import React, { useEffect } from 'react';
import { BibleVerse } from '../../types/bible';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import { useColumnKeys, useTranslationMaps as useTranslationSlice } from '@/store/translationSlice';
import { useEnsureTranslationLoaded } from '@/hooks/useEnsureTranslationLoaded';

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
          {crossRefs.map((ref, index) => {
            const reference = typeof ref === 'string' ? ref : ref.reference;
            const verseText = getVerseText(reference, mainTranslation) ?? "";
            const handleClick = (e: React.MouseEvent) => {
              e.stopPropagation();         // ← this line prevents row handler
              onVerseClick?.(reference);
            };
            return (
              <div key={index} className="text-xs">
                <button
                  onClick={handleClick}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium cursor-pointer underline"
                >
                  {reference}
                </button>
                {verseText && (
                  <div className="text-gray-600 dark:text-gray-400 mt-0.5 leading-tight">
                    {verseText.length > 100 ? `${verseText.substring(0, 100)}...` : verseText}
                  </div>
                )}
              </div>
            );
          })}
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
      <div className="leading-relaxed">
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
  const handleRowClick = () => {
    if (onExpandVerse) {
      onExpandVerse(verse);
    }
  };

  return (
    <div 
      className="flex w-full border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      style={{ height: rowHeight }}
      onClick={handleRowClick}
    >
      {/* Reference Column */}
      <ReferenceCell 
        verse={verse}
        getVerseText={getVerseText}
        mainTranslation={mainTranslation}
        onVerseClick={onVerseClick}
      />

      {/* Main Translation Column */}
      <div className="col-main">
        <MainTranslationCell 
          verse={verse}
          getVerseText={getVerseText}
          mainTranslation={mainTranslation}
          onVerseClick={onVerseClick}
        />
      </div>

      {/* Cross References Column */}
      <div className="col-cross border-l border-gray-200 dark:border-gray-700">
        <CrossReferencesCell 
          verse={verse}
          getVerseText={getVerseText}
          mainTranslation={mainTranslation}
          onVerseClick={onVerseClick}
        />
      </div>
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
  text: string;
  isMain?: boolean;
}

function TranslationCell({ text, isMain }: TranslationCellProps) {
  const bgClass = isMain ? "bg-blue-50 dark:bg-blue-900" : "";
  return (
    <div className={`w-80 px-2 py-1 text-sm border-r border-gray-200 dark:border-gray-700 flex-shrink-0 ${bgClass}`}>
      <div className="overflow-auto h-full">
        {text}
      </div>
    </div>
  );
}

