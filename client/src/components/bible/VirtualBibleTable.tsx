import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ColumnHeaders } from "./ColumnHeaders";
import { VerseRow } from "./VerseRow";
import { getVerseCount, verses as globalVerses } from "@/lib/verseKeysLoader";
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

  // Only render verses in visible range
  // 🔥 Use the fixed-length array with no holes - always safe to access verse.reference
  const safeVisibleRange = {
    start: Math.max(0, visibleRange.start),
    end: Math.min(totalRows - 1, visibleRange.end)
  };
  
  const visibleVerses = Array.from(
    { length: Math.max(1, safeVisibleRange.end - safeVisibleRange.start + 1) },
    (_, i) => {
      const globalIndex = safeVisibleRange.start + i;
      // Always use the global fixed-length array - never undefined
      const baseVerse = globalVerses[globalIndex];
      // Merge with any loaded text from the verses prop
      const loadedVerse = verses[globalIndex];
      if (loadedVerse?.text && Object.keys(loadedVerse.text).length > 0) {
        return { ...baseVerse, text: loadedVerse.text };
      }
      return baseVerse;
    }
  );
  
  console.log(`🔍 VirtualBibleTable render: visibleRange=${JSON.stringify(visibleRange)}, safeRange=${JSON.stringify(safeVisibleRange)}, visibleVerses.length=${visibleVerses.length}, totalHeight=${totalHeight}`);

  // Remove the problematic lazy loading useEffect that was causing infinite loops

  // run once after first mount
  useEffect(() => {
    onPreserveAnchor?.(preserveAnchor);
  }, [onPreserveAnchor, preserveAnchor]);

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
          })}
        </div>
      </div>
    </div>
  );
}
