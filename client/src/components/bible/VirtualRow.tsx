import React, { useEffect, useMemo } from 'react';
import { BibleVerse } from '../../types/bible';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from '@/store/translationSlice';
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
  onProphecyClick?: (prophecyIds: string[], type: 'P' | 'F' | 'V', verseRef: string) => void;
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
  const { crossRefs: crossRefsStore } = useBibleStore();
  
  // Get cross-references from the Bible store (loaded from Supabase)
  const crossRefs = crossRefsStore[verse.reference] ?? [];
  
  // TODO: Load cross-references on demand when not in store
  // This will be implemented as part of the BibleDataAPI integration



  return (
    <div className="cell-cross flex flex-col gap-1 overflow-y-auto custom-scrollbar">
      {crossRefs.map((ref, index) => {
        const txt = getVerseText(ref, mainTranslation) ?? "(loading…)";
        return (
          <button
            key={ref}
            className="flex text-xs gap-1 hover:bg-gray-50 dark:hover:bg-gray-700 px-1 py-0.5 rounded"
            onClick={(e) => {
              e.stopPropagation();
              onVerseClick?.(ref);
            }}
          >
            <span className="font-mono w-14 text-blue-600 dark:text-blue-400 truncate">
              {ref}
            </span>
            <span className="flex-1 text-gray-600 dark:text-gray-400 truncate">
              {txt}
            </span>
          </button>
        );
      })}
      {crossRefs.length === 0 && (
        <div className="text-gray-400 italic text-xs">No cross-references</div>
      )}
    </div>
  );
}

function ProphecyCell({ verse, type, getVerseText, mainTranslation, onVerseClick }: CellProps & { 
  type: 'P' | 'F' | 'V';
  onProphecyClick?: (prophecyIds: string[], type: 'P' | 'F' | 'V', verseRef: string) => void;
}) {
  const { prophecyData } = useBibleStore();
  
  // Get prophecy data from store (loaded from Supabase)  
  const verseData = prophecyData[verse.reference] ?? { P: [], F: [], V: [] };
  const count = verseData[type]?.length ?? 0;

  if (count === 0) {
    return <div className="text-gray-400 text-xs text-center py-1">-</div>;
  }

  return (
    <button
      className="w-full h-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        const onProphecyClick = (e.currentTarget as any).onProphecyClick;
        if (onProphecyClick) {
          onProphecyClick(verseData[type], type, verse.reference);
        } else {
          console.log(`📖 Opening prophecy ${type} details for ${verse.reference}:`, verseData[type]);
        }
      }}
      title={`${count} ${type === 'P' ? 'Predictions' : type === 'F' ? 'Fulfillments' : 'Verifications'}`}
    >
      {count}
    </button>
  );
}

