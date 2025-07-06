import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ColumnHeaders } from "./ColumnHeaders";
import { VerseRow } from "./VerseRow";
import { getVerseCount, getVerseKeys, getVerseKeyByIndex } from "@/lib/verseKeysLoader";
import { 
  loadChunk, 
  calculateAnchorIndex, 
  calculateRenderRange,
  shouldUpdateAnchor
} from "@/lib/anchorLoader";
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
const CENTER_BUFFER = 100; // ±100 verses around center = 200 total verses loaded
const RENDER_BUFFER = 20; // Smaller buffer for actual DOM rendering

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

  // ANCHOR-CENTERED LOADING SYSTEM: Complete replacement of edge-based loading
  const allVerseKeys = getVerseKeys(); // Complete 31,102 verse key references
  const [anchorIndex, setAnchorIndex] = useState(0); // Current center anchor position
  const [loadedRange, setLoadedRange] = useState({ start: 0, end: 100 });
  const [renderRange, setRenderRange] = useState({ start: 0, end: 40 });

  // Calculate total height using the complete verse key track
  const totalHeight = allVerseKeys.length * ROW_HEIGHT;

  // ANCHOR-CENTERED SCROLL HANDLER: Replace all edge-based loading
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    
    // Calculate new anchor index (verse at viewport center)
    const newAnchorIndex = calculateAnchorIndex(scrollTop, ROW_HEIGHT, allVerseKeys.length);
    
    // Only update if anchor changed significantly (prevents thrashing)
    if (shouldUpdateAnchor(newAnchorIndex, anchorIndex, 10)) {
      console.log(`📍 ANCHOR CHANGED: ${anchorIndex} → ${newAnchorIndex} (${allVerseKeys[newAnchorIndex]})`);
      setAnchorIndex(newAnchorIndex);
      
      // Calculate new render range for virtual scrolling
      const newRenderRange = calculateRenderRange(
        newAnchorIndex,
        event.currentTarget.clientHeight,
        ROW_HEIGHT
      );
      setRenderRange(newRenderRange);
      
      // Notify parent of center verse change for text loading
      onCenterVerseChange?.(newAnchorIndex);
    }
    
    // Update scroll state for virtual scrolling positioning
    setScrollTop(scrollTop);
  }, [anchorIndex, allVerseKeys, onCenterVerseChange]);
  


  // User data queries
  const { data: userNotes = [] } = useQuery<UserNote[]>({
    queryKey: ["/api/notes"],
    enabled: !!user,
  });

  const { data: highlights = [] } = useQuery<Highlight[]>({
    queryKey: ["/api/highlights"],
    enabled: !!user,
  });

  // REMOVED: Old updateVisibleRows function
  // Replaced with consolidated anchor-centered scroll handler below

  // Initialize anchor-centered system
  useEffect(() => {
    // Initialize with anchor-centered approach using verse key track
    setLoadedRange({ start: 0, end: 100 });
    setRenderRange({ start: 0, end: 40 });
    setAnchorIndex(0);
    console.log(`🎯 Initialized anchor-centered system: ${allVerseKeys.length} total verse positions`);
  }, [allVerseKeys.length]);

  // ANCHOR-CENTERED SCROLL TRACKING: Replace edge-based logic
  useEffect(() => {
    let animationFrameId: number;

    const handleScrollEvent = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        if (scrollRef.current) {
          const scrollTop = scrollRef.current.scrollTop;
          const viewportHeight = scrollRef.current.clientHeight;
          
          // Calculate center verse index from viewport center
          const centerScrollPosition = scrollTop + (viewportHeight / 2);
          const newAnchorIndex = Math.floor(centerScrollPosition / ROW_HEIGHT);
          const clampedAnchorIndex = Math.max(0, Math.min(allVerseKeys.length - 1, newAnchorIndex));
          
          // Only update if anchor changed significantly (prevents thrashing)
          if (shouldUpdateAnchor(clampedAnchorIndex, anchorIndex, 5)) {
            console.log(`📍 VIEWPORT CENTER CHANGED: ${anchorIndex} → ${clampedAnchorIndex} (${allVerseKeys[clampedAnchorIndex]})`);
            setAnchorIndex(clampedAnchorIndex);
            
            // Calculate new render range for virtual scrolling
            const newRenderRange = calculateRenderRange(
              clampedAnchorIndex,
              viewportHeight,
              ROW_HEIGHT
            );
            setRenderRange(newRenderRange);
            
            // Notify parent of center verse change for text loading
            onCenterVerseChange?.(clampedAnchorIndex);
          }
          
          setScrollTop(scrollTop);
        }
      });
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScrollEvent, { passive: true });
      // Initial update
      handleScrollEvent();
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", handleScrollEvent);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [anchorIndex, allVerseKeys, onCenterVerseChange]);

  // Update when verses change - maintain anchor position
  useEffect(() => {
    // Reset ranges when verse data changes
    setLoadedRange({ start: 0, end: 100 });
    setRenderRange({ start: 0, end: 40 });
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

  // ANCHOR-CENTERED RENDERING: Build verses from render range around anchor
  const visibleVerses = Array.from(
    { length: renderRange.end - renderRange.start + 1 },
    (_, i) => {
      const verseKeyIndex = renderRange.start + i;
      const verseKey = allVerseKeys[verseKeyIndex];
      
      if (!verseKey) return null;
      
      // Find matching verse in loaded array or create placeholder
      const loadedVerse = verses.find(v => v.index === verseKeyIndex);
      
      if (loadedVerse) {
        return loadedVerse; // Use loaded verse with text
      } else {
        // Create placeholder verse from verse key
        const match = verseKey.match(/^(\w+)\.(\d+):(\d+)$/);
        if (!match) return null;
        
        const [, book, chapter, verse] = match;
        return {
          id: `${book.toLowerCase()}-${chapter}-${verse}-${verseKeyIndex}`,
          index: verseKeyIndex,
          book,
          chapter: parseInt(chapter),
          verse: parseInt(verse),
          reference: `${book} ${chapter}:${verse}`,
          text: {}, // Empty - will be loaded around anchor
          crossReferences: [],
          strongsWords: [],
          labels: [],
          contextGroup: "standard",
          height: 120,
        };
      }
    }
  ).filter(Boolean);
  
  // Remove the problematic lazy loading useEffect that was causing infinite loops

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
            if (!verse) return null;
            const actualIndex = renderRange.start + index;            
            return (
              <div
                key={verse.id}
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
