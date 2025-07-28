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
// Start preloading KJV immediately when app loads
import '@/lib/preloader';

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
  displayOrder: number;
}

interface ColumnState {
  columns: ColumnInfo[];
  setVisible: (slot: number, visible: boolean) => void;
  reorder: (from: number, to: number) => void;
  resize: (slot: number, deltaRem: number) => void;
}

interface SizeState {
  sizeMult: number;
  textSizeMult: number;
  externalSizeMult: number;
  unifiedSizing: boolean;
  setSizeMult: (mult: number) => void;
  setTextSizeMult: (mult: number) => void;
  setExternalSizeMult: (mult: number) => void;
  toggleUnifiedSizing: () => void;
}

type LabelName = import('@/lib/labelBits').LabelName;

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
  collapsedProphecies: Set<string>;
  setProphecyData: (data: Record<string, { P: number[], F: number[], V: number[] }>) => void;
  setProphecyIndex: (data: Record<number, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }>) => void;
  toggleProphecyCollapse: (prophecyId: string) => void;
  datesData: string[] | null;
  setDatesData: (dates: string[]) => void;
  labelsData: Record<string, any>;
  setLabelsData: (labels: Record<string, any>) => void;
  store: any;
  showCrossRefs: boolean;
  showProphecies: boolean;
  showNotes: boolean;
  showDates: boolean;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  activeLabels: LabelName[];
  setActiveLabels: (labels: LabelName[]) => void;
  loadCrossRefsData: (verseIds?: string[]) => Promise<void>;
  toggleCrossRefs: () => void;
  toggleProphecies: () => void;
  toggleNotes: () => void;
  toggleDates: () => void;

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
  unlockMode: boolean;
  toggleUnlockMode: () => void;
}>((set, get) => ({
  isInitialized: true,
  translations: {},
  actives: ["KJV"],
  crossRefs: {},
  prophecies: {},
  prophecyData: {},
  prophecyIndex: {},
  collapsedProphecies: new Set<string>(),
  setProphecyData: (data: Record<string, { P: number[], F: number[], V: number[] }>) => set({ prophecyData: data }),
  setProphecyIndex: (data: Record<number, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }>) => set({ prophecyIndex: data }),
  toggleProphecyCollapse: (prophecyId: string) => set(state => {
    const newSet = new Set(state.collapsedProphecies);
    if (newSet.has(prophecyId)) {
      newSet.delete(prophecyId);
    } else {
      newSet.add(prophecyId);
    }
    return { collapsedProphecies: newSet };
  }),
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
  isSearchOpen: false,      // Search modal state
  activeLabels: [],         // Active semantic labels array
  isChronological: false,   // Verse order toggle (canonical vs chronological)
  currentVerseKeys: [],   // Current verse keys array (canonical or chronological)
  setChronological: (chronological: boolean) => set({ isChronological: chronological }),
  setCurrentVerseKeys: (keys: string[]) => set({ currentVerseKeys: keys }),
  unlockMode: false,      // Layout editing mode toggle
  toggleUnlockMode: () => set(state => ({ unlockMode: !state.unlockMode })),

  // DEPRECATED: Legacy cross-reference loading - use useCrossRefLoader hook instead
  loadCrossRefsData: async (verseIds?: string[]) => {
    console.warn('loadCrossRefsData is deprecated, cross-references are now loaded via useCrossRefLoader hook');
    // No-op - the modern useCrossRefLoader handles all cross-ref loading
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

    // Load dates data when toggling on - respect chronological state
    if (newValue) {
      const isChronological = state.isChronological;
      console.log(`📅 Loading ${isChronological ? 'chronological' : 'canonical'} dates data from Supabase...`);
      import('@/data/BibleDataAPI').then(async ({ loadDatesData }) => {
        try {
          const datesArray = await loadDatesData(isChronological);
          get().setDatesData(datesArray);
          console.log(`✅ ${isChronological ? 'Chronological' : 'Canonical'} dates data loaded:`, datesArray.length, 'verse dates');
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

    // If dates are currently visible, reload them in the new order
    if (state.showDates) {
      console.log(`📅 Reloading dates data for ${newChronological ? 'chronological' : 'canonical'} order...`);
      import('@/data/BibleDataAPI').then(async ({ loadDatesData }) => {
        try {
          const datesArray = await loadDatesData(newChronological);
          get().setDatesData(datesArray);
          console.log(`✅ ${newChronological ? 'Chronological' : 'Canonical'} dates data reloaded:`, datesArray.length, 'verse dates');
        } catch (error) {
          console.error('❌ Failed to reload dates data:', error);
        }
      });
    }

    return { isChronological: newChronological };
  }),

  setActives: (ids: string[]) => set({ actives: ids }),
  setTranslations: (id: string, data: any) => set(state => ({
    translations: { ...state.translations, [id]: data }
  })),
  getAllActive: () => get().actives,
  setActiveLabels: (labels: LabelName[]) => {
    console.log('🔍🔍🔍 STORE DEBUG - setActiveLabels called with:', labels, 'type:', typeof labels, 'length:', labels?.length);
    set({ activeLabels: labels });
  },

  // Complete 20-Column Layout Spec - All slots pre-assigned (keeping current working assignments)
  columnState: {
    columns: [
      { slot: 0, visible: true, widthRem: 5, displayOrder: 0 },     // Reference (always visible)
      { slot: 1, visible: false, widthRem: 16, displayOrder: 1 },   // Notes 
      { slot: 2, visible: true, widthRem: 20, displayOrder: 2 },    // Main translation (always visible)
      { slot: 3, visible: false, widthRem: 18, displayOrder: 3 },   // Alt translation 1 (T₁)
      { slot: 4, visible: false, widthRem: 18, displayOrder: 4 },   // Alt translation 2 (T₂)
      { slot: 5, visible: false, widthRem: 18, displayOrder: 5 },   // Alt translation 3 (T₃)
      { slot: 6, visible: false, widthRem: 18, displayOrder: 6 },   // Alt translation 4 (T₄)
      { slot: 7, visible: true, widthRem: 18, displayOrder: 7 },    // Cross References - SAME WIDTH AS ALTERNATE TRANSLATIONS
      { slot: 8, visible: false, widthRem: 18, displayOrder: 8 },   // Prophecy P - SAME WIDTH AS ALTERNATE TRANSLATIONS  
      { slot: 9, visible: false, widthRem: 18, displayOrder: 9 },   // Prophecy F - SAME WIDTH AS ALTERNATE TRANSLATIONS
      { slot: 10, visible: false, widthRem: 18, displayOrder: 10 }, // Prophecy V - SAME WIDTH AS ALTERNATE TRANSLATIONS
      { slot: 11, visible: false, widthRem: 8, displayOrder: 11 },  // Dates (current working position)
      { slot: 12, visible: false, widthRem: 18, displayOrder: 12 }, // Alt translation 5 (T₅)
      { slot: 13, visible: false, widthRem: 18, displayOrder: 13 }, // Alt translation 6 (T₆)
      { slot: 14, visible: false, widthRem: 18, displayOrder: 14 }, // Alt translation 7 (T₇)
      { slot: 15, visible: false, widthRem: 18, displayOrder: 15 }, // Alt translation 8 (T₈)
      { slot: 16, visible: false, widthRem: 18, displayOrder: 16 }, // Alt translation 9 (T₉)
      { slot: 17, visible: false, widthRem: 18, displayOrder: 17 }, // Alt translation 10 (T₁₀)
      { slot: 18, visible: false, widthRem: 18, displayOrder: 18 }, // Alt translation 11 (T₁₁)
      { slot: 19, visible: false, widthRem: 18, displayOrder: 19 }, // Alt translation 12 (T₁₂)
    ],
    setVisible: (slot: number, visible: boolean) => set(state => ({
      columnState: {
        ...state.columnState,
        columns: state.columnState.columns.map(col => 
          col.slot === slot ? { ...col, visible } : col
        )
      }
    })),
    reorder: (fromSlot: number, toSlot: number) => set(state => {
      console.log(`🔄 Column reorder: slot ${fromSlot} → slot ${toSlot}`);
      
      // Find the columns being moved by slot number
      const fromColumn = state.columnState.columns.find(col => col.slot === fromSlot);
      const toColumn = state.columnState.columns.find(col => col.slot === toSlot);
      
      if (!fromColumn || !toColumn) {
        console.warn(`Column not found: fromSlot=${fromSlot} (found: ${!!fromColumn}), toSlot=${toSlot} (found: ${!!toColumn})`);
        console.log('Available columns:', state.columnState.columns.map(c => `slot ${c.slot} (visible: ${c.visible})`));
        return state;
      }
      
      // Get only visible columns sorted by current display order
      const visibleColumns = state.columnState.columns
        .filter(col => col.visible)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      
      const fromDisplayIndex = visibleColumns.findIndex(col => col.slot === fromSlot);
      const toDisplayIndex = visibleColumns.findIndex(col => col.slot === toSlot);
      
      if (fromDisplayIndex === -1 || toDisplayIndex === -1) {
        console.warn(`Display position not found: fromIndex=${fromDisplayIndex}, toIndex=${toDisplayIndex}`);
        return state;
      }
      
      // Reorder the visible columns array by display order
      const reorderedVisible = [...visibleColumns];
      const [movedColumn] = reorderedVisible.splice(fromDisplayIndex, 1);
      reorderedVisible.splice(toDisplayIndex, 0, movedColumn);
      
      // Update only the displayOrder property, keep slot numbers unchanged
      const newColumns = [...state.columnState.columns];
      reorderedVisible.forEach((col, newIndex) => {
        const colIndex = newColumns.findIndex(c => c.slot === col.slot);
        if (colIndex !== -1) {
          newColumns[colIndex] = { 
            ...newColumns[colIndex], 
            displayOrder: newIndex 
          };
        }
      });
      
      console.log(`✅ Column reorder complete`, 
        newColumns.filter(c => c.visible)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map(c => `slot ${c.slot} (order ${c.displayOrder})`));
      
      return { columnState: { ...state.columnState, columns: newColumns } };
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

  // Advanced Size State - Unified or Split Control (0.5-2.0 range)
  sizeState: {
    sizeMult: 1.2, // Unified size multiplier
    textSizeMult: 1.2, // Text-only size multiplier
    externalSizeMult: 1.2, // External elements (columns, headers, rows) size multiplier
    unifiedSizing: true, // Whether to use unified or split control
    setSizeMult: (mult: number) => {
      const currentState = get().sizeState;
      const newState = { 
        ...currentState, 
        sizeMult: mult,
        // When unified, apply to both text and external
        textSizeMult: currentState.unifiedSizing ? mult : currentState.textSizeMult,
        externalSizeMult: currentState.unifiedSizing ? mult : currentState.externalSizeMult
      };
      
      set({ sizeState: newState });
      
      // Apply CSS variables for content-specific scaling (not UI chrome)
      document.documentElement.style.setProperty('--content-size-mult', mult.toString());
      document.documentElement.style.setProperty('--text-size-mult', newState.textSizeMult.toString());
      document.documentElement.style.setProperty('--external-size-mult', newState.externalSizeMult.toString());
      document.documentElement.style.setProperty('--row-height-mult', newState.externalSizeMult.toString());
      document.documentElement.style.setProperty('--column-width-mult', newState.externalSizeMult.toString());
      
      // Persist unified setting
      localStorage.setItem('bibleSizeMult', mult.toString());
      localStorage.setItem('bibleUnifiedSizing', currentState.unifiedSizing.toString());
    },
    setTextSizeMult: (mult: number) => {
      const currentState = get().sizeState;
      const newState = { ...currentState, textSizeMult: mult };
      set({ sizeState: newState });
      
      document.documentElement.style.setProperty('--text-size-mult', mult.toString());
      localStorage.setItem('bibleTextSizeMult', mult.toString());
    },
    setExternalSizeMult: (mult: number) => {
      const currentState = get().sizeState;
      const newState = { ...currentState, externalSizeMult: mult };
      set({ sizeState: newState });
      
      document.documentElement.style.setProperty('--external-size-mult', mult.toString());
      document.documentElement.style.setProperty('--row-height-mult', mult.toString());
      document.documentElement.style.setProperty('--column-width-mult', mult.toString());
      localStorage.setItem('bibleExternalSizeMult', mult.toString());
    },
    toggleUnifiedSizing: () => {
      const currentState = get().sizeState;
      const newUnified = !currentState.unifiedSizing;
      
      // If switching to unified, sync both values to current sizeMult
      const newState = {
        ...currentState,
        unifiedSizing: newUnified,
        textSizeMult: newUnified ? currentState.sizeMult : currentState.textSizeMult,
        externalSizeMult: newUnified ? currentState.sizeMult : currentState.externalSizeMult
      };
      
      set({ sizeState: newState });
      localStorage.setItem('bibleUnifiedSizing', newUnified.toString());
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