function DatesCell({ verse, getVerseText, mainTranslation, onVerseClick }: CellProps) {
  const { datesData } = useBibleStore();
  
  // Get date for this verse index from loaded dates data
  const dateText = datesData?.[verse.index ?? 0] || "";
  
  if (!dateText || dateText.trim() === "") {
    return <div className="text-gray-400 text-xs text-center py-1">-</div>;
  }

  return (
    <div className="text-xs text-gray-700 dark:text-gray-300 text-center py-1 px-1 whitespace-nowrap overflow-hidden text-ellipsis">
      {dateText.trim()}
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



interface SlotConfig {
  type: string;
  header: string;
  translationCode?: string;
  visible: boolean;
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
  const { main, alternates } = useTranslationMaps();
  const { showCrossRefs, showProphecies, showNotes, showDates, columnState } = useBibleStore();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // DEBUG: Check if VirtualRow is being called
  if (verse.reference === "Gen 1:1") {
    console.log('🔥 VirtualRow RENDERING for Gen 1:1');
    console.log('🔥 Store states:', { showCrossRefs, showProphecies, showNotes, showDates });
    console.log('🔥 Translation states:', { main, alternates, activeTranslations });
  }

  // Use store's columnState as the authoritative source, enhanced with translation data
  const slotConfig: Record<number, SlotConfig> = {};

  // Always show reference column (slot 0)
  slotConfig[0] = { type: 'reference', header: 'Ref', visible: true };
  
  // Always show main translation (slot 2 - moved to accommodate Notes at slot 1)
  slotConfig[2] = { type: 'main-translation', header: main, translationCode: main, visible: true };

  // Map all column types based on store state - updated slot assignments
  columnState.columns.forEach(col => {
    switch (col.slot) {
      case 1:
        // Notes column (moved to slot 1 between Ref and Main)
        slotConfig[1] = { type: 'notes', header: 'Notes', visible: col.visible && showNotes };
        break;
      case 7:
        // Cross References column (moved from slot 6 to 7)
        slotConfig[7] = { type: 'cross-refs', header: 'Cross Refs', visible: col.visible && showCrossRefs };
        break;
      case 8:
        // Prophecy P column (moved from slot 7 to 8)
        slotConfig[8] = { type: 'prophecy-p', header: 'P', visible: col.visible && showProphecies };
        break;
      case 9:
        // Prophecy F column (moved from slot 8 to 9)
        slotConfig[9] = { type: 'prophecy-f', header: 'F', visible: col.visible && showProphecies };
        break;
      case 10:
        // Prophecy V column (moved from slot 9 to 10)
        slotConfig[10] = { type: 'prophecy-v', header: 'V', visible: col.visible && showProphecies };
        break;
      case 11:
        // Dates column (unchanged)
        slotConfig[11] = { type: 'context', header: 'Dates', visible: col.visible && showDates };
        break;
    }
  });

  // Dynamically add alternate translation columns to slots 3-6 (shifted due to Notes at slot 1)
  alternates.forEach((translationCode, index) => {
    const slot = 3 + index; // Start at slot 3 for alternates (shifted from 2)
    if (slot <= 6) { // Max 4 alternate translations (slots 3-6)
      slotConfig[slot] = { 
        type: 'alt-translation', 
        header: translationCode, 
        translationCode, 
        visible: true  // Show all active alternate translations
      };
    }
  });

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
    
    // Debug cross-references data
    const { crossRefs } = useBibleStore.getState();
    console.log('🔍 VirtualRow Debug - Cross refs for verse:', crossRefs[verse.reference]);
    console.log('🔍 VirtualRow Debug - All cross refs keys:', Object.keys(crossRefs));
  }

  const handleDoubleClick = () => {
    if (onExpandVerse) {
      onExpandVerse(verse);
    }
  };

  const renderSlot = (column: any) => {
    const { slot, config, widthRem } = column;
    const isMain = config.translationCode === main;

    // Calculate width based on slot type and mobile - updated for new slot layout
    const width = isMobile ? 
      (slot === 0 ? "w-14" :        // Reference (narrower)
       slot === 1 ? "w-16" :        // Notes (between Ref and Main)
       slot === 7 ? "w-12" :        // Cross References (moved to slot 7)
       slot >= 8 && slot <= 10 ? "w-8" : // Prophecy P/F/V (slots 8-10)
       "flex-1") :                  // Translations
      (slot === 0 ? "w-16" :        // Reference (narrower)
       slot === 1 ? "w-64" :        // Notes (between Ref and Main) 
       slot === 7 ? "w-60" :        // Cross References (moved to slot 7)
       slot >= 8 && slot <= 10 ? "w-20" : // Prophecy P/F/V (slots 8-10)
       "w-80");                     // Translations

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
        // Debug translation lookup for first verse
        if (verse.reference === "Gen 1:1") {
          console.log('🔍 Translation Debug:', {
            verseRef: verse.reference,
            translationCode: config.translationCode,
            getVerseTextResult: getVerseText(verse.reference, config.translationCode),
            getMainVerseTextResult: getMainVerseText(verse.reference)
          });
        }
        
        // Try multiple lookup formats
        let verseText = getVerseText(verse.reference, config.translationCode) || 
                        getVerseText(verse.reference.replace(' ', '.'), config.translationCode) ||
                        (config.type === 'main-translation' ? getMainVerseText(verse.reference) : null);
        
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700 ${bgClass}`}>
            <div className="px-2 py-1 text-sm cell-content">
              {verseText || `[${config.translationCode} loading...]`}
            </div>
          </div>
        );

      case 'cross-refs':
        // Get cross-references from the store and display them with verse text from main translation
        const { crossRefs } = useBibleStore.getState();
        const crossRefsForVerse = crossRefs[verse.reference] || [];
        
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <div className="px-1 py-1 text-xs overflow-y-auto h-full space-y-1">
              {crossRefsForVerse.length > 0 ? (
                crossRefsForVerse.slice(0, 3).map((ref, i) => {
                  // Use the same translation lookup as the main translation column
                  const refText = getVerseText(ref, mainTranslation) || 
                                  getVerseText(ref.replace(' ', '.'), mainTranslation) ||
                                  getMainVerseText(ref);
                  
                  return (
                    <button
                      key={i}
                      className="flex text-xs gap-1 hover:bg-gray-50 dark:hover:bg-gray-700 px-1 py-0.5 rounded w-full text-left"
                      onClick={() => onVerseClick?.(ref)}
                    >
                      <span className="font-mono text-blue-600 dark:text-blue-400 flex-shrink-0 min-w-0">
                        {ref}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 truncate flex-1 min-w-0">
                        {refText ? refText.substring(0, 50) + (refText.length > 50 ? '...' : '') : 'Loading...'}
                      </span>
                    </button>
                  );
                })
              ) : (
                <span className="text-gray-400 italic">—</span>
              )}
            </div>
          </div>
        );

      case 'context':
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <DatesCell verse={verse} getVerseText={getVerseText} mainTranslation={mainTranslation} onVerseClick={onVerseClick} />
          </div>
        );

      case 'prophecy-p':
      case 'prophecy-f':
      case 'prophecy-v':
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <ProphecyCell 
              verse={verse} 
              type={config.type.split('-')[1].toUpperCase() as "P" | "F" | "V"}
              getVerseText={getVerseText}
              mainTranslation={mainTranslation}
              onVerseClick={onVerseClick}
            />
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
};

export default VirtualRow;
export { VirtualRow };

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