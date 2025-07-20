import React, { useEffect, useMemo, useState } from 'react';
import { BibleVerse } from '../../types/bible';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from '@/store/translationSlice';
import { useEnsureTranslationLoaded } from '@/hooks/useEnsureTranslationLoaded';
import { getVisibleColumns, getColumnWidth, getDataRequirements } from '@/constants/columnLayout';
import { CrossReferencesCell } from './CrossReferencesCell';

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

// CrossReferencesCell is now imported from separate file

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
  const { main, alternates } = useTranslationMaps();
  const { showCrossRefs, showProphecies, showNotes, showDates, columnState } = useBibleStore();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // DEBUG: Check if VirtualRow is being called
  if (verse.reference === "Gen 1:1") {
    console.log('🔥 VirtualRow RENDERING for Gen 1:1');
    console.log('🔥 Store states:', { showCrossRefs, showProphecies, showNotes, showDates });
    console.log('🔥 Translation states:', { main, alternates, activeTranslations });
  }

  // PROPER SLOT ARCHITECTURE matching UI spec and ColumnHeaders exactly
  const slotConfig: Record<number, SlotConfig> = {};
  
  // Slot 0: Reference (always visible)
  slotConfig[0] = { type: 'reference', header: 'Ref', visible: true };
  
  // Slot 1: Notes (default hidden)
  slotConfig[1] = { type: 'notes', header: 'Notes', visible: showNotes };
  
  // Slot 2: Main translation (always visible)
  slotConfig[2] = { type: 'main-translation', header: main, translationCode: main, visible: true };
  
  // Slot 3: Cross References (per UI spec)
  slotConfig[3] = { type: 'cross-refs', header: 'Cross Refs', visible: showCrossRefs };
  
  // Slot 4: Dates (default hidden)
  slotConfig[4] = { type: 'context', header: 'Dates', visible: showDates };
  
  // Slots 5-16: Alternate translations (per UI spec)
  alternates.forEach((translationCode, index) => {
    const slot = 5 + index; // Alternates start at slot 5
    if (slot <= 16) { // Max 12 alternate translations (slots 5-16)
      slotConfig[slot] = { 
        type: 'alt-translation', 
        header: translationCode, 
        translationCode, 
        visible: true 
      };
    }
  });
  
  // Slots 17-19: Prophecy P/F/V (per UI spec)
  slotConfig[17] = { type: 'prophecy-p', header: 'P', visible: showProphecies };
  slotConfig[18] = { type: 'prophecy-f', header: 'F', visible: showProphecies };
  slotConfig[19] = { type: 'prophecy-v', header: 'V', visible: showProphecies };

  // Get visible columns: combine store state with translation state
  // The authoritative source is the slotConfig based on current translation state
  const visibleColumns = Object.entries(slotConfig)
    .map(([slotStr, config]) => ({
      slot: parseInt(slotStr),
      config,
      widthRem: getDefaultWidth(parseInt(slotStr)),
      visible: config?.visible !== false // Show if config exists and not explicitly hidden
    }))
    .filter(col => col.config && col.visible) // Only render valid, visible slots
    .sort((a, b) => a.slot - b.slot);

  // Helper function to get default widths per UI Layout Spec
  function getDefaultWidth(slot: number): number {
    switch (slot) {
      case 0: return 5;   // Reference
      case 1: return 8;   // Notes
      case 2: return 20;  // Main translation
      case 3: return 15;  // Cross References
      case 4: return 6;   // Dates
      case 5: case 6: case 7: case 8: case 9: case 10:
      case 11: case 12: case 13: case 14: case 15: case 16:
        return 18; // Alt translations
      case 17: case 18: case 19: return 5; // Prophecy P/F/V
      default: return 10;
    }
  }

  // Debug logging for first verse
  if (verse.reference === "Gen 1:1") {
    console.log('🔍 VirtualRow Debug - Translation state:', { main, alternates });
    console.log('🔍 VirtualRow Debug - Show states:', { showCrossRefs, showProphecies, showNotes, showDates });
    console.log('🔍 VirtualRow Debug - Visible columns:', visibleColumns.map(c => `slot ${c.slot} (${c.config?.type}: ${c.config?.header})`));
    console.log('🔍 VirtualRow Debug - Verse data:', { verseID: verse.id, reference: verse.reference });
    console.log('🔍 VirtualRow Debug - Main verse text:', getMainVerseText(verse.reference));
    console.log('🔍 VirtualRow Debug - KJV verse text:', getVerseText(verse.reference, 'KJV'));
  }

  const handleDoubleClick = () => {
    if (onExpandVerse) {
      onExpandVerse(verse);
    }
  };

  const renderSlot = (column: any) => {
    const { slot, config, widthRem } = column;
    const isMain = config.translationCode === main;

    // Calculate width based on PROPER UI SPEC slot assignments
    const width = isMobile ? 
      (slot === 0 ? "w-14" :        // Reference (slot 0)
       slot === 1 ? "w-16" :        // Notes (slot 1)
       slot === 2 ? "flex-1" :      // Main translation (slot 2)
       slot === 3 ? "w-20" :        // Cross References (slot 3 per UI spec) - wider for links
       slot === 4 ? "w-12" :        // Dates (slot 4)
       slot >= 5 && slot <= 16 ? "w-20" : // Alt translations (slots 5-16)
       slot >= 17 && slot <= 19 ? "w-8" : // Prophecy P/F/V (slots 17-19 per UI spec)
       "flex-1") :                  // Default
      (slot === 0 ? "w-16" :        // Reference (slot 0)
       slot === 1 ? "w-64" :        // Notes (slot 1) 
       slot === 2 ? "w-80" :        // Main translation (slot 2)
       slot === 3 ? "w-80" :        // Cross References (slot 3 per UI spec) - wider for links
       slot === 4 ? "w-32" :        // Dates (slot 4)
       slot >= 5 && slot <= 16 ? "w-80" : // Alt translations (slots 5-16)
       slot >= 17 && slot <= 19 ? "w-20" : // Prophecy P/F/V (slots 17-19 per UI spec)
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
        // Use the verse.reference format (Gen 1:1) for text lookup, not verse.id
        const verseText = getVerseText(verse.reference, config.translationCode);
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700 ${bgClass}`}>
            <div className="px-2 py-1 text-sm cell-content">
              {verseText || `[${config.translationCode} loading...]`}
            </div>
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
        const type = config.type.split('-')[1].toUpperCase() as "P" | "F" | "V";
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <ProphecySlotCell verse={verse} type={type} />
          </div>
        );

      default:
        return null;
    }
  };

  // Calculate layout logic matching ColumnHeaders
  const estimatedTotalWidth = useMemo(() => {
    let width = 0;
    width += 80; // Reference column ~80px
    width += 320; // Main translation ~320px
    if (showCrossRefs) width += 240; // Cross refs ~240px
    if (showProphecies) width += 180; // P+F+V ~60px each
    width += (alternates.length * 320); // Alt translations ~320px each
    return width;
  }, [showCrossRefs, showProphecies, alternates]);
  
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const shouldCenter = estimatedTotalWidth <= viewportWidth * 0.95;

  // Clean layout without complex splitting

  return (
    <div 
      className="flex w-full border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bible-verse-row"
      style={{ height: rowHeight }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Simple layout - all columns in order */}
      {visibleColumns.map(renderSlot)}
    </div>
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