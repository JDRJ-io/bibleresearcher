// src/store/translationSlice.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

// GUEST MODE: Remove persistence to prevent session memory
export const useTranslationMaps = create<TranslationState>()((set, get) => ({
      main: 'KJV',
      alternates: [],  // GUEST: No alternates by default
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
          set({ alternates: [...current.alternates, id] });
        } else {
          // was there, remove it
          set({ alternates: alts });
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
    }))

/** selector hook that memoizes the column list */
export const useColumnKeys = () => {
  const store = useTranslationMaps();
  return [store.main, ...store.alternates];  // column order: main first, then alternates
};

export { useTranslationMaps };
export { useTranslationMaps as useTranslationSlice };