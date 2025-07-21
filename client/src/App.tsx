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

// Translation state interface
interface TranslationState {
  main: string;
  alternates: string[];
  setMain: (id: string) => void;
  toggleAlternate: (id: string) => void;
  clearAlternates: (id: string) => void;
  resetMobileDefaults: (mainId: string) => void;
  columnKeys: string[];
}

// Size state interface
interface SizeState {
  sizeMult: number;
  setSizeMult: (mult: number) => void;
}

// Complete Bible Store Interface - SINGLE DECLARATION
export const useBibleStore = create<{
  // Translation management
  translations: Record<string, any>;
  actives: string[];
  translationState: TranslationState;
  setActives: (ids: string[]) => void;
  setTranslations: (id: string, data: any) => void;
  getAllActive: () => string[];

  // Data storage
  crossRefs: Record<string, string[]>;
  prophecies: Record<string, any>;
  prophecyData: Record<string, { P: number[]; F: number[]; V: number[] }>;
  store: any;

  // UI state flags
  showCrossRefs: boolean;
  showProphecies: boolean;
  showNotes: boolean;
  showDates: boolean;
  showLabels: Record<string, boolean>;

  // UI actions
  toggleCrossRefs: () => void;
  toggleProphecies: () => void;
  toggleNotes: () => void;
  toggleDates: () => void;
  toggleLabel: (labelId: string) => void;

  // Data setters
  setCrossRefs: (verseRef: string, refs: string[]) => void;
  setBulkCrossRefs: (data: Record<string, string[]>) => void;
  setProphecyData: (data: Record<string, { P: number[]; F: number[]; V: number[] }>) => void;

  // Column and size state
  columnState: ColumnState;
  sizeState: SizeState;

  // Initialization
  isInitialized: boolean;
}>((set, get) => ({
  // Initialize all state
  isInitialized: true,
  translations: {},
  actives: ["KJV"],
  crossRefs: {},
  prophecies: {},
  prophecyData: {},
  store: { crossRefs: {}, prophecies: {} },

  // UI defaults optimized for guest mode
  showCrossRefs: true,   // ON by default for optimal mobile display
  showProphecies: false, // OFF for cleaner mobile
  showNotes: false,      // OFF by default
  showDates: false,      // OFF by default
  showLabels: {},

  // UI toggle actions
  toggleCrossRefs: () => set(state => {
    console.log('🔄 TOGGLE CROSS REFS - Current:', state.showCrossRefs, '→ New:', !state.showCrossRefs);
    const newValue = !state.showCrossRefs;
    return {
      showCrossRefs: newValue,
      columnState: {
        ...state.columnState,
        columns: state.columnState.columns.map(col => 
          col.slot === 2 ? { ...col, visible: newValue } : col // Cross refs in slot 2
        )
      }
    };
  }),

  toggleProphecies: () => set(state => {
    console.log('🔄 TOGGLE PROPHECIES - Current:', state.showProphecies, '→ New:', !state.showProphecies);
    const newValue = !state.showProphecies;
    return {
      showProphecies: newValue,
      columnState: {
        ...state.columnState,
        columns: state.columnState.columns.map(col => 
          (col.slot >= 15 && col.slot <= 17) ? { ...col, visible: newValue } : col // Prophecy P/F/V slots 15-17
        )
      }
    };
  }),

  toggleNotes: () => set(state => {
    console.log('🔄 TOGGLE NOTES - Current:', state.showNotes, '→ New:', !state.showNotes);
    const newValue = !state.showNotes;
    return {
      showNotes: newValue,
      columnState: {
        ...state.columnState,
        columns: state.columnState.columns.map(col => 
          col.slot === 18 ? { ...col, visible: newValue } : col // Notes in slot 18
        )
      }
    };
  }),

  toggleDates: () => set(state => {
    console.log('🔄 TOGGLE DATES - Current:', state.showDates, '→ New:', !state.showDates);
    const newValue = !state.showDates;
    return {
      showDates: newValue,
      columnState: {
        ...state.columnState,
        columns: state.columnState.columns.map(col => 
          col.slot === 19 ? { ...col, visible: newValue } : col // Dates in slot 19
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

  // Data management
  setCrossRefs: (verseRef: string, refs: string[]) => set(state => ({
    crossRefs: {
      ...state.crossRefs,
      [verseRef]: refs
    }
  })),

  setBulkCrossRefs: (data: Record<string, string[]>) => set(state => ({
    crossRefs: {
      ...state.crossRefs,
      ...data
    }
  })),

  setProphecyData: (data: Record<string, { P: number[]; F: number[]; V: number[] }>) => set(state => ({
    prophecyData: {
      ...state.prophecyData,
      ...data
    }
  })),

  setActives: (ids: string[]) => set({ actives: ids }),
  setTranslations: (id: string, data: any) => set(state => ({
    translations: { ...state.translations, [id]: data }
  })),
  getAllActive: () => get().actives,

  // Column state following UI Layout Spec slot architecture
  columnState: {
    columns: [
      { slot: 0, visible: true, widthRem: 5 },     // Reference (always visible)
      { slot: 1, visible: true, widthRem: 20 },    // Main translation (always visible)
      { slot: 2, visible: true, widthRem: 15 },    // Cross References (default ON)
      { slot: 3, visible: false, widthRem: 18 },   // Alt translation 1
      { slot: 4, visible: false, widthRem: 18 },   // Alt translation 2
      { slot: 5, visible: false, widthRem: 18 },   // Alt translation 3
      { slot: 6, visible: false, widthRem: 18 },   // Alt translation 4
      { slot: 7, visible: false, widthRem: 18 },   // Alt translation 5
      { slot: 8, visible: false, widthRem: 18 },   // Alt translation 6
      { slot: 9, visible: false, widthRem: 18 },   // Alt translation 7
      { slot: 10, visible: false, widthRem: 18 },  // Alt translation 8
      { slot: 11, visible: false, widthRem: 18 },  // Alt translation 9
      { slot: 12, visible: false, widthRem: 18 },  // Alt translation 10
      { slot: 13, visible: false, widthRem: 18 },  // Alt translation 11
      { slot: 14, visible: false, widthRem: 18 },  // Alt translation 12
      { slot: 15, visible: false, widthRem: 5 },   // Prophecy P
      { slot: 16, visible: false, widthRem: 5 },   // Prophecy F
      { slot: 17, visible: false, widthRem: 5 },   // Prophecy V
      { slot: 18, visible: false, widthRem: 16 },  // Notes
      { slot: 19, visible: false, widthRem: 8 },   // Dates/Context
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

  // Size state (UI Layout Spec presets: S=0.85, M=1.0, L=1.35, XL=1.70)
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

  // Translation state management
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
    resetMobileDefaults: (mainId: string) => set(state => ({
      translationState: {
        ...state.translationState,
        main: mainId,
        alternates: [],
        columnKeys: [mainId]
      }
    })),
    columnKeys: ["KJV"]
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