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
const BUFFER_SIZE = 50; // Generous buffer - 5 viewports worth

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

  // Perfect scroll container height - set once for entire Bible
  const containerHeight = totalRows * ROW_HEIGHT;
  
  // Track scroll range to prevent race conditions  
  const currentRangeRef = useRef({ start: 0, end: 0 });
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  // User data queries
  const { data: userNotes = [] } = useQuery<UserNote[]>({
    queryKey: ["/api/notes"],
    enabled: !!user,
  });

  const { data: highlights = [] } = useQuery<Highlight[]>({
    queryKey: ["/api/highlights"],
    enabled: !!user,
  });

  // Single scroll calculation with early-exit guard  
  const updateVisibleRows = () => {
    if (!scrollRef.current || !containerRef.current) return;

    const currentScrollTop = scrollRef.current.scrollTop;
    const viewportHeight = containerRef.current.clientHeight;

    // Calculate range using total Bible rows, not just loaded verses
    const start = Math.max(0, Math.floor(currentScrollTop / ROW_HEIGHT) - BUFFER_SIZE);
    const end = Math.min(
      totalRows - 1,
      Math.floor((currentScrollTop + viewportHeight) / ROW_HEIGHT) + BUFFER_SIZE
    );

    // Early exit if range hasn't changed - prevents race conditions
    if (start === currentRangeRef.current.start && end === currentRangeRef.current.end) {
      return;
    }

    // Update range tracking
    currentRangeRef.current = { start, end };
    setVisibleRange({ start, end });
  };

  // Single scroll listener - clean and simple  
  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        if (!scrollRef.current) return;
        
        setScrollTop(scrollRef.current.scrollTop);
        setScrollLeft(scrollRef.current.scrollLeft);
        updateVisibleRows();
      });
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });
      updateVisibleRows(); // Initial calculation
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", handleScroll);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []); // No dependencies - single setup

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

  // Get verse by global index with fallback for missing verses
  const getVerseByIndex = (index: number): BibleVerse | null => {
    return verses.find(v => v.index === index) || null;
  };

  // Generate visible verses from the range indices using global verse lookup
  const visibleVerses: BibleVerse[] = [];
  for (let i = visibleRange.start; i <= visibleRange.end; i++) {
    const verse = getVerseByIndex(i);
    if (verse) {
      visibleVerses.push(verse);
    }
  }

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
        {/* Virtual scroll container with dynamic height based on loaded content */}
        <div
          className="relative min-w-max"
          style={{ 
            height: `${containerHeight}px`,
            // Ensure container matches loaded verse range for proper scroll boundaries
            minHeight: `${containerHeight}px`
          }}
        >
          {/* Render visible verses with absolute positioning based on global index */}
          {visibleVerses.map((verse) => {
            const verseIndex = verse.index ?? 0;
            return (
              <div
                key={`${verse.id}-${verseIndex}`}
                className="verse-row absolute left-0 right-0"
                style={{
                  top: `${verseIndex * ROW_HEIGHT}px`,
                  height: `${ROW_HEIGHT}px`,
                }}
              >
                <VerseRow
                  verse={verse}
                  verseIndex={verseIndex}
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
