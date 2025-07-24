import React, { useEffect, useMemo } from 'react';
import { BibleVerse } from '../../types/bible';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from '@/store/translationSlice';
import { useEnsureTranslationLoaded } from '@/hooks/useEnsureTranslationLoaded';
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';
import { getVisibleColumns, getColumnWidth, getDataRequirements } from '@/constants/columnLayout';
import { useColumnData } from '@/hooks/useColumnData';

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

// Cell Components
interface CellProps {
  verse: BibleVerse;
  getVerseText: (verseID: string, translationCode: string) => string | undefined;
  mainTranslation: string;
  onVerseClick?: (verseRef: string) => void;
}

function ReferenceCell({ verse }: CellProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'cell-ref' : 'w-20 px-1 py-1 text-xs'} font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
      {verse.reference}
    </div>
  );
}

function CrossReferencesCell({ verse, getVerseText, mainTranslation, onVerseClick }: CellProps) {
  const { crossRefs: crossRefsStore } = useBibleStore();
  const { main } = useTranslationMaps(); // Get the current main translation from the store

  // Get cross-references from the Bible store - try both formats
  const dotFormat = verse.reference.replace(/\s/g, '.');
  const spaceFormat = verse.reference.replace(/\./g, ' ');
  const crossRefs = crossRefsStore[dotFormat] || crossRefsStore[spaceFormat] || [];

  const handleCrossRefClick = (ref: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔗 Cross-reference clicked in cell:', ref, 'Handler available:', !!onVerseClick);

    if (onVerseClick) {
      onVerseClick(ref);
    } else {
      console.warn('⚠️ No onVerseClick handler available');
    }
  };

  return (
    <div className="px-2 py-2 cross-ref-container custom-scrollbar h-full overflow-y-auto relative z-10">
      {crossRefs.length > 0 ? (
        <div className="space-y-2">
          {crossRefs.map((ref, i) => {
            // Convert cross-ref to space format for display and lookup
            const displayRef = ref.replace(/\./g, ' ');
            const lookupRef = ref.replace(/\s/g, '.');

            // Get verse text using the current main translation from the translation maps
            let refText = '';
            if (getVerseText && main) {
              // Try the getVerseText function which should use the cached translation data
              refText = getVerseText(displayRef, main) || 
                        getVerseText(lookupRef, main) || 
                        getVerseText(ref, main) || '';
            }

            return (
              <div
                key={i}
                className="cross-ref-item block w-full px-2 py-2 rounded relative"
              >
                <button
                  type="button"
                  className="font-mono text-blue-600 dark:text-blue-400 text-xs font-semibold mb-1 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer transition-colors relative z-20 inline-block"
                  onClick={(e) => handleCrossRefClick(ref, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ pointerEvents: 'auto' }}
                >
                  {displayRef}
                </button>
                <div className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed whitespace-normal break-words">
                  {refText || 'Loading...'}
                </div>
              </div>
            );
          })}
          {crossRefs.length > 0 && (
            <div className="text-center text-xs text-gray-400 mt-2 py-1">
              {crossRefs.length} reference{crossRefs.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      ) : (
        <span className="text-gray-400 italic text-xs">—</span>
      )}
    </div>
  );
}

function ProphecyCell({ verse, type, getVerseText, mainTranslation, onVerseClick }: CellProps & { 
  type: 'P' | 'F' | 'V';
  onProphecyClick?: (prophecyIds: string[], type: 'P' | 'F' | 'V', verseRef: string) => void;
}) {
  const { prophecyData, prophecyIndex } = useBibleStore();

  // Get prophecy roles for this verse from the parsed prophecy_rows.txt data
  const verseRoles = prophecyData[verse.reference] || { P: [], F: [], V: [] };

  // Get all unique prophecy IDs that touch this verse in any role
  const allIds = [...verseRoles.P, ...verseRoles.F, ...verseRoles.V];
  const uniqueIds = Array.from(new Set(allIds));

  // Group prophecy data by ID for rendering (following the documentation mental model)
  const groupedProphecies: Record<number, {
    summary: string;
    P: string[];  // verses where this prophecy appears as Prediction  
    F: string[];  // verses where this prophecy appears as Fulfillment
    V: string[];  // verses where this prophecy appears as Verification
  }> = {};

  uniqueIds.forEach(id => {
    const entry = prophecyIndex[id];
    if (!entry) return; // still loading - show spinner

    groupedProphecies[id] = {
      summary: entry.summary,
      P: verseRoles.P.includes(id) ? [verse.reference] : [],
      F: verseRoles.F.includes(id) ? [verse.reference] : [],
      V: verseRoles.V.includes(id) ? [verse.reference] : []
    };
  });

  // Extract count for this specific column type
  const count = verseRoles[type]?.length || 0;

  return (
    <div className="flex-1 px-2 py-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded overflow-y-auto" style={{ maxHeight: '120px' }}>
      {uniqueIds.length > 0 ? (
        <div className="space-y-1">
          {Object.values(groupedProphecies).map((prophecyBlock, blockIndex) => (
            <div key={blockIndex} className="border-b border-gray-300 dark:border-gray-600 last:border-b-0">
              {/* Summary bar spans across all columns */}
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-center">
                {prophecyBlock.summary}
              </div>

              {/* Content for this specific column type */}
              {prophecyBlock[type].length > 0 && (
                <div className="space-y-0.5">
                  {prophecyBlock[type].map((verseRef, i) => (
                    <button
                      key={i}
                      onClick={() => onVerseClick && onVerseClick(verseRef)}
                      className="block w-full text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 px-1 py-0.5 rounded transition-colors"
                    >
                      <div className="text-blue-600 dark:text-blue-400 font-medium">
                        {verseRef}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 text-xs mt-0.5 leading-tight">
                        {getVerseText(verseRef, mainTranslation)?.substring(0, 80)}...
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-400 text-center">—</div>
      )}
    </div>
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

  if (verse.reference === "Gen.1:1") {
    console.log('🔍 MainTranslationCell DEBUG:', {
      verseReference: verse.reference,
      mainTranslation,
      verseText,
      getVerseTextResult: getVerseText(verse.reference, mainTranslation),
      verseTextFallback: verse.text?.[mainTranslation]
    });
  }

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

export function VirtualRow({
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
  const { main, alternates } = useTranslationMaps();
  const { showCrossRefs, showNotes, showDates, showProphecies, columnState } = useBibleStore();

  // Ensure data loading is triggered when columns are enabled
  useColumnData();
  const isMobile = useIsMobile();
  const screenSize = useScreenSize();

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
  if (columnState?.columns) {
    columnState.columns.forEach(col => {
      switch (col.slot) {
        case 1:
          // Notes column (moved to slot 1 between Ref and Main) - TOGGLEABLE ON MOBILE
          slotConfig[1] = { type: 'notes', header: 'Notes', visible: col.visible && showNotes };
          break;
        case 7:
          // Cross References column (moved from slot 6 to 7) - DEFAULT ON MOBILE
          slotConfig[7] = { type: 'cross-refs', header: 'Cross Refs', visible: col.visible && showCrossRefs };
          break;
        case 8:
          // Prophecy P column (moved from slot 7 to 8) - TOGGLEABLE ON MOBILE
          slotConfig[8] = { type: 'prophecy-p', header: 'P', visible: col.visible && showProphecies };
          break;
        case 9:
          // Prophecy F column (moved from slot 8 to 9) - TOGGLEABLE ON MOBILE
          slotConfig[9] = { type: 'prophecy-f', header: 'F', visible: col.visible && showProphecies };
          break;
        case 10:
          // Prophecy V column (moved from slot 9 to 10) - TOGGLEABLE ON MOBILE
          slotConfig[10] = { type: 'prophecy-v', header: 'V', visible: col.visible && showProphecies };
          break;
        case 11:
          // Dates column (unchanged) - TOGGLEABLE ON MOBILE
          slotConfig[11] = { type: 'context', header: 'Dates', visible: col.visible && showDates };
          break;
      }
    });
  }

  // Dynamically add alternate translation columns to slots 3-6 (shifted due to Notes at slot 1)
  // HIDDEN ON MOBILE for clean dual-column layout
  if (!isMobile) {
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
  }

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
    console.log('🔍 VirtualRow Debug - onVerseClick handler:', !!onVerseClick);
    console.log('🔍 VirtualRow Debug - Main verse text:', getMainVerseText(verse.reference));
    console.log('🔍 VirtualRow Debug - KJV verse text:', getVerseText(verse.reference, 'KJV'));

    // Debug cross-references data
    const { crossRefs } = useBibleStore.getState();
    console.log('🔍 VirtualRow Debug - Cross refs for verse:', crossRefs[verse.reference]);
    console.log('🔍 VirtualRow Debug - All cross refs keys:', Object.keys(crossRefs).slice(0, 10));
  }

  const handleDoubleClick = () => {
    console.log('🔍 VirtualRow handleDoubleClick triggered for verse:', verse.reference);
    console.log('🔍 onExpandVerse handler available:', !!onExpandVerse);
    if (onExpandVerse) {
      console.log('🔍 Calling onExpandVerse with verse:', verse);
      onExpandVerse(verse);
    } else {
      console.warn('⚠️ No onExpandVerse handler provided to VirtualRow');
    }
  };

  const renderSlot = (column: any) => {
    const { slot, config, widthRem } = column;
    const isMain = config.translationCode === main;

    // Calculate responsive width based on slot type and screen size
    const getColumnWidth = (slotNumber: number) => {
      if (screenSize === 'mobile') {
        switch (slotNumber) {
          case 0: return "w-6";         // Reference - THIN (16px)
          case 1: return "w-20";        // Notes - when visible (80px)
          case 2: return "w-52";        // Main translation - (200px) 
          case 7: return "w-52";        // Cross References - SAME as main (200px)
          case 8: case 9: case 10: return "w-16"; // Prophecy P/F/V - minimal (64px)
          default: return "w-40";       // Alt translations - if any (160px)
        }
      } else if (screenSize === 'tablet') {
        switch (slotNumber) {
          case 0: return "w-20";        // Reference
          case 1: return "w-48";        // Notes
          case 2: return "w-64";        // Main translation
          case 7: return "w-64";        // Cross References
          case 8: case 9: case 10: return "w-16"; // Prophecy P/F/V
          default: return "w-64";       // Alt translations
        }
      } else { // desktop
        switch (slotNumber) {
          case 0: return "w-20";        // Reference
          case 1: return "w-64";        // Notes
          case 2: return "w-80";        // Main translation
          case 7: return "w-80";        // Cross References
          case 8: case 9: case 10: return "w-20"; // Prophecy P/F/V
          default: return "w-80";       // Alt translations
        }
      }
    };

    const width = getColumnWidth(slot);

    const bgClass = isMain ? "bg-blue-50 dark:bg-blue-900" : "";

    switch (config.type) {
      case 'reference':
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <div className="px-1 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 cell-content cell-ref">
              <span>{verse.reference}</span>
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

        // Use the working getGlobalVerseText function that accesses cached data
        let verseText = '';
        if (getVerseText) {
          verseText = getVerseText(verse.reference, config.translationCode);
        }
        if (!verseText && getMainVerseText) {
          verseText = getMainVerseText(verse.reference);
        }
        
        // Final fallback to any available verse text
        if (!verseText && verse.text) {
          verseText = verse.text;
        }

        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700 ${bgClass}`}>
            <div className="px-2 py-1 text-sm cell-content">
              {verseText || `[${config.translationCode} loading...]`}
              {verse.reference === "Gen.1:1" && console.log('🔍 DEBUG Gen.1:1 verseText:', verseText, 'from getMainVerseText:', getMainVerseText(verse.reference))}
            </div>
          </div>
        );

      case 'cross-refs':
        console.log('🔍 VirtualRow rendering cross-refs cell, onVerseClick:', !!onVerseClick);
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <CrossReferencesCell 
              verse={verse} 
              getVerseText={getVerseText} 
              mainTranslation={mainTranslation} 
              onVerseClick={onVerseClick} 
            />
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