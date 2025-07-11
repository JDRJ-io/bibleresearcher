import React, { useEffect } from 'react';
import { BibleVerse } from '../../types/bible';
import { useBibleStore } from '@/providers/BibleDataProvider';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import { useColumnKeys } from '@/store/translationSlice';
import { useEnsureTranslationLoaded } from '@/hooks/useEnsureTranslationLoaded';
import { useCrossReferenceLoader } from '@/hooks/useCrossReferenceLoader';
import { useProphecyLoader } from '@/hooks/useProphecyLoader';

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
  const { translationState, getVerseText } = useBibleStore();
  const { crossReferences } = useCrossReferenceLoader();
  
  // Get cross-references for this verse
  const verseCrossRefs = crossReferences.get(verse.reference.replace(' ', '.')) || [];
  
  return (
    <div className="w-60 px-2 py-1 text-sm border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="overflow-auto h-full max-h-[110px] space-y-1">
        {verseCrossRefs.slice(0, 3).map((ref, i) => {
          const verseText = getVerseText?.(ref.reference, translationState.main) || "Loading...";
          
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
                {verseText.substring(0, 50)}...
              </div>
            </div>
          );
        })}
        {verseCrossRefs.length === 0 && (
          <div className="text-xs text-gray-400 italic">No cross-references</div>
        )}
      </div>
    </div>
  );
}

interface ProphecyCellProps {
  verse: BibleVerse;
  type: "P" | "F" | "V";
}

function ProphecyCell({ verse, type }: ProphecyCellProps) {
  const { prophecyData } = useProphecyLoader();
  const color = type === "P" ? "text-blue-600" : type === "F" ? "text-green-600" : "text-purple-600";
  
  // Get prophecy data for this verse and type
  const verseProphecy = prophecyData.get(verse.reference.replace(' ', '.'));
  const prophecyItems = verseProphecy?.[type] || [];
  
  return (
    <div className="w-20 px-1 py-1 text-xs border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className={`${color} text-center`}>
        {prophecyItems.length > 0 ? (
          <div className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 rounded p-1">
            <span className="font-semibold">{prophecyItems.length}</span>
            <div className="text-xs opacity-75">
              {prophecyItems.slice(0, 2).map((item, i) => (
                <div key={i} className="truncate">
                  ID: {item.id}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
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
  const { toggleTranslation } = useTranslationMaps();
  const ensureTranslationLoaded = useEnsureTranslationLoaded();
  
  // 2-A: Replace every map over translationsInUse with useColumnKeys
  const columnKeys = useColumnKeys();
  
  // 4. Ensure verses load lazily for any newly-visible column
  // Load translations in order: main first, then alternates
  useEffect(() => {
    const loadMissingTranslations = async () => {
      // Load main first
      if (main && !verse?.text[main]) {
        try {
          await ensureTranslationLoaded(main);
        } catch (error) {
          console.warn(`Failed to load main translation ${main}:`, error);
        }
      }
      
      // Then load alternates
      for (const translationId of alternates) {
        if (!verse?.text[translationId]) {
          try {
            await ensureTranslationLoaded(translationId);
          } catch (error) {
            console.warn(`Failed to load alternate translation ${translationId}:`, error);
          }
        }
      }
    };
    
    loadMissingTranslations();
  }, [main, alternates, verse?.text, ensureTranslationLoaded]);
  
  // A2: Header & Column Order Rules - Keep columns locked in order
  // Reference | Cross | P | F | V | main | ...alternates
  const columnOrder = ["Reference", "Cross", "P", "F", "V", ...columnKeys];
  
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
            // A3: VirtualRow.tsx iterates over allActive and pulls text from useBibleStore().translations[tid].get(index)
            let text = verse.text[key];
            const isMainTranslation = key === main;
            
            // A3: If translation is not loaded yet, show skeleton shimmer
            if (!text) {
              text = `Loading ${verse.reference}...`;
              // Translation loading is handled by the useEffect hook above
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