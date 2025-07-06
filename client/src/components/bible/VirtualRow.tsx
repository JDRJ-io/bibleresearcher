import React from 'react';
import { BibleVerse } from '../../types/bible';
import { getBibleDataStore } from '@/lib/bibleDataStore';

interface VirtualRowProps {
  verseID: string;
  rowHeight: number;
  verse: BibleVerse;
  columnData: any;
  getVerseText: (verseID: string, translationCode: string) => string | undefined;
  getMainVerseText: (verseID: string) => string | undefined;
  activeTranslations: string[];
  mainTranslation: string;
}

// Cell Components
interface CellProps {
  verse: BibleVerse;
}

function ReferenceCell({ verse }: CellProps) {
  return (
    <div className="w-20 px-1 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
      {verse.reference}
    </div>
  );
}

function CrossReferencesCell({ verse }: CellProps) {
  return (
    <div className="w-60 px-2 py-1 text-sm border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="overflow-auto h-full">
        {verse.crossReferences?.slice(0, 3).map((ref, i) => (
          <span key={i} className="text-blue-600 dark:text-blue-400 mr-2">{ref.reference}</span>
        )) || ""}
      </div>
    </div>
  );
}

interface ProphecyCellProps {
  verse: BibleVerse;
  type: "P" | "F" | "V";
}

function ProphecyCell({ verse, type }: ProphecyCellProps) {
  const color = type === "P" ? "text-blue-600" : type === "F" ? "text-green-600" : "text-purple-600";
  return (
    <div className="w-20 px-1 py-1 text-xs border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className={`${color} text-center`}>
        {/* Add prophecy counts/indicators here */}
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

// Step 4.3-b. VirtualRow
export function VirtualRow({ verseID, rowHeight, verse, columnData, getVerseText, getMainVerseText, activeTranslations, mainTranslation }: VirtualRowProps) {
  const { headerOrder, mainTranslation: dataStoreMain, translationMaps } = getBibleDataStore();
  
  // Guard against undefined verse data
  if (!verse) {
    return (
      <div 
        className="virtual-row border-b border-gray-200 dark:border-gray-700 flex"
        style={{ height: rowHeight }}
        data-verse-id={verseID}
      >
        <div className="w-20 px-1 py-1 text-xs">Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className="virtual-row border-b border-gray-200 dark:border-gray-700 flex"
      style={{ height: rowHeight }}
      data-verse-id={verseID}
      data-verse-index={verse.index}
    >
      {headerOrder.map((key: string) => {
        switch (key) {
          case "Reference":
            return <ReferenceCell key="ref" verse={verse} />;
          case "Cross":
            return <CrossReferencesCell key="cross" verse={verse} />;
          case "P":
            return <ProphecyCell key="P" verse={verse} type="P" />;
          case "F":
            return <ProphecyCell key="F" verse={verse} type="F" />;
          case "V":
            return <ProphecyCell key="V" verse={verse} type="V" />;
          default:
            // Translation code
            const text = translationMaps.get(key)?.get(verseID) || `Loading ${verse.reference}...`;
            return <TranslationCell key={key} text={text} isMain={key === dataStoreMain} />;
        }
      })}
    </div>
  );
}