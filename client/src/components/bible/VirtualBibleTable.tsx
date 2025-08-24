import React, { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { ROW_HEIGHT } from '@/constants/layout';
import { useIsMobile } from "@/hooks/use-mobile";
import { BibleGrid } from "./BibleGrid";
import { ColumnContent } from "./ColumnContent";
import { useColumnConfiguration } from '@/hooks/useColumnConfiguration';
import { useColumnData } from '@/hooks/useColumnData';
import { useAdaptivePortraitColumns } from '@/hooks/useAdaptivePortraitColumns';
import { useMeasureVisibleColumns } from '@/hooks/useMeasureVisibleColumns';
import { useReferenceColumnWidth } from '@/hooks/useReferenceColumnWidth';
import { useAnchorSlice } from "@/hooks/useAnchorSlice";
import { useTranslationMaps } from "@/hooks/useTranslationMaps";
import { useRowData } from "@/hooks/useRowData";
import { useSliceDataLoader } from "@/hooks/useSliceDataLoader";
import { useCrossRefLoader } from "@/hooks/useCrossRefLoader";
import { useBibleStore } from "@/App";
import { useBibleData } from "@/hooks/useBibleData";
import { getVerseKeys } from "@/lib/verseKeysLoader";

import type {
  BibleVerse,
  Translation,
  AppPreferences,
} from "@/types/bible";
import { useViewportLabels } from "@/hooks/useViewportLabels";

export interface VirtualBibleTableHandle {
  scrollToVerse: (ref: string) => void;
  get node(): HTMLDivElement | null;
  getCurrentVerse: () => { reference: string; index: number };
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
  onCurrentVerseChange?: (verseInfo: { reference: string; index: number }) => void;
}

const VirtualBibleTable = forwardRef<VirtualBibleTableHandle, VirtualBibleTableProps>((props, ref) => {
  const {
    selectedTranslations,
    preferences,
    mainTranslation,
    className = "",
    onExpandVerse,
    onVerseClick,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const isMobile = useIsMobile();

  // Get verse text retrieval function
  const { getVerseText: getBibleVerseText } = useBibleData();
  
  // Translation maps system
  const translationMaps = useTranslationMaps();
  const { activeTranslations } = translationMaps;
  
  // Get reactive verse keys from store
  const { currentVerseKeys } = useBibleStore();
  const verseKeys = Array.isArray(currentVerseKeys) && currentVerseKeys.length > 0 
    ? currentVerseKeys 
    : Array.isArray(getVerseKeys()) 
      ? getVerseKeys() 
      : [];
  
  // Get anchor slice for virtualization
  const { anchorIndex, slice } = useAnchorSlice(containerRef, verseKeys);
  
  // Get row data for the slice  
  const rowDataResult = useRowData(slice.verseIDs, activeTranslations);
  const rowData = rowDataResult.data;
  
  // Load slice data for cross-references and prophecy
  const { isLoading: isSliceLoading } = useSliceDataLoader(slice.verseIDs, mainTranslation);
  
  // Load cross-references  
  useCrossRefLoader(slice.verseIDs, 'cf1');
  
  // Load column-specific data when columns are toggled
  useColumnData();
  
  // Measure visible columns
  useMeasureVisibleColumns(containerRef.current);
  
  // Monitor reference column width for rotation
  useReferenceColumnWidth();

  // Get column configuration
  const { columns } = useColumnConfiguration();

  // Column reorder handler
  const handleColumnReorder = (activeId: string, overId: string) => {
    console.log('Column reorder:', activeId, 'to', overId);
  };

  // Convert verse slice to verse objects for rendering
  const sliceVerses = useMemo(() => {
    return slice.verseIDs.map((verseID, i) => {
      const parts = verseID.split('.');
      const book = parts[0];
      const chapterVerse = parts[1].split(':');
      const chapter = parseInt(chapterVerse[0]);
      const verse = parseInt(chapterVerse[1]);

      // Build text object for all active translations
      const textObj: Record<string, string> = {};
      const mainText = getBibleVerseText(verseID, mainTranslation);
      if (mainText) {
        textObj[mainTranslation] = mainText;
      }

      activeTranslations.forEach(translationCode => {
        if (translationCode !== mainTranslation) {
          const altText = getBibleVerseText(verseID, translationCode);
          if (altText) {
            textObj[translationCode] = altText;
          }
        }
      });

      return {
        id: `${book.toLowerCase()}-${chapter}-${verse}-${slice.start + i}`,
        index: slice.start + i,
        book,
        chapter,
        verse,
        reference: verseID,
        text: textObj,
        crossReferences: [],
        strongsWords: [],
        labels: [],
        contextGroup: "standard" as const
      } as BibleVerse;
    });
  }, [slice.verseIDs, slice.start, getBibleVerseText, mainTranslation, activeTranslations]);

  // Create column content
  const columnContent = useMemo(() => {
    const content: Record<string, React.ReactNode> = {};
    
    columns.forEach(column => {
      content[column.id] = (
        <ColumnContent
          column={column}
          verses={sliceVerses}
          rowHeight={ROW_HEIGHT}
          getVerseText={(verseID: string, translationCode: string) => getBibleVerseText(verseID, translationCode) || ''}
          getMainVerseText={(verseID: string) => getBibleVerseText(verseID, mainTranslation) || ''}
          activeTranslations={activeTranslations}
          mainTranslation={mainTranslation}
          onVerseClick={onVerseClick}
        />
      );
    });
    
    return content;
  }, [columns, sliceVerses, getBibleVerseText, activeTranslations, mainTranslation, onVerseClick]);

  // Scroll handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      setScrollLeft(target.scrollLeft);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // Imperative handle for scrolling
  useImperativeHandle(ref, () => ({
    scrollToVerse: (verseRef: string) => {
      // Implement scrolling to verse
      console.log('Scroll to verse:', verseRef);
    },
    getCurrentVerse: () => {
      // Return current verse info
      return { reference: "Gen.1:1", index: 0 };
    },
    get node() {
      return containerRef.current;
    },
  }));

  return (
    <div className={`virtual-bible-table ${className}`}>
      <div 
        className="tableY"
        ref={containerRef}
        style={{
          height: '100vh',
          width: '100%',
          overflowY: 'auto',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <BibleGrid
          columns={columns}
          onColumnReorder={handleColumnReorder}
          children={columnContent}
          className="bible-table-grid"
        />
      </div>
    </div>
  );
});

VirtualBibleTable.displayName = 'VirtualBibleTable';

export default VirtualBibleTable;
export { VirtualBibleTable };