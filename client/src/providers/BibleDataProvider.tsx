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
  // Translation loading
  loadTranslation: (id: string) => Promise<void>;
  getVerseText: (verseId: string, translationId: string) => string | undefined;
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
      },
      
      // Translation loading functionality
      loadTranslation: async (id: string) => {
        // Import the loadTranslation function from BibleDataAPI
        const { loadTranslation } = await import('@/data/BibleDataAPI');
        
        try {
          const translationData = await loadTranslation(id);
          
          // Convert to Map<number, string> format expected by the store
          const indexMap = new Map<number, string>();
          translationData.forEach((text, verseRef) => {
            // Convert verse reference to index (this is a simplified approach)
            const index = Array.from(translationData.keys()).indexOf(verseRef);
            indexMap.set(index, text);
          });
          
          // Store in the translations record
          set(state => ({
            translations: {
              ...state.translations,
              [id]: indexMap
            }
          }));
          
          console.log(`✅ Loaded translation ${id} with ${translationData.size} verses`);
          
        } catch (error) {
          console.error(`Failed to load translation ${id}:`, error);
          throw error;
        }
      },
      
      getVerseText: (verseId: string, translationId: string) => {
        const translation = get().translations[translationId];
        if (!translation) return undefined;
        
        // Try different formats of the verse reference
        const formats = [
          verseId,
          verseId.replace('.', ' '),
          verseId.replace(' ', '.'),
        ];
        
        for (const format of formats) {
          const text = translation.get(format as any);
          if (text) return text;
        }
        
        return undefined;
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