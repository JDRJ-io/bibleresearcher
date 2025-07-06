import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ColumnHeaders } from "./ColumnHeaders";
import { VirtualRow } from "./VirtualRow";
import { getVerseCount, getVerseKeys, getVerseKeyByIndex } from "@/lib/verseKeysLoader";
import { useAnchorScroll } from "@/hooks/useAnchorScroll";
import { useChunk } from "@/hooks/useChunk";
import { useRowData } from "@/hooks/useRowData";
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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // PURE ANCHOR-CENTERED IMPLEMENTATION: Exact specification compliance
  const containerRef = useRef<HTMLDivElement>(null);
  const verseKeys = getVerseKeys(); // loaded once
  const anchorInfo = useAnchorScroll(containerRef); // {anchorIndex}
  const chunk = useChunk(verseKeys, anchorInfo.anchorIndex, 250);
  const rowData = useRowData(chunk.verseIDs, verses);
  
  const ROWHEIGHT = 120;
  const totalHeight = verseKeys.length * ROWHEIGHT;
  
  // Update center verse when anchor changes
  useEffect(() => {
    if (onCenterVerseChange && anchorInfo.anchorIndex !== centerVerseIndex) {
      onCenterVerseChange(anchorInfo.anchorIndex);
      console.log(`📍 VIEWPORT CENTER CHANGED: ${centerVerseIndex} → ${anchorInfo.anchorIndex} (${getVerseKeyByIndex(anchorInfo.anchorIndex)})`);
    }
  }, [anchorInfo.anchorIndex, centerVerseIndex, onCenterVerseChange]);

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

  console.log(`🎯 VirtualBibleTable anchor-centered render: ${anchorInfo.anchorIndex} (${getVerseKeyByIndex(anchorInfo.anchorIndex)})`);
  console.log(`📊 CHUNK DATA: start=${chunk.start}, end=${chunk.end}, verseIDs=${chunk.verseIDs.length}, rowData keys=${Object.keys(rowData).length}`);

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
        <div style={{height: chunk.start * ROWHEIGHT}} />
        {chunk.verseIDs.map(id => {
          const verse = rowData[id];
          return (
            <VirtualRow 
              key={id} 
              verseID={id} 
              rowHeight={ROWHEIGHT}
              verse={verse} 
              columnData={columnData} 
            />
          );
        })}
        <div style={{height: (verseKeys.length - chunk.end) * ROWHEIGHT}} />
      </div>
    </div>
  );
};

export default VirtualBibleTable;