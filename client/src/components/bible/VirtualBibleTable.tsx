import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { ROW_HEIGHT } from '@/constants/layout';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ColumnHeaders } from "./ColumnHeaders";
import { useColumnData } from '@/hooks/useColumnData';
import { VirtualRow } from "./VirtualRow";
import { getVerseCount, getVerseKeys, getVerseKeyByIndex } from "@/lib/verseKeysLoader";
import { useAnchorSlice } from "@/hooks/useAnchorSlice";
import { useTranslationMaps } from "@/hooks/useTranslationMaps";
import { useRowData } from "@/hooks/useRowData";
import { useSliceDataLoader } from "@/hooks/useSliceDataLoader";
import { useCrossRefLoader } from "@/hooks/useCrossRefLoader";
import { useBibleStore } from "@/App";
import { useBibleData } from "@/hooks/useBibleData";

import type {
  BibleVerse,
  Translation,
  UserNote,
  Highlight,
  AppPreferences,
} from "@/types/bible";
import { useViewportLabels } from "@/hooks/useViewportLabels";
import type { LabelName } from '@/lib/labelBits';

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
}

const VirtualBibleTable = ({
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
}: VirtualBibleTableProps) => {
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
  const sliceVerses: BibleVerse[] = useMemo(() => {
    return slice.verseIDs.map(verseID => {
      const verseData = rowData?.[verseID];
      if (verseData) {
        return verseData;
      }
      // Create properly typed fallback verse
      return {
        id: verseID,
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
  const { showCrossRefs, showProphecies } = useBibleStore();

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
    onVerseClick: (ref: string) => {
      // STRAIGHT-LINE: Assume ref is already in dot format from system
      const verseIndex = verseKeys.findIndex(key => key === ref);
      const foundFormat = ref;

      if (verseIndex >= 0) {
        if (containerRef.current) {
          const containerHeight = containerRef.current.clientHeight;
          const targetScrollTop = (verseIndex * ROW_HEIGHT) - (containerHeight / 2) + (ROW_HEIGHT / 2);

          // Instant jump with simple highlight
          containerRef.current.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'auto'
          });

          // Simple highlight feedback
          setTimeout(() => {
            const targetVerse = document.getElementById(`verse-${foundFormat}`) || 
                               document.querySelector(`[data-verse-ref="${foundFormat}"]`);
            if (targetVerse) {
              targetVerse.classList.add('verse-highlight-flash');
              setTimeout(() => targetVerse.classList.remove('verse-highlight-flash'), 400);
            }
          }, 25);
        }
      }
    },
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

  // Enhanced directional scrolling - only one axis at a time
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'vertical' | 'horizontal' | null>(null);

  // Mobile detection for dual-column layout
  const isMobile = useIsMobile();

  // Detect orientation and determine centering logic
  const isPortrait = typeof window !== 'undefined' ? window.matchMedia('(orientation: portrait)').matches : false;

  // Get viewport width
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;

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

  // Calculate actual total width based on visible columns - optimized for mobile portrait
  const actualTotalWidth = useMemo(() => {
    let width = 0;
    
    // For mobile portrait mode, use specific proportions
    if (isPortrait && isMobile) {
      width += 60; // Reference column - compact for mobile
      width += 220; // Main translation - readable but efficient
      width += 160; // Cross refs - slightly narrower (always shown on mobile)
      if (showProphecies) width += 150; // P+F+V columns
      width += (activeTranslations.filter(t => t !== mainTranslation).length * 180); // Alt translations
    } else {
      // Desktop/landscape sizes
      width += 80; // Reference column ~80px  
      width += 320; // Main translation ~320px
      if (showCrossRefs) width += 320; // Cross refs ~320px
      if (showProphecies) width += 180; // P+F+V ~60px each
      width += (activeTranslations.filter(t => t !== mainTranslation).length * 320); // Alt translations ~320px each
    }
    
    return width;
  }, [activeTranslations, mainTranslation, showCrossRefs, showProphecies, isPortrait, isMobile]);

  const fitsHorizontally = actualTotalWidth <= viewportWidth;
  const shouldCenter = !isPortrait && fitsHorizontally;
  const needsHorizontalScroll = actualTotalWidth > viewportWidth;

  useEffect(() => {
    if (!wrapperRef.current) return;

    let startX = 0, startY = 0;
    let isScrolling = false;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isScrolling = false;
      setScrollDirection(null);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isScrolling) {
        const dx = Math.abs(e.touches[0].clientX - startX);
        const dy = Math.abs(e.touches[0].clientY - startY);

        // Determine scroll direction based on initial movement
        if (dx > dy && dx > 15) {
          // Horizontal scrolling detected
          setScrollDirection('horizontal');
          wrapperRef.current!.style.touchAction = "pan-x";
          wrapperRef.current!.style.overflowY = "hidden";
          isScrolling = true;
        } else if (dy > dx && dy > 15) {
          // Vertical scrolling detected
          setScrollDirection('vertical');
          wrapperRef.current!.style.touchAction = "pan-y";
          wrapperRef.current!.style.overflowX = "hidden";
          isScrolling = true;
        }
      }
    };

    const onTouchEnd = () => {
      // Reset to allow both directions after touch ends
      if (wrapperRef.current) {
        wrapperRef.current.style.touchAction = "pan-y";
        wrapperRef.current.style.overflowX = "auto";
        wrapperRef.current.style.overflowY = "auto";
      }
      setScrollDirection(null);
      isScrolling = false;
    };

    const onScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      setScrollLeft(target.scrollLeft);
    };

    const wrapper = wrapperRef.current;
    const container = containerRef.current;
    wrapper.addEventListener("touchstart", onTouchStart);
    wrapper.addEventListener("touchmove", onTouchMove);
    wrapper.addEventListener("touchend", onTouchEnd);
    if (container) {
      container.addEventListener("scroll", onScroll);
    }

    return () => {
      if (wrapper) {
        wrapper.removeEventListener("touchstart", onTouchStart);
        wrapper.removeEventListener("touchmove", onTouchMove);
        wrapper.removeEventListener("touchend", onTouchEnd);
      }
      if (container) {
        container.removeEventListener("scroll", onScroll);
      }
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

  // Horizontal scrollbar guard: prevent scrollLeft overflow after column changes
  // Clamp scroll when switching modes (portrait/landscape or fit/overflow)
  useEffect(() => {
    const w = wrapperRef.current;
    if (!w) return;
    const max = w.scrollWidth - w.clientWidth;
    if (w.scrollLeft > max) {
      w.scrollLeft = max;
    }
  }, [shouldCenter, actualTotalWidth, visibleColumns]); // Trigger when centering mode or width changes

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

      <div 
        ref={(node) => {
          (wrapperRef as any).current = node;
          (containerRef as any).current = node; // Connect containerRef for anchor slice system
        }}
        className={`flex overflow-x-auto ${shouldCenter ? 'justify-center' : 'justify-start'} ${isMobile ? 'dual-col' : ''}`}
        style={{ 
          touchAction: "pan-y", 
          marginTop: '0', // Remove the desktop gap below the header
          height: "calc(100vh - 85px)",
          overflowY: 'auto'
        }}
        data-scroll-direction={scrollDirection}
        onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
        data-testid="bible-table"
      >
        <div className="min-w-max">
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
  );
};

export default VirtualBibleTable;
export { VirtualBibleTable };