import { logger } from "@/lib/logger";
import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MagicLinkToast } from "@/components/auth/MagicLinkToast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConsentMiniLine } from "@/components/ConsentMiniLine";
import { ThemeProvider } from "@/components/bible/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { HighlightProvider } from "@/contexts/HighlightContext";
import { SelectionProvider } from "@/contexts/SelectionContext";
import { setupGlobalDiagnostics } from "@/utils/globalDiagnostics";
import DynamicBackground from "@/components/ui/DynamicBackground";
import { TutorialProvider } from "@/tutorial/Manager";
import { ConfettiPortal } from "@/components/Confetti";
import BiblePage from "@/pages/bible";
import AuthCallback from "@/pages/auth/callback";
import ResetPassword from "@/pages/auth/reset";
import ConfirmEmail from "@/pages/auth/confirm";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import BillingSuccess from "@/pages/BillingSuccess";
import BillingCancel from "@/pages/BillingCancel";
import { create } from 'zustand';
import { useTranslationMaps } from '@/store/translationSlice';
import { markDirty, useSessionState } from '@/hooks/useSessionState';
import { ColumnChangeSignal } from '@/hooks/useColumnChangeSignal';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
// Start preloading KJV immediately when app loads
import '@/lib/preloader';

// ── STABLE EMPTY REFS (prevents setState during render) ─────────────────────
const EMPTY_OBJ = Object.freeze({});
const EMPTY_ARR = Object.freeze([]) as readonly unknown[];

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

// Default column configuration (baseline for reset) - matches columnState initialization
const DEFAULT_COLUMNS: Readonly<ColumnInfo[]> = Object.freeze([
  { slot: 0, visible: true, widthRem: 5, displayOrder: 0 },     // Reference (always visible)
  { slot: 1, visible: false, widthRem: 16, displayOrder: 1 },   // Notes (paid feature)
  { slot: 2, visible: true, widthRem: 20, displayOrder: 2 },    // Main translation
  { slot: 3, visible: false, widthRem: 18, displayOrder: 3 },   // Alt translation 1
  { slot: 4, visible: false, widthRem: 18, displayOrder: 4 },   // Alt translation 2
  { slot: 5, visible: false, widthRem: 18, displayOrder: 5 },   // Alt translation 3
  { slot: 6, visible: false, widthRem: 18, displayOrder: 6 },   // Alt translation 4
  { slot: 7, visible: false, widthRem: 18, displayOrder: 7 },   // Alt translation 5
  { slot: 8, visible: false, widthRem: 18, displayOrder: 8 },   // Alt translation 6
  { slot: 9, visible: false, widthRem: 18, displayOrder: 9 },   // Alt translation 7
  { slot: 10, visible: false, widthRem: 18, displayOrder: 10 }, // Alt translation 8
  { slot: 11, visible: false, widthRem: 18, displayOrder: 11 }, // Alt translation 9
  { slot: 12, visible: false, widthRem: 18, displayOrder: 12 }, // Alt translation 10
  { slot: 13, visible: false, widthRem: 18, displayOrder: 13 }, // Alt translation 11
  { slot: 14, visible: false, widthRem: 18, displayOrder: 14 }, // Alt translation 12
  { slot: 15, visible: true, widthRem: 18, displayOrder: 15 },  // Cross References
  { slot: 16, visible: false, widthRem: 18, displayOrder: 16 }, // Unified Prophecy
  { slot: 19, visible: false, widthRem: 20, displayOrder: 17 }, // Master Column (Hybrid) - fixed displayOrder gap
]);

