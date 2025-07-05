import React, { useState, useRef, useEffect } from "react";
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

// Small buffers for efficient virtualization - following original prototype
const VIEWPORT_BUFFER = 20; // Preload ± 2 viewports (≈ 20 rows above & below)
const BUFFER_SIZE = 2; // Minimal buffer like original prototype

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
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // FIX 1: Feed all 31,102 verse keys - create stable array with all verse keys
  const allVerseKeys = useRef<BibleVerse[]>([]);
  
  // Initialize all verse keys on first load
  useEffect(() => {
    if (allVerseKeys.current.length === 0) {
      // Create all 31,102 verse keys with "Loading..." placeholder text
      const fullVerseList: BibleVerse[] = [];
      for (let i = 0; i < 31102; i++) {
        fullVerseList.push({
          id: `loading-${i}`,
          index: i,
          book: "Loading",
          chapter: 0,
          verse: 0,
          reference: `Loading ${i}`,
          text: { KJV: "Loading..." },
          crossReferences: []
        });
      }
      allVerseKeys.current = fullVerseList;
    }
  }, []);

  // Update verse text cache when verses are loaded
  useEffect(() => {
    verses.forEach((verse) => {
      if (verse.index !== undefined && allVerseKeys.current[verse.index]) {
        allVerseKeys.current[verse.index] = verse;
      }
    });
  }, [verses]);

  // FIX 2: Row pool system - 120 reusable DOM elements
  const rowPoolSize = 120;
  const rowRefs = useRef<Array<React.RefObject<HTMLDivElement>>>([]);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  
  const totalHeight = 31102 * ROW_HEIGHT; // Always use full Bible size
  
  // Track current range and center verse for anchoring
  const currentRangeRef = useRef({ start: 0, end: 0 });
  const centerVerseRef = useRef(0);

  // Initialize row pool on first render
  useEffect(() => {
    if (rowRefs.current.length === 0) {
      rowRefs.current = Array.from({ length: rowPoolSize }, () => React.createRef());
    }
  }, [rowPoolSize]);

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

    // Calculate which verses should be visible with small efficient buffers
    const currentVerseIndex = Math.floor(currentScrollTop / ROW_HEIGHT);
    const viewportVerseCount = Math.ceil(viewportHeight / ROW_HEIGHT);
    
    // Use small buffers like original prototype - just 2-3 viewports worth
    const start = Math.max(0, currentVerseIndex - VIEWPORT_BUFFER);
    const end = Math.min(
      totalRows - 1, // Use totalRows instead of verses.length to prevent clamping
      currentVerseIndex + viewportVerseCount + VIEWPORT_BUFFER
    );

    // Early exit if range hasn't changed (key optimization from original)
    if (start === currentRangeRef.current.start && end === currentRangeRef.current.end) {
      return;
    }

    // Update both ref and state
    currentRangeRef.current = { start, end };
    setVisibleRange({ start, end });
  };

  // FIX 4: Anchoring function - preserve center verse during UI changes
  const anchorToVerse = (verseIndex: number) => {
    if (scrollRef.current) {
      const targetScrollTop = verseIndex * ROW_HEIGHT;
      scrollRef.current.scrollTop = targetScrollTop;
      setScrollTop(targetScrollTop);
    }
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
          const newScrollTop = scrollRef.current.scrollTop;
          const newScrollLeft = scrollRef.current.scrollLeft;
          
          // Update center verse for anchoring
          if (containerRef.current) {
            const viewportHeight = containerRef.current.clientHeight;
            centerVerseRef.current = Math.floor((newScrollTop + viewportHeight / 2) / ROW_HEIGHT);
          }
          
          // FIX 3: Move header with direct DOM manipulation, not React state
          if (headerRef.current) {
            headerRef.current.style.transform = `translateX(-${newScrollLeft}px)`;
          }
          
          // Only update vertical scroll state
          setScrollTop(newScrollTop);
          
          // Update visible verses with early-exit optimization
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

  // FIX 2: Row pool rendering system - reuse DOM elements instead of React re-renders
  const updateRowPool = () => {
    const visibleRowCount = Math.min(rowPoolSize, visibleRange.end - visibleRange.start + 1);
    
    for (let i = 0; i < visibleRowCount; i++) {
      const verseIndex = visibleRange.start + i;
      const verse = allVerseKeys.current[verseIndex];
      
      if (verse && rowRefs.current[i]?.current) {
        const rowElement = rowRefs.current[i].current;
        
        if (rowElement) {
          // Update position using direct DOM manipulation
          rowElement.style.top = `${verseIndex * ROW_HEIGHT}px`;
          rowElement.style.height = `${ROW_HEIGHT}px`;
          
          // Update verse content without React re-render
          const referenceCell = rowElement.querySelector('.reference-cell');
          const textCell = rowElement.querySelector('.text-cell');
          
          if (referenceCell) {
            referenceCell.textContent = verse.reference;
          }
          
          if (textCell) {
            textCell.textContent = verse.text.KJV || 'Loading...';
          }
        }
      }
    }
  };

  // Update row pool when visible range changes
  useEffect(() => {
    updateRowPool();
  }, [visibleRange]);

  // FIX 4: Anchor center verse during UI changes (preferences toggle)
  useEffect(() => {
    const centerVerse = centerVerseRef.current;
    if (centerVerse > 0) {
      // Re-anchor to center verse after preferences change
      setTimeout(() => {
        anchorToVerse(centerVerse);
      }, 50);
    }
  }, [preferences.showNotes, preferences.showProphecy, preferences.showContext]);

  // Create static row pool - these DOM elements are reused
  const createRowPool = () => {
    const rowElements = [];
    
    for (let i = 0; i < rowPoolSize; i++) {
      rowElements.push(
        <div
          key={`pool-${i}`}
          ref={rowRefs.current[i]}
          className="verse-row absolute left-0 right-0 bg-background border-b"
          style={{
            top: `${i * ROW_HEIGHT}px`,
            height: `${ROW_HEIGHT}px`,
          }}
        >
          <div className="flex min-w-max h-full">
            <div className="reference-cell w-24 flex-shrink-0 flex items-center justify-center border-r px-2 text-sm">
              Loading...
            </div>
            <div className="text-cell w-80 flex-shrink-0 flex items-center px-3 border-r text-sm">
              Loading...
            </div>
          </div>
        </div>
      );
    }
    
    return rowElements;
  };

  return (
    <div className="flex-1 flex flex-col h-full relative" ref={containerRef}>
      <ColumnHeaders
        ref={headerRef}
        selectedTranslations={selectedTranslations}
        showNotes={preferences.showNotes}
        showProphecy={preferences.showProphecy}
        showContext={preferences.showContext}
        scrollLeft={0}
      />

      <div
        className="flex-1 overflow-auto"
        style={{ 
          height: "100%", // Let container take full available space
          marginTop: "48px" 
        }}
        ref={scrollRef}
      >
        {/* Single container with exact total height - prevents white space gaps */}
        <div
          className="relative min-w-max"
          style={{ 
            height: `${totalHeight}px`,
            position: 'relative'
          }}
        >
          {/* Row pool system - reuse DOM elements */}
          {createRowPool()}
        </div>
      </div>
    </div>
  );
}
