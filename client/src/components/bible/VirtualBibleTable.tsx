import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { ROW_HEIGHT } from '@/constants/layout';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ColumnHeaders } from "./ColumnHeaders";
import { VirtualRow } from "./VirtualRow";
import { getVerseCount, getVerseKeys, getVerseKeyByIndex } from "@/lib/verseKeysLoader";
import { useAnchorSlice } from "@/hooks/useAnchorSlice";
import { useTranslationMaps } from "@/hooks/useTranslationMaps";
import { useRowData } from "@/hooks/useRowData";
import { useSliceDataLoader } from "@/hooks/useSliceDataLoader";
import { useCrossRefLoader } from "@/hooks/useCrossRefLoader";

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const verseKeys = getVerseKeys(); // loaded once
  const { anchorIndex, slice } = useAnchorSlice(containerRef);
  
  // Mobile touch handling for directional scrolling
  useEffect(() => {
    if (!wrapperRef.current) return;

    let startX = 0, startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > dy * 1.2) {               // X-dominant
        wrapperRef.current!.style.touchAction = "pan-x";
      } else {
        wrapperRef.current!.style.touchAction = "pan-y";
      }
    };

    const onTouchEnd = () => {
      wrapperRef.current!.style.touchAction = "pan-y";
    };

    wrapperRef.current.addEventListener("touchstart", onTouchStart);
    wrapperRef.current.addEventListener("touchmove", onTouchMove);
    wrapperRef.current.addEventListener("touchend", onTouchEnd);
    
    return () => {
      if (wrapperRef.current) {
        wrapperRef.current.removeEventListener("touchstart", onTouchStart);
        wrapperRef.current.removeEventListener("touchmove", onTouchMove);
        wrapperRef.current.removeEventListener("touchend", onTouchEnd);
      }
    };
  }, []);
  
  // NEW: fetch hydrated verses for the current slice
  const { data: rowData } = useRowData(slice.verseIDs, mainTranslation);
  const totalHeight = verseKeys.length * ROW_HEIGHT;
  
  // B-1: Load slice data for cross-references and prophecy
  const { isLoading: isSliceLoading } = useSliceDataLoader(slice.verseIDs);
  
  // B-2: Load cross-references with offset-based approach
  useCrossRefLoader(slice.verseIDs, 'cf1');
  
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
    crossReferences: true,
    prophecyData: {},
    settings: {
      mainTranslation: mainTranslation,
      multiTranslations: preferences.selectedTranslations || [],
      showCrossReferences: true,
      showProphecy: preferences.showProphecy,
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

  return (
    <div ref={wrapperRef} className={`virtual-bible-table bible-table-wrapper ${className}`}>
      <ColumnHeaders 
        selectedTranslations={selectedTranslations}
        showNotes={preferences.showNotes}
        showProphecy={preferences.showProphecy}
        showContext={false}
        scrollLeft={0}
      />
      
      <div ref={containerRef} className="scroll-container overflow-auto" style={{ height: "calc(100vh - 120px)" }} data-testid="bible-table">
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
              const altText = getVerseText(id, translationCode);
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
              getVerseText={getVerseText}
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
  );
};

export default VirtualBibleTable;