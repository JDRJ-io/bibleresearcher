import React, { useEffect, useMemo, useState } from 'react';
import { BibleVerse } from '../../types/bible';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from '@/store/translationSlice';
import { useLayoutStore, ColumnId, COL_WIDTH } from '@/store/useLayoutStore';
import { NotesCell } from '@/components/user/NotesCell';
import { BookmarkButton } from '@/components/user/BookmarkButton';
import LabeledText from './LabeledText';
import { useLabeledText } from '@/hooks/useLabeledText';
import { useViewportLabels } from '@/hooks/useViewportLabels';

import { PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VirtualRowProps {
  verseID: string;
  verse: BibleVerse;
  rowHeight: number;
  columnData: any;
  getVerseText: (verseID: string, translationCode: string) => string;
  getMainVerseText: (verseID: string) => string;
  activeTranslations: string[];
  mainTranslation: string;
  onVerseClick: (ref: string) => void;
  onExpandVerse?: (verse: BibleVerse) => void;
  onDoubleClick?: () => void;
}

export function VirtualRowWithLayout({
  verseID,
  verse,
  rowHeight,
  columnData,
  getVerseText,
  getMainVerseText,
  activeTranslations,
  mainTranslation,
  onVerseClick,
  onExpandVerse,
  onDoubleClick
}: VirtualRowProps) {
  const { mode, visible, openPanel } = useLayoutStore();
  const { crossRefs, prophecyData, datesData, showDates, showNotes, showCrossRefs, showProphecies, activeLabels } = useBibleStore();
  const { alternates } = useTranslationMaps();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Get visible columns based on mode
  const visibleColumns = visible(windowWidth);
  
  // Get viewport labels for the current verse
  const { getVerseLabels } = useViewportLabels({
    verses: [verse],
    activeLabels: activeLabels || [],
    mainTranslation: mainTranslation
  });
  
  // Helper to render cell based on column ID
  const renderCell = (columnId: ColumnId) => {
    const width = COL_WIDTH[columnId];
    const cellStyle = {
      width: `${width}px`,
      minWidth: `${width}px`,
      flexShrink: 0
    };
    
    switch (columnId) {
      case 'ref':
        return (
          <div key="ref" className="px-1 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" style={cellStyle}>
            {verse.reference}
          </div>
        );
        
      case 'dates':
        if (!showDates || !datesData) return null;
        const verseIndex = Object.keys(getMainVerseText).indexOf(verseID);
        const dateInfo = datesData[verseIndex];
        return (
          <div key="dates" className="px-2 py-1 text-sm text-gray-600 dark:text-gray-400 border-r" style={cellStyle}>
            {dateInfo || '—'}
          </div>
        );
        
      case 'notes':
        if (!showNotes) return null;
        return (
          <div key="notes" className="border-r" style={cellStyle}>
            <NotesCell verseRef={verseID} />
          </div>
        );
        
      case 'main':
        const mainText = getMainVerseText(verseID);
        return (
          <div key="main" className="px-2 py-1 text-sm border-r" style={cellStyle}>
            <LabeledText
              text={mainText}
              labelData={getVerseLabels(verse.reference)}
              activeLabels={activeLabels || []}
              verseKey={verse.reference}
              translationCode={mainTranslation}
            />
          </div>
        );
        
      case 'crossRefs':
        if (!showCrossRefs) return null;
        const crossReferences = crossRefs[verse.reference] || [];
        return (
          <div key="crossRefs" className="px-2 py-1 text-sm border-r" style={cellStyle}>
            {crossReferences.length > 0 ? (
              <div className="space-y-1">
                {crossReferences.slice(0, 3).map((ref, i) => (
                  <button
                    key={i}
                    className="block text-blue-600 dark:text-blue-400 text-sm hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVerseClick(ref);
                    }}
                  >
                    {ref}
                  </button>
                ))}
                {crossReferences.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{crossReferences.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-400 italic">—</span>
            )}
          </div>
        );
        
      case 'prediction':
      case 'verification':
      case 'fulfillment':
        if (!showProphecies) return null;
        const prophecyInfo = prophecyData[verse.reference];
        const typeKey = columnId === 'prediction' ? 'P' : columnId === 'fulfillment' ? 'F' : 'V';
        const count = prophecyInfo?.[typeKey]?.length || 0;
        return (
          <div key={columnId} className="px-2 py-1 text-center text-sm border-r" style={cellStyle}>
            {count > 0 ? (
              <span className="font-medium text-blue-600 dark:text-blue-400">{count}</span>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        );
        
      default:
        // Handle alternate translations
        if (columnId.startsWith('alt-')) {
          const altIndex = parseInt(columnId.split('-')[1]) - 1;
          const altCode = alternates[altIndex];
          if (!altCode) return null;
          
          const altText = getVerseText(verseID, altCode);
          return (
            <div key={columnId} className="px-2 py-1 text-sm border-r" style={cellStyle}>
              <LabeledText
                text={altText || ''}
                labelData={getVerseLabels(verse.reference)}
                activeLabels={activeLabels || []}
                verseKey={verse.reference}
                translationCode={altCode}
              />
            </div>
          );
        }
        return null;
    }
  };
  
  // Handle row click in context-lens mode
  const handleRowClick = () => {
    if (mode === 'context-lens') {
      openPanel(verse.reference);
    }
  };
  
  return (
    <div 
      className="flex border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      style={{ height: `${rowHeight}px` }}
      onClick={handleRowClick}
    >
      {visibleColumns.map(columnId => renderCell(columnId))}
      
      {/* Context lens button */}
      {mode === 'context-lens' && (
        <div className="ml-auto px-2 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              openPanel(verse.reference);
            }}
          >
            <PanelRightOpen className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}