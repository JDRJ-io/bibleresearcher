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

type LabelName = string;

export const useBibleStore = create<{
  translations: Record<string, any>;
  actives: string[];
  translationState: TranslationState;
  setActives: (ids: string[]) => void;
  setTranslations: (id: string, data: any) => void;
  getAllActive: () => string[];
  crossRefs: Record<string, string[]>;
  prophecies: Record<string, any>;
  prophecyData: Record<string, { P: number[], F: number[], V: number[] }>;
  prophecyIndex: Record<number, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }>;
  setProphecyData: (data: Record<string, { P: number[], F: number[], V: number[] }>) => void;
  setProphecyIndex: (data: Record<number, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }>) => void;
  datesData: string[] | null;
  setDatesData: (dates: string[]) => void;
  labelsData: Record<string, any>;
  setLabelsData: (labels: Record<string, any>) => void;
  store: any;
  showCrossRefs: boolean;
  showProphecies: boolean;
  showNotes: boolean;
  showDates: boolean;
  showLabels: Record<string, boolean>;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  activeLabels: LabelName[];
  setActiveLabels: (labels: LabelName[]) => void;
  loadCrossRefsData: (verseIds?: string[]) => Promise<void>;
  toggleCrossRefs: () => void;
  toggleProphecies: () => void;
  toggleNotes: () => void;
  toggleDates: () => void;
  toggleLabel: (labelId: string) => void;
  toggleContext: () => void;
  toggleChronological: () => void;
  showContext: boolean;
  columnState: ColumnState;
  sizeState: SizeState;
  isInitialized: boolean;
  isChronological: boolean;
  currentVerseKeys: string[];
  setChronological: (chronological: boolean) => void;
  setCurrentVerseKeys: (keys: string[]) => void;
}>((set, get) => ({
  isInitialized: true,
  translations: {},
  actives: ["KJV"],
  crossRefs: {},
  prophecies: {},
  prophecyData: {},
  prophecyIndex: {},
  setProphecyData: (data: Record<string, { P: number[], F: number[], V: number[] }>) => set({ prophecyData: data }),
  setProphecyIndex: (data: Record<number, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }>) => set({ prophecyIndex: data }),
  datesData: null,
  setDatesData: (dates: string[]) => set({ datesData: dates }),
  labelsData: {},
  setLabelsData: (labels: Record<string, any>) => set({ labelsData: labels }),
  setSearchOpen: (open: boolean) => set({ isSearchOpen: open }),
  setCrossRefs: (refs: Record<string, string[]>) => set({ crossRefs: refs }),
  store: { crossRefs: {}, prophecies: {} },
  showCrossRefs: true,  // Default ON for free users (optimal mobile display)
  showProphecies: false, // Default OFF for free users (cleaner mobile)
  showNotes: false,     // Notes column toggle
  showDates: false,     // Dates column toggle
  showContext: false,   // Context boundaries toggle
  showLabels: {},           // Labels state object for semantic highlighting  
  isSearchOpen: false,      // Search modal state
  activeLabels: [],         // Active semantic labels array
  isChronological: false,   // Verse order toggle (canonical vs chronological)
  currentVerseKeys: [],   // Current verse keys array (canonical or chronological)
  setChronological: (chronological: boolean) => set({ isChronological: chronological }),
  setCurrentVerseKeys: (keys: string[]) => set({ currentVerseKeys: keys }),

  // Load cross-references data for specific verse range (anchor-centered)
  loadCrossRefsData: async (verseIds?: string[]) => {
    const state = get();

    // If no specific verses requested, this is a no-op (we load on-demand only)
    if (!verseIds || verseIds.length === 0) {
      console.log('📚 Cross-references will load on-demand as needed');
      return;
    }

    // Check which verses we don't have yet
    const neededVerses = verseIds.filter(id => {
      const spaceFormat = id.replace('.', ' ');
      const dotFormat = id.replace(' ', '.');
      return !state.crossRefs[spaceFormat] && !state.crossRefs[dotFormat];
    });

    if (neededVerses.length === 0) {
      console.log('✅ All requested cross-references already loaded');
      return;
    }

    console.log(`📚 Loading cross-references for ${neededVerses.length} verses...`);

    try {
      const { getCrossReferences } = await import('@/data/BibleDataAPI');
      const newCrossRefs: Record<string, string[]> = { ...state.crossRefs };

      // Load cross-references for each needed verse individually
      for (const verseId of neededVerses) {
        try {
          const refs = await getCrossReferences(verseId);
          if (refs && refs.length > 0) {
            const spaceFormat = verseId.replace('.', ' ');
            const dotFormat = verseId.replace(' ', '.');
            newCrossRefs[spaceFormat] = refs;
            newCrossRefs[dotFormat] = refs;
          }
        } catch (error) {
          console.warn(`Failed to load cross-refs for ${verseId}:`, error);
        }
      }

      console.log(`✅ Loaded cross-references for ${neededVerses.length} verses`);
      set({ crossRefs: newCrossRefs });

    } catch (error) {
      console.error('❌ Failed to load cross-references:', error);
    }
  },

  toggleCrossRefs: () => set(state => {
    console.log('🔄 TOGGLE CROSS REFS - Current:', state.showCrossRefs, '→ New:', !state.showCrossRefs);
    const newValue = !state.showCrossRefs;

    // Load cross-references data when toggling on
    if (newValue && Object.keys(state.crossRefs).length === 0) {
      // Trigger data loading
      setTimeout(() => get().loadCrossRefsData(), 0);
    }

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

    // Load prophecy data when toggling on - using prophecy_rows.txt and prophecy_index.json
    if (newValue && Object.keys(state.prophecyData).length === 0) {
      console.log('🔮 Loading prophecy data from Supabase files...');
      import('@/data/BibleDataAPI').then(async ({ loadProphecyData }) => {
        try {
          const { verseRoles, prophecyIndex } = await loadProphecyData();

          // Store both the verse roles and the prophecy index
          const currentState = get();
          currentState.setProphecyData(verseRoles);
          currentState.setProphecyIndex(prophecyIndex);

          console.log(`✅ Prophecy system loaded: ${Object.keys(verseRoles).length} verses with roles, ${Object.keys(prophecyIndex).length} prophecies`);
        } catch (error) {
          console.error('❌ Failed to load prophecy data:', error);
          // Set empty data to prevent repeated loading attempts
          const currentState = get();
          currentState.setProphecyData({});
          currentState.setProphecyIndex({});
        }
      });
    }

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

    // Load dates data when toggling on
    if (newValue && !state.datesData) {
      console.log('📅 Loading dates data from Supabase...');
      import('@/data/BibleDataAPI').then(async ({ getDatesCanonical }) => {
        try {
          const datesText = await getDatesCanonical();
          const datesArray = datesText.split('\n').filter(line => line.trim());

          get().setDatesData(datesArray);
          console.log('✅ Dates data loaded:', datesArray.length, 'verse dates');
        } catch (error) {
          console.error('❌ Failed to load dates data:', error);
        }
      });
    }

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

  toggleLabel: (labelId: string) => set(state => {
    const newValue = !state.showLabels[labelId];

    // Load label data when toggling on
    if (newValue && !state.labelsData[labelId]) {
      console.log(`🏷️ Loading ${labelId} label data from Supabase...`);
      import('@/data/BibleDataAPI').then(async ({ getLabelsData }) => {
        try {
          const labels = await getLabelsData('KJV');
          get().setLabelsData({ ...get().labelsData, [labelId]: labels });
          console.log(`✅ Labels data loaded for ${labelId}:`, Object.keys(labels).length, 'verses');
        } catch (error) {
          console.error(`❌ Failed to load ${labelId} labels:`, error);
        }
      });
    }

    return {
      showLabels: {
        ...state.showLabels,
        [labelId]: newValue
      }
    };
  }),

  toggleContext: () => set(state => {
    console.log('🔄 TOGGLE CONTEXT - Current:', state.showContext, '→ New:', !state.showContext);
    const newValue = !state.showContext;

    // Load context groups data when toggling on
    if (newValue) {
      console.log('🌐 Loading context groups data from Supabase...');
      import('@/data/BibleDataAPI').then(async ({ getContextGroups }) => {
        try {
          const contextData = await getContextGroups();
          console.log('✅ Context groups data loaded:', contextData.length, 'groups');
        } catch (error) {
          console.error('❌ Failed to load context groups:', error);
        }
      });
    }

    return { showContext: newValue };
  }),

  // Toggle between canonical and chronological verse order
  toggleChronological: () => set(state => {
    const newChronological = !state.isChronological;
    console.log('🔄 TOGGLE CHRONOLOGICAL - Current:', state.isChronological, '→ New:', newChronological);

    // Update state first
    const newState = { isChronological: newChronological };

    // Trigger verse reloading by dispatching a custom event
    // This allows the Bible component to react to the change
    setTimeout(() => {
      const event = new CustomEvent('chronologicalOrderChanged', { 
        detail: { isChronological: newChronological } 
      });
      window.dispatchEvent(event);
      console.log(`📅 Dispatched chronologicalOrderChanged event with isChronological: ${newChronological}`);
    }, 0);

    return newState;
  }),

  setActives: (ids: string[]) => set({ actives: ids }),
  setTranslations: (id: string, data: any) => set(state => ({
    translations: { ...state.translations, [id]: data }
  })),
  getAllActive: () => get().actives,
  setActiveLabels: (labels: string[]) => set({ activeLabels: labels }),

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
  // Detect if performance mode should be enabled
  const enablePerformanceMode = () => {
    // Enable performance mode on mobile devices or low-memory devices
    const isMobile = window.innerWidth < 768;
    const hasLowMemory = 'memory' in performance && 
      (performance as any).memory?.jsHeapSizeLimit < 1024 * 1024 * 1024; // < 1GB

    return isMobile || hasLowMemory;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider 
          enablePerformanceMode={enablePerformanceMode()}
          defaultTheme="light"
        >
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