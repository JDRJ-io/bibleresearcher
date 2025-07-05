import React, { useState, useRef, useEffect, useCallback } from "react";
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
  /**
   * Callback to set the anchor preservation function
   */
  onAnchorReady?: (preserveAnchor: (callback: () => void) => void) => void;
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
  onAnchorReady,
}: VirtualBibleTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Row pool system - allocate ±120 rows on first render, store refs in array
  const rowPoolSize = 120; // Fixed pool size as specified
  const rowRefs = useRef<Array<React.RefObject<HTMLDivElement>>>([]);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  
  // Calculate total height for scrollbar using the full verse count
  // Height = totalVerses × rowHeight right after verse keys load
  const totalHeight = totalRows * ROW_HEIGHT;
  
  // Track current range to prevent race conditions and support anchoring
  const currentRangeRef = useRef({ start: 0, end: 0 });
  const centerVerseRef = useRef(0); // Track center verse for anchoring
  
  // Anchoring function - preserves center verse when UI options change
  const preserveAnchor = useCallback((callback: () => void) => {
    if (!containerRef.current || !scrollRef.current) {
      if (typeof callback === 'function') {
        callback();
      }
      return;
    }
    
    // Remember current center verse
    const currentScrollTop = scrollRef.current.scrollTop;
    const viewportHeight = containerRef.current.clientHeight;
    const anchorVerseIndex = Math.floor((currentScrollTop + viewportHeight / 2) / ROW_HEIGHT);
    
    // Execute the UI change
    if (typeof callback === 'function') {
      callback();
    }
    
    // Restore scroll position after next render
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = anchorVerseIndex * ROW_HEIGHT;
      }
    }, 0);
  }, []);

  // Initialize row pool on first render
  useEffect(() => {
    if (rowRefs.current.length === 0) {
      rowRefs.current = Array.from({ length: rowPoolSize }, () => React.createRef());
    }
  }, [rowPoolSize]);

  // Pass anchoring function to parent
  useEffect(() => {
    if (onAnchorReady) {
      onAnchorReady(preserveAnchor);
    }
  }, [onAnchorReady]);

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

    // CENTER-ANCHORED: Calculate based on center of viewport like prototype
    const currentVerseIndex = Math.floor((currentScrollTop + viewportHeight / 2) / ROW_HEIGHT);
    const viewportVerseCount = Math.ceil(viewportHeight / ROW_HEIGHT);
    
    // Update center verse for anchoring
    centerVerseRef.current = currentVerseIndex;
    
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
          
          // Move header with ref, not React state - prevents re-render lag
          if (headerRef.current) {
            headerRef.current.style.transform = `translateX(-${newScrollLeft}px)`;
          }
          
          // Keep minimal state updates for scroll position tracking
          setScrollTop(newScrollTop);
          // REMOVED: setScrollLeft(newScrollLeft) - no longer needed since header follows via ref
          
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

  // Helper to update verse row content in-place without remounting
  const updateVerseRow = (element: HTMLDivElement | null, verse: BibleVerse, verseIndex: number) => {
    if (!element) return;
    
    // Fill verse text on-demand if missing
    if (!verse.text.KJV) {
      import('@/hooks/useBibleData').then(({ fillVerseText }) => {
        fillVerseText(verse, 'KJV');
        // Update element after text loads
        requestAnimationFrame(() => updateVerseRow(element, verse, verseIndex));
      });
      return;
    }
    
    // Update position
    element.style.top = `${verseIndex * ROW_HEIGHT}px`;
    element.style.height = `${ROW_HEIGHT}px`;
    element.style.position = 'absolute';
    element.style.left = '0';
    element.style.right = '0';
    element.className = 'verse-row absolute left-0 right-0';
    
    // Update content directly in DOM
    element.innerHTML = `
      <div class="flex border-b" style="height: ${ROW_HEIGHT}px; border-color: var(--border-color);">
        <div class="w-24 flex-shrink-0 flex items-center justify-center border-r px-2 text-sm font-medium" style="border-color: var(--border-color);">
          ${verse.reference}
        </div>
        ${selectedTranslations.map(translation => `
          <div class="w-80 flex-shrink-0 p-3 border-r text-sm overflow-auto" style="border-color: var(--border-color); max-height: ${ROW_HEIGHT}px;">
            ${verse.text[translation.id] || 'Loading...'}
          </div>
        `).join('')}
        <div class="w-60 flex-shrink-0 p-3 border-r text-sm overflow-auto" style="border-color: var(--border-color); max-height: ${ROW_HEIGHT}px;">
          ${verse.crossReferences?.slice(0, 3).map(ref => 
            `<a href="#" class="text-blue-600 hover:underline mr-2" onclick="window.dispatchEvent(new CustomEvent('navigate-verse', {detail: '${ref.reference}'}))">${ref.reference}</a>`
          ).join('') || ''}
        </div>
        ${preferences.showProphecy ? `
          <div class="w-64 flex-shrink-0 p-3 border-r text-sm overflow-auto" style="border-color: var(--border-color); max-height: ${ROW_HEIGHT}px;">
            Prophecy data...
          </div>
        ` : ''}
        ${preferences.showNotes ? `
          <div class="w-60 flex-shrink-0 p-3 text-sm overflow-auto" style="max-height: ${ROW_HEIGHT}px;">
            Notes...
          </div>
        ` : ''}
      </div>
    `;
  };

  // Row pool rendering system - direct DOM manipulation instead of JSX remounting
  const renderRowPool = () => {
    const rowElements = [];
    const visibleRowCount = Math.min(rowPoolSize, visibleRange.end - visibleRange.start + 1);
    
    for (let i = 0; i < visibleRowCount; i++) {
      const verseIndex = visibleRange.start + i;
      const verse = verses[verseIndex];
      
      if (verse) {
        // Create row wrapper only once, then update content in place
        const rowElement = (
          <div
            key={`row-${i}`}
            ref={(el) => {
              if (el) {
                rowRefs.current[i] = { current: el };
                updateVerseRow(el, verse, verseIndex);
              }
            }}
          />
        );
        rowElements.push(rowElement);
      }
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
        scrollLeft={scrollLeft}
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
          {renderRowPool()}
        </div>
      </div>
    </div>
  );
}
