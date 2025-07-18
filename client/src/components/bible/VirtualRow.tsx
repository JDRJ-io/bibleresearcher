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
  const { showCrossRefs, showProphecies } = useBibleStore();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Match the column order from ColumnHeaders exactly
  const columnOrder = [
    "Reference", 
    main,
    ...alternates,
    ...(showCrossRefs ? ["Cross References"] : []),
    ...(showProphecies ? ["P", "F", "V"] : [])
  ];

  const handleRowClick = () => {
    if (onExpandVerse) {
      onExpandVerse(verse);
    }
  };

  const renderColumn = (columnKey: string) => {
    const isMain = columnKey === main;
    // Mobile-optimized widths to match attached image
    const width = isMobile ? 
      (columnKey === "Reference" ? "w-16" : 
       columnKey === "Cross References" ? "w-12" : 
       ["P", "F", "V"].includes(columnKey) ? "w-8" : "flex-1") :
      (columnKey === "Reference" ? "w-20" : 
       columnKey === "Cross References" ? "w-60" : 
       ["P", "F", "V"].includes(columnKey) ? "w-20" : "w-80");
    
    if (columnKey === "Reference") {
      return (
        <div key="ref" className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
          <ReferenceCell 
            verse={verse}
            getVerseText={getVerseText}
            mainTranslation={mainTranslation}
            onVerseClick={onVerseClick}
          />
        </div>
      );
    }
    
    if (columnKey === "Cross References") {
      return (
        <div key="cross-references" className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
          <CrossReferencesCell 
            verse={verse}
            getVerseText={getVerseText}
            mainTranslation={mainTranslation}
            onVerseClick={onVerseClick}
          />
        </div>
      );
    }
    
    if (["P", "F", "V"].includes(columnKey)) {
      return (
        <div key={columnKey} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
          <ProphecyCell verse={verse} type={columnKey as "P" | "F" | "V"} />
        </div>
      );
    }
    
    // Translation column
    const bgClass = isMain ? "bg-blue-50 dark:bg-blue-900" : "";
    return (
      <div key={columnKey} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700 ${bgClass}`}>
        <TranslationCell 
          verse={verse}
          translation={columnKey}
          getVerseText={getVerseText}
          isMain={isMain}
        />
      </div>
    );
  };

  return (
    <div 
      className="flex w-full border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bible-verse-row"
      style={{ height: rowHeight }}
      onClick={handleRowClick}
    >
      {columnOrder.map(renderColumn)}
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

