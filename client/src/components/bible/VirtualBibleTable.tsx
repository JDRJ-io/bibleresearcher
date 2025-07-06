import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ColumnHeaders } from "./ColumnHeaders";
import { VerseRow } from "./VerseRow";
import { getVerseCount, getVerseKeys, getVerseKeyByIndex } from "@/lib/verseKeysLoader";
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

  // VERSE KEY TRACKING SYSTEM: VirtualBibleTable operates on complete verse key track
  const allVerseKeys = getVerseKeys(); // Complete 31,102 verse key references
  const [anchorVerseIndex, setAnchorVerseIndex] = useState(0); // Current center anchor position
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 40 });
  const [currentStartIndex, setCurrentStartIndex] = useState(0);
  const [currentEndIndex, setCurrentEndIndex] = useState(-1);

  // Calculate total height using the complete verse key track
  const totalHeight = allVerseKeys.length * ROW_HEIGHT;
  


  // User data queries
  const { data: userNotes = [] } = useQuery<UserNote[]>({
    queryKey: ["/api/notes"],
    enabled: !!user,
  });

  const { data: highlights = [] } = useQuery<Highlight[]>({
    queryKey: ["/api/highlights"],
    enabled: !!user,
  });

  // VERSE KEY ANCHOR TRACKING: Center-anchored loading based on verse key positions
  const updateVisibleRows = () => {
    if (!scrollRef.current || !containerRef.current) return;

    const currentScrollTop = scrollRef.current.scrollTop;
    const viewportHeight = containerRef.current.clientHeight;

    // Calculate CENTER verse key index from scroll position
    const centerVerseKeyIndex = Math.floor((currentScrollTop + viewportHeight / 2) / ROW_HEIGHT);
    const clampedCenterIndex = Math.max(0, Math.min(allVerseKeys.length - 1, centerVerseKeyIndex));
    
    // Only render small buffer around viewport for DOM performance
    const renderStart = Math.max(0, Math.floor(currentScrollTop / ROW_HEIGHT) - RENDER_BUFFER);
    const renderEnd = Math.min(allVerseKeys.length - 1, 
      Math.ceil((currentScrollTop + viewportHeight) / ROW_HEIGHT) + RENDER_BUFFER);
    
    // CENTER-ANCHORED LOADING: Trigger when anchor verse changes significantly
    if (Math.abs(clampedCenterIndex - anchorVerseIndex) > 50) {
      const anchorVerseKey = allVerseKeys[clampedCenterIndex];
      console.log(`🎯 Anchor verse changed: ${clampedCenterIndex} (${anchorVerseKey})`);
      setAnchorVerseIndex(clampedCenterIndex);
      
      // DIRECT LOADING: Call loadVerseRange directly from VirtualBibleTable
      if (verses.length > 0) {
        console.log(`🔄 VirtualBibleTable loading center-anchored text around ${clampedCenterIndex}`);
        // This should trigger the loadVerseRange function in useBibleData
        if (onCenterVerseChange) {
          onCenterVerseChange(clampedCenterIndex);
        }
      }
    }

    // Early exit if render range hasn't changed
    if (renderStart === currentStartIndex && renderEnd === currentEndIndex) return;

    setCurrentStartIndex(renderStart);
    setCurrentEndIndex(renderEnd);
    setVisibleRange({ start: renderStart, end: renderEnd });
  };

  // Initialize verse key tracking system
  useEffect(() => {
    // Always initialize with verse key track, not dependent on loaded verses
    setVisibleRange({ start: 0, end: 40 });
    setCurrentStartIndex(0);
    setCurrentEndIndex(40);
    setAnchorVerseIndex(0);
    console.log(`🎯 Initialized verse key tracking: ${allVerseKeys.length} total verse positions`);
  }, [allVerseKeys.length]);

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

  // VERSE KEY TRACK BUILDING: Build verses from verse key positions, not loaded array
  const visibleVerses = Array.from(
    { length: visibleRange.end - visibleRange.start + 1 },
    (_, i) => {
      const verseKeyIndex = visibleRange.start + i;
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
            const actualIndex = visibleRange.start + index;            
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
