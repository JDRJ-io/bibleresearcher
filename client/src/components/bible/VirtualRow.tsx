import React, { useEffect, useMemo } from 'react';
import { BibleVerse } from '../../types/bible';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from '@/store/translationSlice';
import { useEnsureTranslationLoaded } from '@/hooks/useEnsureTranslationLoaded';
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';
import { getVisibleColumns, getColumnWidth, getDataRequirements } from '@/constants/columnLayout';
import { useColumnData } from '@/hooks/useColumnData';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
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

  // OPTIMIZATION: verse.reference is now dot format "Gen.1:1" - matches crossRefs store keys
  const crossRefs = crossRefsStore[verse.reference] || [];

  const handleCrossRefClick = (ref: string, e: React.MouseEvent) => {
    console.log('🔗 Cross-reference clicked:', ref, 'Handler:', !!onVerseClick);

    // Only stop propagation to prevent scroll interference, but allow the click to proceed
    e.stopPropagation();

    if (onVerseClick) {
      console.log('🔗 Calling onVerseClick with:', ref);
      onVerseClick(ref);
      console.log('🔗 onVerseClick called successfully');
    } else {
      console.warn('⚠️ No onVerseClick handler available');
    }
  };

  // Debug: Log cross-reference rendering for Gen.1:1
  if (verse.reference === "Gen.1:1") {
    console.log('🔗 RENDER DEBUG Gen.1:1:', {
      crossRefsCount: crossRefs.length,
      firstFew: crossRefs.slice(0, 3),
      hasOnVerseClick: !!onVerseClick
    });
  }

  return (
    <div className="px-2 py-1 text-sm cell-content">
      {crossRefs.length > 0 ? (
        <div className="space-y-0">
          {crossRefs.map((ref, i) => {
            // OPTIMIZATION: Cross-refs now use consistent dot format
            let refText = '';
            if (getVerseText && mainTranslation) {
              refText = getVerseText(ref, mainTranslation) || '';
            }

            return (
              <div key={i} className="cross-ref-item block w-full mb-1">
                <button
                  type="button"
                  className="font-mono text-blue-600 dark:text-blue-400 text-sm font-semibold hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer transition-colors"
                  onClick={(e) => handleCrossRefClick(ref, e)}
                  style={{ minHeight: '24px', minWidth: '60px' }}
                >
                  {ref}
                </button>
                <div className="text-gray-700 dark:text-gray-300 text-sm leading-tight whitespace-normal break-words">
                  {refText || '—'}
                </div>
              </div>
            );
          })}
          {crossRefs.length > 3 && (
            <div className="text-center text-sm text-gray-400">
              {crossRefs.length} references
            </div>
          )}
        </div>
      ) : (
        <span className="text-gray-400 italic text-sm">—</span>
      )}
    </div>
  );
}

