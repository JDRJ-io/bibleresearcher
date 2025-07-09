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
      alternates: [],
      setMain: (id: string) => {
        const current = get();
        const newAlts = current.alternates.filter((t) => t !== id);  // remove new main if it was alt
        const shouldAddOldMain = current.main !== id && !newAlts.includes(current.main);
        
        set({
          main: id,
          alternates: shouldAddOldMain ? [...newAlts, current.main] : newAlts,
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
  return [...store.alternates, store.main];  // column order
};