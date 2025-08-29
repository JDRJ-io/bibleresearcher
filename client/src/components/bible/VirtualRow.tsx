import React, { useEffect, useMemo, useState } from 'react';
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
import { InlineDateInfo } from './InlineDateInfo';
import { HybridCell } from './HybridCell';



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
  centerVerseRef?: string; // For hybrid column - always shows data for center anchor verse
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
    <div 
      className={`${isMobile ? 'cell-ref' : 'w-20 px-1 py-1 text-xs'} font-medium glass-morphism glass-reference-cell flex-shrink-0 border-r`}
      style={{
        color: 'var(--text-primary)',
        borderColor: 'var(--border-color)'
      }}
    >
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

  // Cross-reference rendering debug removed for performance

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
              <div key={i} className="cross-ref-item block w-full mb-1" style={{background: 'none', border: 'none', padding: '0'}}>
                <button
                  type="button"
                  className="font-mono text-sm font-semibold cursor-pointer"
                  style={{
                    color: 'var(--link-color)', 
                    background: 'none', 
                    border: 'none', 
                    padding: '0',
                    textDecoration: 'none',
                    minHeight: '24px',
                    minWidth: '60px',
                    touchAction: 'manipulation'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                    e.currentTarget.style.color = 'var(--link-hover-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                    e.currentTarget.style.color = 'var(--link-color)';
                  }}
                  onClick={(e) => handleCrossRefClick(ref, e)}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => handleCrossRefClick(ref, e)}
                >
                  {ref}
                </button>
                <div className="text-sm leading-tight whitespace-normal break-words" style={{color: 'var(--text-primary)', background: 'none', padding: '0'}}>
                  <div className="text-sm leading-tight h-full" style={{background: 'none', padding: '0', border: 'none', boxShadow: 'none'}}>
                    {refText ? renderTextWithLabels(refText, ref) : '—'}
                  </div>
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
    <div className="px-2 py-1 text-sm cell-content glass-morphism">
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
                            <div className="px-2 py-1 text-sm leading-tight cell-content h-full overflow-y-auto" style={{ maxHeight: '100%', boxSizing: 'border-box' }}>
                              {fullVerseText ? renderTextWithLabels(fullVerseText, verseRef) : 'Loading...'}
                            </div>
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
    <div className="flex items-center justify-center h-full w-full glass-morphism">
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

  // Translation lookup debug removed for performance

  // Get verse text with proper fallbacks
  const verseText = getVerseText(verse.reference, mainTranslation) || 
                    verse.text?.[mainTranslation] || 
                    verse.text?.text || 
                    '';

  // Get labels for this verse if available
  const verseLabels = getVerseLabels ? getVerseLabels(verse.reference) : {};

  // Use LabeledText if we have active labels (don't require verseLabels yet, let component handle empty data)
  const shouldUseLabeledText = activeLabels && activeLabels.length > 0;

  // MainTranslationCell debug removed for performance

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
      wrapperClassName="h-full max-h-full"
    >
      <div className={`px-2 py-1 text-sm cell-content h-full max-h-full overflow-y-auto whitespace-pre-wrap break-words leading-tight glass-morphism glass-verse-cell ${contextClasses}`}>
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
            className="verse-text"
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
  getVerseLabels,
  centerVerseRef
}: VirtualRowProps) {
  // Track orientation changes for responsive date positioning
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);
  
  // FIX #1: Use translation store as SINGLE source of truth for mainTranslation
  const store = useBibleStore();
  const { main: mainTranslation, alternates } = useTranslationMaps();

  // Debug translation store state (only for first verse to avoid spam)
  // Console logging removed for cleaner output
  const { showCrossRefs, showNotes, showDates, showProphecies, showHybrid, columnState } = store;

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

  // Use store's columnState as the authoritative source, enhanced with translation data
  const slotConfig: Record<number, SlotConfig> = {};

  // Always show reference column (slot 0)
  slotConfig[0] = { type: 'reference', header: '#', visible: true };

  // Notes column (slot 2) - dates are now inline with reference
  slotConfig[2] = { type: 'notes', header: 'Notes', visible: showNotes };

  // Main translation (slot 3)
  slotConfig[3] = { type: 'main-translation', header: mainTranslation, translationCode: mainTranslation, visible: true };

  // Map all column types based on store state - updated slot assignments
  if (columnState?.columns) {
    columnState.columns.forEach(col => {
      switch (col.slot) {
        // case 1: removed - dates are now inline with reference column
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
        case 20:
          // Hybrid column - shows all data for center anchor verse
          slotConfig[20] = { type: 'hybrid', header: 'Master', visible: col.visible && showHybrid };
          break;
      }
    });
  }

  // Dynamically add alternate translation columns to slots 12-19 (FIXED to match translationSlice.ts)
  // This ensures NO interference with cross-references (slot 7) or prophecy columns (slots 8-10)
  // FILTER OUT main translation to prevent duplication
  alternates
    .filter(translationCode => translationCode !== mainTranslation) // Prevent main translation duplication
    .forEach((translationCode, index) => {
      // All alternate translations start from slot 12 (AFTER cross-references at slot 7)
      const slotNumber = 12 + index; // Slots 12-19

      if (slotNumber <= 19) { // Max 8 alternate translations total (slots 12-19)
        slotConfig[slotNumber] = { 
          type: 'alt-translation', 
          header: translationCode, 
          translationCode, 
          visible: true  // Show all active alternate translations
        };
      }
    });

  // Get all available columns: combine store state with translation state
  // The authoritative source is the slotConfig based on current translation state
  let allColumns = Object.entries(slotConfig)
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
    allColumns.forEach((col: any) => {
      col.displayOrder = slotToDisplayOrder.get(col.slot) ?? col.slot;
    });

    allColumns.sort((a: any, b: any) => (a.displayOrder ?? a.slot) - (b.displayOrder ?? b.slot));
  } else {
    // Fallback to slot-based sorting
    allColumns.sort((a, b) => a.slot - b.slot);
  }

  // Apply horizontal navigation filtering - match NewColumnHeaders logic
  const { getVisibleSlice } = useBibleStore();
  const fixedColumnTypes = ['reference']; // Always show reference column

  const fixedColumns = allColumns.filter(col => fixedColumnTypes.includes(col.config?.type));
  const navigableColumns = allColumns.filter(col => !fixedColumnTypes.includes(col.config?.type));

  // FIXED: Always show all toggled columns for horizontal scrolling support
  // Remove artificial limits that were preventing mobile users from seeing all their active columns
  // But filter out context columns in mobile portrait mode to prevent extra thin columns
  const isPortraitMode = window.innerHeight > window.innerWidth;
  const isMobileMode = window.innerWidth <= 640;
  const isMobilePortraitMode = isPortraitMode && isMobileMode;
  
  let visibleColumns = [...fixedColumns, ...navigableColumns];
  
  // Filter out context columns in mobile portrait mode
  if (isMobilePortraitMode) {
    visibleColumns = visibleColumns.filter(col => 
      col.config?.type !== 'context' && 
      col.slot !== 1 && // Dates slot
      col.slot !== 11   // Context slot
    );
  }

  // Helper function to get default widths per UI Layout Spec
  function getDefaultWidth(slot: number): number {
    switch (slot) {
      case 0: return 5;   // Reference
      case 2: return 8;   // Notes (moved to slot 2)
      case 3: return 20;  // Main translation (moved to slot 3)
      case 7: return 15;  // Cross References (slot 7)
      case 8: case 9: case 10: return 10; // Prophecy columns
      case 12: case 13: case 14: case 15: 
      case 16: case 17: case 18: case 19: return 18; // Alternate translations (slots 12-19)
      case 20: return 24; // Hybrid column - wider to accommodate all data
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
    console.log('🔍 VirtualRow Debug - Actual column keys being rendered:', visibleColumns.map(c => c.config?.type));
    console.log('🔍 VirtualRow Debug - KJV verse text:', getVerseText(verse.reference, 'KJV'));

    // Debug cross-references data
    const { crossRefs } = useBibleStore.getState();
    console.log('🔍 VirtualRow Debug - Cross refs for verse:', crossRefs[verse.reference]);
    console.log('🔍 VirtualRow Debug - All cross refs keys:', Object.keys(crossRefs).slice(0, 10));
  }

  const renderSlot = (column: any) => {
    const { slot, config } = column;
    const isMain = config.translationCode === mainTranslation;

    // Generate column ID to match NewColumnHeaders format
    const getColumnId = (config: SlotConfig) => {
      switch (config.type) {
        case 'reference':
          return 'reference';
        case 'notes':
          return 'notes';
        case 'main-translation':
          return 'main-translation';
        case 'cross-refs':
          return 'cross-refs';
        case 'prophecy-p':
          return 'prophecy-prediction';
        case 'prophecy-f':
          return 'prophecy-fulfillment';
        case 'prophecy-v':
          return 'prophecy-verification';
        case 'alt-translation':
          return `alt-translation-${config.translationCode}`;
        case 'hybrid':
          return 'hybrid';
        default:
          return config.type;
      }
    };

    const columnId = getColumnId(config);

    // Get responsive pixel width for portrait/landscape modes
    const getResponsiveColumnPixelWidth = (slotNumber: number) => {
      const columnInfo = columnState?.columns?.find((col: any) => col.slot === slotNumber);
      if (!columnInfo) {
        console.warn(`No column info found for slot ${slotNumber}`);
        return '160px'; // fallback
      }

      // Use adaptive CSS variables for portrait/landscape modes
      const isPortraitInCell = window.innerHeight > window.innerWidth;

      if (isPortraitInCell) {
        // Portrait mode - use adaptive CSS variables with column-width-mult scaling (IDENTICAL to NewColumnHeaders)
        if (slotNumber === 0) return 'calc(var(--adaptive-ref-width) * var(--column-width-mult, 1))';
        if (slotNumber === 2 && config.type === 'notes') return 'calc(var(--adaptive-notes-width) * var(--column-width-mult, 1))';
        if (slotNumber === 3 && config.type === 'main-translation') return 'calc(var(--adaptive-main-width) * var(--column-width-mult, 1))';
        if (slotNumber === 7 && config.type === 'cross-refs') return 'calc(var(--adaptive-cross-width) * var(--column-width-mult, 1))';
        if (slotNumber >= 8 && slotNumber <= 10 && (config.type === 'prophecy-p' || config.type === 'prophecy-f' || config.type === 'prophecy-v')) return 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))';
        if (slotNumber >= 12 && slotNumber <= 19 && config.type === 'alt-translation') return 'calc(var(--adaptive-alt-width) * var(--column-width-mult, 1))';
        if (slotNumber === 20 && config.type === 'hybrid') return 'calc(384px * var(--column-width-mult, 1))'; // 384px = w-96
        return 'calc(var(--adaptive-alt-width) * var(--column-width-mult, 1))';
      } else {
        // Landscape mode - use adaptive CSS variables with column-width-mult scaling (IDENTICAL to NewColumnHeaders)
        if (slotNumber === 0) return 'calc(var(--adaptive-ref-width) * var(--column-width-mult, 1))';
        if (slotNumber === 2) return 'calc(var(--adaptive-notes-width) * var(--column-width-mult, 1))';
        if (slotNumber === 3) return 'calc(var(--adaptive-main-width) * var(--column-width-mult, 1))';
        if (slotNumber === 7) return 'calc(var(--adaptive-cross-width) * var(--column-width-mult, 1))';
        if (slotNumber >= 8 && slotNumber <= 10) return 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))';
        if (slotNumber >= 12 && slotNumber <= 19) return 'calc(var(--adaptive-alt-width) * var(--column-width-mult, 1))';
        if (slotNumber === 20 && config.type === 'hybrid') return 'calc(384px * var(--column-width-mult, 1))'; // 384px = w-96
        return 'calc(var(--adaptive-cross-width) * var(--column-width-mult, 1))';
      }
    };

    // Use inline styles for exact width matching with responsive column width scaling
    const columnStyle = {
      width: getResponsiveColumnPixelWidth(slot), // Unified variables already include multiplier
      flexShrink: 0
    };

    const bgClass = "";

    switch (config.type) {
      case 'reference':
        const isPortraitInRefCell = window.innerHeight > window.innerWidth;
        const isMobilePortraitMode = isPortraitInRefCell && window.innerWidth <= 768; // Use tablet breakpoint
        
        return (
          <div 
            key={slot} 
            className="bible-column columnGroup border-r border-gray-200 dark:border-gray-700 cell" 
            style={columnStyle}
            data-column={config.type}
            data-col-key={columnId}
          >
            <div className={`text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 cell-content cell-ref h-full m-0 p-0 ${
              isMobilePortraitMode 
                ? 'flex flex-row items-center justify-center gap-0.5' 
                : 'flex flex-col items-center justify-center'
            }`}>
              <span className={`leading-none m-0 p-0 ${isMobilePortraitMode ? 'vertical-text' : 'truncate'}`}>
                {verse.reference}
              </span>
              {showDates && (
                <InlineDateInfo 
                  verseId={verse.reference} 
                  className={isMobilePortraitMode ? 'vertical-text' : 'mt-1 px-0.5'} 
                />
              )}
            </div>
          </div>
        );

      case 'notes':
        return (
          <div 
            key={slot} 
            className="bible-column border-r border-gray-200 dark:border-gray-700" 
            style={columnStyle}
            data-column={config.type}
            data-col-key={columnId}
          >
            <NotesCell verseRef={verse.reference} className="h-full" onVerseClick={onVerseClick} />
          </div>
        );

      case 'main-translation':
        return (
          <div 
            key={slot} 
            className="bible-column columnGroup border-r border-gray-200 dark:border-gray-700 h-full" 
            style={columnStyle}
            data-column={config.type}
            data-col-key={columnId}
          >
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

        // Alternate translations with labels support
        let verseText = getVerseText(verse.reference, config.translationCode) || 
                        getMainVerseText(verse.reference);

        // Get labels for this verse if we have active labels
        const shouldUseLabeledText = activeLabels && activeLabels.length > 0;
        const verseLabels = shouldUseLabeledText && getVerseLabels ? getVerseLabels(verse.reference) : {};

        // Copy/bookmark/share handlers for alternate translations
        const handleAltCopy = () => {
          const text = `${verse.reference} (${config.translationCode}) - ${verseText}`;
          navigator.clipboard.writeText(text);
        };

        const handleAltBookmark = () => {
          console.log('Bookmark verse:', verse.reference, 'from', config.translationCode);
        };

        const handleAltShare = () => {
          const text = `${verse.reference} (${config.translationCode}) - ${verseText}`;
          if (navigator.share) {
            navigator.share({
              title: `${verse.reference} (${config.translationCode})`,
              text: text,
            });
          } else {
            handleAltCopy();
          }
        };

        return (
          <div 
            key={slot} 
            className="bible-column border-r border-gray-200 dark:border-gray-700 h-full" 
            style={columnStyle}
            data-column={config.type}
            data-col-key={columnId}
          >
            <HoverVerseBar
              verse={verse}
              translation={config.translationCode}
              onCopy={handleAltCopy}
              onBookmark={handleAltBookmark}
              onShare={handleAltShare}
              wrapperClassName="h-full max-h-full"
            >
              <div className="px-2 py-1 text-sm cell-content h-full max-h-full overflow-y-auto">
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
            </HoverVerseBar>
          </div>
        );

      case 'cross-refs':
        return (
          <div 
            key={slot} 
            className="bible-column columnGroup border-r border-gray-200 dark:border-gray-700" 
            style={columnStyle}
            data-column={config.type}
            data-col-key={columnId}
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

      // context/dates case removed - dates are now inline with reference column

      case 'prophecy-p':
      case 'prophecy-f':
      case 'prophecy-v':
        return (
          <div 
            key={slot} 
            className="bible-column border-r border-gray-200 dark:border-gray-700" 
            style={columnStyle}
            data-column={config.type}
            data-col-key={columnId}
          >
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

      case 'hybrid':
        // Hybrid column is now handled by MasterColumnPanel - don't render here
        return null;

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

  const currentViewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const shouldCenter = actualTotalWidth <= currentViewportWidth * 0.95;
  const needsHorizontalScroll = actualTotalWidth > currentViewportWidth;

  // RESPONSIVE MIN-WIDTH: Use viewport-constrained width on smaller screens
  const responsiveMinWidth = useMemo(() => {
    // On mobile/tablet, allow more flexible width utilization
    if (currentViewportWidth <= 768) {
      // Use 95% of viewport width or actual width, whichever is smaller
      return Math.min(actualTotalWidth, currentViewportWidth * 0.95);
    }
    // On desktop, maintain full calculated width
    return actualTotalWidth;
  }, [actualTotalWidth, currentViewportWidth]);

  // Remove mystical/prophecy effects from rows

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
    <div className="w-80 px-2 py-1 text-sm flex-shrink-0 overflow-hidden">
      <div className="h-[120px] overflow-y-auto overflow-x-hidden cell-content">
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {verseText || (
            <span className="text-muted-foreground italic">
              [{verse.reference} - {translation} loading...]
            </span>
          )}
        </div>
      </div>
    </div>
  );
}