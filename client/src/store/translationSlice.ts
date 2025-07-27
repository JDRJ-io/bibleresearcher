// src/store/translationSlice.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper function to map alternate translation index to slot number
function getSlotForAlternateIndex(index: number): number {
  if (index < 4) {
    // Primary alternate translations: slots 3-6
    return 3 + index;
  } else if (index < 12) {
    // Extended alternate translations: slots 12-19 (8 additional slots)
    return 12 + (index - 4);
  }
  return -1; // Invalid index
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
          if (slot !== -1) {
            // Use window event to notify main store to avoid circular dependency
            window.dispatchEvent(new CustomEvent('translation-slot-visibility', {
              detail: { slot, visible: true }
            }));
          }
        } else {
          // was there, remove it
          const removedIndex = current.alternates.findIndex(t => t === id);
          set({ alternates: alts });
          
          // Also hide the corresponding slot in the main store
          const slot = getSlotForAlternateIndex(removedIndex);
          if (slot !== -1) {
            // Use window event to notify main store to avoid circular dependency
            window.dispatchEvent(new CustomEvent('translation-slot-visibility', {
              detail: { slot, visible: false }
            }));
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