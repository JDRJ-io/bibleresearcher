import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { ROW_HEIGHT } from '@/constants/layout';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
  
  // Integrate translation maps system for verse text loading
  const translationMaps = useTranslationMaps();
  const { activeTranslations, getVerseText, getMainVerseText, mainTranslation: translationMainTranslation } = translationMaps;
  
  // PURE ANCHOR-CENTERED IMPLEMENTATION: Single source of truth
  const containerRef = useRef<HTMLDivElement>(null);
  const verseKeys = getVerseKeys(); // loaded once
  const { anchorIndex, slice } = useAnchorSlice(containerRef);
  
  // NEW: fetch hydrated verses for the current slice
  const { data: rowData } = useRowData(slice.verseIDs, mainTranslation);
  const totalHeight = verseKeys.length * ROW_HEIGHT;
  
  // B-1: Load slice data for cross-references and prophecy
  const { isLoading: isSliceLoading } = useSliceDataLoader(slice.verseIDs, mainTranslation);
  
  // B-2: Load cross-references with offset-based approach
  useCrossRefLoader(slice.verseIDs, 'cf1');
  
  // B-3: Eager-load main translation for cross-ref snippets
  const { crossRefs: crossRefsStore } = useBibleStore();
  useEffect(() => {
    const loadCrossRefTranslations = async () => {
      const refs = slice.verseIDs.flatMap(verseId => crossRefsStore[verseId] ?? []);
      const need = refs.filter(ref => !getVerseText(ref, mainTranslation));
      if (need.length > 0) {
        console.log(`📖 Loading ${need.length} cross-ref verse texts for main translation`);
      }
    };
    
    if (slice.verseIDs.length > 0) {
      loadCrossRefTranslations().catch(console.error);
    }
  }, [slice.verseIDs, crossRefsStore, mainTranslation, getVerseText]);
  
  // Load column-specific data when columns are toggled
  useColumnData();
  
  // Get store state for column toggles
  const { showCrossRefs, showProphecies } = useBibleStore();
  
  // Get verse text retrieval function from useBibleData
  const { getVerseText: getBibleVerseText, getGlobalVerseText: getGlobalVerseTextFromHook } = useBibleData();
  
  // Create getVerseText wrapper for VirtualRow (any translation) - use getBibleVerseText to avoid conflict
  const getVerseTextForRow = useCallback((verseID: string, translationCode: string) => {
    return getBibleVerseText(verseID, translationCode);
  }, [getBibleVerseText]);
  
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
      // Convert reference to verse index for anchor jumping
      const verseIndex = verseKeys.findIndex(key => key === ref || key.replace('.', ' ') === ref);
      if (verseIndex >= 0) {
        // Use the anchor system to jump to the verse
        const targetScrollTop = verseIndex * ROW_HEIGHT;
        if (containerRef.current) {
          containerRef.current.scrollTop = targetScrollTop;
        }
        console.log(`📖 Jumping to verse ${ref} at index ${verseIndex}`);
      } else {
        console.warn(`⚠️ Could not find verse index for ${ref}`);
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
  
  // Layout rule: Center when few columns, left-anchor when many columns overflow screen
  // Calculate approximate total width needed for all columns
  const estimatedTotalWidth = useMemo(() => {
    let width = 0;
    width += 80; // Reference column ~80px
    width += 320; // Main translation ~320px
    if (showCrossRefs) width += 240; // Cross refs ~240px
    if (showProphecies) width += 180; // P+F+V ~60px each
    width += (activeTranslations.filter(t => t !== mainTranslation).length * 320); // Alt translations ~320px each
    return width;
  }, [showCrossRefs, showProphecies, activeTranslations, mainTranslation]);
  
  // Get viewport width
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  
  // Center only if total width fits in viewport, otherwise left-anchor
  const shouldCenter = estimatedTotalWidth <= viewportWidth * 0.95; // 5% margin
  
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
  useEffect(() => {
    const w = wrapperRef.current;
    if (!w) return;
    const tooWide = w.scrollWidth > w.clientWidth;
    if (tooWide && w.scrollLeft > w.scrollWidth - w.clientWidth) {
      w.scrollLeft = w.scrollWidth - w.clientWidth;
    }
  }, [visibleColumns]); // Trigger when visible columns change

  // Mobile detection for dual-column layout
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <div className={`virtual-bible-table ${className}`} style={{ paddingTop: '0px' }}>
      <ColumnHeaders 
        selectedTranslations={selectedTranslations}
        showNotes={preferences.showNotes}
        showProphecy={showProphecies}
        showCrossRefs={showCrossRefs}
        showContext={false}
        scrollLeft={scrollLeft}
        preferences={preferences}
        isGuest={true}
      />
      
      <div 
        ref={wrapperRef} 
        className={`bible-table-wrapper ${isMobile ? 'dual-col' : ''}`}
        style={{ 
          touchAction: "pan-y", 
          marginTop: '-1px',
          height: "calc(100vh - 75px)",
          overflowX: shouldCenter ? 'hidden' : 'auto',
          overflowY: 'auto'
        }}
        data-scroll-direction={scrollDirection}
        onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
        data-testid="bible-table"
      >
        <div className={shouldCenter ? "flex justify-center w-full" : "flex w-full"}>
          <div className={shouldCenter ? "min-w-max" : "min-w-max"} style={{ minWidth: shouldCenter ? 'auto' : `${estimatedTotalWidth}px` }}>
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
                
                // Add main translation text
                if (verseData) {
                  textObj[mainTranslation] = verseData.text;
                }
                
                // Add alternate translation text from the translation maps
                activeTranslations.forEach(translationCode => {
                  if (translationCode !== mainTranslation) {
                    const altText = getVerseTextForRow(id, translationCode);
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
                
                return (
                  <VirtualRow 
                    key={id}
                    verseID={id}
                    verse={bibleVerse}
                    rowHeight={ROW_HEIGHT}
                    columnData={columnData}
                    getVerseText={getVerseTextForRow}
                    getMainVerseText={getMainVerseText}
                    activeTranslations={activeTranslations}
                    mainTranslation={translationMainTranslation}
                    onVerseClick={onNavigateToVerse}
                    onExpandVerse={onExpandVerse}
                  />
                );
            })}
            <div style={{height: (verseKeys.length - slice.end) * ROW_HEIGHT}} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualBibleTable;