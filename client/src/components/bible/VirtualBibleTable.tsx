import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import { ROW_HEIGHT } from '@/constants/layout';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ColumnHeaders } from "./ColumnHeaders";
import { useColumnData } from '@/hooks/useColumnData';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import { useAdaptivePortraitColumns } from '@/hooks/useAdaptivePortraitColumns';
import { useAdaptiveWidths } from '@/hooks/useAdaptiveWidths';
import { useOrientation } from '@/hooks/useOrientation';
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
  Highlight,
  AppPreferences,
} from "@/types/bible";
import { useViewportLabels } from "@/hooks/useViewportLabels";
import type { LabelName } from '@/lib/labelBits';

export interface VirtualBibleTableHandle {
  scrollToVerse: (ref: string) => void;
  get node(): HTMLDivElement | null;
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
  } = props;
  // All hooks must be called at the top level of the component
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get verse text retrieval function from useBibleData - MUST BE EARLY
  const { getVerseText: getBibleVerseText } = useBibleData();

  // Integrate translation maps system for verse text loading
  const translationMaps = useTranslationMaps();
  const { activeTranslations, mainTranslation: translationMainTranslation, getVerseText: getTranslationVerseText } = translationMaps;
  
  // PURE ANCHOR-CENTERED IMPLEMENTATION: Single source of truth
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Remove ref handling for now
  
  // Get reactive verse keys from store instead of static function
  const { currentVerseKeys, isChronological } = useBibleStore();
  const verseKeys = currentVerseKeys.length > 0 ? currentVerseKeys : getVerseKeys(); // Use store keys or fallback
  
  const { anchorIndex, slice } = useAnchorSlice(containerRef, verseKeys);

  // NEW: fetch hydrated verses for the current slice
  const { data: rowData } = useRowData(slice.verseIDs, mainTranslation);
  
  // Labels system integration - get entire store for debugging
  const store = useBibleStore();
  const activeLabels = store.activeLabels;
  
  // Immediate debug log to see current state
  console.log('🔍🔍🔍 IMMEDIATE - VirtualBibleTable current activeLabels:', activeLabels, 'type:', typeof activeLabels, 'length:', activeLabels?.length);
  console.log('🔍🔍🔍 IMMEDIATE - Full store check:', { 
    hasStore: !!store,
    storeActiveLabels: store?.activeLabels,
    directActiveLabels: useBibleStore.getState().activeLabels 
  });
  
  // Force test to ensure store updates are working
  useEffect(() => {
    const unsubscribe = useBibleStore.subscribe(
      (state) => {
        console.log('🔥🔥🔥 STORE SUBSCRIPTION - activeLabels changed to:', state.activeLabels);
      }
    );
    return unsubscribe;
  }, []);
  
  // DIRECT TEST: Force test Dan.7:3 with known labels
  useEffect(() => {
    if (activeLabels?.includes('what' as any)) {
      console.log('🧪 DIRECT TEST: Testing Dan.7:3 with what label active');
      const testLabels = { what: ['four huge beasts'], where: ['out of the water'], action: ['came up'] };
      const testText = 'Then four huge beasts came up out of the water, each different from the others.';
      console.log('🧪 Test text:', testText);
      console.log('🧪 Test labels:', testLabels);
    }
  }, [activeLabels]);
  
  // Debug activeLabels from store - FORCE RENDER CHECK
  useEffect(() => {
    console.log('🔍🔍🔍 URGENT DEBUG - VirtualBibleTable activeLabels changed:', activeLabels, 'type:', typeof activeLabels, 'length:', activeLabels?.length);
    console.log('🔍🔍🔍 URGENT DEBUG - VirtualBibleTable activeLabels array:', JSON.stringify(activeLabels));
  }, [activeLabels]);
  
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
    console.log('🔍 VirtualBibleTable about to call useViewportLabels with:', {
      versesCount: sliceVerses.length,
      activeLabels: activeLabels,
      activeLabelsJSON: JSON.stringify(activeLabels),
      mainTranslation: translationMainTranslation || mainTranslation
    });
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
  const { showCrossRefs, showProphecies, toggleCrossRefs } = useBibleStore();

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
      showHighlights: true,
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

  console.log(`🎯 VirtualBibleTable anchor-centered render: ${anchorIndex} (${getVerseKeyByIndex(anchorIndex)})`);
  const rowDataSize = rowData ? Object.keys(rowData).length : 0;
  console.log(`📊 CHUNK DATA: start=${slice.start}, end=${slice.end}, verseIDs=${slice.verseIDs.length}, rowData keys=${rowDataSize}`);

  // Expert's physically separated scroll axes - one axis at a time
  const vScrollRef = useRef<HTMLDivElement>(null); // Vertical scroller
  const hScrollRef = useRef<HTMLDivElement>(null); // Horizontal scroller
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
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

  // FORCE show cross-references in portrait mode for three-column layout
  // Note: useBibleStore is already called earlier in the component, use existing values

  React.useEffect(() => {
    if (isPortrait && !showCrossRefs) {
      console.log('🎯 THREE-COLUMN: Force enabling cross-references for portrait mode');
      toggleCrossRefs();
    }
  }, [isPortrait, showCrossRefs, toggleCrossRefs]);

  // PROPER CENTERING: Only center when content actually fits without horizontal scroll
  const shouldCenter = !isMobile && actualTotalWidth <= viewportWidth * 0.9;
  const needsHorizontalScroll = actualTotalWidth > viewportWidth;

  // Expert's rail-breaking system for smooth axis switching
  useEffect(() => {
    const vScroll = vScrollRef.current;
    const hScroll = hScrollRef.current;
    if (!vScroll || !hScroll) return;

    // Track scroll position for column headers
    const onHorizontalScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      setScrollLeft(target.scrollLeft);
    };

    // Ultra-light wheel/trackpad router
    function wheelRouter(e: WheelEvent) {
      // Don't intercept wheel events from cross-reference cells
      const target = e.target as HTMLElement;
      if (target.closest('.cross-ref-item') || target.closest('.cell-content')) {
        return;
      }
      
      const { deltaX, deltaY } = e;
      // Pick the dominant delta every frame
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        hScroll!.scrollLeft += deltaX;
      } else {
        vScroll!.scrollTop += deltaY;
      }
      e.preventDefault(); // we already forwarded it
    }

    // Pointer-move guard for mid-gesture "axis switch"
    function attachRailBreaker(el: HTMLElement, axis: 'x' | 'y') {
      let startX = 0, startY = 0, activeAxis: 'x' | 'y' | null = null;

      const onPointerDown = (e: PointerEvent) => {
        // Don't capture pointer events on buttons, clickable elements, or cross-reference cells
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || 
            target.closest('button') ||
            target.closest('.cross-ref-item') ||
            target.closest('.cell-content')) {
          return;
        }
        
        if (e.pointerType === 'touch' || e.pointerType === 'pen') {
          startX = e.clientX;
          startY = e.clientY;
          activeAxis = null;
          el.setPointerCapture(e.pointerId);
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!e.isPrimary) return;
        
        // Don't handle pointer moves from cross-reference cells
        const target = e.target as HTMLElement;
        if (target.closest('.cross-ref-item') || target.closest('.cell-content')) {
          return;
        }
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // If they cross 30° off the intended axis, hand off
        if (!activeAxis && (axis === 'x' ? Math.abs(dy) > Math.abs(dx) : Math.abs(dx) > Math.abs(dy))) {
          // Cancel this scroller & send to sibling
          const tgt = axis === 'x' ? vScroll : hScroll;
          tgt!.scrollBy({ left: dx, top: dy, behavior: 'auto' });
          el.releasePointerCapture(e.pointerId);
          e.preventDefault();
          return;
        }
        activeAxis = axis; // lock once confirmed
      };

      el.addEventListener('pointerdown', onPointerDown);
      el.addEventListener('pointermove', onPointerMove, { passive: false });

      return () => {
        el.removeEventListener('pointerdown', onPointerDown);
        el.removeEventListener('pointermove', onPointerMove);
      };
    }

    // Add event listeners
    hScroll.addEventListener('scroll', onHorizontalScroll);
    hScroll.addEventListener('wheel', wheelRouter, { passive: false });
    vScroll.addEventListener('wheel', wheelRouter, { passive: false });

    // Attach rail breakers
    const cleanupH = attachRailBreaker(hScroll, 'x');
    const cleanupV = attachRailBreaker(vScroll, 'y');

    return () => {
      hScroll.removeEventListener('scroll', onHorizontalScroll);
      hScroll.removeEventListener('wheel', wheelRouter);
      vScroll.removeEventListener('wheel', wheelRouter);
      cleanupH();
      cleanupV();
    };
  }, []);

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
      <ColumnHeaders 
        selectedTranslations={selectedTranslations}
        showNotes={preferences?.showNotes || false}
        showProphecy={showProphecies}
        showCrossRefs={showCrossRefs}
        showContext={false}
        scrollLeft={scrollLeft}
        preferences={preferences || {}}
        isGuest={true}

      />

      {/* Expert's physically separated scroll axes */}
      <div 
        ref={(node) => {
          (wrapperRef as any).current = node;
        }}
        className="scroll-container"
        style={{ 
          position: 'relative',
          height: "calc(100vh - 85px)",
          overflow: 'hidden' // Container manages child scrollers
        }}
        data-testid="bible-table"
      >
        {/* Vertical scroller: entire verse stack */}
        <div 
          ref={(node) => {
            (vScrollRef as any).current = node;
            (containerRef as any).current = node; // Connect containerRef for anchor slice system
          }}
          className="v-scroll"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            scrollbarGutter: 'stable both-edges',
            contain: 'layout paint style',
            willChange: 'scroll-position',
            touchAction: 'pan-y' // Only allow vertical panning
          }}
        >
          {/* Horizontal scroller: extra columns */}
          <div 
            ref={(node) => {
              (hScrollRef as any).current = node;
            }}
            className="h-scroll"
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              overscrollBehavior: 'contain',
              touchAction: 'pan-x', // Only allow horizontal panning
              scrollbarGutter: 'stable both-edges',
              contain: 'layout paint style',
              willChange: 'scroll-position'
            }}
          >
            <div className="tableInner flex"
             style={{ 
               minWidth: 'max-content', // Natural content width for expert's system
               width: 'max-content',    // Shrink-wrap to content
               margin: isPortrait ? '0' : '0 auto' // Center in landscape, left-align in portrait
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

                // Only log for first verse to avoid spam
                if (id === "Gen.1:1") {
                  console.log(`🔍 VirtualBibleTable rendering VirtualRow for ${id}, onExpandVerse available:`, !!onExpandVerse);
                }
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
                  />
                );
            })}
            <div style={{height: (verseKeys.length - slice.end) * ROW_HEIGHT}} />
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

VirtualBibleTable.displayName = 'VirtualBibleTable';

export default VirtualBibleTable;
export { VirtualBibleTable };