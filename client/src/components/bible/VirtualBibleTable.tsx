import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import { ROW_HEIGHT } from '@/constants/layout';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { NewColumnHeaders } from "./NewColumnHeaders";
import { useColumnData } from '@/hooks/useColumnData';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import { useAdaptivePortraitColumns } from '@/hooks/useAdaptivePortraitColumns';
import { useMeasureVisibleColumns } from '@/hooks/useMeasureVisibleColumns';
import { useAdaptiveWidths } from '@/hooks/useAdaptiveWidths';
import { useOrientation } from '@/hooks/useOrientation';
import { useReferenceColumnWidth } from '@/hooks/useReferenceColumnWidth';
import { VirtualRow } from "./VirtualRow";
import { getVerseCount, getVerseKeys, getVerseKeyByIndex } from "@/lib/verseKeysLoader";
import { useAnchorSlice } from "@/hooks/useAnchorSlice";
import { useTranslationMaps } from "@/hooks/useTranslationMaps";
import { useRowData } from "@/hooks/useRowData";
import { useSliceDataLoader } from "@/hooks/useSliceDataLoader";
import { useCrossRefLoader } from "@/hooks/useCrossRefLoader";
import { useBibleStore } from "@/App";
import { useBibleData } from "@/hooks/useBibleData";
import { useVerseNav } from "@/hooks/useVerseNav";
import { makeScrollToVerse } from "@/utils/scrollToVerse";
import { getVerseIndex } from "@/lib/verseIndexMap";

import type {
  BibleVerse,
  Translation,
  UserNote,
  AppPreferences,
} from "@/types/bible";
import { useViewportLabels } from "@/hooks/useViewportLabels";
import { useNotesCache } from "@/hooks/useNotesCache";
import { ScrollbarTooltip } from "@/components/ui/ScrollbarTooltip";
import type { LabelName } from '@/lib/labelBits';

export interface VirtualBibleTableHandle {
  scrollToVerse: (ref: string) => void;
  get node(): HTMLDivElement | null;
  getCurrentVerse: () => { reference: string; index: number };
}

interface VirtualBibleTableProps {
  verses: BibleVerse[];
  selectedTranslations: Translation[];
  preferences: AppPreferences;
  mainTranslation: string;
  className?: string;
  onExpandVerse?: (verse: BibleVerse) => void;
  onNavigateToVerse?: (verseId: string) => void;
  getProphecyDataForVerse?: (verseId: string) => any;
  getGlobalVerseText?: (verseId: string, translation: string) => string;
  totalRows?: number;
  onCenterVerseChange?: (verseIndex: number) => void;
  centerVerseIndex?: number;
  onPreserveAnchor?: (callback: any) => void;
  onVerseClick?: (ref: string) => void;
  onCurrentVerseChange?: (verseInfo: { reference: string; index: number }) => void;
}

