import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ColumnHeaders } from "./ColumnHeaders";
import { VerseRow } from "./VerseRow";
import { getVerseCount, verses as globalVerses, keyToReference, parseVerseKey } from "@/lib/verseKeysLoader";
import type {
  BibleVerse,
  Translation,
  UserNote,
  Highlight,
} from "@/types/bible";

interface VirtualBibleTableProps {
  verses: BibleVerse[];
  selectedTranslations: Translation[];
  preferences: {
    showNotes: boolean;
    showProphecy: boolean;
    showContext: boolean;
  };
  mainTranslation?: string;
  onExpandVerse: (verse: BibleVerse) => void;
  onNavigateToVerse: (reference: string) => void;
  getProphecyDataForVerse?: (verseKey: string) => any[];
  getGlobalVerseText?: (reference: string) => string;
  /**
   * Total number of verse rows in the full Bible.
   * Used to set the placeholder container height so the
   * scroll bar spans the entire Bible length.
   */
  totalRows: number;
  onCenterVerseChange?: (centerIndex: number) => void;
  onPreserveAnchor?: (preserveAnchor: (callback: () => void) => void) => void;
  centerVerseIndex?: number;
  onScrollTopChange?: (scrollTop: number) => void;
}

const ROW_HEIGHT = 120; // Fixed height for each verse row
const BUFFER_SIZE = 20; // Number of verses to render above/below viewport

