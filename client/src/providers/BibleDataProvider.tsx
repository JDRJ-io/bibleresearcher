import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Feature Block A - A1: Global State & Selectors
interface TranslationState {
  main: string;        // 'NKJV'
  alternates: string[]; // ['KJV', 'ESV']
  setMain: (id: string) => void;
  toggleAlternate: (id: string) => void;
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
          // Feature Block C - C2: Selecting new main calls setMain(id); old main pushed into alternates
          const currentMain = state.translationState.main;
          const newAlternates = currentMain && currentMain !== id 
            ? Array.from(new Set([...state.translationState.alternates, currentMain]))
            : state.translationState.alternates;
          
          return {
            translationState: {
              ...state.translationState,
              main: id,
              alternates: newAlternates
            }
          };
        }),
        toggleAlternate: (id: string) => set(state => {
          // Feature Block C - C2: Toggling alternates adds/removes from alternates
          const currentAlternates = state.translationState.alternates;
          const newAlternates = currentAlternates.includes(id)
            ? currentAlternates.filter(alt => alt !== id)
            : [...currentAlternates, id];
          
          return {
            translationState: {
              ...state.translationState,
              alternates: newAlternates
            }
          };
        })
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