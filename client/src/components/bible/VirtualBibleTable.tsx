/**
 * Expert's Two-Mode Bible Table Implementation
 * Clean implementation using the production-ready orientation system
 */

import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { ROW_HEIGHT } from '@/constants/layout';
import { ColumnWidths } from '@/constants/columnWidths';
import { BibleTableShell } from './BibleTableShell';
import { ColumnHeaders } from "./ColumnHeaders";
import { VirtualRow } from "./VirtualRow";
import { useAnchorSlice } from "@/hooks/useAnchorSlice";
import { useBibleData } from "@/hooks/useBibleData";
import { useBibleStore } from "@/App";
import { useColumnData } from '@/hooks/useColumnData';
import { getVerseKeys } from "@/lib/verseKeysLoader";

import type {
  BibleVerse,
  Translation,
  AppPreferences,
} from "@/types/bible";

export interface VirtualBibleTableHandle {
  scrollToVerse: (ref: string) => void;
  get node(): HTMLDivElement | null;
}

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
  onVerseClick?: (ref: string) => void;
}

const VirtualBibleTable = forwardRef<VirtualBibleTableHandle, VirtualBibleTableProps>((props, ref) => {
  const {
    selectedTranslations,
    preferences,
    mainTranslation,
    className = "",
    onExpandVerse,
    onNavigateToVerse,
    onVerseClick,
  } = props;

  // Bible data and store hooks
  const { getVerseText: getBibleVerseText } = useBibleData();
  const { showCrossRefs, showProphecies } = useBibleStore();
  
  // Anchor slice system for virtual scrolling
  const containerRef = useRef<HTMLDivElement>(null);
  const { slice, anchorIndex } = useAnchorSlice(containerRef);
  
  // Column system
  const columnData = useColumnData({
    showNotes: preferences?.showNotes || false,
    showProphecy: showProphecies,
    showCrossRefs: showCrossRefs,
    showContext: false,
    onVerseClick,
    selectedTranslations,
    preferences: preferences || {}
  });

  // Get verse keys for virtual scrolling
  const verseKeys = getVerseKeys();
  const [scrollLeft, setScrollLeft] = useState(0);

  // Handle table shell scroll ref callback
  const handleTableShellRef = useCallback((ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      containerRef.current = ref.current;
    }
  }, []);

  // Expose scroll methods to parent
  useImperativeHandle(ref, () => ({
    scrollToVerse: (verseRef: string) => {
      // Implementation for scrolling to verse
      console.log(`Scrolling to verse: ${verseRef}`);
    },
    get node() {
      return containerRef.current;
    }
  }), []);

  console.log(`🎯 VirtualBibleTable anchor-centered render: ${anchorIndex} verses ${slice.start}-${slice.end}`);

  return (
    <div className={`virtual-bible-table ${className}`}>
      <ColumnHeaders 
        selectedTranslations={selectedTranslations}
        showNotes={preferences?.showNotes || false}
        showProphecy={showProphecies}
        showCrossRefs={showCrossRefs}
        showContext={false}
        scrollLeft={scrollLeft}
        preferences={preferences || {}}
        isGuest={true}
      />

      {/* Expert's Two-Mode Bible Table Shell */}
      <div style={{ height: "calc(100vh - 85px)" }} data-testid="bible-table">
        <BibleTableShell onScrollRef={handleTableShellRef}>
          
          {/* Reference Column */}
          <div className={ColumnWidths.ref}>
            <div style={{height: slice.start * ROW_HEIGHT}} />
            {slice.verseIDs.map((id, i) => (
              <div key={`ref-${id}`} 
                   style={{ 
                     height: ROW_HEIGHT, 
                     fontSize: '14px', 
                     padding: '8px 4px',
                     borderBottom: '1px solid #e5e7eb',
                     display: 'flex',
                     alignItems: 'center'
                   }}>
                {id}
              </div>
            ))}
            <div style={{height: (verseKeys.length - slice.end) * ROW_HEIGHT}} />
          </div>

          {/* Main Translation Column */}
          <div className={ColumnWidths.main}>
            <div style={{height: slice.start * ROW_HEIGHT}} />
            {slice.verseIDs.map((id, i) => {
              // Convert ID to BibleVerse structure
              const parts = id.split('.');
              const book = parts[0];
              const chapterVerse = parts[1].split(':');
              const chapter = parseInt(chapterVerse[0]);
              const verse = parseInt(chapterVerse[1]);

              // Get verse text for main translation
              const mainText = getBibleVerseText(id, mainTranslation);
              const textObj: Record<string, string> = {};
              if (mainText) {
                textObj[mainTranslation] = mainText;
              }

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
                  getVerseText={(verseId: string, translation: string) => getBibleVerseText(verseId, translation)}
                  getMainVerseText={(verseId: string) => getBibleVerseText(verseId, mainTranslation)}
                  activeTranslations={[mainTranslation]}
                  mainTranslation={mainTranslation}
                  onVerseClick={onVerseClick}
                  onExpandVerse={onExpandVerse}
                />
              );
            })}
            <div style={{height: (verseKeys.length - slice.end) * ROW_HEIGHT}} />
          </div>

          {/* Cross-Reference Column */}
          {showCrossRefs && (
            <div className={ColumnWidths.xref}>
              <div style={{height: slice.start * ROW_HEIGHT}} />
              {slice.verseIDs.map((id, i) => (
                <div key={`xref-${id}`} 
                     style={{ 
                       height: ROW_HEIGHT, 
                       fontSize: '12px', 
                       padding: '8px 4px',
                       borderBottom: '1px solid #e5e7eb',
                       display: 'flex',
                       alignItems: 'center'
                     }}>
                  Cross-refs for {id}
                </div>
              ))}
              <div style={{height: (verseKeys.length - slice.end) * ROW_HEIGHT}} />
            </div>
          )}

        </BibleTableShell>
      </div>
    </div>
  );
});

VirtualBibleTable.displayName = 'VirtualBibleTable';

export default VirtualBibleTable;
export { VirtualBibleTable };