export function VirtualBibleTable({
  verses,
  selectedTranslations,
  preferences,
  onExpandVerse,
  onNavigateToVerse,
  getProphecyDataForVerse,
  getGlobalVerseText,
  totalRows,
  onCenterVerseChange,
  onPreserveAnchor,
  centerVerseIndex = 0,
  onScrollTopChange,
}: VirtualBibleTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Track component lifecycle
  const mountTimeRef = useRef<number>(Date.now());
  const renderCountRef = useRef<number>(0);
  
  useEffect(() => {
    const mountTime = Date.now();
    mountTimeRef.current = mountTime;
    console.log(`⏱️ VirtualBibleTable MOUNTED at ${new Date(mountTime).toLocaleTimeString()}`);
    
    return () => {
      const lifespan = Date.now() - mountTimeRef.current;
      console.error(`❌ VirtualBibleTable UNMOUNTING after ${lifespan}ms (${(lifespan/1000).toFixed(2)}s)`);
      console.error(`❌ Total renders before unmount: ${renderCountRef.current}`);
      console.error(`❌ Component state at unmount:`, {
        versesLength: verses.length,
        totalRows,
      });
    };
  }, []);
  
  // Track each render
  useEffect(() => {
    renderCountRef.current++;
    const renderTime = Date.now() - mountTimeRef.current;
    console.log(`⏱️ VirtualBibleTable render #${renderCountRef.current} at +${renderTime}ms`);
  });
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Anchor preservation - expose preserveAnchor function
  const preserveAnchor = useCallback((callback: () => void) => {
    if (!scrollRef.current) {
      callback();
      return;
    }

    // Save current scroll position
    const savedScrollTop = scrollRef.current.scrollTop;

    // Execute the callback that might change UI
    callback();

    // Restore scroll position on next frame
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = savedScrollTop;
      }
    });
  }, []);

  // Virtual scrolling state
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 40 });
  const [currentStartIndex, setCurrentStartIndex] = useState(0);
  const [currentEndIndex, setCurrentEndIndex] = useState(-1);

  // Step 2: preserveAnchor already defined above

  // Expose preserveAnchor function to parent
  useEffect(() => {
    if (onPreserveAnchor) {
      onPreserveAnchor(preserveAnchor);
    }
  }, [onPreserveAnchor, preserveAnchor]);

  // Calculate total height for scrollbar using the full verse count
  const totalHeight = (totalRows ?? getVerseCount()) * ROW_HEIGHT;

  // User data queries
  const { data: userNotes = [] } = useQuery<UserNote[]>({
    queryKey: ["/api/notes"],
    enabled: !!user,
  });

  const { data: highlights = [] } = useQuery<Highlight[]>({
    queryKey: ["/api/highlights"],
    enabled: !!user,
  });

  // Update visible range based on scroll position
  const updateVisibleRows = () => {
    if (!scrollRef.current || !containerRef.current) return;

    const currentScrollTop = scrollRef.current.scrollTop;
    const viewportHeight = containerRef.current.clientHeight;

    // --- inside updateVisibleRows() ---
    const centerIdx = Math.floor(
      (currentScrollTop + viewportHeight / 2) / ROW_HEIGHT,
    );
    const start = Math.max(0, centerIdx - BUFFER_SIZE);
    const end = Math.min(totalRows - 1, centerIdx + BUFFER_SIZE);

    // Update visible range state to trigger re-render
    setVisibleRange({ start, end });

    // Pull-ahead loader: trigger loading for center verse (global index)
    if (centerIdx !== centerVerseIndex) {
      onCenterVerseChange?.(centerIdx); // fire even when verses is still empty
    }

    // Early exit if range hasn't changed (key optimization from original)
    if (start === currentStartIndex && end === currentEndIndex) return;

    setCurrentStartIndex(start);
    setCurrentEndIndex(end);
    setVisibleRange({ start, end });
  };

  // Initialize scroll position to top only once
  useEffect(() => {
    setVisibleRange({ start: 0, end: 40 });
    setCurrentStartIndex(0);
    setCurrentEndIndex(40);
  }, []);

  // Handle scroll events
  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        if (scrollRef.current) {
          const currentScrollTop = scrollRef.current.scrollTop;
          setScrollTop(currentScrollTop);
          updateVisibleRows();

          // Step 4: Pass scroll position up if someone needs it
          if (onScrollTopChange) {
            onScrollTopChange(currentScrollTop);
          }
        }
      });
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });
      // Initial update
      updateVisibleRows();
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", handleScroll);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [verses.length, currentStartIndex, currentEndIndex]);

  // Update when verses change
  useEffect(() => {
    setCurrentStartIndex(0);
    setCurrentEndIndex(-1);
    updateVisibleRows();
  }, [verses]);

  // Helper functions
  const getUserNoteForVerse = (reference: string) => {
    return userNotes.find((note) => note.verseRef === reference);
  };

  const getHighlightsForVerse = (reference: string) => {
    return highlights.filter((h) => h.verseRef === reference);
  };

  // Note mutations
  const createNoteMutation = useMutation({
    mutationFn: async (data: { verseRef: string; note: string }) => {
      const res = await apiRequest("POST", "/api/notes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({ title: "Note saved" });
    },
  });

  const handleHighlight = (verseRef: string, selection: Selection) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to highlight verses",
        variant: "destructive",
      });
      return;
    }

    // Handle highlight logic here if needed
    console.log("Highlight requested for", verseRef, selection);
  };

  // Fire loader no-matter what (inside updateVisibleRows() mutates verses[index].text):
  const visibleVerses = Array.from({ length: visibleRange.end - visibleRange.start + 1 }, (_, i) => {
    const globalIndex = visibleRange.start + i;
    if (globalIndex >= totalRows) return undefined;
    
    // Get verse from the global verses array
    const verse = verses[globalIndex];
    if (!verse) return undefined;
    
    // Ensure prop is never undefined
    return {
      ...verse,
      text: verse.text || {},
      crossReferences: verse.crossReferences || []
    };
  }).filter(Boolean) as BibleVerse[];
  
  // Enhanced error logging
  try {
    console.log('VirtualBibleTable render:', {
      totalRows,
      versesLength: verses.length, 
      visibleRange,
      visibleVersesLength: visibleVerses.length,
      firstVisible: visibleVerses[0]?.reference || 'undefined',
      hasUndefinedText: visibleVerses.some(v => v && !v.text),
      hasNullVerses: visibleVerses.some(v => v === null || v === undefined),
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Check for potential issues
    if (visibleVerses.length === 0) {
      console.error('❌ ERROR: No visible verses to render!', {
        visibleRange,
        versesLength: verses.length,
        totalRows
      });
    }
    
    if (visibleVerses.some(v => !v)) {
      console.error('❌ ERROR: Some visible verses are null/undefined!', {
        nullIndices: visibleVerses.map((v, i) => !v ? i : null).filter(i => i !== null)
      });
    }
  } catch (error) {
    console.error('❌ ERROR in VirtualBibleTable render logging:', error);
  }

  // Prime window once (init effect):
  useEffect(() => {
    const updateVisibleRange = (start: number, end: number) => {
      if (visibleRange.start !== start || visibleRange.end !== end) {
        setVisibleRange({ start, end });
      }
    };
    
    updateVisibleRange(0, Math.min(40, totalRows - 1));
  }, [totalRows]);

  // run once after first mount
  useEffect(() => {
    onPreserveAnchor?.(preserveAnchor);
  }, [onPreserveAnchor, preserveAnchor]);

  try {
    return (
      <div className="flex-1 flex flex-col h-full relative" ref={containerRef}>
        <ColumnHeaders
          selectedTranslations={selectedTranslations}
          showNotes={preferences.showNotes}
          showProphecy={preferences.showProphecy}
          showContext={preferences.showContext}
          scrollLeft={0}
        />

        <div
          className="flex-1 overflow-auto"
          style={{ height: "calc(100vh - 160px)", marginTop: "48px" }}
          ref={scrollRef}
        >
          {/* Virtual scroll container with total height */}
          <div
            className="relative min-w-max"
            style={{ height: `${totalHeight}px` }}
          >
            {/* Render only visible verses with absolute positioning */}
            {visibleVerses.map((verse, index) => {
              const actualIndex = visibleRange.start + index;
              try {
                return (
                  <div
                    key={verse?.id || `placeholder-${actualIndex}`}
                    className="verse-row absolute left-0 right-0"
                    data-verse-index={actualIndex}
                    style={{
                      top: `${actualIndex * ROW_HEIGHT}px`,
                      height: `${ROW_HEIGHT}px`,
                    }}
                  >
                    <VerseRow
                      verse={verse}
                      verseIndex={actualIndex}
                      selectedTranslations={selectedTranslations}
                      showNotes={preferences.showNotes}
                      showProphecy={preferences.showProphecy}
                      showContext={preferences.showContext}
                      userNote={verse ? getUserNoteForVerse(verse.reference) : undefined}
                      highlights={verse ? getHighlightsForVerse(verse.reference) : []}
                      onExpandVerse={onExpandVerse}
                      onHighlight={handleHighlight}
                      onNavigateToVerse={onNavigateToVerse}
                      getProphecyDataForVerse={getProphecyDataForVerse}
                      getGlobalVerseText={getGlobalVerseText}
                      allVerses={verses}
                    />
                  </div>
                );
              } catch (error) {
                console.error(`❌ ERROR rendering verse at index ${actualIndex}:`, error, { verse });
                return (
                  <div
                    key={`error-${actualIndex}`}
                    className="verse-row absolute left-0 right-0 bg-red-100 dark:bg-red-900"
                    style={{
                      top: `${actualIndex * ROW_HEIGHT}px`,
                      height: `${ROW_HEIGHT}px`,
                    }}
                  >
                    <div className="p-3 text-red-700 dark:text-red-300">
                      Error rendering verse at index {actualIndex}
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('❌ CRITICAL ERROR in VirtualBibleTable render:', error);
    console.error('Component state at crash:', {
      versesLength: verses.length,
      visibleVersesLength: visibleVerses.length,
      visibleRange,
      totalRows
    });
    
    return (
      <div className="flex-1 flex items-center justify-center bg-red-50 dark:bg-red-950">
        <div className="text-red-700 dark:text-red-300 text-center p-8">
          <h2 className="text-xl font-bold mb-2">Error Loading Bible Table</h2>
          <p className="mb-4">The table encountered an error and could not render.</p>
          <details className="text-left max-w-2xl mx-auto">
            <summary className="cursor-pointer">Error Details</summary>
            <pre className="mt-2 p-4 bg-red-100 dark:bg-red-900 rounded overflow-auto text-xs">
              {error?.toString()}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
