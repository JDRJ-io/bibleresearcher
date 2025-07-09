import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Feature Block A - A1: Global State & Selectors
// 1-A: Separate selected vs visible translations
interface TranslationState {
  main: string;        // current main translation
  alternates: string[]; // currently visible alternates
  // actions
  setMain: (id: string) => void;
  toggleAlternate: (id: string) => void;
  clearAlternates: (id: string) => void;
  // derived
  columnKeys: string[];  // [...alternates, main] - memoized
}

export const useBibleStore = create<{
  translations: Record<string, Map<number, string>>;
  actives: string[];
  translationState: TranslationState;
  setActives: (ids: string[]) => void;
  setTranslations: (id: string, data: Map<number, string>) => void;
  // A1: Emit derived selector
  getAllActive: () => string[];
}>(
  persist(
    (set, get) => ({
      translations: {},
      actives: ["KJV"],
      translationState: {
        main: "KJV",
        alternates: [],
        setMain: (id: string) => set(state => {
          // 1-B: Rules inside setMain
          if (id === state.translationState.main) return state; // no-op
          
          const currentMain = state.translationState.main;
          const currentAlternates = state.translationState.alternates;
          
          // Remove new main if it was already in alternates
          const newAlts = currentAlternates.filter(t => t !== id);
          
          // Add old main to alternates if it wasn't already there
          const finalAlternates = currentMain && currentMain !== id 
            ? Array.from(new Set([...newAlts, currentMain]))
            : newAlts;
          
          const columnKeys = Array.from(new Set([...finalAlternates, id])); // memoized
          
          return {
            translationState: {
              ...state.translationState,
              main: id,
              alternates: finalAlternates,
              columnKeys
            }
          };
        }),
        toggleAlternate: (id: string) => set(state => {
          // 1-C: toggleAlternate
          if (id === state.translationState.main) return state; // cannot demote main here
          
          const currentAlternates = state.translationState.alternates;
          const has = currentAlternates.includes(id);
          
          const newAlternates = has 
            ? currentAlternates.filter(t => t !== id)  // remove column
            : Array.from(new Set([...currentAlternates, id]));  // add column
          
          const columnKeys = Array.from(new Set([...newAlternates, state.translationState.main])); // memoized
          
          return {
            translationState: {
              ...state.translationState,
              alternates: newAlternates,
              columnKeys
            }
          };
        }),
        clearAlternates: (id: string) => set(state => {
          return {
            translationState: {
              ...state.translationState,
              alternates: [],
              columnKeys: [state.translationState.main]
            }
          };
        }),
        columnKeys: []  // initialize empty
      },
      setActives: (ids) => set({ actives: ids }),
      setTranslations: (id, data) => {
        set(s => ({ translations: { ...s.translations, [id]: data } }));
      },
      // A1: Derived selector allActive = [...alternates, main]
      getAllActive: () => {
        const state = get();
        return [...state.translationState.alternates, state.translationState.main];
      }
    }),
    {
      name: 'bible-store',
      // C3: Persist main + alternates to localStorage (Zustand persist middleware)
      partialize: (state) => ({
        translationState: state.translationState
      })
    }
  )
);