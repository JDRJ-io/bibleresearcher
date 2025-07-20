import React, { useEffect } from 'react';
import { BibleVerse } from '../../types/bible';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import { useColumnKeys, useTranslationMaps as useTranslationSlice } from '@/store/translationSlice';
import { useEnsureTranslationLoaded } from '@/hooks/useEnsureTranslationLoaded';
import { getVisibleColumns, getColumnWidth, getDataRequirements } from '@/constants/columnLayout';

interface VirtualRowProps {
  verseID: string;
  rowHeight: number;
  verse: BibleVerse;
  columnData: any;
  getVerseText: (verseID: string, translationCode: string) => string | undefined;
  getMainVerseText: (verseID: string) => string | undefined;
  activeTranslations: string[];
  mainTranslation: string;
  onVerseClick?: (verseRef: string) => void;
  onExpandVerse?: (verse: BibleVerse) => void;
}

// Cell Components
interface CellProps {
  verse: BibleVerse;
  getVerseText: (verseID: string, translationCode: string) => string | undefined;
  mainTranslation: string;
  onVerseClick?: (verseRef: string) => void;
}

function ReferenceCell({ verse }: CellProps) {
  return (
    <div className="w-20 px-1 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
      {verse.reference}
    </div>
  );
}

function CrossReferencesCell({ verse, getVerseText, mainTranslation, onVerseClick }: CellProps) {
  const crossRefs = verse.crossReferences || [];

  return (
    <div className="w-full px-2 py-1 text-sm overflow-y-auto" style={{ maxHeight: '120px' }}>
      {crossRefs.length > 0 ? (
        <div className="space-y-1">
          <div className="text-xs text-gray-500 mb-1">
            Cross-refs ({crossRefs.length})
          </div>
          {crossRefs.slice(0, 3).map((ref, index) => {
            const reference = typeof ref === 'string' ? ref : ref.reference;
            const verseText = getVerseText(reference, mainTranslation) ?? "";
            const handleClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              onVerseClick?.(reference);
            };
            return (
              <div key={index} className="text-xs">
                <button
                  onClick={handleClick}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium cursor-pointer underline block"
                >
                  {reference}
                </button>
                {verseText && (
                  <div className="text-gray-600 dark:text-gray-400 mt-0.5 leading-tight">
                    {verseText.length > 60 ? `${verseText.substring(0, 60)}...` : verseText}
                  </div>
                )}
              </div>
            );
          })}
          {crossRefs.length > 3 && (
            <div className="text-xs text-blue-500 cursor-pointer">
              +{crossRefs.length - 3} more
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-400 italic text-xs">No cross-references</div>
      )}
    </div>
  );
}

function MainTranslationCell({ verse, getVerseText, mainTranslation }: CellProps) {
  const verseText = getVerseText(verse.reference, mainTranslation) ?? verse.text?.[mainTranslation] ?? "";

  return (
    <div className="flex-1 px-2 py-1 text-sm overflow-y-auto" style={{ maxHeight: '120px' }}>
      <div className="leading-relaxed verse-text">
        {verseText || "Loading..."}
      </div>
    </div>
  );
}

const VirtualRow: React.FC<VirtualRowProps> = ({
  verseID,
  rowHeight,
  verse,
  columnData,
  getVerseText,
  getMainVerseText,
  activeTranslations,
  mainTranslation,
  onVerseClick,
  onExpandVerse,
}) => {
  const { main, alternates } = useTranslationSlice();
  const { showCrossRefs, showProphecies, columnState } = useBibleStore();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // UI Layout Spec slot-based system (slots 0-19)
  const slotConfig = {
    0: { type: 'reference', header: 'Ref' },
    1: { type: 'notes', header: 'Notes' },
    2: { type: 'main-translation', header: main, translationCode: main },
    3: { type: 'cross-references', header: 'Cross References' },
    4: { type: 'dates', header: 'Date' },
    // Slots 5-16: Alternate translations
    ...Object.fromEntries(alternates.map((alt, i) => [
      5 + i, { type: 'alt-translation', header: alt, translationCode: alt }
    ])),
    17: { type: 'prophecy-p', header: 'P' },
    18: { type: 'prophecy-f', header: 'F' },
    19: { type: 'prophecy-v', header: 'V' }
  };
  
  // Get visible columns from store and sort by slot
  const visibleColumns = columnState.columns
    .filter(col => col.visible)
    .sort((a, b) => a.slot - b.slot)
    .map(col => ({ ...col, config: slotConfig[col.slot] }))
    .filter(col => col.config); // Only render slots that have config

  const handleDoubleClick = () => {
    if (onExpandVerse) {
      onExpandVerse(verse);
    }
  };

  const renderSlot = (column: any) => {
    const { slot, config, widthRem } = column;
    const isMain = config.translationCode === main;
    
    // Calculate width based on slot type and mobile
    const width = isMobile ? 
      (slot === 0 ? "w-16" :        // Reference 
       slot === 3 ? "w-12" :        // Cross References
       slot >= 17 ? "w-8" :         // Prophecy P/F/V
       "flex-1") :                  // Translations
      (slot === 0 ? "w-20" :        // Reference
       slot === 3 ? "w-60" :        // Cross References  
       slot >= 17 ? "w-20" :        // Prophecy P/F/V
       "w-80");                     // Translations
    
    const bgClass = isMain ? "bg-blue-50 dark:bg-blue-900" : "";
    
    switch (config.type) {
      case 'reference':
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <div className="px-1 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
              {verse.reference}
            </div>
          </div>
        );
        
      case 'notes':
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <div className="px-2 py-1 text-sm text-gray-500">
              [Notes placeholder]
            </div>
          </div>
        );
        
      case 'main-translation':
      case 'alt-translation':
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700 ${bgClass}`}>
            <div className="px-2 py-1 text-sm">
              [{config.translationCode} Text]
            </div>
          </div>
        );
        
      case 'cross-references':
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <div className="px-2 py-1 text-sm text-blue-600">
              [Cross Refs]
            </div>
          </div>
        );
        
      case 'dates':
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <div className="px-2 py-1 text-sm text-gray-500">
              [Date placeholder]
            </div>
          </div>
        );
        
      case 'prophecy-p':
      case 'prophecy-f':
      case 'prophecy-v':
        const type = config.type.split('-')[1].toUpperCase() as "P" | "F" | "V";
        const color = type === "P" ? "text-blue-600" : type === "F" ? "text-green-600" : "text-purple-600";
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <div className={`px-1 py-1 text-xs text-center ${color}`}>
              {type}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div 
      className="flex w-full border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bible-verse-row"
      style={{ height: rowHeight }}
      onDoubleClick={handleDoubleClick}
    >
      {visibleColumns.map(renderSlot)}
    </div>
  );
};

export default VirtualRow;
export { VirtualRow };

interface ProphecyCellProps {
  verse: BibleVerse;
  type: "P" | "F" | "V";
}

function ProphecyCell({ verse, type }: ProphecyCellProps) {
  const color = type === "P" ? "text-blue-600" : type === "F" ? "text-green-600" : "text-purple-600";
  const { prophecies } = useBibleStore();

  // Access prophecies data from the store using verse.reference
  const verseProphecies = prophecies[verse.reference] || {};

  // Direct access to P/F/V arrays
  const items = verseProphecies[type] || [];
  const hasProphecy = items.length > 0;
  const prophecyCount = items.length;

  return (
    <div className="w-20 px-1 py-1 text-xs border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className={`${color} text-center`}>
        {hasProphecy && (
          <div className="flex items-center justify-center gap-1">
            <span className={`text-xs ${color} cursor-pointer`} title={`${prophecyCount} ${type} references`}>
              ●
            </span>
            <span className="text-xs text-gray-500">{prophecyCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface TranslationCellProps {
  verse: BibleVerse;
  translation: string;
  getVerseText: (verseID: string, translationCode: string) => string | undefined;
  isMain?: boolean;
}

function TranslationCell({ verse, translation, getVerseText, isMain }: TranslationCellProps) {
  const verseText = getVerseText(verse.reference, translation) ?? verse.text?.[translation] ?? "";
  const bgClass = isMain ? "bg-blue-50 dark:bg-blue-900" : "";
  
  return (
    <div className={`w-80 px-2 py-1 text-sm flex-shrink-0 ${bgClass}`}>
      <div className="overflow-auto h-full verse-text">
        {verseText || "Loading..."}
      </div>
    </div>
  );
}

