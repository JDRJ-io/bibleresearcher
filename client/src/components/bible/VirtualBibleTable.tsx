import { useState, useRef, useEffect, useCallback } from "react";
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
  onCenterVerseChange?: (centerIndex: number) => void;
  centerVerseIndex?: number;
  onPreserveAnchor?: (callback: () => void) => void;
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
  centerVerseIndex = 0,
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
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 100 });
  const [currentStartIndex, setCurrentStartIndex] = useState(0);
  const [currentEndIndex, setCurrentEndIndex] = useState(-1);

  // Calculate total height for scrollbar using the full verse count
  const totalHeight = totalRows * ROW_HEIGHT;

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

    // Switch to center-based slice math as specified
    const centerIdx = Math.floor((currentScrollTop + viewportHeight / 2) / ROW_HEIGHT);
    const start = Math.max(0, centerIdx - BUFFER_SIZE);
    const end = Math.min(totalRows - 1, centerIdx + BUFFER_SIZE);
    
    // Pull-ahead loader: trigger loading for center verse (global index)
    if (verses.length > 0 && onCenterVerseChange) {
      // centerIdx is now a true Bible index (no more firstDisplayIndex fudge)
      onCenterVerseChange(centerIdx);
    }

    // Early exit if range hasn't changed (key optimization from original)
    if (start === currentStartIndex && end === currentEndIndex) return;

    setCurrentStartIndex(start);
    setCurrentEndIndex(end);
    setVisibleRange({ start, end });
  };

  // Handle scroll events
  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        if (scrollRef.current) {
          setScrollTop(scrollRef.current.scrollTop);
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
  const visibleVerses = verses.slice(visibleRange.start, visibleRange.end + 1);
  
  // Lazy text loading - check if any visible verses need text loading
  useEffect(() => {
    if (visibleVerses.length === 0) return;
    
    // Find verses that need text loading
    const versesNeedingText = visibleVerses.filter(verse => 
      !verse.text || Object.keys(verse.text).length === 0
    );
    
    if (versesNeedingText.length > 0) {
      // Trigger loading for the range that needs text
      const firstIndex = Math.max(0, visibleRange.start - BUFFER_SIZE);
      const lastIndex = Math.min(totalRows - 1, visibleRange.end + BUFFER_SIZE);
      
      if (onCenterVerseChange) {
        const centerIdx = Math.floor((firstIndex + lastIndex) / 2);
        onCenterVerseChange(centerIdx);
      }
    }
  }, [visibleRange.start, visibleRange.end, visibleVerses.length, totalRows, onCenterVerseChange]);

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
                key={verse.id}
                className="verse-row absolute left-0 right-0"
                data-verse-index={verse.index}
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