interface ColumnState {
  columns: ColumnInfo[];
  setVisible: (slot: number, visible: boolean) => void;
  reorder: (from: number, to: number) => void;
  resize: (slot: number, deltaRem: number) => void;
  setColumnDisplayOrder: (newOrder: number[]) => void;
  resetColumnOrder: () => void;
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

interface ActiveColumn {
  key: string;
  header: string;
  type: 'reference' | 'translation' | 'cross-ref' | 'prophecy' | 'notes' | 'alt-translation';
}

// Cross-reference loading status for two-stage system
interface CrossRefStatus {
  data: string[];           // The actual cross-references
  status: 'none' | 'top5' | 'full';  // Loading status: none=not loaded, top5=only top 5 loaded, full=all loaded
}

export const useBibleStore = create<{
  translations: Record<string, any>;
  actives: string[];
  translationState: TranslationState;
  setActives: (ids: string[]) => void;
  setTranslations: (id: string, data: any) => void;
  getAllActive: () => string[];
  crossRefs: Record<string, CrossRefStatus>;
  crossRefsLoading: boolean;
  setCrossRefs: (refs: Record<string, string[]>) => void;
  setCrossRefStatus: (verseId: string, data: string[], status: 'none' | 'top5' | 'full') => void;
  setCrossRefsLoading: (loading: boolean) => void;
  strongsData: Record<string, any[]>;
  strongsLoading: Set<string>;
  setStrongsData: (verseId: string, data: any[]) => void;
  loadStrongsData: (verseIds: string[]) => Promise<void>;
  highlights: Record<string, any[]>;
  setHighlights: (highlights: Record<string, any[]>) => void;
  prophecies: Record<string, any>;
  prophecyData: Record<string, { P: number[], F: number[], V: number[] }> | undefined;
  prophecyIndex: Record<number, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }> | undefined;
  collapsedProphecies: Set<string>;
  setProphecyData: (data: Record<string, { P: number[], F: number[], V: number[] }> | undefined) => void;
  setProphecyIndex: (data: Record<number, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }> | undefined) => void;
  toggleProphecyCollapse: (prophecyId: string) => void;
  datesData: string[] | null;
  setDatesData: (dates: string[]) => void;
  labelsData: Record<string, any>;
  setLabelsData: (labels: Record<string, any>) => void;
  contextBoundaries: Map<string, { startVerse: string; endVerse: string; groupIndex: number }>;
  setContextBoundaries: (boundaries: Map<string, { startVerse: string; endVerse: string; groupIndex: number }>) => void;
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
  showHybrid: boolean;
  toggleHybrid: () => void;
  columnState: ColumnState;
  sizeState: SizeState;
  isInitialized: boolean;
  isChronological: boolean;
  currentVerseKeys: string[];
  setChronological: (chronological: boolean) => void;
  setCurrentVerseKeys: (keys: string[]) => void;
  unlockMode: boolean;
  toggleUnlockMode: () => void;


  // UNIFIED: Dynamic visible count system with enhanced navigation
  visibleCount: number;
  containerWidthPx: number;
  columnWidthsPx: Record<string, number>;
  gapPx: number;
  fixedColumns: string[];
  navigableColumns: string[];
  fallbackVisibleNavigableCount: number;
  baseWidths: Record<string, number>;
  
  // Column shifting navigation state
  navigationOffset: number;
  maxVisibleNavigableColumns: number;
  visibleNavigableCount: number; // Measured count from DOM
  
  // Column pivot state - tracks which column is the main focus
  pivotColumnIndex: number;
  
  setVisibleCount: (count: number) => void;
  setContainerWidthPx: (width: number) => void;
  setGapPx: (gap: number) => void;
  setColumnWidthPx: (id: string, width: number) => void;
  setFixedColumns: (columns: string[]) => void;
  setNavigableColumns: (columns: string[]) => void;
  rebuildNavigableColumns: () => void;
  setFallbackVisibleNavigableCount: (count: number) => void;
  setMaxVisibleNavigableColumns: (count: number) => void;
  setVisibleNavigableCount: (count: number) => void;
  
  // Column shifting navigation functions
  shiftColumnsLeft: () => void;
  shiftColumnsRight: () => void;
  canShiftLeft: () => boolean;
  canShiftRight: () => boolean;
  resetColumnShift: () => void;
  autoRecenter: () => void;
  
  // Column pivot functions - cycle through individual column focus
  pivotColumnLeft: () => void;
  pivotColumnRight: () => void;
  canPivotLeft: () => boolean;
  canPivotRight: () => boolean;
  getCurrentPivotColumn: () => ActiveColumn | null;
  
  // Column alignment lock modes
  alignmentLockMode: 'auto' | 'centeredLocked' | 'leftLocked';
  setAlignmentLockMode: (mode: 'auto' | 'centeredLocked' | 'leftLocked') => void;
  
  // 🎯 MEMOIZATION CACHE: Properties for buildActiveColumns optimization
  _activeColumnsCache: ActiveColumn[];
  _activeColumnsDeps: string;
  _lastEmptyCacheWarning?: number;
  
  buildActiveColumns: () => ActiveColumn[];
  buildActiveColumnsPure: () => ActiveColumn[];
  recomputeActiveColumns: (depsKey: string, builder: () => ActiveColumn[]) => void;
  getActiveColumns: () => ActiveColumn[];
  setupTranslationReactivity: () => () => void;
  getVisibleSlice: () => {
    start: number;
    end: number;
    canGoLeft: boolean;
    canGoRight: boolean;
    labelStart: number;
    labelEnd: number;
    totalNavigable: number;
    templateForVisible: string;
    visibleKeys: string[];
    visibleNavigableCount: number;
    modeUsed: 'width' | 'count';
    activeColumns: ActiveColumn[];
  };
  getSharedGridTemplate: () => string;
}>((set, get) => ({
  isInitialized: true,
  translations: {},
  actives: ["KJV"],
  crossRefs: {},
  crossRefsLoading: false,
  strongsData: {},
  strongsLoading: new Set<string>(),
  highlights: {},
  prophecies: {},
  prophecyData: undefined,
  prophecyIndex: undefined,
  collapsedProphecies: new Set<string>(),
  setProphecyData: (data: Record<string, { P: number[], F: number[], V: number[] }> | undefined) => set({ prophecyData: data }),
  setProphecyIndex: (data: Record<number, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }> | undefined) => set({ prophecyIndex: data }),
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
  contextBoundaries: new Map(),
  setContextBoundaries: (boundaries: Map<string, { startVerse: string; endVerse: string; groupIndex: number }>) => set({ contextBoundaries: boundaries }),
  setSearchOpen: (open: boolean) => set({ isSearchOpen: open }),
  setCrossRefs: (refs: Record<string, string[]>) => {
    // Convert old format to new CrossRefStatus format for backward compatibility
    const crossRefStatuses: Record<string, CrossRefStatus> = {};
    for (const [verseId, data] of Object.entries(refs)) {
      crossRefStatuses[verseId] = {
        data,
        status: 'full' // Assume full loading for backward compatibility
      };
    }
    set({ crossRefs: crossRefStatuses });
  },
  
  setCrossRefStatus: (verseId: string, data: string[], status: 'none' | 'top5' | 'full') => {
    const current = get().crossRefs;
    set({
      crossRefs: {
        ...current,
        [verseId]: {
          data,
          status
        }
      }
    });
  },
  
  setCrossRefsLoading: (loading: boolean) => set({ crossRefsLoading: loading }),
  
  setStrongsData: (verseId: string, data: any[]) => {
    const current = get().strongsData;
    set({
      strongsData: {
        ...current,
        [verseId]: data
      }
    });
  },
  
  loadStrongsData: async (verseIds: string[]) => {
    const state = get();
    
    // Filter to verses that don't have Strong's data yet AND aren't currently loading
    const neededVerses = verseIds.filter(id => 
      !state.strongsData[id] && !state.strongsLoading.has(id)
    );
    
    if (neededVerses.length === 0) {
      return;
    }
    
    // Mark verses as loading
    const newLoadingSet = new Set(state.strongsLoading);
    neededVerses.forEach(id => newLoadingSet.add(id));
    set({ strongsLoading: newLoadingSet });
    
    try {
      const { BibleDataAPI } = await import('@/data/BibleDataAPI');
      
      // Load Strong's data for each needed verse
      for (const verseId of neededVerses) {
        try {
          const cells = await BibleDataAPI.getInterlinearData(verseId);
          get().setStrongsData(verseId, cells || []);
        } catch (error) {
          console.error(`Error loading Strong's data for ${verseId}:`, error);
          get().setStrongsData(verseId, []);
        } finally {
          // Remove from loading set
          const currentLoadingSet = new Set(get().strongsLoading);
          currentLoadingSet.delete(verseId);
          set({ strongsLoading: currentLoadingSet });
        }
      }
    } catch (error) {
      logger.error('APP', '❌ Failed to load Strong\'s data:', error);
      // Clear all loading flags on error
      set({ strongsLoading: new Set<string>() });
    }
  },
  
  setHighlights: (highlights: Record<string, any[]>) => {
    const prev = get().highlights;
    const prevKeys = Object.keys(prev);
    const newKeys = Object.keys(highlights);
    
    // Check if keys are different
    if (prevKeys.length !== newKeys.length || prevKeys.some(k => !highlights.hasOwnProperty(k))) {
      set({ highlights });
      return;
    }
    
    // Check if values are different
    for (const key of newKeys) {
      const prevValue = prev[key];
      const newValue = highlights[key];
      if (!prevValue || prevValue.length !== newValue.length || prevValue.some((v, i) => v.id !== newValue[i].id)) {
        set({ highlights });
        return;
      }
    }
  },
  store: { crossRefs: {}, highlights: {}, prophecies: {} },
  showCrossRefs: true,  // Default ON for all users
  showProphecies: false, // Default OFF for non-users
  showNotes: false,     // Notes column toggle (paid feature)
  showDates: false,      // Dates column toggle - OFF by default
  showContext: false,   // Context boundaries toggle - OFF by default
  showHybrid: false,    // Master column toggle - OFF by default, resets on reload for guests
  isSearchOpen: false,      // Search modal state
  activeLabels: [],         // Active semantic labels array
  isChronological: false,   // Verse order toggle (canonical vs chronological)
  currentVerseKeys: [],   // Current verse keys array (canonical or chronological)
  setChronological: (chronological: boolean) => set({ isChronological: chronological }),
  setCurrentVerseKeys: (keys: string[]) => set({ currentVerseKeys: keys }),
  unlockMode: false,      // Layout editing mode toggle
  toggleUnlockMode: () => set(state => {
    markDirty();
    return { unlockMode: !state.unlockMode };
  }),
  
  // Column alignment lock modes
  alignmentLockMode: 'auto' as const,  // Default to auto mode (existing dynamic behavior)
  setAlignmentLockMode: (mode: 'auto' | 'centeredLocked' | 'leftLocked') => set(state => {
    const newState: any = { alignmentLockMode: mode };
    
    // CRITICAL FIX: When entering centeredLocked mode, reset navigationOffset to 0 to ensure true centering
    if (mode === 'centeredLocked') {
      newState.navigationOffset = 0;
      logger.debug('APP', '🎯 Centered lock activated - resetting navigationOffset to 0 for true centering');
    }
    
    return newState;
  }),

  // Load cross-references data for specific verse range (anchor-centered)
  // Updated for two-stage loading: loads top-5 initially, remainder on-demand
  loadCrossRefsData: async (verseIds?: string[]) => {
    const state = get();

    // If no specific verses provided, load for current verse keys (compatibility with toggle)
    let versesToLoad = verseIds;
    if (!versesToLoad || versesToLoad.length === 0) {
      versesToLoad = state.currentVerseKeys.slice(0, 50); // Load first 50 verses when toggling
      if (versesToLoad.length === 0) {
        return; // No verses available to load
      }
    }

    // Check for verses that need loading (none status or don't exist)
    const neededVerses = versesToLoad.filter(id => {
      const crossRefStatus = state.crossRefs[id];
      return !crossRefStatus || crossRefStatus.status === 'none';
    });

    if (neededVerses.length === 0) {
      return;
    }

    // Set loading state
    set({ crossRefsLoading: true });

    try {
      // Import the new two-stage loading functions and canonical parser
      const { getCrossRefsTop5 } = await import('@/data/BibleDataAPI');
      const { parseVerseReference, canonicalToReference } = await import('@/lib/bibleSearchEngine');
      
      // Helper function to canonicalize verse reference
      const canonicalizeVerseReference = (ref: string): string => {
        const parsed = parseVerseReference(ref);
        if (!parsed || !parsed.book || !parsed.chapter || !parsed.verse) {
          return ref; // Return original if parsing fails
        }
        
        const bookRef = canonicalToReference(parsed.book);
        return `${bookRef}.${parsed.chapter}:${parsed.verse}`;
      };
      
      // Load top-5 cross-references for each needed verse
      const top5Data = await getCrossRefsTop5();
      
      // Update store with top-5 data
      const updates: Record<string, CrossRefStatus> = { ...state.crossRefs };
      
      for (const verseId of neededVerses) {
        // Canonicalize the verse ID for lookup in top5Data
        const canonicalVerseId = canonicalizeVerseReference(verseId);
        const top5Refs = top5Data[canonicalVerseId] || [];
        updates[verseId] = {
          data: top5Refs,
          status: 'top5'
        };
      }

      set({ crossRefs: updates, crossRefsLoading: false });

    } catch (error) {
      logger.error('APP', '❌ Failed to load top-5 cross-references:', error);
      
      // Fallback to old system if two-stage loading fails
      try {
        const { getCrossReferences } = await import('@/data/BibleDataAPI');
        const updates: Record<string, CrossRefStatus> = { ...state.crossRefs };

        for (const verseId of neededVerses) {
          try {
            const refs = await getCrossReferences(verseId);
            if (refs && refs.length > 0) {
              updates[verseId] = {
                data: refs,
                status: 'full'
              };
            }
          } catch (error) {
            logger.warn('APP', `Failed to load cross-refs for ${verseId}:`, error);
          }
        }

        set({ crossRefs: updates, crossRefsLoading: false });
      } catch (fallbackError) {
        logger.error('APP', '❌ Fallback cross-reference loading also failed:', fallbackError);
        set({ crossRefsLoading: false });
      }
    }
  },

  toggleCrossRefs: () => {
    set(state => {
      const newValue = !state.showCrossRefs;

      // Load cross-references data when toggling on
      if (newValue && Object.keys(state.crossRefs).length === 0) {
        // Trigger data loading with two-stage system
        setTimeout(() => get().loadCrossRefsData(), 0);
      }

      const newState = {
        showCrossRefs: newValue,
        columnState: {
          ...state.columnState,
          columns: state.columnState.columns.map(col => 
            col.slot === 15 ? { ...col, visible: newValue } : col // Slot 15 = Cross References
          )
        }
      };
      markDirty();
      return newState;
    });
    
    // 🎯 INSTANT UPDATE: Rebuild navigableColumns synchronously so headers update in same frame
    get().rebuildNavigableColumns();
  },

  toggleProphecies: () => {
    set(state => {
      const newValue = !state.showProphecies;

      if (newValue) {
        // Turning ON → load once via deduped loader
        import('@/data/BibleDataAPI').then(async ({ loadProphecyData }) => {
          try {
            const { verseRoles, prophecyIndex } = await loadProphecyData();
            const s = get();
            s.setProphecyData(verseRoles);
            s.setProphecyIndex(prophecyIndex);
          } catch (err) {
            logger.error('APP', '❌ Failed to load prophecy data:', err);
            const s = get();
            s.setProphecyData({});
            s.setProphecyIndex({});
          }
        });
      } else {
        // Turning OFF → drop state + clear caches to allow GC
        const s = get();
        s.setProphecyData(undefined);
        s.setProphecyIndex(undefined);
        import('@/data/BibleDataAPI').then(({ clearProphecyCache }) => clearProphecyCache());
      }

      const newState = {
        showProphecies: newValue,
        columnState: {
          ...state.columnState,
          columns: state.columnState.columns.map(col => 
            col.slot === 16 ? { ...col, visible: newValue } : col // Slot 16 = Unified Prophecy column
          )
        }
      };
      markDirty();
      return newState;
    });
    
    // 🎯 INSTANT UPDATE: Rebuild navigableColumns synchronously so headers update in same frame
    get().rebuildNavigableColumns();
  },

  toggleNotes: () => {
    set(state => {
      const newValue = !state.showNotes;
      const newState = {
        showNotes: newValue,
        columnState: {
          ...state.columnState,
          columns: state.columnState.columns.map(col => 
            col.slot === 1 ? { ...col, visible: newValue } : col // Slot 1 = Notes
          )
        }
      };
      markDirty();
      return newState;
    });
    
    // 🎯 INSTANT UPDATE: Rebuild navigableColumns synchronously so headers update in same frame
    get().rebuildNavigableColumns();
  },

  toggleDates: () => set(state => {
    const newValue = !state.showDates;

    // Load dates data when toggling on - respect chronological state
    if (newValue) {
      const isChronological = state.isChronological;
      import('@/data/BibleDataAPI').then(async ({ loadDatesData }) => {
        try {
          const datesArray = await loadDatesData(isChronological);
          get().setDatesData(datesArray);
        } catch (error) {
          logger.error('APP', '❌ Failed to load dates data:', error);
        }
      });
    }

    const newState = {
      showDates: newValue,
      columnState: {
        ...state.columnState,
        columns: state.columnState.columns.map(col => 
          col.slot === 999 ? { ...col, visible: newValue } : col // Dates are overlay, no real column
        )
      }
    };
    markDirty();
    return newState;
  }),



  toggleContext: () => set(state => {
    const newValue = !state.showContext;

    // Load context groups data when toggling on
    if (newValue) {
      import('@/data/BibleDataAPI').then(async ({ getContextGroups }) => {
        try {
          const contextData = await getContextGroups();

          // Process context groups into a map for quick lookup
          const newContextMap = new Map<string, { startVerse: string; endVerse: string; groupIndex: number }>();

          // Convert pipe format to dot format
          const convertToDotFormat = (verseId: string): string => {
            const parts = verseId.split('|');
            if (parts.length !== 3) return verseId;
            return `${parts[0]}.${parts[1]}:${parts[2]}`;
          };

          contextData.forEach((group, groupIndex) => {
            if (group.length === 0) return;

            // Convert all verses in the group to dot format
            const dotFormatVerses = group.map(v => convertToDotFormat(v));
            const startVerse = dotFormatVerses[0];
            const endVerse = dotFormatVerses[dotFormatVerses.length - 1];

            // Map each verse in the group to its boundary info
            dotFormatVerses.forEach(verse => {
              newContextMap.set(verse, {
                startVerse,
                endVerse,
                groupIndex
              });
            });
          });

          get().setContextBoundaries(newContextMap);

        } catch (error) {
          logger.error('APP', '❌ Failed to load context groups:', error);
        }
      });
    }

    markDirty();
    return { showContext: newValue };
  }),

  toggleHybrid: () => set(state => {
    const newValue = !state.showHybrid;
    const newState = {
      showHybrid: newValue,
      columnState: {
        ...state.columnState,
        columns: state.columnState.columns.map(col => 
          col.slot === 19 ? { ...col, visible: newValue } : col // Slot 19 = Hybrid
        )
      }
    };
    markDirty();
    return newState;
  }),

  // Toggle between canonical and chronological verse order
  toggleChronological: () => set(state => {
    const newChronological = !state.isChronological;

    // IMMEDIATE VERSE RELOADING: Follow exact system logging path (STEP 5-8)

    // IMMEDIATE EXECUTION: Just load the new verse order
    (async () => {
      try {
        // CRITICAL FIX: Clear verse index cache when switching order to prevent verse jumping
        const { clearVerseIndexCache } = await import('@/lib/verseIndexMap');
        clearVerseIndexCache();

        const { loadVerseKeys } = await import('@/data/BibleDataAPI');
        const { createVerseObjectsFromKeys } = await import('@/lib/verseKeysLoader');

        // STEP 1: Load the new verse order
        const verseKeys = await loadVerseKeys(newChronological);


        // Update store with new keys
        get().setCurrentVerseKeys(verseKeys);

        // Create verse objects in new order
        const reorderedVerses = createVerseObjectsFromKeys(verseKeys);

        // Trigger UI update
        window.dispatchEvent(new CustomEvent('verse-order-changed', { 
          detail: { 
            newOrder: newChronological ? 'chronological' : 'canonical',
            verses: reorderedVerses 
          }
        }));

      } catch (error) {
        logger.error('APP', '❌ IMMEDIATE: Failed to reload verses:', error);
        if (error instanceof Error) {
          logger.error('APP', '❌ Error details:', error.stack);
        }
        logger.error('APP', '❌ Error object:', error);
      }
    })();

    // If dates are currently visible, reload them in the new order
    if (state.showDates) {
      import('@/data/BibleDataAPI').then(async ({ loadDatesData }) => {
        try {
          const datesArray = await loadDatesData(newChronological);
          get().setDatesData(datesArray);
        } catch (error) {
          logger.error('APP', '❌ Failed to reload dates data:', error);
        }
      });
    }

    markDirty();
    return { isChronological: newChronological };
  }),

  setActives: (ids: string[]) => set({ actives: ids }),
  setTranslations: (id: string, data: any) => set(state => ({
    translations: { ...state.translations, [id]: data }
  })),
  getAllActive: () => get().actives,
  setActiveLabels: (labels: LabelName[]) => {
    set({ activeLabels: labels });
    markDirty();
  },

  // Complete Column Layout - Updated for new track structure
  columnState: {
    columns: [
      { slot: 0, visible: true, widthRem: 5, displayOrder: 0 },     // Reference (always visible)
      { slot: 1, visible: false, widthRem: 16, displayOrder: 1 },   // Notes (paid feature)
      { slot: 2, visible: true, widthRem: 20, displayOrder: 2 },    // Main translation (moved to slot 2)
      { slot: 3, visible: false, widthRem: 18, displayOrder: 3 },   // Alt translation 1
      { slot: 4, visible: false, widthRem: 18, displayOrder: 4 },   // Alt translation 2
      { slot: 5, visible: false, widthRem: 18, displayOrder: 5 },   // Alt translation 3
      { slot: 6, visible: false, widthRem: 18, displayOrder: 6 },   // Alt translation 4
      { slot: 7, visible: false, widthRem: 18, displayOrder: 7 },   // Alt translation 5
      { slot: 8, visible: false, widthRem: 18, displayOrder: 8 },   // Alt translation 6
      { slot: 9, visible: false, widthRem: 18, displayOrder: 9 },   // Alt translation 7
      { slot: 10, visible: false, widthRem: 18, displayOrder: 10 }, // Alt translation 8
      { slot: 11, visible: false, widthRem: 18, displayOrder: 11 }, // Alt translation 9
      { slot: 12, visible: false, widthRem: 18, displayOrder: 12 }, // Alt translation 10
      { slot: 13, visible: false, widthRem: 18, displayOrder: 13 }, // Alt translation 11
      { slot: 14, visible: false, widthRem: 18, displayOrder: 14 }, // Alt translation 12
      { slot: 15, visible: true, widthRem: 18, displayOrder: 15 },  // Cross References (moved to slot 15)
      { slot: 16, visible: false, widthRem: 18, displayOrder: 16 }, // Unified Prophecy (slot 16)
      { slot: 19, visible: false, widthRem: 20, displayOrder: 17 }, // Master Column (Hybrid) - sequential order
    ],
    setVisible: (slot: number, visible: boolean) => set(state => {
      markDirty();
      return {
        columnState: {
          ...state.columnState,
          columns: state.columnState.columns.map(col => 
            col.slot === slot ? { ...col, visible } : col
          )
        }
      };
    }),
    reorder: (fromSlot: number, toSlot: number) => set(state => {
      logger.debug('APP', `🔄 Column reorder: slot ${fromSlot} → slot ${toSlot}`);

      // Find the columns being moved by slot number
      const fromColumn = state.columnState.columns.find(col => col.slot === fromSlot);
      const toColumn = state.columnState.columns.find(col => col.slot === toSlot);

      if (!fromColumn || !toColumn) {
        logger.warn('APP', `Column not found: fromSlot=${fromSlot} (found: ${!!fromColumn}), toSlot=${toSlot} (found: ${!!toColumn})`);
        logger.debug('APP', 'Available columns:', state.columnState.columns.map(c => `slot ${c.slot} (visible: ${c.visible})`));
        return state;
      }

      // Get only visible columns sorted by current display order
      const visibleColumns = state.columnState.columns
        .filter(col => col.visible)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      const fromDisplayIndex = visibleColumns.findIndex(col => col.slot === fromSlot);
      const toDisplayIndex = visibleColumns.findIndex(col => col.slot === toSlot);

      if (fromDisplayIndex === -1 || toDisplayIndex === -1) {
        logger.warn('APP', `Display position not found: fromIndex=${fromDisplayIndex}, toIndex=${toDisplayIndex}`);
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

      logger.debug('APP', `✅ Column reorder complete`, 
        newColumns.filter(c => c.visible)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map(c => `slot ${c.slot} (order ${c.displayOrder})`));

      markDirty();
      return { columnState: { ...state.columnState, columns: newColumns } };
    }),
    resize: (slot: number, deltaRem: number) => set(state => {
      markDirty();
      return {
        columnState: {
          ...state.columnState,
          columns: state.columnState.columns.map(col => 
            col.slot === slot ? { ...col, widthRem: Math.max(3, col.widthRem + deltaRem) } : col
          )
        }
      };
    }),
    setColumnDisplayOrder: (newOrder: number[]) => {
      set(state => {
        logger.debug('COLUMN', 'set-display-order', { newOrder });
        
        const newColumns = [...state.columnState.columns];
        
        // Update each column's order and visibility
        newOrder.forEach((slot, displayIndex) => {
          const colIndex = newColumns.findIndex(c => c.slot === slot);
          if (colIndex !== -1) {
            newColumns[colIndex] = {
              ...newColumns[colIndex],
              displayOrder: displayIndex,
              visible: true
            };
          }
        });
        
        // Mark dirty for session save
        markDirty();
        
        // Reset navigation offset as order changed
        return {
          columnState: { ...state.columnState, columns: newColumns },
          navigationOffset: 0,
          _activeColumnsDeps: '' // Invalidate cache to trigger recomputation
        };
      });
      
      // Trigger recomputation of active columns to update UI
      const currentStore = get();
      if (currentStore.buildActiveColumns) {
        const newActiveColumns = currentStore.buildActiveColumns();
        set({
          _activeColumnsCache: newActiveColumns,
          _activeColumnsDeps: JSON.stringify({
            main: currentStore.translationState.main,
            alts: currentStore.translationState.alternates,
            showCrossRefs: currentStore.showCrossRefs,
            showProphecies: currentStore.showProphecies,
            showNotes: currentStore.showNotes,
            columns: currentStore.columnState.columns.map(c => ({ slot: c.slot, visible: c.visible, order: c.displayOrder }))
          })
        });
      }
    },
    resetColumnOrder: () => {
      logger.info('APP', '🔄 Resetting column order to defaults');
      
      set(state => {
        // Reset displayOrder and widthRem to defaults, keep current visibility
        const resetColumns = state.columnState.columns.map(col => {
          const defaultCol = DEFAULT_COLUMNS.find(dc => dc.slot === col.slot);
          return defaultCol ? {
            ...col,
            displayOrder: defaultCol.displayOrder,
            widthRem: defaultCol.widthRem
          } : col;
        });
        
        markDirty();
        
        // Reset navigation offset and invalidate cache
        return {
          columnState: { ...state.columnState, columns: resetColumns },
          navigationOffset: 0,
          _activeColumnsDeps: '' // Invalidate cache to trigger recomputation
        };
      });
      
      // Rebuild navigable columns to update UI instantly
      const currentStore = get();
      if (currentStore.rebuildNavigableColumns) {
        currentStore.rebuildNavigableColumns();
      }
      
      // Emit column change signal for downstream components (synchronous)
      ColumnChangeSignal.getInstance().emit('order', { action: 'reset' });
      
      logger.info('APP', '✅ Column order reset complete');
    }
  },

  // Advanced Size State - Unified or Split Control (0.5-2.0 range)
  sizeState: {
    sizeMult: 1.0, // Unified size multiplier
    textSizeMult: 1.0, // Text-only size multiplier
    externalSizeMult: 1.0, // External elements (columns, headers, rows) size multiplier
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
      markDirty();
    },
    setTextSizeMult: (mult: number) => {
      const currentState = get().sizeState;
      const newState = { ...currentState, textSizeMult: mult };
      set({ sizeState: newState });

      document.documentElement.style.setProperty('--text-size-mult', mult.toString());
      localStorage.setItem('bibleTextSizeMult', mult.toString());
      markDirty();
    },
    setExternalSizeMult: (mult: number) => {
      const currentState = get().sizeState;
      const newState = { ...currentState, externalSizeMult: mult };
      set({ sizeState: newState });

      document.documentElement.style.setProperty('--external-size-mult', mult.toString());
      document.documentElement.style.setProperty('--row-height-mult', mult.toString());
      document.documentElement.style.setProperty('--column-width-mult', mult.toString());
      
      // Notify components that size settings changed (complete payload matching Display Settings)
      window.dispatchEvent(new CustomEvent('manualSizeChange', {
        detail: { 
          textSize: currentState.textSizeMult, 
          rowHeight: mult, 
          columnWidth: mult,
          isUnified: currentState.unifiedSizing
        }
      }));
      
      localStorage.setItem('bibleExternalSizeMult', mult.toString());
      markDirty();
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
      markDirty();
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

      markDirty();
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

      markDirty();
      return {
        translationState: {
          ...state.translationState,
          alternates: newAlternates,
          columnKeys
        }
      };
    }),
    clearAlternates: (id: string) => set(state => {
      markDirty();
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


  // UNIFIED: Dynamic visible count system implementation with CSS grid templates
  visibleCount: 1,
  containerWidthPx: 0,
  columnWidthsPx: {},
  gapPx: 0,
  fixedColumns: ['reference'], // Only reference is fixed now
  navigableColumns: [],
  fallbackVisibleNavigableCount: 1,
  
  // 🎯 MEMOIZATION CACHE: Initial state for buildActiveColumns optimization
  _activeColumnsCache: [],
  _activeColumnsDeps: '',
  
  // Column shifting navigation state
  navigationOffset: 0,
  maxVisibleNavigableColumns: 3, // Legacy - will be replaced by measured count
  visibleNavigableCount: 1, // Measured count from DOM
  
  // Column pivot state
  pivotColumnIndex: 0,

  // Column type to width mapping (base widths)
  baseWidths: {
    reference: 72,
    'main-translation': 420,
    'alt-translation': 360,
    'cross-refs': 360,
    'prophecy': 360,
    notes: 320
  },

  setVisibleCount: (count: number) => set({ visibleCount: Math.max(1, count) }),
  setContainerWidthPx: (width: number) => set({ containerWidthPx: Math.max(0, width) }),
  setGapPx: (gap: number) => set({ gapPx: Math.max(0, gap) }),
  setColumnWidthPx: (id: string, width: number) => set(state => ({
    columnWidthsPx: { ...state.columnWidthsPx, [id]: width }
  })),
  setFixedColumns: (columns: string[]) => {
    const prev = get().fixedColumns;
    if (prev.length !== columns.length || prev.some((v, i) => v !== columns[i])) {
      set({ fixedColumns: columns });
    }
  },
  setNavigableColumns: (columns: string[]) => {
    const prev = get().navigableColumns;
    if (prev.length !== columns.length || prev.some((v, i) => v !== columns[i])) {
      set({ navigableColumns: columns });
    }
  },
  
  // 🎯 INSTANT COLUMN UPDATE: Rebuild navigableColumns array synchronously
  // Called immediately after any column toggle to ensure headers + alignment update in same frame
  rebuildNavigableColumns: () => {
    const state = get();
    const translationStore = useTranslationMaps.getState();
    const translationMain = translationStore.main;
    const translationAlternates = translationStore.alternates;
    
    // Build navigable columns array (same logic as VirtualBibleTable useEffect)
    const nav: string[] = ['main-translation'];
    if (state.showCrossRefs) nav.push('cross-refs');
    if (state.showNotes) nav.push('notes');
    if (state.showProphecies) nav.push('prophecy');
    
    // Add alternate translation columns (filter out main to avoid duplicates)
    translationAlternates
      .filter(code => code !== translationMain)
      .forEach(code => nav.push(`alt-translation-${code}`));
    
    // Update the store synchronously
    const prev = state.navigableColumns;
    if (prev.length !== nav.length || prev.some((v, i) => v !== nav[i])) {
      logger.debug('STORE', '🔄 Instant column rebuild:', { 
        from: prev, 
        to: nav, 
        flags: { 
          showCrossRefs: state.showCrossRefs, 
          showNotes: state.showNotes, 
          showProphecies: state.showProphecies 
        } 
      });
      set({ navigableColumns: nav });
    }
  },
  setFallbackVisibleNavigableCount: (count: number) => set({ fallbackVisibleNavigableCount: Math.max(1, count) }),
  setMaxVisibleNavigableColumns: (count: number) => set({ maxVisibleNavigableColumns: Math.max(1, count) }),
  setVisibleNavigableCount: (count: number) => set({ visibleNavigableCount: Math.max(1, count) }),

  // Column shifting navigation functions
  shiftColumnsLeft: () => set(state => {
    // Respect alignment lock modes - prevent shifting in centeredLocked mode
    if (state.alignmentLockMode === 'centeredLocked') {
      logger.debug('APP', '⬅️ Shift blocked: Centered lock mode active');
      return state; // No changes
    }
    
    const maxOffset = Math.max(0, state.navigationOffset - 1);
    logger.debug('APP', `⬅️ Shifting columns left: ${state.navigationOffset} → ${maxOffset}`);
    return { navigationOffset: maxOffset };
  }),
  
  shiftColumnsRight: () => set(state => {
    // Respect alignment lock modes - prevent shifting in centeredLocked mode
    if (state.alignmentLockMode === 'centeredLocked') {
      logger.debug('APP', '➡️ Shift blocked: Centered lock mode active');
      return state; // No changes
    }
    
    const totalNavigable = state.navigableColumns.length;
    
    // IMPROVED MOBILE DETECTION: Consider both viewport width AND orientation
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobilePortrait = state.containerWidthPx <= 768 && isPortrait;
    const measuredCount = state.visibleNavigableCount || state.maxVisibleNavigableColumns;
    
    // Only cap at 2 columns for mobile PORTRAIT mode, allow more for landscape
    const visibleCount = isMobilePortrait 
      ? Math.min(2, measuredCount, totalNavigable)  // Mobile Portrait: Cap at 2 columns
      : measuredCount;                              // Desktop or Mobile Landscape: Use measured count
    
    const maxOffset = Math.max(0, totalNavigable - visibleCount);
    const newOffset = Math.min(maxOffset, state.navigationOffset + 1);
    logger.debug('APP', `➡️ Shifting columns right: ${state.navigationOffset} → ${newOffset} (max: ${maxOffset})`);
    return { navigationOffset: newOffset };
  }),
  
  canShiftLeft: () => {
    const state = get();
    // Respect alignment lock modes - prevent shifting in centeredLocked mode
    if (state.alignmentLockMode === 'centeredLocked') {
      return false;
    }
    
    // ENHANCEMENT: Also disable when auto center-aligned (columns fit in viewport)
    if (state.alignmentLockMode === 'auto' && state.navigationOffset === 0) {
      const totalNavigable = state.navigableColumns.length;
      const measuredCount = state.visibleNavigableCount || state.maxVisibleNavigableColumns;
      
      // If all columns fit in viewport, we're center-aligned, so disable shifting
      if (totalNavigable <= measuredCount) {
        return false;
      }
    }
    
    return state.navigationOffset > 0;
  },
  
  canShiftRight: () => {
    const state = get();
    // Respect alignment lock modes - prevent shifting in centeredLocked mode
    if (state.alignmentLockMode === 'centeredLocked') {
      return false;
    }
    
    const totalNavigable = state.navigableColumns.length;
    
    // IMPROVED MOBILE DETECTION: Consider both viewport width AND orientation
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobilePortrait = state.containerWidthPx <= 768 && isPortrait;
    const measuredCount = state.visibleNavigableCount || state.maxVisibleNavigableColumns;
    
    // Only cap at 2 columns for mobile PORTRAIT mode, allow more for landscape
    const visibleCount = isMobilePortrait 
      ? Math.min(2, measuredCount, totalNavigable)  // Mobile Portrait: Cap at 2 columns
      : measuredCount;                              // Desktop or Mobile Landscape: Use measured count
    
    // ENHANCEMENT: Also disable when auto center-aligned (columns fit in viewport)
    if (state.alignmentLockMode === 'auto' && state.navigationOffset === 0) {
      // If all columns fit in viewport, we're center-aligned, so disable shifting
      if (totalNavigable <= visibleCount) {
        return false;
      }
    }
    
    const maxOffset = Math.max(0, totalNavigable - visibleCount);
    return state.navigationOffset < maxOffset;
  },
  
  resetColumnShift: () => set(state => {
    // Respect alignment lock modes - prevent reset in centeredLocked mode
    if (state.alignmentLockMode === 'centeredLocked') {
      logger.debug('APP', '🔄 Reset blocked: Centered lock mode active');
      return state; // No changes
    }
    return { navigationOffset: 0 };
  }),
  
  autoRecenter: () => set(state => {
    // Atomically reset both navigation offset and pivot state when content fits
    // This prevents tug-of-war between reset logic and pivot preservation
    if (state.alignmentLockMode !== 'auto') {
      return state; // Only auto-recenter in auto mode
    }
    logger.debug('APP', '🎯 Auto-recenter: Resetting navigation and pivot state', {
      fromOffset: state.navigationOffset,
      fromPivot: state.pivotColumnIndex
    });
    return { 
      navigationOffset: 0,
      pivotColumnIndex: 0
    };
  }),
  
  // Column pivot functions - cycle through individual column focus
  pivotColumnLeft: () => set(state => {
    const activeColumns = state.buildActiveColumns();
    const newIndex = state.pivotColumnIndex > 0 ? state.pivotColumnIndex - 1 : activeColumns.length - 1;
    logger.debug('APP', '⬅️ Pivoting to column:', activeColumns[newIndex]?.header || 'Unknown');
    return { pivotColumnIndex: newIndex };
  }),
  
  pivotColumnRight: () => set(state => {
    const activeColumns = state.buildActiveColumns();
    const newIndex = state.pivotColumnIndex < activeColumns.length - 1 ? state.pivotColumnIndex + 1 : 0;
    logger.debug('APP', '➡️ Pivoting to column:', activeColumns[newIndex]?.header || 'Unknown');
    return { pivotColumnIndex: newIndex };
  }),
  
  canPivotLeft: () => {
    const state = get();
    const activeColumns = state.getActiveColumns();
    return activeColumns.length > 1;
  },
  
  canPivotRight: () => {
    const state = get();
    const activeColumns = state.getActiveColumns();
    return activeColumns.length > 1;
  },
  
  getCurrentPivotColumn: () => {
    const state = get();
    const activeColumns = state.getActiveColumns();
    return activeColumns[state.pivotColumnIndex] || null;
  },

  // 🚨 PURE: Build active columns from current state (NO set() call)
  buildActiveColumnsPure: () => {
    const state = get();
    const translationStore = useTranslationMaps.getState();

    // Create columns array with canonical position ordering
    const columnList: Array<{ position: number; column: ActiveColumn }> = [];

    // Reference column (position 0)
    columnList.push({ 
      position: 0, 
      column: { key: 'reference', header: '#', type: 'reference' }
    });

    // Notes column (position 1)
    if (state.showNotes) {
      columnList.push({ 
        position: 1, 
        column: { key: 'notes', header: 'Notes', type: 'notes' }
      });
    }

    // Main translation (position 2)
    columnList.push({ 
      position: 2, 
      column: { 
        key: translationStore.main, 
        header: translationStore.main, 
        type: 'translation' 
      }
    });

    // Alternate translations (positions 3-14)
    translationStore.alternates
      .filter((alt: string) => alt !== translationStore.main)
      .forEach((translationCode: string, index: number) => {
        columnList.push({
          position: 3 + index, // Start at position 3
          column: {
            key: `alt-translation-${translationCode}`,
            header: translationCode,
            type: 'alt-translation'
          }
        });
      });

    // Cross references (position 15)
    if (state.showCrossRefs) {
      columnList.push({ 
        position: 15, 
        column: { key: 'cross-refs', header: 'Cross Refs', type: 'cross-ref' }
      });
    }

    // Prophecy column (position 16 - unified)
    if (state.showProphecies) {
      columnList.push({ 
        position: 16, 
        column: { key: 'prophecy', header: 'Prophecy', type: 'prophecy' }
      });
    }

    // Sort by canonical position and extract columns
    const columns = columnList
      .sort((a, b) => a.position - b.position)
      .map(item => item.column);

    return columns;
  },

  // 🚨 WRITER: Updates cache atomically (called from effects, not render)
  recomputeActiveColumns: (depsKey: string, builder: () => ActiveColumn[]) => {
    const state = get();
    if (state._activeColumnsDeps === depsKey) return; // no-op if unchanged
    
    const cols = builder();
    const navigableColumnKeys = cols
      .filter(col => col.type !== 'reference')
      .map(col => col.key);
    
    set({
      _activeColumnsCache: cols,
      _activeColumnsDeps: depsKey,
      navigableColumns: navigableColumnKeys
    });
  },

  // 🚨 READER: Get cached columns (safe during render)
  getActiveColumns: () => {
    const cache = get()._activeColumnsCache;
    
    // 🔍 DEV INVARIANT: Warn once if cache is empty (throttled to prevent spam)
    if (import.meta.env.DEV && (!cache || cache.length === 0)) {
      const state = get();
      if (!state._lastEmptyCacheWarning || Date.now() - state._lastEmptyCacheWarning > 1000) {
        logger.warn('APP', '⚠️ Active columns cache empty (this warning throttled to 1/sec)', {
          isInitialized: state.isInitialized,
          depsKey: state._activeColumnsDeps
        });
        // Update warning timestamp (but don't trigger re-render)
        (get() as any)._lastEmptyCacheWarning = Date.now();
      }
    }
    
    return cache;
  },

  // 🚨 LEGACY: Keep for backward compat, but delegates to pure version
  buildActiveColumns: () => {
    const state = get();
    // If cache is empty, compute once
    if (state._activeColumnsCache.length === 0) {
      const cols = state.buildActiveColumnsPure();
      const navigableColumnKeys = cols
        .filter(col => col.type !== 'reference')
        .map(col => col.key);
      set({
        _activeColumnsCache: cols,
        navigableColumns: navigableColumnKeys
      });
      return cols;
    }
    return state._activeColumnsCache;
  },
  
  // Add reactive listener for translation changes
  setupTranslationReactivity: () => {
    // Listen for translation changes and invalidate cache
    const handleTranslationChange = () => {
      logger.debug('APP', '🔄 Translation change detected, invalidating column cache...');
      // 🎯 CACHE INVALIDATION: Clear cache instead of rebuilding immediately
      set({ _activeColumnsCache: [], _activeColumnsDeps: '' });
      
      // 🎯 INSTANT UPDATE: Also rebuild navigableColumns for alternate translation toggles
      get().rebuildNavigableColumns();
    };
    
    window.addEventListener('translation-layout-change', handleTranslationChange);
    window.addEventListener('translation-slot-visibility', handleTranslationChange);
    
    return () => {
      window.removeEventListener('translation-layout-change', handleTranslationChange);
      window.removeEventListener('translation-slot-visibility', handleTranslationChange);
    };
  },

  // Column shifting navigation with discrete left/right movement
  getVisibleSlice: () => {
    const s = get();
    const totalNavigable = s.navigableColumns?.length ?? 0;
    
    // Show all navigable columns - no artificial limits
    const maxVisible = totalNavigable;
    const start = Math.max(0, s.navigationOffset);
    const end = Math.min(totalNavigable, start + maxVisible);
    
    // Determine if we can navigate left or right
    const canGoLeft = s.canShiftLeft();
    const canGoRight = s.canShiftRight();

    // Generate template for visible columns with proper widths
    const visibleCount = Math.max(0, end - start);
    const measuredNavigableWidth = s.columnWidthsPx.translation || s.columnWidthsPx['cross-ref'] || 360;
    const templateForVisible = visibleCount > 0 ? Array(visibleCount).fill(`${measuredNavigableWidth}px`).join(' ') : '';
    const visibleKeys = visibleCount > 0 ? Array.from({ length: visibleCount }, (_, i) => `col-${start + i}`) : [];
    
    // Get actual active columns for proper rendering
    const activeColumns = s.getActiveColumns();


    return {
      start,
      end,
      canGoLeft,
      canGoRight,
      labelStart: totalNavigable ? start + 1 : 0,
      labelEnd: end,
      totalNavigable,
      templateForVisible,
      visibleKeys,
      visibleNavigableCount: visibleCount,
      modeUsed: 'count' as const,
      activeColumns
    };
  },

  // Shared grid template for perfect header-row alignment
  getSharedGridTemplate: () => {
    const { templateForVisible } = get().getVisibleSlice();
    return templateForVisible;
  }
}));

function Router() {
  return (
    <Switch>
      <Route path="/" component={BiblePage} />
      <Route path="/profile" component={Profile} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/auth/confirm" component={ConfirmEmail} />
      <Route path="/auth/reset" component={ResetPassword} />
      <Route path="/billing/success" component={BillingSuccess} />
      <Route path="/billing/cancel" component={BillingCancel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Setup session auto-save listeners
  useSessionState();
  
  // Setup global keyboard height detection for all overlays
  useKeyboardHeight();

  // Detect if performance mode should be enabled
  const enablePerformanceMode = () => {
    // Enable performance mode on mobile devices or low-memory devices
    const isMobile = window.innerWidth < 768;
    const hasLowMemory = 'memory' in performance && 
      (performance as any).memory?.jsHeapSizeLimit < 1024 * 1024 * 1024; // < 1GB

    return isMobile || hasLowMemory;
  };

  // Set up translation reactivity on app start
  React.useEffect(() => {
    const cleanup = useBibleStore.getState().setupTranslationReactivity();
    
    // Set up mobile diagnostics tools (browser console access)
    setupGlobalDiagnostics();
    
    return cleanup;
  }, []);

  // iOS Safari viewport detection and portrait class management
  React.useEffect(() => {
    const applyViewportFlags = () => {
      const isPortrait = window.matchMedia('(orientation: portrait)').matches;
      const isNarrow = Math.min(window.innerWidth, window.innerHeight) <= 900; // "mobile-ish"
      document.documentElement.classList.toggle('is-portrait', isPortrait && isNarrow);

      // 100vh fallback (only used by CSS fallback rules)
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };

    // Initial detection
    applyViewportFlags();

    // Listen to orientation and resize changes with passive listeners
    ['resize', 'orientationchange', 'pageshow'].forEach(ev =>
      window.addEventListener(ev, applyViewportFlags, { passive: true })
    );

    // Cleanup function
    return () => {
      ['resize', 'orientationchange', 'pageshow'].forEach(ev =>
        window.removeEventListener(ev, applyViewportFlags)
      );
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider 
          defaultTheme="dark"
        >
          <DynamicBackground />
          <TutorialProvider>
            <SelectionProvider>
              <HighlightProvider>
                <TooltipProvider>
                  <Toaster />
                  <MagicLinkToast />
                  <ConsentMiniLine />
                  <ConfettiPortal />
                  <Router />
                </TooltipProvider>
              </HighlightProvider>
            </SelectionProvider>
          </TutorialProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;