// src/store/translationSlice.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper function to map alternate translation index to slot number
function getSlotForAlternateIndex(index: number): number {
  // All alternate translations use slots 12-19 (8 total slots)
  // This matches the slot assignment in ColumnHeaders.tsx and VirtualRow.tsx
  if (index < 8) {
    return 12 + index;
  }
  return -1; // Invalid index (max 8 alternate translations)
}

interface TranslationState {
  main: string;
  alternates: string[];
  /** swap in a new main, old main is removed */
  setMain: (id: string) => void;
  /** toggle an alternate on/off */
  toggleAlternate: (id: string) => void;
  /** reset to mobile defaults: main + no alternates */
  resetMobileDefaults: (mainId: string) => void;
}

export const useTranslationMaps = create<TranslationState>()(
  persist(
    (set, get) => ({
      main: 'KJV',
      alternates: [],  // -- not the whole list
      setMain: (id: string) => {
        const current = get();
        if (id === current.main) return;  // no-op
        
        set({
          main: id,
          alternates: current.alternates.filter((t) => t !== id),  // 1. remove new main
        });
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
        }
      },
      resetMobileDefaults: (mainId: string) => {
        // Mobile portrait: only main translation, no alternates
        // Cross-references will be handled by the bible store toggle
        set({
          main: mainId,
          alternates: []
        });
      },
    }),
    { name: 'translation-state' }
  )
);

/** selector hook that memoizes the column list */
export const useColumnKeys = () => {
  const store = useTranslationMaps();
  return [store.main, ...store.alternates];  // column order: main first, then alternates
};