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
  verses,
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
  const verseKeys = getVerseKeys(); // loaded once
  const { anchorIndex, slice } = useAnchorSlice(containerRef);
  const totalHeight = verseKeys.length * ROW_HEIGHT;
  
  // 3-B. Preserve scroll position during slice swaps
  useEffect(() => {
    if (onCenterVerseChange && anchorIndex !== centerVerseIndex) {
      onCenterVerseChange(anchorIndex);
      console.log(`📍 VIEWPORT CENTER CHANGED: ${centerVerseIndex} → ${anchorIndex} (${getVerseKeyByIndex(anchorIndex)})`);
    }
  }, [anchorIndex, centerVerseIndex, onCenterVerseChange]);

  // 2-A. Initial scroll position setup (without direct scrollTop assignment)
  const INITIAL_ANCHOR_INDEX = 5; // Gen 1:6
  useEffect(() => {
    if (containerRef.current && onPreserveAnchor) {
      // Use the provided scroll preservation callback instead of direct assignment
      onPreserveAnchor(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = INITIAL_ANCHOR_INDEX * ROW_HEIGHT;
        }
      });
    }
  }, [onPreserveAnchor]); // run once when callback is available

  // 3-B. Preserve scroll position during slice swaps - SMOOTH FIX: apply only the delta, not an absolute reset
  const prevStart = useRef(slice.start);
  const prevScroll = useRef(0);
  
  // 2-C. Stop rubber-band by clamping scroll compensation
  const MAX_COMPENSATION_ROWS = 150; // < 1 screen height
  
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !onPreserveAnchor) return;
    
    // Maintain centre row after slice swap
    // container.scrollTop = newAnchor * ROW_HEIGHT + DIFF_FROM_ROW_HEIGHT;
    
    // DELETE the assignment (guard it behind one-time callback such as onPreserveAnchor() that runs only after column toggles)
    // After you remove them, the browser's native inertial scrolling will take over and the slingshot effect disappears.
    
    // Save latest for next pass
    prevStart.current = slice.start;
  }, [slice.start, anchorIndex, onPreserveAnchor]);

  // Get verse data for current chunk
  const getVerseData = useCallback((verseId: string) => {
    return verses.find(v => v.reference === verseId) || verses.find(v => v.id === verseId);
  }, [verses]);

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
    onVerseClick: onNavigateToVerse,
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
  const rowDataSize = typeof slice.data.get === 'function' ? slice.data.size : Object.keys(slice.data).length;
  console.log(`📊 CHUNK DATA: start=${slice.start}, end=${slice.end}, verseIDs=${slice.verseIDs.length}, rowData keys=${rowDataSize}`);

  return (
    <div className={`virtual-bible-table ${className}`}>
      <ColumnHeaders 
        selectedTranslations={selectedTranslations}
        showNotes={preferences.showNotes}
        showProphecy={preferences.showProphecy}
        showContext={false}
        scrollLeft={0}
      />
      
      <div ref={containerRef} className="scroll-container overflow-auto" style={{ height: "calc(100vh - 120px)" }}>
        <div style={{height: slice.start * ROW_HEIGHT}} />
        {slice.verseIDs.map((verseKey, index) => {
          // Create a basic verse object from the verse key
          const parts = verseKey.split('.');
          const book = parts[0];
          const chapterVerse = parts[1].split(':');
          const chapter = parseInt(chapterVerse[0]);
          const verse = parseInt(chapterVerse[1]);
          
          const verseObj = {
            id: `${book.toLowerCase()}-${chapter}-${verse}-${slice.start + index}`,
            index: slice.start + index,
            book,
            chapter,
            verse,
            reference: verseKey,
            text: {},
            crossReferences: [],
            strongsWords: [],
            labels: [],
            contextGroup: "standard" as const
          };
          
          return (
            <VirtualRow 
              key={verseObj.id} 
              verseID={verseKey} 
              rowHeight={ROW_HEIGHT}
              verse={verseObj} 
              columnData={columnData}
              getVerseText={getVerseText}
              getMainVerseText={getMainVerseText}
              activeTranslations={activeTranslations}
              mainTranslation={translationMainTranslation}
            />
          );
        })}
        <div style={{height: (verseKeys.length - slice.end) * ROW_HEIGHT}} />
      </div>
    </div>
  );
};

export default VirtualBibleTable;