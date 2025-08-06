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
import { classesForMask } from '@/lib/labelRenderer';
import { LabelName } from '@/lib/labelBits';
import { NotesCell } from '@/components/user/NotesCell';
import { VerseText } from '@/components/highlights/VerseText';
import { HoverVerseBar } from './HoverVerseBar';



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
  getVerseLabels?: (verseReference: string) => Record<string, string[]>;
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

function CrossReferencesCell({ verse, getVerseText, mainTranslation, onVerseClick, getVerseLabels }: CellProps) {
  const { crossRefs: crossRefsStore, activeLabels } = useBibleStore();

  // OPTIMIZATION: verse.reference is now dot format "Gen.1:1" - matches crossRefs store keys
  const crossRefs = crossRefsStore[verse.reference] || [];



  const handleCrossRefClick = (ref: string, e: React.MouseEvent | React.TouchEvent) => {
    console.log('🔗 Cross-reference clicked:', ref, 'Handler:', !!onVerseClick);

    // Stop all event propagation to prevent scroll interference
    e.stopPropagation();
    e.preventDefault();

    if (onVerseClick) {
      console.log('🔗 Calling onVerseClick with:', ref);
      onVerseClick(ref);
      console.log('🔗 onVerseClick called successfully');
    } else {
      console.warn('⚠️ No onVerseClick handler available');
    }
  };

  // Helper function to render text with labels using proper LabeledText component
  const renderTextWithLabels = (text: string, reference: string) => {
    if (!text) return '—';
    
    if (!activeLabels || activeLabels.length === 0) {
      return text;
    }

    // Get labels for this cross-reference verse
    const labelData: Partial<Record<LabelName, string[]>> = {};
    if (getVerseLabels) {
      const verseLabels = getVerseLabels(reference);
      activeLabels.forEach((labelName) => {
        if (verseLabels[labelName]) {
          labelData[labelName as LabelName] = verseLabels[labelName];
        }
      });
    }

    // Use the proper LabeledText component
    return (
      <LabeledText
        text={text}
        labelData={labelData}
        activeLabels={activeLabels}
        verseKey={reference}
        translationCode={mainTranslation}
      />
    );
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
    <div className="px-2 py-1 text-sm cell-content cross-ref-cell">
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
                  className="font-mono text-blue-600 dark:text-blue-400 text-sm font-semibold cursor-pointer"
                  onClick={(e) => handleCrossRefClick(ref, e)}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => handleCrossRefClick(ref, e)}
                  style={{ 
                    minHeight: '24px', 
                    minWidth: '60px',
                    touchAction: 'manipulation'
                  }}
                >
                  {ref}
                </button>
                <div className="text-gray-700 dark:text-gray-300 text-sm leading-tight whitespace-normal break-words">
                  {refText ? renderTextWithLabels(refText, ref) : '—'}
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

function ProphecyCell({ verse, type, getVerseText, mainTranslation, onVerseClick, getVerseLabels }: CellProps & { 
  type: 'P' | 'F' | 'V';
  onProphecyClick?: (prophecyIds: string[], type: 'P' | 'F' | 'V', verseRef: string) => void;
}) {
  const { prophecyData, prophecyIndex, collapsedProphecies, toggleProphecyCollapse, activeLabels } = useBibleStore();

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

  // Helper function to render text with labels using proper LabeledText component
  const renderTextWithLabels = (text: string, reference: string) => {
    if (!text) return 'Loading...';
    
    if (!activeLabels || activeLabels.length === 0) {
      return text;
    }

    // Get labels for this prophecy verse
    const labelData: Partial<Record<LabelName, string[]>> = {};
    if (getVerseLabels) {
      const verseLabels = getVerseLabels(reference);
      activeLabels.forEach((labelName) => {
        if (verseLabels[labelName]) {
          labelData[labelName as LabelName] = verseLabels[labelName];
        }
      });
    }

    // Use the proper LabeledText component
    return (
      <LabeledText
        text={text}
        labelData={labelData}
        activeLabels={activeLabels}
        verseKey={reference}
        translationCode={mainTranslation}
      />
    );
  };

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
                  className="w-full text-left text-sm font-medium text-gray-800 dark:text-gray-200 px-0 py-0"
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
                          className="block w-full text-left py-0"
                        >
                          <div className="text-blue-600 dark:text-blue-400 font-medium text-sm leading-tight">
                            {verseRef}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 text-sm leading-tight whitespace-normal break-words -mt-0.5">
                            {fullVerseText ? renderTextWithLabels(fullVerseText, verseRef) : 'Loading...'}
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

  // Responsive text orientation: rotated on mobile, left-to-right on desktop
  const isPortrait = window.innerHeight > window.innerWidth;
  const shouldRotate = isMobile || isPortrait;

  return (
    <div className="flex items-center justify-center h-full w-full">
        <div className="text-xs text-gray-700 dark:text-gray-300 text-center leading-tight"
             style={{ 
               fontSize: '10px',
               lineHeight: '1.2',
               transform: shouldRotate ? 'rotate(-90deg)' : 'none',
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

  const handleCopy = () => {
    const text = `${verse.reference} (${mainTranslation}) - ${verseText}`;
    navigator.clipboard.writeText(text);
  };

  const handleBookmark = () => {
    // Would trigger bookmark creation with the verse reference
    console.log('Bookmark verse:', verse.reference);
  };

  const handleShare = () => {
    const text = `${verse.reference} (${mainTranslation}) - ${verseText}`;
    if (navigator.share) {
      navigator.share({
        title: `${verse.reference} (${mainTranslation})`,
        text: text,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <HoverVerseBar
      verse={verse}
      translation={mainTranslation}
      onCopy={handleCopy}
      onBookmark={handleBookmark}
      onShare={handleShare}
    >
      <div className={`px-2 py-1 text-sm leading-tight cell-content h-full max-h-full ${contextClasses}`}>
        {shouldUseLabeledText ? (
          <span
            data-verse-ref={verse.reference}
            data-translation={mainTranslation}
            className="verse-text"
          >
            <LabeledText
              text={verseText}
              labelData={verseLabels}
              activeLabels={activeLabels}
              verseKey={verse.reference}
              translationCode={mainTranslation}
            />
          </span>
        ) : (
          <span
            data-verse-ref={verse.reference}
            data-translation={mainTranslation}
            className="verse-text h-full"
          >
            <VerseText
              verseRef={verse.reference}
              translation={mainTranslation}
              text={verseText}
            />
          </span>
        )}
      </div>
    </HoverVerseBar>
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
  onDoubleClick,
  getVerseLabels
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

  // Get active labels from store for component logic
  const activeLabels = store.activeLabels || [];

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

  // Build column configuration matching NewColumnHeaders logic exactly
  const buildColumns = () => {
    const cols: Array<{
      id: string;
      type: string;
      header: string;
      translationCode?: string;
      visible: boolean;
    }> = [];

    // 1. Reference column (always visible)
    cols.push({
      id: 'reference',
      type: 'reference',
      header: '#',
      visible: true
    });

    // 2. Dates column (showDates controls the dates column)
    if (showDates) {
      cols.push({
        id: 'dates',
        type: 'context',
        header: '📅',
        visible: true
      });
    }

    // 3. Notes column
    if (showNotes) {
      cols.push({
        id: 'notes',
        type: 'notes',
        header: 'Notes',
        visible: true
      });
    }

    // 4. Main translation (always visible)
    cols.push({
      id: 'main-translation',
      type: 'main-translation',
      header: mainTranslation,
      translationCode: mainTranslation,
      visible: true
    });

    // 5. Cross references (should come before alternate translations)
    if (showCrossRefs) {
      cols.push({
        id: 'cross-refs',
        type: 'cross-refs',
        header: 'Cross Refs',
        visible: true
      });
    }

    // 6. Prophecy columns (should come before alternate translations)
    if (showProphecies) {
      cols.push({
        id: 'prophecy-p',
        type: 'prophecy-p',
        header: 'P',
        visible: true
      });
      cols.push({
        id: 'prophecy-f',
        type: 'prophecy-f',
        header: 'F',
        visible: true
      });
      cols.push({
        id: 'prophecy-v',
        type: 'prophecy-v',
        header: 'V',
        visible: true
      });
    }

    // 7. Alternate translations (filtered to exclude main translation)
    alternates
      .filter(translationCode => translationCode !== mainTranslation)
      .forEach((translationCode) => {
        cols.push({
          id: `alt-${translationCode}`,
          type: 'alt-translation',
          header: translationCode,
          translationCode,
          visible: true
        });
      });

    return cols;
  };

  let allColumns = buildColumns();

  // Apply drag and drop reordering by checking against localColumns state from headers
  // We need to synchronize with the NewColumnHeaders drag state to maintain column order
  const applyDragOrder = (cols: typeof allColumns) => {
    // If there's no reordering happening, just return the natural order
    return cols;
  };

  allColumns = applyDragOrder(allColumns);

  // Apply horizontal navigation filtering - keep reference column always visible
  const { columnOffset, maxVisibleColumns } = useBibleStore();
  const fixedColumnTypes = ['reference']; // Always show reference column
  
  const fixedColumns = allColumns.filter(col => fixedColumnTypes.includes(col.type));
  const navigableColumns = allColumns.filter(col => !fixedColumnTypes.includes(col.type));
  
  // Apply offset to navigable columns
  const offsetNavigableColumns = navigableColumns.slice(columnOffset, columnOffset + maxVisibleColumns - fixedColumns.length);
  
  // Combine fixed columns (always first) with offset navigable columns
  const visibleColumns = [...fixedColumns, ...offsetNavigableColumns];

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
    console.log('🔍 VirtualRow Debug - Visible columns:', visibleColumns.map(c => `${c.id} (${c.type}: ${c.header})`));
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
    const isMain = column.translationCode === mainTranslation;

    // Get responsive pixel width for portrait/landscape modes  
    const getResponsiveColumnPixelWidth = () => {
      // Use adaptive CSS variables for portrait mode, fallback to clamp() for landscape
      const isPortrait = window.innerHeight > window.innerWidth;

      if (isPortrait) {
        // Portrait mode - use adaptive CSS variables (IDENTICAL to ColumnHeaders)
        if (column.type === 'reference') return 'var(--adaptive-ref-width)';
        if (column.type === 'main-translation') return 'var(--adaptive-main-width)';
        if (column.type === 'cross-refs') return 'var(--adaptive-cross-width)';
        if (column.type === 'alt-translation') return 'var(--adaptive-alt-width)';
        if (column.type === 'prophecy-p' || column.type === 'prophecy-f' || column.type === 'prophecy-v') return 'var(--adaptive-prophecy-width)';
        if (column.type === 'notes') return 'var(--adaptive-notes-width)';
        if (column.type === 'context') return 'var(--adaptive-context-width)';
        return 'var(--adaptive-alt-width)';
      } else {
        // Landscape mode - use unified variables (IDENTICAL to ColumnHeaders)
        if (column.type === 'reference') return 'var(--adaptive-ref-width)';
        if (column.type === 'main-translation') return 'var(--adaptive-main-width)';
        if (column.type === 'cross-refs') return 'var(--adaptive-cross-width)';
        if (column.type === 'alt-translation') return 'var(--adaptive-alt-width)';
        if (column.type === 'prophecy-p' || column.type === 'prophecy-f' || column.type === 'prophecy-v') return 'var(--adaptive-prophecy-width)';
        if (column.type === 'notes') return 'var(--adaptive-notes-width)';
        if (column.type === 'context') return 'var(--adaptive-context-width)';
        return 'var(--adaptive-alt-width)';
      }

      // Convert rem to pixels for other columns (same as headers - 1rem = 16px)
      const pixelWidth = (columnInfo?.widthRem || 10) * 16;
      return `${pixelWidth}px`;
    };

    // Use inline styles for exact width matching with responsive column width scaling
    const columnStyle = {
      width: getResponsiveColumnPixelWidth(), // Unified variables already include multiplier
      flexShrink: 0
    };

    const bgClass = "";

    switch (column.type) {
      case 'reference':
        return (
          <div key={column.id} className="bible-column columnGroup border-r border-gray-200 dark:border-gray-700" style={columnStyle}>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 cell-content cell-ref flex items-center justify-center h-full m-0 p-0">
              <span className="truncate leading-none m-0 p-0">{verse.reference}</span>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div key={column.id} className="bible-column border-r border-gray-200 dark:border-gray-700" style={columnStyle}>
            <NotesCell verseRef={verse.reference} className="h-full" onVerseClick={onVerseClick} />
          </div>
        );

      case 'main-translation':
        return (
          <div key={column.id} className="bible-column columnGroup border-r border-gray-200 dark:border-gray-700 h-full" style={columnStyle}>
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
            translationCode: column.translationCode,
            getVerseTextResult: getVerseText(verse.reference, column.translationCode),
            getMainVerseTextResult: getMainVerseText(verse.reference)
          });
        }

        // Alternate translations with labels support
        let verseText = getVerseText(verse.reference, column.translationCode) || 
                        getMainVerseText(verse.reference);

        // Get labels for this verse if we have active labels
        const shouldUseLabeledText = activeLabels && activeLabels.length > 0;
        const verseLabels = shouldUseLabeledText && getVerseLabels ? getVerseLabels(verse.reference) : {};

        return (
          <div key={slot} className="bible-column border-r border-gray-200 dark:border-gray-700 h-full" style={columnStyle}>
            <div className="px-2 py-1 text-sm cell-content h-full max-h-full">
              {verseText ? (
                shouldUseLabeledText ? (
                  <LabeledText
                    text={verseText}
                    labelData={verseLabels}
                    activeLabels={activeLabels}
                    verseKey={`${verse.reference}-${config.translationCode}`}
                    translationCode={config.translationCode}
                  />
                ) : (
                  verseText
                )
              ) : (
                `[${config.translationCode} loading...]`
              )}
            </div>
          </div>
        );

      case 'cross-refs':
        return (
          <div 
            key={slot} 
            className="bible-column columnGroup border-r border-gray-200 dark:border-gray-700" 
            style={columnStyle}
            onWheel={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            onScroll={(e) => e.stopPropagation()}
          >
            <CrossReferencesCell 
              verse={verse} 
              getVerseText={getVerseText} 
              mainTranslation={mainTranslation} 
              onVerseClick={onVerseClick}
              getVerseLabels={getVerseLabels}
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
              getVerseLabels={getVerseLabels}
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

  // RESPONSIVE MIN-WIDTH: Use viewport-constrained width on smaller screens
  const responsiveMinWidth = useMemo(() => {
    // On mobile/tablet, allow more flexible width utilization
    if (viewportWidth <= 768) {
      // Use 95% of viewport width or actual width, whichever is smaller
      return Math.min(actualTotalWidth, viewportWidth * 0.95);
    }
    // On desktop, maintain full calculated width
    return actualTotalWidth;
  }, [actualTotalWidth, viewportWidth]);

  // RESPONSIVE COLUMN WIDTHS - Optimize space utilization
  return (
    <div 
      className="border-b border-gray-200 dark:border-gray-700 bible-verse-row"
      style={{ 
        height: rowHeight,
        width: needsHorizontalScroll ? `${actualTotalWidth}px` : '100%',
        minWidth: `${responsiveMinWidth}px`,
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