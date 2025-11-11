// src/store/translationSlice.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearTranslationRefs } from '@/lib/supabaseClient';

// Helper function to map alternate translation index to slot number
function getSlotForAlternateIndex(index: number): number {
  // All 12 alternate translations use slots 3-14 (continuous)
  if (index < 12) {
    return 3 + index; // slots 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14
  }
  // Support unlimited alternate translations by creating additional slots dynamically
  else {
    return 20 + (index - 12); // slots 20, 21, 22, ... (unlimited)
  }
}

interface TranslationState {
  main: string;
  alternates: string[];
  /** Reactive counter that increments when translations are loaded - triggers cell re-renders */
  translationsVersion: number;
  /** swap in a new main, old main is removed */
  setMain: (id: string) => void;
  /** toggle an alternate on/off */
  toggleAlternate: (id: string) => void;
  /** reset to mobile defaults: main + no alternates */
  resetMobileDefaults: (mainId: string) => void;
  /** PHASE 0.3: Clear translation memory references for garbage collection */
  clearTranslationCache: () => void;
  /** Increment version to trigger re-renders when translation data is loaded */
  incrementTranslationsVersion: () => void;
}

// Check if user is a guest (no authentication) to reset to defaults
const isGuestUser = () => {
  // TEMP FIX: Allow guests to persist alternates during session
  // Later this can be tied to actual authentication state
  return false; // Allow alternates to persist for better user experience
};

export const useTranslationMaps = create<TranslationState>()(
  persist(
    (set, get) => ({
      main: 'KJV',
      alternates: [],  // -- not the whole list
      translationsVersion: 0,
      setMain: (id: string) => {
        const current = get();
        if (id === current.main) return;  // no-op
        
        console.log(`🔄 Main translation change: ${current.main} → ${id}`);
        
        // Before changing main, clean up all existing alternate slots
        current.alternates.forEach((altId, index) => {
          const slot = getSlotForAlternateIndex(index);
          if (slot !== -1) {
            window.dispatchEvent(new CustomEvent('translation-slot-visibility', {
              detail: { slot, visible: false }
            }));
            console.log(`🧹 CLEANUP: Hidden slot ${slot} for alternate ${altId} during main change`);
          }
        });
        
        set({
          main: id,
          alternates: current.alternates.filter((t) => t !== id),  // 1. remove new main
        });
        
        // Signal layout change for header realignment
        window.dispatchEvent(new CustomEvent('translation-layout-change', {
          detail: { type: 'main-change', from: current.main, to: id }
        }));
        
        // CRITICAL FIX: Dispatch event to refresh cross-references and verse-dependent data
        window.dispatchEvent(new CustomEvent('translation-main-changed', {
          detail: { 
            from: current.main, 
            to: id,
            timestamp: Date.now()
          }
        }));
        console.log(`📡 Dispatched translation-main-changed event for cross-reference refresh`);
        
        // PHASE 0.3: Clear unused translation references after main change
        console.log(`🧹 [PHASE 0.3] Clearing translation cache after main change: ${current.main} → ${id}`);
        clearTranslationRefs();
      },
      toggleAlternate: (id: string) => {
        const current = get();
        if (id === current.main) return;  // cannot demote main here
        
        const alts = current.alternates.filter((t) => t !== id);
        if (alts.length === current.alternates.length) {
          // wasn't there, add it
          const newAlternates = [...current.alternates, id];
          set({ alternates: newAlternates });
          
          // Also make the corresponding slot visible in the main store
          const slot = getSlotForAlternateIndex(newAlternates.length - 1);
          console.log(`🎯 DISPATCHING translation-slot-visibility: slot ${slot} → visible:true for ${id}`);
          if (slot !== -1) {
            // Use window event to notify main store to avoid circular dependency
            window.dispatchEvent(new CustomEvent('translation-slot-visibility', {
              detail: { slot, visible: true }
            }));
            console.log(`📡 Dispatched slot visibility event: slot ${slot} → true`);
          } else {
            console.error(`❌ Invalid slot ${slot} for alternate translation ${id}`);
          }
          
          // Signal layout change for header realignment when columns are added
          window.dispatchEvent(new CustomEvent('translation-layout-change', {
            detail: { type: 'alt-added', translationId: id }
          }));
        } else {
          // was there, remove it
          const removedIndex = current.alternates.findIndex(t => t === id);
          set({ alternates: alts });
          
          // Also hide the corresponding slot in the main store
          const slot = getSlotForAlternateIndex(removedIndex);
          console.log(`🎯 DISPATCHING translation-slot-visibility: slot ${slot} → visible:false for ${id}`);
          if (slot !== -1) {
            // Use window event to notify main store to avoid circular dependency
            window.dispatchEvent(new CustomEvent('translation-slot-visibility', {
              detail: { slot, visible: false }
            }));
            console.log(`📡 Dispatched slot visibility event: slot ${slot} → false`);
          } else {
            console.error(`❌ Invalid slot ${slot} for alternate translation ${id}`);
          }
          
          // Signal layout change for header realignment when columns are removed
          window.dispatchEvent(new CustomEvent('translation-layout-change', {
            detail: { type: 'alt-removed', translationId: id }
          }));
        }
      },
      resetMobileDefaults: (mainId: string) => {
        // Mobile portrait: only main translation, no alternates
        // Cross-references will be handled by the bible store toggle
        set({
          main: mainId,
          alternates: []
        });
        
        // PHASE 0.3: Clear translation cache when resetting to mobile defaults
        console.log(`🧹 [PHASE 0.3] Clearing translation cache during mobile reset`);
        clearTranslationRefs();
      },
      clearTranslationCache: () => {
        // PHASE 0.3: Manual cache clearing function
        console.log(`🧹 [PHASE 0.3] Manual translation cache clear requested`);
        clearTranslationRefs();
      },
      incrementTranslationsVersion: () => {
        set((state) => ({ translationsVersion: state.translationsVersion + 1 }));
      },
    }),
    { 
      name: 'translation-state',
      onRehydrateStorage: () => (state) => {
        // For guest users, reset to defaults ignoring localStorage
        if (isGuestUser() && state) {
          state.main = 'KJV';
          state.alternates = [];
        }
      }
    }
  )
);

/** selector hook that memoizes the column list */
export const useColumnKeys = () => {
  const store = useTranslationMaps();
  return [store.main, ...store.alternates];  // column order: main first, then alternates
};