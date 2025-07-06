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

// Minimal working version to fix hook errors
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
  console.log("🎯 VirtualBibleTable rendering with minimal hooks");
  
  // Simplified version without problematic hooks
  const containerRef = useRef<HTMLDivElement>(null);
  const ROWHEIGHT = 120;
  
  // Show first 250 verses for now
  const displayVerses = verses.slice(0, 250);
  const totalHeight = verses.length * ROWHEIGHT;
  
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
        <div style={{ height: totalHeight }}>
          {displayVerses.map((verse, index) => (
            <div 
              key={verse.id} 
              className="verse-row"
              style={{ 
                position: 'absolute', 
                top: index * ROWHEIGHT,
                left: 0,
                right: 0,
                height: ROWHEIGHT,
                borderBottom: '1px solid #e0e0e0',
                padding: '8px'
              }}
            >
              <div className="verse-cell">
                <strong>{verse.reference}</strong>: {verse.text?.KJV || 'Loading...'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualBibleTable;