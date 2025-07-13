import React, { useEffect } from 'react';
import { BibleVerse } from '../../types/bible';
import { useBibleStore } from '@/providers/BibleDataProvider';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import { useColumnKeys } from '@/store/translationSlice';
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
}

function ReferenceCell({ verse }: CellProps) {
  return (
    <div className="w-20 px-1 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
      {verse.reference}
    </div>
  );
}

// Feature Block B-2: Column Cell Format + B-3: Hover/Click
// Left: compact reference (Book Chap:Verse) in mono-font
// Right: verse text (main translation only)
// Style: 50%/50% split in a flex row; text wraps inside cell with internal scroll when overflow
interface CrossReferencesCellProps extends CellProps {
  onVerseClick?: (verseRef: string) => void;
}

function CrossReferencesCell({ verse, onVerseClick }: CrossReferencesCellProps) {
  const { translationState } = useBibleStore();
  const { getVerseText } = useTranslationMaps();
  const { main } = useTranslationMaps();
  
  return (
    <div className="w-60 px-2 py-1 text-sm border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="overflow-auto h-full max-h-[110px] space-y-1">
        {verse.crossReferences?.slice(0, 3).map((ref, i) => {
          const verseText = getVerseText?.(ref.reference, main) || "Loading...";
          
          return (
            <div 
              key={i} 
              className="flex gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-1"
              title={`${ref.reference}: ${verseText}`}
              onClick={() => onVerseClick?.(ref.reference)}
            >
              {/* B-2: Left: compact reference in mono-font */}
              <div className="w-1/2 font-mono text-xs text-blue-600 dark:text-blue-400 flex-shrink-0">
                {ref.reference}
              </div>
              {/* B-2: Right: verse text (main translation only) */}
              <div className="w-1/2 text-xs text-gray-600 dark:text-gray-400 break-words">
                {verseText}
              </div>
            </div>
          );
        }) || ""}
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
  const { store } = useBibleStore();
  
  // Safe access to prophecies data with null checks
  const prophecies = store?.prophecies || {};
  const verseProphecies = prophecies[verse.id] || {};
  const hasProphecy = verseProphecies[type]?.length > 0;
  const prophecyCount = hasProphecy ? verseProphecies[type].length : 0;
  
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

// Feature Block A-3: Verse Rendering Pipeline
export function VirtualRow({ verseID, rowHeight, verse, columnData, getVerseText, getMainVerseText, activeTranslations, mainTranslation, onVerseClick, onExpandVerse }: VirtualRowProps) {
  const { translationState, getAllActive } = useBibleStore();
  const { main, alternates } = translationState;
  const { getVerseText: getTranslationText } = useTranslationMaps();
  const ensureTranslationLoaded = useEnsureTranslationLoaded();
  
  // 2-A: Replace every map over translationsInUse with useColumnKeys
  const columnKeys = useColumnKeys();
  
  // 2-B Trigger point: VirtualRow (per cell) → useEffect(() => { if (!text) ensureTranslationLoaded(tid) }, [text, tid])
  useEffect(() => {
    columnKeys.forEach(async (translationId) => {
      // Check if translation is loaded in the global cache first
      const translationText = getTranslationText(verse?.id, translationId);
      if (!translationText && !verse?.text[translationId]) {
        try {
          await ensureTranslationLoaded(translationId);
        } catch (error) {
          console.error(`Failed to load translation ${translationId}:`, error);
        }
      }
    });
  }, [columnKeys, verse?.text, verse?.id, getTranslationText, ensureTranslationLoaded]);
  
  // A2: Header & Column Order Rules - Keep columns locked in order
  // Reference | main | ...alternates | Cross | P | F | V
  const columnOrder = ["Reference", ...columnKeys, "Cross", "P", "F", "V"];
  
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
      {columnOrder.map((key: string, index: number) => {
        // Use index + key to ensure unique keys, preventing duplicate key warnings
        const uniqueKey = `${key}-${index}`;
        
        switch (key) {
          case "Reference":
            return <ReferenceCell key={uniqueKey} verse={verse} />;
          case "Cross":
            return <CrossReferencesCell key={uniqueKey} verse={verse} onVerseClick={onVerseClick} />;
          case "P":
            return <ProphecyCell key={uniqueKey} verse={verse} type="P" />;
          case "F":
            return <ProphecyCell key={uniqueKey} verse={verse} type="F" />;
          case "V":
            return <ProphecyCell key={uniqueKey} verse={verse} type="V" />;
          default:
            // A3: VirtualRow.tsx iterates over allActive and pulls text from translation maps
            let text = verse.text[key] || getTranslationText(verse.reference, key);
            const isMainTranslation = key === main;
            

            
            // A3: If translation is not loaded yet, show skeleton shimmer
            if (!text) {
              text = `Loading ${verse.reference}...`;
            }
            
            // A2: When main changes → only header tint changes, not the physical column index (muscle-memory preservation)
            return (
              <TranslationCell 
                key={uniqueKey} 
                text={text} 
                isMain={isMainTranslation} 
              />
            );
        }
      })}
    </div>
  );
}