function ProphecyCell({ verse, type, getVerseText, mainTranslation, onVerseClick }: CellProps & { 
  type: 'P' | 'F' | 'V';
  onProphecyClick?: (prophecyIds: string[], type: 'P' | 'F' | 'V', verseRef: string) => void;
}) {
  const { prophecyData, prophecyIndex, collapsedProphecies, toggleProphecyCollapse } = useBibleStore();

  // OPTIMIZATION: verse.reference uses dot format - direct lookup
  const verseRoles = prophecyData[verse.reference];

  if (!verseRoles) {
    return (
      <div className="px-2 py-1 text-sm cell-content">
        <div className="text-gray-400 text-center text-sm">—</div>
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
    <div className="px-2 py-1 text-sm cell-content">
      {uniqueProphecyIds.length > 0 ? (
        <div className="space-y-1">
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
              <div key={prophecyId} className="mb-1">
                {/* Compact clickable summary - no box, just text */}
                <button
                  onClick={() => toggleProphecyCollapse(String(prophecyId))}
                  className="w-full text-left text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-0 py-0"
                >
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 mr-1">
                    {prophecyId}.
                  </span>
                  <span className="text-sm leading-tight break-words">
                    {prophecyDetails.summary}
                  </span>
                </button>

                {/* Compact verse list - tight spacing */}
                {!isCollapsed && (
                  <div className="mt-1 space-y-0">
                    {versesToShow.map((verseRef, i) => {
                      // Get the full verse text using the same method as other columns
                      const fullVerseText = getVerseText(verseRef, mainTranslation) || '';

                      return (
                        <button
                          key={i}
                          onClick={() => onVerseClick && onVerseClick(verseRef)}
                          className="block w-full text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 py-0 transition-colors"
                        >
                          <div className="text-blue-600 dark:text-blue-400 font-medium text-sm leading-tight">
                            {verseRef}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 text-sm leading-tight whitespace-normal break-words -mt-0.5">
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
        <div className="text-gray-400 text-center text-sm">—</div>
      )}
    </div>
  );
}

function DatesCell({ verse, getVerseText, mainTranslation, onVerseClick, isMobile }: CellProps & { isMobile?: boolean }) {
  const { datesData } = useBibleStore();

  // Get date for this verse index from loaded dates data
  let dateText = datesData?.[verse.index ?? 0] || "";

  // Remove verse key references (everything before and including #)
  if (dateText && dateText.includes('#')) {
    dateText = dateText.split('#').slice(1).join('#').trim();
  }

  if (!dateText || dateText.trim() === "") {
    return <div className="text-gray-400 text-xs text-center py-1">-</div>;
  }

  // Display text vertically (rotated 90 degrees counterclockwise) to match reference design
  return (
    <div className="flex items-center justify-center h-full w-full">
        <div className="text-xs text-gray-700 dark:text-gray-300 text-center leading-tight whitespace-nowrap"
             style={{ 
               fontSize: '10px',
               lineHeight: '1.2',
               transform: 'rotate(-90deg)',
               transformOrigin: 'center',
               whiteSpace: 'nowrap',
               overflow: 'visible'
             }}>
          {dateText.trim()}
        </div>
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
  const contextBoundaries = store.contextBoundaries;
  const showContext = store.showContext;

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
    // OPTIMIZATION: verse.reference is now in dot format - no conversion needed
    const altRef1 = verse.reference;
    const altRef2 = verse.reference;

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

  // Get context boundary info for this verse
  const contextBoundary = showContext && contextBoundaries ? contextBoundaries.get(verse.reference) : null;
  const isContextStart = contextBoundary && contextBoundary.startVerse === verse.reference;
  const isContextEnd = contextBoundary && contextBoundary.endVerse === verse.reference;

  // Determine border classes based on context boundaries
  let contextClasses = '';
  if (showContext && contextBoundary) {
    const borderColor = 'border-blue-300 dark:border-blue-700';

    // Top border for start of context
    if (isContextStart) {
      contextClasses += ` border-t-2 ${borderColor}`;
    }

    // Bottom border for end of context
    if (isContextEnd) {
      contextClasses += ` border-b-2 ${borderColor}`;
    }

    // Left and right borders for all verses in context
    contextClasses += ` border-l-2 border-r-2 ${borderColor}`;

    // Light background to show context grouping
    contextClasses += ' bg-blue-50/30 dark:bg-blue-900/10';
  }

  return (
    <div className={`px-2 py-1 text-sm leading-tight cell-content ${contextClasses}`}>
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

  // Debug translation store state (only for first verse to avoid spam)
  if (verse.reference === "Gen 1:1") {
    console.log('🔍 VirtualRow translation state:', { mainTranslation, alternates });
  }
  const { showCrossRefs, showNotes, showDates, showProphecies, columnState } = store;

  // Ensure data loading is triggered when columns are enabled
  useColumnData();
  const isMobile = useIsMobile();
  const screenSize = useScreenSize();
  const responsiveConfig = useResponsiveColumns();

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

  // Notes column right after dates (slot 2)
  slotConfig[2] = { type: 'notes', header: 'Notes', visible: showNotes };

  // Main translation after notes (slot 3)
  slotConfig[3] = { type: 'main-translation', header: mainTranslation, translationCode: mainTranslation, visible: true };

  // Dates column right after reference (slot 1)
  slotConfig[1] = { type: 'context', header: 'Dates', visible: showDates };

  // Map all column types based on store state - updated slot assignments
  if (columnState?.columns) {
    columnState.columns.forEach(col => {
      switch (col.slot) {
        case 1:
          // Dates column (moved to slot 1 after Ref)
          slotConfig[1] = { type: 'context', header: 'Dates', visible: col.visible && showDates };
          break;
        case 2:
          // Notes column (moved to slot 2)
          slotConfig[2] = { type: 'notes', header: 'Notes', visible: col.visible && showNotes };
          break;
        case 3:
          // Main translation (moved to slot 3)
          slotConfig[3] = { type: 'main-translation', header: mainTranslation, translationCode: mainTranslation, visible: col.visible };
          break;
        case 7:
          // Cross References column (unchanged)
          slotConfig[7] = { type: 'cross-refs', header: 'Cross Refs', visible: col.visible && showCrossRefs };
          break;
        case 8:
          // Prophecy P column (unchanged)
          slotConfig[8] = { type: 'prophecy-p', header: 'P', visible: col.visible && showProphecies };
          break;
        case 9:
          // Prophecy F column (unchanged)
          slotConfig[9] = { type: 'prophecy-f', header: 'F', visible: col.visible && showProphecies };
          break;
        case 10:
          // Prophecy V column (unchanged)
          slotConfig[10] = { type: 'prophecy-v', header: 'V', visible: col.visible && showProphecies };
          break;
      }
    });
  }

  // Dynamically add alternate translation columns to slots 12-19 (AFTER cross-references)
  // This matches the slot assignment in ColumnHeaders.tsx
  // FILTER OUT main translation to prevent duplication
  alternates
    .filter(translationCode => translationCode !== mainTranslation) // Prevent main translation duplication
    .forEach((translationCode, index) => {
      // All alternate translations start from slot 12 (AFTER cross-references at slot 7)
      const slot = 12 + index;

      if (slot <= 19) { // Max 8 alternate translations total starting from slot 12
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
    const { slot, config } = column;
    const isMain = config.translationCode === mainTranslation;

    // Get responsive pixel width for portrait/landscape modes
    const getResponsiveColumnPixelWidth = (slotNumber: number) => {
      const columnInfo = columnState?.columns?.find((col: any) => col.slot === slotNumber);
      if (!columnInfo) {
        console.warn(`No column info found for slot ${slotNumber}`);
        return '160px'; // fallback
      }

      // Use adaptive CSS variables for portrait mode, fallback to clamp() for landscape
      const isPortrait = window.innerHeight > window.innerWidth;

      if (isPortrait) {
        // Portrait mode - use precision adaptive widths
        if (slotNumber === 0) return 'var(--adaptive-ref-width)'; // Reference column
        if (slotNumber === 3 && config.type === 'main-translation') return 'var(--adaptive-main-width)'; // Main translation
        if (slotNumber === 7 && config.type === 'cross-refs') return 'var(--adaptive-cross-width)'; // Cross references

        // Handle alternate translations and other column types
        if (config.type === 'alt-translation' && slotNumber !== 3) return 'var(--adaptive-alt-width)'; // Alternate translations
        if (config.type === 'prophecy-p' || config.type === 'prophecy-f' || config.type === 'prophecy-v') return 'var(--adaptive-prophecy-width)'; // Prophecy columns
        if (config.type === 'notes') return 'var(--adaptive-notes-width)'; // Notes column
        if (config.type === 'context') return '32px'; // Very compact dates column
      } else {
        // Landscape mode - use expert's clamp() system
        if (slotNumber === 0) return 'var(--w-ref)'; // Reference column
        if (slotNumber === 3 && config.type === 'main-translation') return 'var(--w-main)'; // Main translation
        if (slotNumber === 7 && config.type === 'cross-refs') return 'var(--w-xref)'; // Cross references

        // Handle alternate translations and other column types
        if (config.type === 'alt-translation' && slotNumber !== 3) return 'var(--w-alt)'; // Alternate translations
        if (config.type === 'prophecy-p' || config.type === 'prophecy-f' || config.type === 'prophecy-v') return 'var(--w-prophecy)'; // Prophecy columns
        if (config.type === 'notes') return 'var(--w-alt)'; // Notes use alternate width
        if (config.type === 'context') return '4rem'; // Compact context/dates column
      }

      // Convert rem to pixels for other columns (same as headers - 1rem = 16px)
      const pixelWidth = columnInfo.widthRem * 16;
      return `${pixelWidth}px`;
    };

    // Use inline styles for exact width matching with responsive column width scaling
    const columnStyle = {
      width: `calc(${getResponsiveColumnPixelWidth(slot)} * var(--column-width-mult))`,
      flexShrink: 0
    };

    const bgClass = "";

    switch (config.type) {
      case 'reference':
        return (
          <div key={slot} className="bible-column columnGroup border-r border-gray-200 dark:border-gray-700" style={columnStyle}>
            <div className="px-1 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 cell-content cell-ref">
              <span>{verse.reference}</span>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div key={slot} className="bible-column border-r border-gray-200 dark:border-gray-700" style={columnStyle}>
            <div className="px-2 py-1 text-sm text-gray-500 cell-content flex items-center justify-center h-full">
              <div className="text-gray-400 italic text-center">
                <div className="text-xs">Add note...</div>
              </div>
            </div>
          </div>
        );

      case 'main-translation':
        return (
          <div key={slot} className="bible-column columnGroup border-r border-gray-200 dark:border-gray-700" style={columnStyle}>
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
          <div key={slot} className="bible-column border-r border-gray-200 dark:border-gray-700" style={columnStyle}>
            <div className="px-2 py-1 text-sm cell-content">
              {verseText || `[${config.translationCode} loading...]`}
            </div>
          </div>
        );

      case 'cross-refs':
        return (
          <div key={slot} className="bible-column columnGroup border-r border-gray-200 dark:border-gray-700" style={columnStyle}>
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
          <div key={slot} className="bible-column border-r border-gray-200 dark:border-gray-700" style={columnStyle}>
            <DatesCell verse={verse} getVerseText={getVerseText} mainTranslation={mainTranslation} onVerseClick={onVerseClick} isMobile={isMobile} />
          </div>
        );

      case 'prophecy-p':
      case 'prophecy-f':
      case 'prophecy-v':
        return (
          <div key={slot} className="bible-column border-r border-gray-200 dark:border-gray-700" style={columnStyle}>
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

  // Calculate actual total width from columnState - SAME as ColumnHeaders
  const actualTotalWidth = useMemo(() => {
    if (!columnState?.columns) return 0;

    return visibleColumns.reduce((total, col) => {
      const columnInfo = columnState.columns.find(c => c.slot === col.slot);
      if (columnInfo) {
        // Convert rem to pixels (1rem = 16px)
        return total + (columnInfo.widthRem * 16);
      }
      return total + 160; // fallback width
    }, 0);
  }, [visibleColumns, columnState]);

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const shouldCenter = actualTotalWidth <= viewportWidth * 0.95;
  const needsHorizontalScroll = actualTotalWidth > viewportWidth;

  // FIXED COLUMN WIDTHS - No compression, maintain exact pixel widths
  return (
    <div 
      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bible-verse-row"
      style={{ 
        height: rowHeight,
        width: needsHorizontalScroll ? `${actualTotalWidth}px` : '100%',
        minWidth: `${actualTotalWidth}px`,
        display: 'flex'
      }}
      data-verse-ref={verse.reference}
      onDoubleClick={handleDoubleClick}
    >
      {/* Fixed-width layout - all columns maintain exact widths */}
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