import React, { useEffect, useMemo } from 'react';
import { BibleVerse } from '../../types/bible';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from '@/store/translationSlice';
import { useEnsureTranslationLoaded } from '@/hooks/useEnsureTranslationLoaded';
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';
import { getVisibleColumns, getColumnWidth, getDataRequirements } from '@/constants/columnLayout';
import { useColumnData } from '@/hooks/useColumnData';
import LabeledText from './LabeledText';
import { useLabeledText } from '@/hooks/useLabeledText';
import { useViewportLabels } from '@/hooks/useViewportLabels';

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
  getVerseLabels?: (verseReference: string) => Record<string, string[]>;
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

            // Get verse text using the same method as other columns - use mainTranslation parameter
            let refText = '';
            if (getVerseText && mainTranslation) {
              // Try multiple formats to ensure we get the text from BibleDataAPI cache
              refText = getVerseText(displayRef, mainTranslation) || 
                        getVerseText(lookupRef, mainTranslation) || 
                        getVerseText(ref, mainTranslation) || '';
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
  const [collapsedProphecies, setCollapsedProphecies] = React.useState<Set<string>>(new Set());

  const toggleProphecyCollapse = (prophecyId: string) => {
    setCollapsedProphecies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(prophecyId)) {
        newSet.delete(prophecyId);
      } else {
        newSet.add(prophecyId);
      }
      return newSet;
    });
  };

  // Try multiple formats for verse lookup - match the format used in VirtualRow for cross-refs
  const possibleKeys = [
    verse.reference,
    verse.reference.replace(/\s/g, '.'), // "Gen 1:1" -> "Gen.1:1"
    verse.reference.replace(/\./g, ' '), // "Gen.1:1" -> "Gen 1:1"
  ];

  let verseRoles = null;
  for (const key of possibleKeys) {
    if (prophecyData[key]) {
      verseRoles = prophecyData[key];
      break;
    }
  }

  if (!verseRoles) {
    return (
      <div className="flex-1 px-2 py-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded overflow-y-auto" style={{ maxHeight: '120px' }}>
        <div className="text-gray-400 text-center">—</div>
      </div>
    );
  }

  // Get ALL prophecy IDs that touch this verse in ANY role (P, F, or V)
  const allProphecyIds = [
    ...(verseRoles.P || []),
    ...(verseRoles.F || []),
    ...(verseRoles.V || [])
  ];

  // Remove duplicates
  const uniqueProphecyIds = Array.from(new Set(allProphecyIds));

  return (
    <div className="flex-1 px-2 py-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded overflow-y-auto" style={{ maxHeight: '120px' }}>
      {uniqueProphecyIds.length > 0 ? (
        <div className="space-y-2">
          {uniqueProphecyIds.map((prophecyId) => {
            const prophecyDetails = prophecyIndex[prophecyId];
            if (!prophecyDetails) return null; // still loading

            // For each prophecy that touches this verse, show the verses in this column type
            let versesToShow: string[] = [];
            if (type === 'P') {
              versesToShow = prophecyDetails.prophecy || [];
            } else if (type === 'F') {
              versesToShow = prophecyDetails.fulfillment || [];
            } else if (type === 'V') {
              versesToShow = prophecyDetails.verification || [];
            }

            // Skip if no verses to show in this column for this prophecy
            if (versesToShow.length === 0) return null;

            const isCollapsed = collapsedProphecies.has(String(prophecyId));

            return (
              <div key={prophecyId} className="border-b border-gray-300 dark:border-gray-600 last:border-b-0 pb-2">
                {/* Clickable summary text with collapse indicator */}
                <button
                  onClick={() => toggleProphecyCollapse(String(prophecyId))}
                  className="w-full text-[9px] font-medium text-gray-700 dark:text-gray-300 mb-1 px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-center leading-tight hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors flex items-center justify-center gap-1"
                >
                  <span className="text-[8px]">{isCollapsed ? '▶' : '▼'}</span>
                  <span>{prophecyId}. {prophecyDetails.summary}</span>
                </button>

                {/* Show ALL verses for this prophecy in this column - collapsible */}
                {!isCollapsed && (
                  <div className="space-y-1">
                    {versesToShow.map((verseRef, i) => {
                      // Get the full verse text using the same method as other columns
                      const fullVerseText = getVerseText(verseRef, mainTranslation) || '';

                      return (
                        <button
                          key={i}
                          onClick={() => onVerseClick && onVerseClick(verseRef)}
                          className="block w-full text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 px-1 py-0.5 rounded transition-colors"
                        >
                          <div className="text-blue-600 dark:text-blue-400 font-medium text-[10px] mb-1">
                            {verseRef}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 text-[9px] leading-tight whitespace-normal break-words">
                            {fullVerseText || 'Loading...'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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

// MainTranslationCell component with labels support
function MainTranslationCell({ 
  verse, 
  getVerseText, 
  mainTranslation,
  getVerseLabels 
}: {
  verse: BibleVerse;
  getVerseText: (reference: string, translation: string) => string;
  mainTranslation: string;
  getVerseLabels?: (verseReference: string) => any;
}) {
  const store = useBibleStore();
  const activeLabels = store.activeLabels || [];

  // FIX #4: Debug translation lookup with normalization  
  if (verse.reference === "Gen.4:1") {
    console.log('CELL CHECK', {
      verse: verse.reference,
      mainTranslation,
      normalizedCode: mainTranslation?.toUpperCase(),
      textResult: getVerseText(verse.reference, mainTranslation)?.slice(0,40)
    });
  }

  // Get verse text with proper fallbacks
  const verseText = getVerseText(verse.reference, mainTranslation) || 
                    verse.text?.[mainTranslation] || 
                    verse.text?.text || 
                    '';

  // Get labels for this verse if available
  const verseLabels = getVerseLabels ? getVerseLabels(verse.reference) : {};

  // Use LabeledText if we have active labels (don't require verseLabels yet, let component handle empty data)
  const shouldUseLabeledText = activeLabels && activeLabels.length > 0;

  // Enhanced debug for Gen.1:1
  if (verse.reference === "Gen.1:1" || verse.reference === "Gen 1:1") {
    console.log(`🏷️ MainTranslationCell DEBUG for ${verse.reference}:`, {
      verseLabels,
      activeLabels,
      shouldUseLabeledText,
      hasGetVerseLabels: !!getVerseLabels,
      storeActiveLabels: store?.activeLabels,
      verseText: verseText ? verseText.substring(0, 50) + '...' : 'NO TEXT',
      verseTextLength: verseText?.length || 0
    });

    // Try different reference formats
    const altRef1 = verse.reference.replace('.', ' ');
    const altRef2 = verse.reference.replace(' ', '.');

    if (getVerseLabels) {
      console.log(`🏷️ MainTranslationCell trying alt refs:`, {
        original: verse.reference,
        alt1: altRef1,
        alt2: altRef2,
        labelsAlt1: getVerseLabels(altRef1),
        labelsAlt2: getVerseLabels(altRef2)
      });
    }
  }

  // Handle empty verse text - just return empty instead of loading message
  if (!verseText) {
    return (
      <div className="verse-text p-2 text-sm leading-relaxed text-gray-400">
        —
      </div>
    );
  }

  return (
    <div 
      className="verse-text p-2 text-sm leading-relaxed max-h-24 overflow-y-auto"
      onClick={() => {/* handle verse click if needed */}}
    >
      {shouldUseLabeledText ? (
        <LabeledText
          text={verseText}
          labelData={verseLabels}
          activeLabels={activeLabels}
          verseKey={verse.reference}
          translationCode={mainTranslation}
        />
      ) : (
        verseText
      )}
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
  onVerseClick,
  onExpandVerse,
  onDoubleClick
}: VirtualRowProps) {
  // FIX #1: Use translation store as SINGLE source of truth for mainTranslation
  const store = useBibleStore();
  const { main: mainTranslation, alternates } = useTranslationMaps();
  
  // Debug translation store state
  console.log('🔍 VirtualRow translation state:', { mainTranslation, alternates });
  const { showCrossRefs, showNotes, showDates, showProphecies, columnState } = store;

  // Ensure data loading is triggered when columns are enabled
  useColumnData();
  const isMobile = useIsMobile();
  const screenSize = useScreenSize();

  // Get viewport labels hook at top level - BEFORE any conditionals  
  const activeLabels = store.activeLabels || [];
  const { getVerseLabels } = useViewportLabels({
    verses: [verse], 
    activeLabels: activeLabels, 
    mainTranslation: mainTranslation
  });

  // DEBUG: Check if VirtualRow is being called
  if (verse.reference === "Gen 1:1") {
    console.log('🔥 VirtualRow RENDERING for Gen 1:1');
    console.log('🔥 Store states:', { showCrossRefs, showProphecies, showNotes, showDates });
    console.log('🔥 Translation states:', { mainTranslation, alternates, activeTranslations });
  }

  // Handle double-click to open Strong's overlay
  const handleDoubleClick = () => {
    console.log(`🔍 VirtualRow handleDoubleClick called for ${verse.reference}`);
    console.log(`🔍 onExpandVerse available:`, !!onExpandVerse);
    if (onExpandVerse) {
      console.log(`🔍 Calling onExpandVerse for ${verse.reference}`);
      onExpandVerse(verse);
    } else {
      console.warn(`⚠️ onExpandVerse not available for ${verse.reference}`);
    }
  };

  // Use store's columnState as the authoritative source, enhanced with translation data
  const slotConfig: Record<number, SlotConfig> = {};

  // Always show reference column (slot 0)
  slotConfig[0] = { type: 'reference', header: 'Ref', visible: true };

  // Always show main translation (slot 2 - moved to accommodate Notes at slot 1)
  slotConfig[2] = { type: 'main-translation', header: mainTranslation, translationCode: mainTranslation, visible: true };

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
  let visibleColumns = Object.entries(slotConfig)
    .map(([slotStr, config]) => ({
      slot: parseInt(slotStr),
      config,
      widthRem: getDefaultWidth(parseInt(slotStr)),
      visible: config?.visible !== false // Show if config exists and not explicitly hidden
    }))
    .filter(col => col.config && col.visible); // Only render valid, visible slots

  // Sort by displayOrder from store if available
  if (columnState?.columns) {
    const slotToDisplayOrder = new Map();
    columnState.columns.forEach(col => {
      if (col.visible) {
        slotToDisplayOrder.set(col.slot, col.displayOrder);
      }
    });

    // Add displayOrder to each column and sort
    visibleColumns.forEach((col: any) => {
      col.displayOrder = slotToDisplayOrder.get(col.slot) ?? col.slot;
    });

    visibleColumns.sort((a: any, b: any) => (a.displayOrder ?? a.slot) - (b.displayOrder ?? b.slot));
  } else {
    // Fallback to slot-based sorting
    visibleColumns.sort((a, b) => a.slot - b.slot);
  }

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
    console.log('🔍 VirtualRow Debug - Translation state:', { mainTranslation, alternates });
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



  const renderSlot = (column: any) => {
    const { slot, config, widthRem } = column;
    const isMain = config.translationCode === mainTranslation;

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

    const bgClass = "";

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
        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
            <MainTranslationCell 
              key={`${verse.reference}-${mainTranslation}`}
              verse={verse} 
              getVerseText={getVerseText} 
              mainTranslation={mainTranslation}
              getVerseLabels={getVerseLabels}
            />
          </div>
        );

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

        // Simple fallback to hook functions for alternate translations (no labels)
        let verseText = getVerseText(verse.reference, config.translationCode) || 
                        getMainVerseText(verse.reference);

        return (
          <div key={slot} className={`${width} flex-shrink-0 border-r border-gray-200 dark:border-gray-700 ${bgClass}`}>
            <div className="px-2 py-1 text-sm cell-content">
              {verseText || `[${config.translationCode} loading...]`}
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
        const prophecyWidth = 'w-[200px]'; // Much wider prophecy columns
        return (
          <div key={slot} className={`${prophecyWidth} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
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
    if (showProphecies) width += 600; // P+F+V ~200px each
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

  return (
    <div className="w-80 px-2 py-1 text-sm flex-shrink-0">
      <div className="overflow-auto h-full verse-text">
        {verseText || "Loading..."}
      </div>
    </div>
  );
}