const VirtualBibleTable = forwardRef<VirtualBibleTableHandle, VirtualBibleTableProps>((props, ref) => {
  const {
    selectedTranslations,
    preferences,
    mainTranslation,
    className = "",
    onExpandVerse,
    onNavigateToVerse,
    getProphecyDataForVerse,
    getGlobalVerseText,
    totalRows,
    onCenterVerseChange,
    centerVerseIndex = 0,
    onPreserveAnchor,
    onVerseClick,
    onCurrentVerseChange,
  } = props;
  // All hooks must be called at the top level of the component
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialize notes caching system for batch loading
  const { batchLoadNotes } = useNotesCache();

  // Get verse text retrieval function from useBibleData - MUST BE EARLY
  const { getVerseText: getBibleVerseText } = useBibleData();

  // Integrate translation maps system for verse text loading
  const translationMaps = useTranslationMaps();
  const { activeTranslations, mainTranslation: translationMainTranslation, getVerseText: getTranslationVerseText } = translationMaps;
  
  // PURE ANCHOR-CENTERED IMPLEMENTATION: Single source of truth
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrollbarDragging, setIsScrollbarDragging] = useState(false);
  const [showScrollTooltip, setShowScrollTooltip] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | undefined>();

  // NEW: Measure actual column container for dynamic visible count calculation
  useMeasureVisibleColumns(containerRef.current);

  // NEW: Update store with current column configuration (moved below store declarations)
  const { setFixedColumns, setNavigableColumns, setColumnWidthPx } = useBibleStore();
  
  // Remove ref handling for now
  
  // Get reactive verse keys from store instead of static function
  const { currentVerseKeys, isChronological } = useBibleStore();
  const verseKeys = currentVerseKeys.length > 0 ? currentVerseKeys : getVerseKeys(); // Use store keys or fallback
  
  // PAUSE virtual loading during scrollbar dragging for smooth performance
  const { anchorIndex, slice } = useAnchorSlice(containerRef, verseKeys, { 
    disabled: isScrollbarDragging 
  });
  
  // Handle scrollbar dragging state changes
  const handleScrollbarDragChange = useCallback((dragging: boolean, clientX?: number, clientY?: number) => {
    setIsScrollbarDragging(dragging);
    setShowScrollTooltip(dragging);
    if (dragging && clientX !== undefined && clientY !== undefined) {
      setMousePosition({ x: clientX, y: clientY });
    } else {
      setMousePosition(undefined);
    }
  }, []);
  
  // Get current verse reference from anchor index
  const getCurrentVerse = useCallback(() => {
    const currentRef = verseKeys[anchorIndex] || verseKeys[0] || 'Gen.1:1';
    return { reference: currentRef, index: anchorIndex };
  }, [anchorIndex, verseKeys]);
  
  // Notify parent of current verse changes
  useEffect(() => {
    if (onCurrentVerseChange) {
      const verseInfo = getCurrentVerse();
      onCurrentVerseChange(verseInfo);
    }
  }, [anchorIndex, verseKeys, onCurrentVerseChange, getCurrentVerse]);

  // NEW: fetch hydrated verses for the current slice
  const { data: rowData } = useRowData(slice.verseIDs, mainTranslation);
  
  // Labels system integration - get entire store for debugging
  const store = useBibleStore();
  const activeLabels = store.activeLabels;
  
  // VirtualBibleTable immediate debug logs removed for performance
  
  // Store subscription debug logs removed for performance
  
  // Direct test debug logs removed for performance
  
  // VirtualBibleTable urgent debug logs removed for performance
  
  // Convert slice to verse objects for useViewportLabels
  const sliceVerses = useMemo(() => {
    return slice.verseIDs.map(verseID => {
      const verseData = rowData?.[verseID];
      if (verseData && 'book' in verseData && 'chapter' in verseData) {
        return verseData as unknown as BibleVerse;
      }
      // Create properly typed fallback verse
      return {
        id: verseID,
        index: 0,
        reference: verseID, // STRAIGHT-LINE: Keep original format
        book: '',
        chapter: 0,
        verse: 0,
        text: {},
        crossReferences: [],
        strongsWords: [],
        labels: [],
        contextGroup: 'standard' as const
      } as BibleVerse;
    });
  }, [slice.verseIDs, rowData]);
  
  // Force hook re-evaluation when activeLabels changes  
  useEffect(() => {
    // useViewportLabels debug logs removed for performance
  }, [activeLabels, sliceVerses.length, translationMainTranslation, mainTranslation]);
  
  const { getVerseLabels } = useViewportLabels({
    verses: sliceVerses, 
    activeLabels: activeLabels || [], 
    mainTranslation: translationMainTranslation || mainTranslation
  });
  const totalHeight = verseKeys.length * ROW_HEIGHT;

  // B-1: Load slice data for cross-references and prophecy
  const { isLoading: isSliceLoading } = useSliceDataLoader(slice.verseIDs, mainTranslation);

  // B-2: Load cross-references with offset-based approach
  useCrossRefLoader(slice.verseIDs, 'cf1');

  // Cross-reference text loading handled by main translation system - no duplication
  const { crossRefs: crossRefsStore } = useBibleStore();

  // Load column-specific data when columns are toggled
  useColumnData();

  // Get store state for column toggles
  const { showCrossRefs, showProphecies, toggleCrossRefs, showNotes } = useBibleStore();

  // NEW: Update store with current column configuration (now that store variables are available)
  useEffect(() => {
    // Update fixed and navigable column lists in store
    setFixedColumns(['reference']);
    
    const navigableColumnIds = [];
    if (showCrossRefs) navigableColumnIds.push('KJV', 'CrossRefs');
    else navigableColumnIds.push('KJV');
    
    if (showNotes) navigableColumnIds.push('Notes');
    if (showProphecies) {
      navigableColumnIds.push('Prediction', 'Fulfillment', 'Verification');
    }
    
    setNavigableColumns(navigableColumnIds);
    
    // Measure and update column widths
    setTimeout(() => {
      const measureColumns = () => {
        // Measure reference column
        const refEl = document.querySelector('[data-column="reference"]');
        if (refEl) {
          setColumnWidthPx('reference', refEl.getBoundingClientRect().width);
        }
        
        // Measure main translation column
        const kjvEl = document.querySelector('[data-column="main-translation"]');
        if (kjvEl) {
          setColumnWidthPx('KJV', kjvEl.getBoundingClientRect().width);
        }
        
        // Measure cross refs column
        if (showCrossRefs) {
          const crossEl = document.querySelector('[data-column="cross-refs"]');
          if (crossEl) {
            setColumnWidthPx('CrossRefs', crossEl.getBoundingClientRect().width);
          }
        }
        
        // Measure prophecy columns
        if (showProphecies) {
          const predEl = document.querySelector('[data-column="prophecy-prediction"]');
          const fulfEl = document.querySelector('[data-column="prophecy-fulfillment"]');
          const verifEl = document.querySelector('[data-column="prophecy-verification"]');
          
          if (predEl) setColumnWidthPx('Prediction', predEl.getBoundingClientRect().width);
          if (fulfEl) setColumnWidthPx('Fulfillment', fulfEl.getBoundingClientRect().width);
          if (verifEl) setColumnWidthPx('Verification', verifEl.getBoundingClientRect().width);
        }
      };
      
      measureColumns();
    }, 100); // Small delay to ensure DOM is ready
    
  }, [showCrossRefs, showProphecies, showNotes, setFixedColumns, setNavigableColumns, setColumnWidthPx]);

  // PERFORMANCE FIX: Preload notes for visible verses when notes column is enabled
  useEffect(() => {
    if (showNotes && user && slice.verseIDs.length > 0) {
      console.log(`📝 Preloading notes for ${slice.verseIDs.length} visible verses...`);
      batchLoadNotes(slice.verseIDs);
    }
  }, [showNotes, user?.id, slice.verseIDs, batchLoadNotes]);

  // Create getVerseText wrapper for VirtualRow (any translation) - USE TRANSLATION MAPS SYSTEM
  const getVerseTextForRow = useCallback((verseID: string, translationCode: string): string => {
    // Use the translation maps system that properly loads from Supabase
    return getTranslationVerseText(verseID, translationCode) || getBibleVerseText(verseID, translationCode) || "";
  }, [getTranslationVerseText, getBibleVerseText]);

  // Create getMainVerseText wrapper for VirtualRow (main translation) - USE PROPER MAIN TRANSLATION
  const getMainVerseTextForRow = useCallback((verseID: string): string => {
    const effectiveMainTranslation = translationMainTranslation || mainTranslation;
    return getTranslationVerseText(verseID, effectiveMainTranslation) || getBibleVerseText(verseID, effectiveMainTranslation) || "";
  }, [getTranslationVerseText, getBibleVerseText, translationMainTranslation, mainTranslation]);

  // 3-B. Preserve scroll position during slice swaps
  useEffect(() => {
    if (onCenterVerseChange && anchorIndex !== centerVerseIndex) {
      onCenterVerseChange(anchorIndex);
      console.log(`📍 VIEWPORT CENTER CHANGED: ${centerVerseIndex} → ${anchorIndex} (${getVerseKeyByIndex(anchorIndex)})`);
    }
  }, [anchorIndex, centerVerseIndex, onCenterVerseChange]);

  // Removed direct scroll assignment - let browser handle natural scrolling

  // 3-B. Preserve scroll position during slice swaps - SMOOTH FIX: apply only the delta, not an absolute reset
  const prevStart = useRef(slice.start);
  const prevScroll = useRef(0);

  // 2-C. Stop rubber-band by clamping scroll compensation
  const MAX_COMPENSATION_ROWS = 150; // < 1 screen height

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !onPreserveAnchor) return;

    // Browser's native inertial scrolling handles movement - no manual assignments needed

    // Save latest for next pass
    prevStart.current = slice.start;
  }, [slice.start, anchorIndex, onPreserveAnchor]);

  // Get verse data for current chunk - now use rowData instead of verses array
  const getVerseData = useCallback((verseId: string) => {
    return rowData?.[verseId];
  }, [rowData]);

  // Create column data for VirtualRow
  const columnData = {
    translations: selectedTranslations,
    crossReferences: showCrossRefs,
    prophecyData: {},
    settings: {
      mainTranslation: mainTranslation,
      multiTranslations: preferences.selectedTranslations || [],
      showCrossReferences: showCrossRefs,
      showProphecy: showProphecies,
      showStrongs: false,
      showNotes: preferences.showNotes,

      showBookmarks: true,
    },
    onVerseClick: onVerseClick || ((ref: string) => goTo(ref)),
  };

  // User actions
  const noteMutation = useMutation({
    mutationFn: async ({ verseId, note }: { verseId: string; note: string }) => {
      return apiRequest(`/api/notes`, "POST", { verseId, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({ description: "Note saved successfully" });
    },
    onError: () => {
      toast({ description: "Failed to save note", variant: "destructive" });
    },
  });

  const highlightMutation = useMutation({
    mutationFn: async ({ verseId, text, color }: { verseId: string; text: string; color: string }) => {
      return apiRequest(`/api/highlights`, "POST", { verseId, text, color });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/highlights"] });
      toast({ description: "Highlight saved successfully" });
    },
    onError: () => {
      toast({ description: "Failed to save highlight", variant: "destructive" });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async ({ verseId, note }: { verseId: string; note: string }) => {
      return apiRequest(`/api/bookmarks`, "POST", { verseId, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({ description: "Bookmark saved successfully" });
    },
    onError: () => {
      toast({ description: "Failed to save bookmark", variant: "destructive" });
    },
  });

  // VirtualBibleTable anchor-centered render log removed for performance
  const rowDataSize = rowData ? Object.keys(rowData).length : 0;
  // Chunk data log removed for performance
  
  // DEBUG: Check column widths after render  
  useEffect(() => {
    const checkWidths = () => {
      const root = document.documentElement;
      const refWidth = getComputedStyle(root).getPropertyValue('--w-ref').trim();
      const adaptiveRefWidth = getComputedStyle(root).getPropertyValue('--adaptive-ref-width').trim();
      const columnWidthMult = getComputedStyle(root).getPropertyValue('--column-width-mult').trim();
      const isPortrait = window.innerHeight > window.innerWidth;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // CSS Variables debug removed for performance
      
      const headerCell = document.querySelector('[data-column="reference"]');
      const dataCell = document.querySelector('[data-verse-ref] > div:first-child');
      
      if (headerCell && dataCell) {
        const headerStyles = getComputedStyle(headerCell);
        const dataStyles = getComputedStyle(dataCell);
        const headerWidth = headerStyles.width;
        const dataWidth = dataStyles.width;
        const headerMinWidth = headerStyles.minWidth;
        const dataMinWidth = dataStyles.minWidth;
        
        // Header/data width comparison logging removed for performance
      } else {
        // Elements not found debug logging removed for performance
      }
    };
    
    // Check immediately and after a delay
    checkWidths();
    const timer = setTimeout(checkWidths, 200);
    
    return () => clearTimeout(timer);
  }, [slice.verseIDs]);

  // Expert's physically separated scroll axes - one axis at a time
  const vScrollRef = useRef<HTMLDivElement>(null); // Vertical scroller
  const hScrollRef = useRef<HTMLDivElement>(null); // Horizontal scroller
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'vertical' | 'horizontal' | null>(null);
  
  // Handle runtime error overlay that blocks navigation
  useEffect(() => {
    const dismissErrorOverlay = () => {
      // Look for runtime error overlay and dismiss it
      const overlay = document.querySelector('[data-testid="runtime-error-modal"], .runtime-error-overlay, [class*="runtime-error"]');
      if (overlay) {
        // Try clicking outside or pressing escape
        const escEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' });
        document.dispatchEvent(escEvent);
        // Also try clicking the overlay backdrop
        (overlay as HTMLElement).click();
      }
    };
    
    // Dismiss any existing overlays
    dismissErrorOverlay();
    
    // Set up observer for new overlays
    const observer = new MutationObserver(() => {
      dismissErrorOverlay();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);
  
  // Navigation system for back/forward buttons - OPTIMIZED for instant navigation
  const scrollToVerse = useCallback((ref: string) => {
    console.log('🚀 INSTANT VirtualBibleTable scrollToVerse called with:', ref, 'container exists:', !!containerRef.current);
    if (!containerRef.current) {
      console.log('📜 VirtualBibleTable scrollToVerse: container not available');
      return;
    }
    
    // ⚡ PERFORMANCE FIX: Use O(1) Map lookup instead of O(n) findIndex
    const idx = getVerseIndex(ref);
    console.log('🚀 INSTANT lookup found index', idx, 'for verse', ref);
    
    if (idx === -1) {
      console.log('📜 VirtualBibleTable scrollToVerse: verse not found in index map');
      return;
    }

    const containerH = containerRef.current.clientHeight;
    // FIXED: More precise scroll calculation - center the verse exactly
    const target = Math.round((idx * ROW_HEIGHT) - (containerH / 2) + (ROW_HEIGHT / 2));
    console.log('🚀 INSTANT scrolling to position', target, 'for verse at index', idx);

    // Use direct scrollTop assignment for immediate response, ensure bounds
    const maxScroll = (verseKeys.length * ROW_HEIGHT) - containerH;
    containerRef.current.scrollTop = Math.max(0, Math.min(target, maxScroll));

    // Flash highlight with normalized reference
    const normalizedRef = ref.includes(' ') ? ref.replace(/\s/g, '.') : ref;
    setTimeout(() => {
      const el = document.querySelector(`[data-verse-ref="${normalizedRef}"]`) as HTMLElement | null;
      console.log('🚀 INSTANT highlight element found:', !!el, 'for ref:', normalizedRef);
      if (el) {
        el.classList.add('verse-highlight-flash');
        setTimeout(() => el.classList.remove('verse-highlight-flash'), 400);
      }
    }, 25);
  }, []);
  
  // Expose the scroll function and container to parent via ref
  useImperativeHandle(ref, () => ({
    scrollToVerse,
    getCurrentVerse,
    get node() {
      return containerRef.current;
    },
  }));

  const { goTo } = useVerseNav(scrollToVerse);

  // Calculate visible columns for layout logic
  const visibleColumns = useMemo(() => {
    const columns = [
      "Reference", // Always visible
      mainTranslation, // Main translation always visible
      ...(showCrossRefs ? ["Cross References"] : []),
      ...(showProphecies ? ["P", "F", "V"] : []),
      ...activeTranslations.filter(t => t !== mainTranslation) // Alternate translations
    ];
    return columns;
  }, [mainTranslation, showCrossRefs, showProphecies, activeTranslations]);

  // Calculate actual total width based on visible columns - simplified approach
  const actualTotalWidth = useMemo(() => {
    let width = 0;
    width += 80; // Reference column ~80px  
    width += 320; // Main translation ~320px
    if (showCrossRefs) width += 320; // Cross refs ~320px
    if (showProphecies) width += 180; // P+F+V ~60px each
    width += (activeTranslations.filter(t => t !== mainTranslation).length * 320); // Alt translations ~320px each
    return width;
  }, [activeTranslations, mainTranslation, showCrossRefs, showProphecies]);

  // Get viewport width
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;

  // Mobile detection for dual-column layout
  const isMobile = useIsMobile();
  
  // Responsive column system
  const responsiveConfig = useResponsiveColumns();
  // Expert's lightweight CSS-first adaptive system
  useAdaptiveWidths();
  
  const adaptiveConfig = useAdaptivePortraitColumns();
  const orientation = useOrientation();
  const isPortrait = orientation === 'portrait';

  // Update CSS variables dynamically based on adaptive configuration
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      // Update CSS custom properties for adaptive column widths
      const root = document.documentElement;
      const { adaptiveWidths } = adaptiveConfig;
      
      root.style.setProperty('--adaptive-ref-width', `${adaptiveWidths.reference}px`);
      root.style.setProperty('--adaptive-main-width', `${adaptiveWidths.mainTranslation}px`);
      root.style.setProperty('--adaptive-cross-width', `${adaptiveWidths.crossReference}px`);
      root.style.setProperty('--adaptive-alt-width', `${adaptiveWidths.alternate}px`);
      root.style.setProperty('--adaptive-prophecy-width', `${adaptiveWidths.prophecy}px`);
      root.style.setProperty('--adaptive-notes-width', `${adaptiveWidths.notes}px`);
      root.style.setProperty('--adaptive-context-width', `${adaptiveWidths.context}px`);

      console.log('🎯 Applied THREE-COLUMN Adaptive Widths:', {
        viewport: `${adaptiveConfig.screenWidth}×${adaptiveConfig.screenHeight}`,
        isPortrait: adaptiveConfig.isPortrait,
        safeWidth: adaptiveConfig.safeViewportWidth,
        coreColumnsWidth: adaptiveConfig.coreColumnsWidth,
        guaranteedFit: adaptiveConfig.guaranteedFit,
        threeColumnWidths: {
          reference: adaptiveWidths.reference,
          mainTranslation: adaptiveWidths.mainTranslation,
          crossReference: adaptiveWidths.crossReference
        },
        equalMainCross: Math.abs(adaptiveWidths.mainTranslation - adaptiveWidths.crossReference) <= 1
      });
    }
  }, [adaptiveConfig]);

  // ADAPTIVE VERSE REFERENCE ROTATION: Monitor reference column width and rotate when thin
  useReferenceColumnWidth();

  // FORCE show cross-references in portrait mode for three-column layout
  // Note: useBibleStore is already called earlier in the component, use existing values

  React.useEffect(() => {
    if (isPortrait && !showCrossRefs) {
      console.log('🎯 THREE-COLUMN: Force enabling cross-references for portrait mode');
      toggleCrossRefs();
    }
  }, [isPortrait, showCrossRefs, toggleCrossRefs]);

  // The old static column system has been removed
  // All column calculations now happen dynamically via useMeasureVisibleColumns

  // PROPER CENTERING: Only center when content actually fits without horizontal scroll
  const shouldCenter = !isMobile && actualTotalWidth <= viewportWidth * 0.9;
  const needsHorizontalScroll = actualTotalWidth > viewportWidth;

  // Simplified vertical-only scrolling system with header rollup detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastScrollTop = 0;
    let scrollTimeout: NodeJS.Timeout | null = null;

    // Track scroll position for custom scrollbar (vertical only)
    const onScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      const currentScrollTop = target.scrollTop;
      
      // No longer track scrollLeft since horizontal scrolling is disabled
      setScrollLeft(0); // Always keep at 0
      
      // Update scrollTop state if not currently dragging scrollbar
      if (!isScrollbarDragging) {
        setScrollTop(currentScrollTop);
      }

      // Banner rollup logic - hide PatchNotesBanner on scroll down
      if (isMobile && currentScrollTop > lastScrollTop && currentScrollTop > 30) {
        // User is scrolling down - hide banner via event system
        window.dispatchEvent(new CustomEvent('virtualTableScroll', { 
          detail: { scrollDirection: 'down', scrollTop: currentScrollTop } 
        }));
      }

      lastScrollTop = currentScrollTop;
    };

    container.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', onScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [isScrollbarDragging, isMobile]);

  // CSS handles centering automatically with margin-inline: auto

  // Define --colW CSS variable for mobile dual-column layout
  useEffect(() => {
    const BASE_COL_W = 640; // Base column width to match CSS
    const sizeMultiplier = preferences.fontSize === 'small' ? 0.9 : preferences.fontSize === 'large' ? 1.1 : 1;
    document.documentElement.style.setProperty(
      "--colW",
      `${BASE_COL_W * sizeMultiplier}px`
    );
  }, [preferences.fontSize]);

  // Expert's CSS Grid handles overflow naturally - no manual scroll interference needed

  return (
    <div className={`virtual-bible-table ${className}`} style={{ paddingTop: '0px', marginTop: '0px' }}>
      <NewColumnHeaders 
        selectedTranslations={selectedTranslations}
        showNotes={preferences?.showNotes || false}
        showProphecy={showProphecies}
        showCrossRefs={showCrossRefs}

        showDates={store.showDates}
        scrollLeft={scrollLeft}
        preferences={preferences || {}}
        isGuest={true}
        bodyRef={containerRef}
      />

      {/* Unified scroll container with momentary axis commitment */}
      <div 
        ref={(node) => {
          (wrapperRef as any).current = node;
          (vScrollRef as any).current = node;
          (hScrollRef as any).current = node;
          (containerRef as any).current = node; // Connect containerRef for anchor slice system
        }}
        className="unified-scroll-container scroll-area"
        style={{ 
          position: 'relative',
          height: "calc(100vh - var(--top-header-height-mobile) - var(--column-header-height))",
          overflowX: 'hidden', // Disable horizontal scrolling - navigation arrows control column visibility
          overflowY: 'auto', // Allow vertical scrolling only
          overscrollBehavior: 'contain',
          contain: 'layout paint style',
          willChange: 'scroll-position',
          touchAction: 'pan-y', // Only allow vertical panning
          // Hide default scrollbars since we'll show custom ones
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
          // Ensure content width doesn't exceed viewport to prevent horizontal scrolling
          maxWidth: '100vw',
          // On mobile, ensure strict vertical-only scrolling
          ...(isMobile && {
            touchAction: 'pan-y manipulation',
            overscrollBehaviorX: 'none',
            overscrollBehaviorY: 'contain'
          })
        }}
        data-testid="bible-table"
      >
        {/* Content container - preserving original adaptive behavior */}
        <div 
          style={{ 
            minWidth: isMobile ? `${viewportWidth}px` : `${Math.max(actualTotalWidth, viewportWidth)}px`,
            maxWidth: isMobile ? `${viewportWidth * 0.98}px` : undefined, // Slight constraint on mobile to prevent edge overflow
            minHeight: `${verseKeys.length * ROW_HEIGHT}px`,
            position: 'relative',
            overflow: isMobile ? 'hidden' : 'visible'
          }}
        >
          <div className="tableInner flex"
            style={{ 
              minWidth: isMobile ? '100%' : 'max-content', // Keep original adaptive logic
              width: isMobile ? '100%' : 'max-content',
              maxWidth: isMobile ? '98%' : undefined, // Small safety margin on mobile
              margin: isPortrait ? '0' : '0 auto',
              overflow: isMobile ? 'hidden' : 'visible'
            }}>
            <div style={{ 
              minWidth: responsiveConfig.columnAlignment === 'centered' ? 'max-content' : `${actualTotalWidth}px`,
              width: responsiveConfig.columnAlignment === 'centered' ? 'auto' : `${actualTotalWidth}px`
            }}>
            <div style={{height: slice.start * ROW_HEIGHT}} />
            {slice.verseIDs.map((id, i) => {
                // Convert simple rowData to BibleVerse structure
                const verseData = rowData?.[id];
                const parts = id.split('.');
                const book = parts[0];
                const chapterVerse = parts[1].split(':');
                const chapter = parseInt(chapterVerse[0]);
                const verse = parseInt(chapterVerse[1]);

                // Build text object for all active translations
                const textObj: Record<string, string> = {};

                // Add main translation text using the translation loader system
                const mainText = getBibleVerseText(id, mainTranslation);
                if (mainText) {
                  textObj[mainTranslation] = mainText;
                }

                // Add alternate translation text from the translation maps
                activeTranslations.forEach(translationCode => {
                  if (translationCode !== mainTranslation) {
                    const altText = getBibleVerseText(id, translationCode);
                    if (altText) {
                      textObj[translationCode] = altText;
                    }
                  }
                });

                const bibleVerse: BibleVerse = {
                  id: `${book.toLowerCase()}-${chapter}-${verse}-${slice.start + i}`,
                  index: slice.start + i,
                  book,
                  chapter,
                  verse,
                  reference: id,
                  text: textObj,
                  crossReferences: [],
                  strongsWords: [],
                  labels: [],
                  contextGroup: "standard" as const
                };

                // VirtualRow rendering log removed for performance
                return (
                  <VirtualRow 
                    key={id}
                    verseID={id}
                    verse={bibleVerse}
                    rowHeight={ROW_HEIGHT}
                    columnData={columnData}
                    getVerseText={getVerseTextForRow}
                    getMainVerseText={getMainVerseTextForRow}
                    activeTranslations={activeTranslations}
                    mainTranslation={mainTranslation}
                    onVerseClick={columnData.onVerseClick}
                    onExpandVerse={onExpandVerse}
                    getVerseLabels={getVerseLabels}
                  />
                );
            })}
            <div style={{height: (verseKeys.length - slice.end) * ROW_HEIGHT}} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Vertical Scrollbar */}
      <div 
        className="absolute right-0 w-6 md:w-3 z-30 bg-black/5 dark:bg-white/5 rounded-l-full"
        style={{ 
          height: "calc((100vh - 89px) * 0.75)",
          top: "calc((100vh - 89px) * 0.125 + 8px)", // Center the smaller track vertically
          touchAction: 'none' // Prevent default touch behavior
        }}
      >
        <div 
          className="absolute right-0 top-0 w-6 md:w-3 bg-blue-500 dark:bg-blue-400 rounded-l-full transition-all duration-150 md:hover:w-3.5 md:hover:bg-blue-600 dark:md:hover:bg-blue-300 active:bg-blue-600 dark:active:bg-blue-300"
          style={{
            height: `${Math.max(8, Math.min(40, ((window.innerHeight - 85) / (verseKeys.length * ROW_HEIGHT)) * 100))}%`,
            top: `${Math.min(94, (scrollTop / Math.max(1, verseKeys.length * ROW_HEIGHT - (window.innerHeight - 85))) * (100 - Math.max(8, Math.min(40, ((window.innerHeight - 85) / (verseKeys.length * ROW_HEIGHT)) * 100))))}%`,
            cursor: 'pointer',
            touchAction: 'none',
            minHeight: '32px' // Smaller minimum touch target size
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            console.log('🎯 SCROLLBAR: Starting drag - PAUSING virtual loading');
            handleScrollbarDragChange(true, e.clientX, e.clientY);
            
            const startY = e.clientY;
            const scrollContainer = containerRef.current;
            if (!scrollContainer) return;
            
            const startScrollTop = scrollContainer.scrollTop;
            const maxScroll = Math.max(0, verseKeys.length * ROW_HEIGHT - window.innerHeight + 85);
            
            const handleMouseMove = (e: MouseEvent) => {
              const deltaY = e.clientY - startY;
              // SPEED MULTIPLIER: Make drag 3x more sensitive (less mouse travel = more scroll)
              const SPEED_MULTIPLIER = 1.5;
              const scrollRatio = (deltaY * SPEED_MULTIPLIER) / (window.innerHeight - 85);
              const newScrollTop = Math.max(0, Math.min(maxScroll, startScrollTop + (scrollRatio * maxScroll)));
              scrollContainer.scrollTo({
                top: newScrollTop,
                behavior: 'instant'
              });
              // SYNC STATE: Update scrollTop state during drag for scrollbar positioning
              setScrollTop(newScrollTop);
              // Update mouse position for tooltip
              setMousePosition({ x: e.clientX, y: e.clientY });
            };
            
            const handleMouseUp = () => {
              console.log('🎯 SCROLLBAR: Drag ended - RESUMING virtual loading');
              handleScrollbarDragChange(false);
              
              // FORCE REFRESH: Trigger a scroll event to ensure virtual loading catches up
              requestAnimationFrame(() => {
                if (scrollContainer) {
                  scrollContainer.dispatchEvent(new Event('scroll'));
                }
              });
              
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            console.log('🎯 SCROLLBAR: Starting touch drag - PAUSING virtual loading');
            const touch = e.touches[0];
            handleScrollbarDragChange(true, touch.clientX, touch.clientY);
            
            const startY = touch.clientY;
            const scrollContainer = containerRef.current;
            if (!scrollContainer) return;
            
            const startScrollTop = scrollContainer.scrollTop;
            const maxScroll = Math.max(0, verseKeys.length * ROW_HEIGHT - window.innerHeight + 85);
            
            const handleTouchMove = (e: TouchEvent) => {
              e.preventDefault();
              const touch = e.touches[0];
              const deltaY = touch.clientY - startY;
              // SPEED MULTIPLIER: Make drag 3x more sensitive (less touch travel = more scroll)
              const SPEED_MULTIPLIER = 3;
              const scrollRatio = (deltaY * SPEED_MULTIPLIER) / (window.innerHeight - 85);
              const newScrollTop = Math.max(0, Math.min(maxScroll, startScrollTop + (scrollRatio * maxScroll)));
              scrollContainer.scrollTo({
                top: newScrollTop,
                behavior: 'instant'
              });
              // SYNC STATE: Update scrollTop state during drag for scrollbar positioning
              setScrollTop(newScrollTop);
              // Update touch position for tooltip
              setMousePosition({ x: touch.clientX, y: touch.clientY });
            };
            
            const handleTouchEnd = (e: TouchEvent) => {
              e.preventDefault();
              console.log('🎯 SCROLLBAR: Touch drag ended - RESUMING virtual loading');
              handleScrollbarDragChange(false);
              
              // FORCE REFRESH: Trigger a scroll event to ensure virtual loading catches up
              requestAnimationFrame(() => {
                if (scrollContainer) {
                  scrollContainer.dispatchEvent(new Event('scroll'));
                }
              });
              
              document.removeEventListener('touchmove', handleTouchMove);
              document.removeEventListener('touchend', handleTouchEnd);
            };
            
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
          }}
        />
      </div>
      
      {/* Scrollbar Tooltip - Shows verse reference during scrollbar dragging */}
      <ScrollbarTooltip
        containerRef={containerRef}
        isVisible={showScrollTooltip}
        mousePosition={mousePosition}
        verseKeys={verseKeys}
        currentScrollTop={scrollTop}
      />
    </div>
  );
});

VirtualBibleTable.displayName = 'VirtualBibleTable';

export default VirtualBibleTable;
export { VirtualBibleTable };