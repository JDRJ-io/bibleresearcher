import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/bible/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import BiblePage from "@/pages/bible";
import AuthCallback from "@/pages/auth/callback";
import NotFound from "@/pages/not-found";
import { create } from 'zustand';

// Inlined BibleDataProvider - Bible Store
interface TranslationState {
  main: string;
  alternates: string[];
  setMain: (id: string) => void;
  toggleAlternate: (id: string) => void;
  clearAlternates: (id: string) => void;
  columnKeys: string[];
}

// UI Layout Spec Column State Interface
interface ColumnInfo {
  slot: number;
  visible: boolean;
  widthRem: number;
}

interface ColumnState {
  columns: ColumnInfo[];
  setVisible: (slot: number, visible: boolean) => void;
  reorder: (from: number, to: number) => void;
  resize: (slot: number, deltaRem: number) => void;
}

interface SizeState {
  sizeMult: number;
  setSizeMult: (mult: number) => void;
}

interface SizeState {
  sizeMult: number;
  setSizeMult: (mult: number) => void;
}

export const useBibleStore = create<{
  translations: Record<string, Map<number, string>>;
  actives: string[];
  translationState: TranslationState;
  setActives: (ids: string[]) => void;
  setTranslations: (id: string, data: Map<number, string>) => void;
  getAllActive: () => string[];
  crossRefs: Record<string, string[]>;
  prophecies: Record<string, any>;
  store: any;
  showCrossRefs: boolean;
  showProphecies: boolean;
  showNotes: boolean;
  showDates: boolean;
  showLabels: Record<string, boolean>;
  toggleCrossRefs: () => void;
  toggleProphecies: () => void;
  toggleNotes: () => void;
  toggleDates: () => void;
  toggleLabel: (labelId: string) => void;
  columnState: ColumnState;
  sizeState: SizeState;
}>((set, get) => ({
      translations: {},
      actives: ["KJV"],
      crossRefs: {},
      prophecies: {},
      store: { crossRefs: {}, prophecies: {} },
      showCrossRefs: true,  // Default ON for free users (optimal mobile display)
      showProphecies: false, // Default OFF for free users (cleaner mobile)
      showNotes: false,     // Notes column toggle
      showDates: false,     // Dates column toggle
      showLabels: {},       // Labels state object for semantic highlighting
      toggleCrossRefs: () => set(state => {
        console.log('🔄 TOGGLE CROSS REFS - Current:', state.showCrossRefs, '→ New:', !state.showCrossRefs);
        return {
          showCrossRefs: !state.showCrossRefs,
          columnState: {
            ...state.columnState,
            columns: state.columnState.columns.map(col => 
              col.slot === 3 ? { ...col, visible: !state.showCrossRefs } : col
            )
          }
        };
      }),
      toggleProphecies: () => set(state => {
        console.log('🔄 TOGGLE PROPHECIES - Current:', state.showProphecies, '→ New:', !state.showProphecies);
        return {
          showProphecies: !state.showProphecies,
          columnState: {
            ...state.columnState,
            columns: state.columnState.columns.map(col => 
              [17, 18, 19].includes(col.slot) ? { ...col, visible: !state.showProphecies } : col
            )
          }
        };
      }),
      toggleNotes: () => set(state => {
        console.log('🔄 TOGGLE NOTES - Current:', state.showNotes, '→ New:', !state.showNotes);
        return {
          showNotes: !state.showNotes,
          columnState: {
            ...state.columnState,
            columns: state.columnState.columns.map(col => 
              col.slot === 1 ? { ...col, visible: !state.showNotes } : col
            )
          }
        };
      }),
      toggleDates: () => set(state => {
        console.log('🔄 TOGGLE DATES - Current:', state.showDates, '→ New:', !state.showDates);
        return {
          showDates: !state.showDates,
          columnState: {
            ...state.columnState,
            columns: state.columnState.columns.map(col => 
              col.slot === 4 ? { ...col, visible: !state.showDates } : col
            )
          }
        };
      }),
      toggleLabel: (labelId: string) => set(state => ({
        showLabels: {
          ...state.showLabels,
          [labelId]: !state.showLabels[labelId]
        }
      })),
      setActives: (ids: string[]) => set({ actives: ids }),
      setTranslations: (id: string, data: Map<number, string>) => set(state => ({
        translations: { ...state.translations, [id]: data }
      })),
      getAllActive: () => get().actives,
      columnState: {
        columns: [
          { slot: 0, visible: true, widthRem: 4 },    // Reference
          { slot: 1, visible: false, widthRem: 3 },   // Notes  
          { slot: 2, visible: true, widthRem: 20 },   // Main Translation
          { slot: 3, visible: true, widthRem: 15 },   // Cross References
          { slot: 4, visible: false, widthRem: 5 },   // Dates
          { slot: 17, visible: false, widthRem: 1.5 }, // Prophecy P
          { slot: 18, visible: false, widthRem: 1.5 }, // Prophecy F  
          { slot: 19, visible: false, widthRem: 1.5 }  // Prophecy V
        ],
        setVisible: (slot: number, visible: boolean) => set(state => ({
          columnState: {
            ...state.columnState,
            columns: state.columnState.columns.map(col => 
              col.slot === slot ? { ...col, visible } : col
            )
          }
        })),
        reorder: (from: number, to: number) => {
          // Column reordering implementation
        },
        resize: (slot: number, deltaRem: number) => set(state => ({
          columnState: {
            ...state.columnState,
            columns: state.columnState.columns.map(col => 
              col.slot === slot ? { ...col, widthRem: Math.max(3, col.widthRem + deltaRem) } : col
            )
          }
        }))
      },
      sizeState: {
        sizeMult: 1.0, // Default to Medium
        setSizeMult: (mult: number) => {
          set({ sizeState: { sizeMult: mult, setSizeMult: get().sizeState.setSizeMult } });
          // Apply CSS variable to root
          document.documentElement.style.setProperty('--sizeMult', mult.toString());
          // Persist to localStorage
          localStorage.setItem('bibleSizeMult', mult.toString());
        }
      },
      translationState: {
        main: "KJV",
        alternates: [],
        setMain: (id: string) => set(state => {
          if (id === state.translationState.main) return state;
          
          const currentMain = state.translationState.main;
          const currentAlternates = state.translationState.alternates;
          const newAlts = currentAlternates.filter(t => t !== id);
          const finalAlternates = currentMain && currentMain !== id 
            ? Array.from(new Set([...newAlts, currentMain]))
            : newAlts;
          const columnKeys = Array.from(new Set([...finalAlternates, id]));
          
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
          if (id === state.translationState.main) return state;
          
          const currentAlternates = state.translationState.alternates;
          const hasAlternate = currentAlternates.includes(id);
          const newAlternates = hasAlternate 
            ? currentAlternates.filter(t => t !== id)
            : [...currentAlternates, id];
          const columnKeys = Array.from(new Set([...newAlternates, state.translationState.main]));
          
          return {
            translationState: {
              ...state.translationState,
              alternates: newAlternates,
              columnKeys
            }
          };
        }),
        clearAlternates: (exceptId: string) => set(state => ({
          translationState: {
            ...state.translationState,
            alternates: state.translationState.alternates.filter(id => id === exceptId),
            columnKeys: [state.translationState.main, exceptId].filter(Boolean)
          }
        })),
        columnKeys: ["KJV"]
      }tate,
            columns: state.columnState.columns.map(col => 
              col.slot === 3 ? { ...col, visible: !state.showCrossRefs } : col
            )
          }
        };
        console.log('🔄 TOGGLE CROSS REFS - Updated columns:', newState.columnState.columns.filter(c => c.visible).map(c => `slot ${c.slot}`));
        return newState;
      }),
      toggleProphecies: () => set(state => {
        console.log('🔄 TOGGLE PROPHECIES - Current:', state.showProphecies, '→ New:', !state.showProphecies);
        const newState = {
          showProphecies: !state.showProphecies,
          columnState: {
            ...state.columnState,
            columns: state.columnState.columns.map(col => 
              col.slot >= 17 && col.slot <= 19 ? { ...col, visible: !state.showProphecies } : col
            )
          }
        };
        console.log('🔄 TOGGLE PROPHECIES - Updated columns:', newState.columnState.columns.filter(c => c.visible).map(c => `slot ${c.slot}`));
        return newState;
      }),
      toggleNotes: () => set(state => {
        console.log('🔄 TOGGLE NOTES - Current:', state.showNotes, '→ New:', !state.showNotes);
        const newState = {
          showNotes: !state.showNotes,
          columnState: {
            ...state.columnState,
            columns: state.columnState.columns.map(col => 
              col.slot === 1 ? { ...col, visible: !state.showNotes } : col
            )
          }
        };
        console.log('🔄 TOGGLE NOTES - Updated columns:', newState.columnState.columns.filter(c => c.visible).map(c => `slot ${c.slot}`));
        return newState;
      }),
      toggleDates: () => set(state => {
        console.log('🔄 TOGGLE DATES - Current:', state.showDates, '→ New:', !state.showDates);
        const newState = {
          showDates: !state.showDates,
          columnState: {
            ...state.columnState,
            columns: state.columnState.columns.map(col => 
              col.slot === 4 ? { ...col, visible: !state.showDates } : col
            )
          }
        };
        console.log('🔄 TOGGLE DATES - Updated columns:', newState.columnState.columns.filter(c => c.visible).map(c => `slot ${c.slot}`));
        return newState;
      }),
      toggleLabel: (labelId: string) => set(state => ({
        showLabels: {
          ...state.showLabels,
          [labelId]: !state.showLabels[labelId]
        }
      })),
      
      // UI Layout Spec Column State (slots 0-19)
      columnState: {
        columns: [
          { slot: 0, visible: true, widthRem: 5 },     // Reference
          { slot: 1, visible: false, widthRem: 8 },    // Notes  
          { slot: 2, visible: true, widthRem: 20 },    // Main translation
          { slot: 3, visible: true, widthRem: 15 },    // Cross References (default ON)
          { slot: 4, visible: false, widthRem: 6 },    // Dates
          // Slots 5-16 for alternate translations
          ...Array.from({ length: 12 }, (_, i) => ({ slot: i + 5, visible: false, widthRem: 18 })),
          { slot: 17, visible: false, widthRem: 5 },   // Prophecy P (default OFF)
          { slot: 18, visible: false, widthRem: 5 },   // Prophecy F (default OFF)
          { slot: 19, visible: false, widthRem: 5 },   // Prophecy V (default OFF)
        ],
        setVisible: (slot: number, visible: boolean) => set(state => ({
          columnState: {
            ...state.columnState,
            columns: state.columnState.columns.map(col => 
              col.slot === slot ? { ...col, visible } : col
            )
          }
        })),
        reorder: (from: number, to: number) => set(state => {
          const columns = [...state.columnState.columns];
          const fromCol = columns.find(col => col.slot === from);
          const toCol = columns.find(col => col.slot === to);
          if (fromCol && toCol) {
            fromCol.slot = to;
            toCol.slot = from;
          }
          return { columnState: { ...state.columnState, columns } };
        }),
        resize: (slot: number, deltaRem: number) => set(state => ({
          columnState: {
            ...state.columnState,
            columns: state.columnState.columns.map(col => 
              col.slot === slot ? { ...col, widthRem: Math.max(3, col.widthRem + deltaRem) } : col
            )
          }
        }))
      },
      
      // Size State (UI Layout Spec presets: S=0.85, M=1.0, L=1.35, XL=1.70)
      sizeState: {
        sizeMult: 1.0, // Default to Medium
        setSizeMult: (mult: number) => {
          set({ sizeState: { sizeMult: mult, setSizeMult: get().sizeState.setSizeMult } });
          // Apply CSS variable to root
          document.documentElement.style.setProperty('--sizeMult', mult.toString());
          // Persist to localStorage
          localStorage.setItem('bibleSizeMult', mult.toString());
        }
      },
      translationState: {
        main: "KJV",
        alternates: [],
        setMain: (id: string) => set(state => {
          if (id === state.translationState.main) return state;
          
          const currentMain = state.translationState.main;
          const currentAlternates = state.translationState.alternates;
          const newAlts = currentAlternates.filter(t => t !== id);
          const finalAlternates = currentMain && currentMain !== id 
            ? Array.from(new Set([...newAlts, currentMain]))
            : newAlts;
          const columnKeys = Array.from(new Set([...finalAlternates, id]));
          
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
          if (id === state.translationState.main) return state;
          
          const currentAlternates = state.translationState.alternates;
          const has = currentAlternates.includes(id);
          const newAlternates = has 
            ? currentAlternates.filter(t => t !== id)
            : Array.from(new Set([...currentAlternates, id]));
          const columnKeys = Array.from(new Set([...newAlternates, state.translationState.main]));
          
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
        columnKeys: []
      },
      setActives: (ids) => set({ actives: ids }),
      setTranslations: (id, data) => {
        set(s => ({ translations: { ...s.translations, [id]: data } }));
      },
      getAllActive: () => {
        const state = get();
        return [...state.translationState.alternates, state.translationState.main];
      }
    }));

function Router() {
  return (
    <Switch>
      <Route path="/" component={BiblePage} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
