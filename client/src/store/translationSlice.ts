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
          set({ alternates: [...current.alternates, id] });
        } else {
          // was there, remove it
          set({ alternates: alts });
        }
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