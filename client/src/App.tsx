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

export const useBibleStore = create<{
  translations: Record<string, any>;
  actives: string[];
  translationState: TranslationState;
  setActives: (ids: string[]) => void;
  setTranslations: (id: string, data: any) => void;
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
  isInitialized: boolean;
}>((set, get) => ({
  isInitialized: true,
  translations: {},
  actives: ["KJV"],
  crossRefs: {},
  prophecies: {},
  prophecyData: {} as Record<string, { P: string[], F: string[], V: string[] }>,
  setProphecyData: (data: Record<string, { P: string[], F: string[], V: string[] }>) => set({ prophecyData: data }),
  setCrossRefs: (refs: Record<string, string[]>) => set({ crossRefs: refs }),
  store: { crossRefs: {}, prophecies: {} },
  showCrossRefs: true,  // Default ON for free users (optimal mobile display)
  showProphecies: false, // Default OFF for free users (cleaner mobile)
  showNotes: false,     // Notes column toggle
  showDates: false,     // Dates column toggle
  showLabels: {},       // Labels state object for semantic highlighting

  toggleCrossRefs: () => set(state => {
    console.log('🔄 TOGGLE CROSS REFS - Current:', state.showCrossRefs, '→ New:', !state.showCrossRefs);
    const newValue = !state.showCrossRefs;
    const newState = {
      showCrossRefs: newValue,
      columnState: {
        ...state.columnState,
        columns: state.columnState.columns.map(col => 
          col.slot === 7 ? { ...col, visible: newValue } : col // Slot 7 = Cross References (moved from 6)
        )
      }
    };
    console.log('🔄 TOGGLE CROSS REFS - Updated columns:', newState.columnState.columns.filter(c => c.visible).map(c => `slot ${c.slot}`));
    return newState;
  }),

  toggleProphecies: () => set(state => {
    console.log('🔄 TOGGLE PROPHECIES - Current:', state.showProphecies, '→ New:', !state.showProphecies);
    const newValue = !state.showProphecies;
    const newState = {
      showProphecies: newValue,
      columnState: {
        ...state.columnState,
        columns: state.columnState.columns.map(col => 
          (col.slot >= 8 && col.slot <= 10) ? { ...col, visible: newValue } : col // Slots 8-10 = Prophecy P/F/V (moved from 7-9)
        )
      }
    };
    console.log('🔄 TOGGLE PROPHECIES - Updated columns:', newState.columnState.columns.filter(c => c.visible).map(c => `slot ${c.slot}`));
    return newState;
  }),

  toggleNotes: () => set(state => {
    console.log('🔄 TOGGLE NOTES - Current:', state.showNotes, '→ New:', !state.showNotes);
    const newValue = !state.showNotes;
    const newState = {
      showNotes: newValue,
      columnState: {
        ...state.columnState,
        columns: state.columnState.columns.map(col => 
          col.slot === 1 ? { ...col, visible: newValue } : col // Slot 1 = Notes (moved to between Ref and Main)
        )
      }
    };
    console.log('🔄 TOGGLE NOTES - Updated columns:', newState.columnState.columns.filter(c => c.visible).map(c => `slot ${c.slot}`));
    return newState;
  }),

  toggleDates: () => set(state => {
    console.log('🔄 TOGGLE DATES - Current:', state.showDates, '→ New:', !state.showDates);
    const newValue = !state.showDates;
    const newState = {
      showDates: newValue,
      columnState: {
        ...state.columnState,
        columns: state.columnState.columns.map(col => 
          col.slot === 11 ? { ...col, visible: newValue } : col // Slot 11 = Context/Dates (unchanged)
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

  setActives: (ids: string[]) => set({ actives: ids }),
  setTranslations: (id: string, data: any) => set(state => ({
    translations: { ...state.translations, [id]: data }
  })),
  getAllActive: () => get().actives,

  // UI Layout Spec Column State - Notes between Ref and Main Translation
  columnState: {
    columns: [
      { slot: 0, visible: true, widthRem: 5 },     // Reference (always visible)
      { slot: 1, visible: false, widthRem: 16 },   // Notes (between Ref and Main)
      { slot: 2, visible: true, widthRem: 20 },    // Main translation (always visible)
      { slot: 3, visible: false, widthRem: 18 },   // Alt translation 1
      { slot: 4, visible: false, widthRem: 18 },   // Alt translation 2
      { slot: 5, visible: false, widthRem: 18 },   // Alt translation 3
      { slot: 6, visible: false, widthRem: 18 },   // Alt translation 4
      { slot: 7, visible: true, widthRem: 15 },    // Cross References (default ON)
      { slot: 8, visible: false, widthRem: 5 },    // Prophecy P (default OFF)
      { slot: 9, visible: false, widthRem: 5 },    // Prophecy F (default OFF)
      { slot: 10, visible: false, widthRem: 5 },   // Prophecy V (default OFF)
      { slot: 11, visible: false, widthRem: 8 },   // Context/Dates (default OFF)
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
    clearAlternates: (id: string) => set(state => ({
      translationState: {
        ...state.translationState,
        alternates: [],
        columnKeys: [state.translationState.main]
      }
    })),
    columnKeys: []
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