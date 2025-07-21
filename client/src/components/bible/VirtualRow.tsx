
import React, { useEffect, useMemo, useState } from 'react';
import { BibleVerse } from '../../types/bible';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import { CrossReferencesCell } from './CrossReferencesCell';
import { ProphecyCell } from './ProphecyColumns';

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
  // Ensure verse.reference is valid before rendering
  const reference = verse?.reference || 'Loading...';
  
  return (
    <div className="w-20 px-1 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
      {reference}
    </div>
  );
}

// CrossReferencesCell is now imported from separate file

function MainTranslationCell({ verse, getVerseText, mainTranslation }: CellProps) {
  const verseText = getVerseText(verse.reference, mainTranslation) ?? verse.text?.[mainTranslation] ?? "";

  // Text retrieval for main translation

  return (
    <div className="flex-1 px-2 py-1 text-sm overflow-y-auto" style={{ maxHeight: '120px' }}>
      <div className="leading-relaxed verse-text">
        {verseText || `[${mainTranslation} loading...]`}
      </div>
    </div>
  );
}

interface SlotConfig {
  type: string;
  header: string;
  translationCode?: string;
  visible: boolean;
}

const VirtualRow: React.FC<VirtualRowProps> = React.memo(({
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
  // 🚨 TEMPORARY DEBUGGING: Catch the 'split' error at the source
  try {
    console.log('🔍 VirtualRow DEBUG:', {
      verseID: typeof verseID,
      verseIDValue: verseID,
      verse: verse ? {
        reference: typeof verse.reference,
        referenceValue: verse.reference,
        text: typeof verse.text
      } : 'VERSE IS NULL/UNDEFINED',
      mainTranslation: typeof mainTranslation,
      mainTranslationValue: mainTranslation
    });

    // Check if anything that might call .split() is undefined
    if (verseID && typeof verseID !== 'string') {
      console.error('🚨 DEBUG: verseID is not a string!', verseID);
    }
    if (verse?.reference && typeof verse.reference !== 'string') {
      console.error('🚨 DEBUG: verse.reference is not a string!', verse.reference);
    }
    if (mainTranslation && typeof mainTranslation !== 'string') {
      console.error('🚨 DEBUG: mainTranslation is not a string!', mainTranslation);
    }

    const translationMaps = useTranslationMaps();
    const store = useBibleStore();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Safety checks for store and translation data
    if (!store || !translationMaps) {
      console.warn('⚠️ VirtualRow: Store or translation maps not available');
      return (
        <div className="w-full border-b border-gray-200 dark:border-gray-700 flex items-center justify-center" style={{ height: rowHeight }}>
          <div className="text-gray-500">Loading row...</div>
        </div>
      );
    }

  const { main = 'KJV', alternates = [] } = translationMaps;
  const { 
    showCrossRefs = true, 
    showProphecies = false, 
    showNotes = false, 
    showDates = false, 
    columnState 
  } = store;

  // Safety check for verse data
  if (!verse || !verse.reference) {
    console.warn('⚠️ VirtualRow: Invalid verse data');
    return (
      <div className="w-full border-b border-gray-200 dark:border-gray-700 flex items-center justify-center" style={{ height: rowHeight }}>
        <div className="text-gray-500">Invalid verse data</div>
      </div>
    );
  }

  // Clean rendering without excessive debug logs

  // PROPER SLOT ARCHITECTURE matching UI spec and ColumnHeaders exactly
  const slotConfig: Record<number, SlotConfig> = {};
  
  // Slot 0: Reference (always visible)
  slotConfig[0] = { type: 'reference', header: 'Ref', visible: true };
  
  // Slot 1: Main translation (always visible) - moved to slot 1 for proper center loading
  slotConfig[1] = { type: 'main-translation', header: main, translationCode: main, visible: true };
  
  // Slot 2: Cross References (center column when enabled)
  slotConfig[2] = { type: 'cross-refs', header: 'Cross Refs', visible: showCrossRefs };
  
  // Slots 3-14: Alternate translations (load to the right first, then left)
  alternates.forEach((translationCode, index) => {
    const slot = 3 + index; // Alternates start at slot 3
    if (slot <= 14) { // Max 12 alternate translations (slots 3-14)
      slotConfig[slot] = { 
        type: 'alt-translation', 
        header: translationCode, 
        translationCode, 
        visible: true 
      };
    }
  });
  
  // Slots 15-17: Prophecy P/F/V (rightmost columns)
  slotConfig[15] = { type: 'prophecy-p', header: 'P', visible: showProphecies };
  slotConfig[16] = { type: 'prophecy-f', header: 'F', visible: showProphecies };
  slotConfig[17] = { type: 'prophecy-v', header: 'V', visible: showProphecies };
  
  // Slot 18: Notes (rightmost)
  slotConfig[18] = { type: 'notes', header: 'Notes', visible: showNotes };
  
  // Slot 19: Context/Dates (rightmost)
  slotConfig[19] = { type: 'context', header: 'Dates', visible: showDates };

  // Get visible columns: combine store state with translation state
  // The authoritative source is the slotConfig based on current translation state
  const visibleColumns = Object.entries(slotConfig)
    .filter(([_, cfg]) => cfg && cfg.visible !== false)   // Keep only real configs
    .map(([slotStr, cfg]) => ({ 
      slot: parseInt(slotStr), 
      config: cfg, 
      widthRem: getDefaultWidth(parseInt(slotStr)) 
    }))
    .sort((a, b) => a.slot - b.slot);

  // Helper function to get default widths per UI Layout Spec
  function getDefaultWidth(slot: number): number {
    switch (slot) {
      case 0: return 5;   // Reference
      case 1: return 20;  // Main translation (center position)
      case 2: return 15;  // Cross References
      case 3: case 4: case 5: case 6: case 7: case 8:
      case 9: case 10: case 11: case 12: case 13: case 14:
        return 18; // Alt translations
      case 15: case 16: case 17: return 5; // Prophecy P/F/V
      case 18: return 16; // Notes
      case 19: return 8;  // Dates
      default: return 10;
    }
  }

  // Simplified logging for critical issues only

  const handleDoubleClick = () => {
    if (onExpandVerse) {
      onExpandVerse(verse);
    }
  };

  const renderSlot = (column: any) => {
    const { slot, config, widthRem } = column;

    // ⬇️ add this line to freeze execution and inspect config values
    debugger;

    const isMain = config.translationCode === main;

    // Calculate width based on slot system matching ColumnHeaders
    const width = isMobile ? 
      (slot === 0 ? "w-14" :        // Reference (slot 0)
       slot === 1 ? "flex-1" :      // Main translation (slot 1) - takes remaining space
       slot === 2 ? "w-12" :        // Cross References (slot 2)
       slot >= 3 && slot <= 14 ? "w-20" : // Alt translations (slots 3-14)
       slot >= 15 && slot <= 17 ? "w-8" : // Prophecy P/F/V (slots 15-17)
       slot === 18 ? "w-16" :       // Notes (slot 18)
       slot === 19 ? "w-12" :       // Dates (slot 19)
       "flex-1") :                  // Default
      (slot === 0 ? "w-16" :        // Reference (slot 0)
       slot === 1 ? "w-80" :        // Main translation (slot 1)
       slot === 2 ? "w-60" :        // Cross References (slot 2)
       slot >= 3 && slot <= 14 ? "w-80" : // Alt translations (slots 3-14)
       slot >= 15 && slot <= 17 ? "w-20" : // Prophecy P/F/V (slots 15-17)
       slot === 18 ? "w-64" :       // Notes (slot 18)
       slot === 19 ? "w-32" :       // Dates (slot 19)
       "w-80");                     // Default

    const bgClass = isMain ? "bg-blue-50 dark:bg-blue-900" : "";

    switch (config.type) {
      case 'reference':
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <div className="px-1 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 cell-content">
              {verse.reference}
            </div>
          </div>
        );

      case 'notes':
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <div className="px-2 py-1 text-sm text-gray-500 cell-content">
              [Notes placeholder]
            </div>
          </div>
        );

      case 'main-translation':
      case 'alt-translation':
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700 ${bgClass}`}>
            <TranslationCell 
              verse={verse}
              translation={config.translationCode}
              getVerseText={getVerseText}
              isMain={isMain}
            />
          </div>
        );

      case 'cross-refs':
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <CrossReferencesCell 
              verseReference={verse.reference}
              onNavigateToVerse={onVerseClick}
            />
          </div>
        );

      case 'context':
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <div className="px-2 py-1 text-sm text-gray-500 cell-content">
              [Date placeholder]
            </div>
          </div>
        );

      case 'prophecy-p':
      case 'prophecy-f':
      case 'prophecy-v':
        let type: "P" | "F" | "V" | undefined;
        if (config?.type?.startsWith('prophecy-')) {
          type = config.type.split('-')[1].toUpperCase() as "P" | "F" | "V";
        } else {
          console.warn('VirtualRow: unexpected config.type', config);
          return null;         // skip this slot gracefully
        }
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <ProphecyCell 
              verseReference={verse.reference}
              type={type}
              onNavigateToVerse={onVerseClick}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Center-then-left loading behavior: calculate if content fits in viewport
  const estimatedTotalWidth = useMemo(() => {
    let width = 0;
    width += 80; // Reference column ~80px
    width += 320; // Main translation ~320px
    if (showCrossRefs) width += 240; // Cross refs ~240px
    if (showProphecies) width += 180; // P+F+V ~60px each
    width += (alternates.length * 320); // Alt translations ~320px each
    if (showNotes) width += 256; // Notes ~256px
    if (showDates) width += 128; // Dates ~128px
    return width;
  }, [showCrossRefs, showProphecies, alternates, showNotes, showDates]);
  
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const shouldCenter = estimatedTotalWidth <= viewportWidth * 0.9;

  // Apply center-then-left loading: center content when it fits, left-align when it overflows

  return (
    <div 
      className="w-full border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bible-verse-row"
      style={{ height: rowHeight }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Center-then-left loading wrapper */}
      <div 
        className={`flex h-full ${shouldCenter ? 'justify-center' : 'justify-start'}`}
        style={{ 
          minWidth: shouldCenter ? 'auto' : `${estimatedTotalWidth}px`,
          width: shouldCenter ? '100%' : 'max-content'
        }}
      >
        {visibleColumns.map(renderSlot)}
      </div>
    </div>
  );
  } catch (error) {
    console.error('🚨 VirtualRow CRASH DEBUG:', {
      error: error.message,
      stack: error.stack,
      verseID,
      verse,
      mainTranslation,
      translationMaps,
      store
    });
    return (
      <div className="w-full border-b border-red-200 bg-red-50 flex items-center justify-center" style={{ height: rowHeight }}>
        <div className="text-red-600 text-xs">ERROR: {error.message}</div>
      </div>
    );
  }
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders unless verse data actually changes
  return (
    prevProps.verseID === nextProps.verseID &&
    prevProps.rowHeight === nextProps.rowHeight &&
    prevProps.verse.reference === nextProps.verse.reference &&
    prevProps.mainTranslation === nextProps.mainTranslation &&
    JSON.stringify(prevProps.activeTranslations) === JSON.stringify(nextProps.activeTranslations)
  );
});

export default VirtualRow;
export { VirtualRow };

interface ProphecySlotCellProps {
  verse: BibleVerse;
  type: "P" | "F" | "V";
}

function ProphecySlotCell({ verse, type }: ProphecySlotCellProps) {
  const color = type === "P" ? "text-blue-600" : type === "F" ? "text-green-600" : "text-purple-600";
  const [prophecyCount, setProphecyCount] = useState<number>(0);
  
  useEffect(() => {
    (async () => {
      try {
        const { getProphecyForVerse, ensureProphecyLoaded } = await import('@/lib/prophecyCache');
        await ensureProphecyLoaded();
        const data = getProphecyForVerse(verse.reference);
        setProphecyCount(data[type]?.length || 0);
      } catch (error) {
        console.warn(`Failed to load prophecy data for ${verse.reference}:`, error);
        setProphecyCount(0);
      }
    })();
  }, [verse.reference, type]);
  
  const displayContent = prophecyCount > 0 ? prophecyCount.toString() : '';
  
  return (
    <div className="px-1 py-1 text-xs text-center cell-content" title={prophecyCount > 0 ? `${prophecyCount} ${type === "P" ? "Prediction" : type === "F" ? "Fulfillment" : "Verification"} references` : ''}>
      <span className={color}>{displayContent}</span>
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
  // Add safety checks to prevent errors
  if (!verse || !translation) {
    return (
      <div className="px-2 py-1 text-sm cell-content">
        <div className="overflow-auto h-full verse-text">Loading...</div>
      </div>
    );
  }

  // Try to get text from the verse object first, then fall back to getVerseText
  const verseText = verse.text?.[translation] || 
                    getVerseText?.(verse.reference, translation) || 
                    `Sample ${translation} text for ${verse.reference}`;
  const bgClass = isMain ? "bg-blue-50 dark:bg-blue-900" : "";

  return (
    <div className={`px-2 py-1 text-sm cell-content ${bgClass}`}>
      <div className="overflow-auto h-full verse-text">
        {verseText}
      </div>
    </div>
  );
}
