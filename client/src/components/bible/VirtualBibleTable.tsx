import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ColumnHeaders } from "./ColumnHeaders";
import { VerseRow } from "./VerseRow";
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
}: VirtualBibleTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling state - simplified to track only what's needed
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  
  // Calculate total height for scrollbar using the full verse count
  const totalHeight = totalRows * ROW_HEIGHT;
  
  // Track current range to prevent race conditions
  const currentRangeRef = useRef({ start: 0, end: 0 });

  // User data queries
  const { data: userNotes = [] } = useQuery<UserNote[]>({
    queryKey: ["/api/notes"],
    enabled: !!user,
  });

  const { data: highlights = [] } = useQuery<Highlight[]>({
    queryKey: ["/api/highlights"],
    enabled: !!user,
  });

  // Update visible range based on scroll position - single source of truth
  const updateVisibleRows = () => {
    if (!scrollRef.current || !containerRef.current) return;

    const currentScrollTop = scrollRef.current.scrollTop;
    const viewportHeight = containerRef.current.clientHeight;

    // Calculate which verses should be visible
    const start = Math.max(0, Math.floor(currentScrollTop / ROW_HEIGHT) - BUFFER_SIZE);
    const end = Math.min(
      verses.length - 1,
      Math.ceil((currentScrollTop + viewportHeight) / ROW_HEIGHT) + BUFFER_SIZE
    );

    // Early exit if range hasn't changed (key optimization from original)
    if (start === currentRangeRef.current.start && end === currentRangeRef.current.end) {
      return;
    }

    // Update both ref and state
    currentRangeRef.current = { start, end };
    setVisibleRange({ start, end });
  };

  // Handle scroll events - single scroll listener to prevent race conditions
  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        if (scrollRef.current) {
          setScrollTop(scrollRef.current.scrollTop);
          setScrollLeft(scrollRef.current.scrollLeft);
          updateVisibleRows();
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
  }, [verses.length]); // Only depend on verses.length, not internal state

  // Update when verses change - reset range and recalculate
  useEffect(() => {
    currentRangeRef.current = { start: 0, end: 0 };
    setVisibleRange({ start: 0, end: 0 });
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
  const visibleVerses = verses.slice(visibleRange.start, visibleRange.end + 1);

  return (
    <div className="flex-1 flex flex-col h-full relative" ref={containerRef}>
      <ColumnHeaders
        selectedTranslations={selectedTranslations}
        showNotes={preferences.showNotes}
        showProphecy={preferences.showProphecy}
        showContext={preferences.showContext}
        scrollLeft={scrollLeft}
      />

      <div
        className="flex-1 overflow-auto"
        style={{ height: "calc(100vh - 160px)", marginTop: "48px" }}
        ref={scrollRef}
      >
        {/* Virtual scroll container with guaranteed total height for perfect scrollbar */}
        <div
          className="relative min-w-max"
          style={{ 
            height: `${totalHeight}px`,
            // Ensure container takes full calculated height for proper scrollbar
            minHeight: `${totalHeight}px`
          }}
        >
          {/* Render only visible verses with absolute positioning */}
          {visibleVerses.map((verse, index) => {
          const actualIndex = visibleRange.start + index;            
          return (
              <div
                key={verse.id}
                className="verse-row absolute left-0 right-0"
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
                  userNote={getUserNoteForVerse(verse.reference)}
                  highlights={getHighlightsForVerse(verse.reference)}
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
