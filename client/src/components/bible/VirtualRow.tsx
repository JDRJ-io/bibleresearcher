import React, { useEffect, useMemo, useState, useRef } from 'react';
import { BibleVerse } from '../../types/bible';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from '@/store/translationSlice';
import { useViewportStore } from '@/stores/viewportStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useEnsureTranslationLoaded } from '@/hooks/useEnsureTranslationLoaded';
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';
import { getVisibleColumns, getColumnWidth, getDataRequirements } from '@/constants/columnLayout';
import { useColumnData } from '@/hooks/useColumnData';
import { measureTextWidth } from '@/utils/textMeasurement';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import { useContextBoundaries } from '@/hooks/useGlobalContextBoundaries';
import LabeledText from './LabeledText';
import { useLabeledText } from '@/hooks/useLabeledText';
import { useViewportLabels } from '@/hooks/useViewportLabels';
import { classesForMask } from '@/lib/labelRenderer';
import { LabelName } from '@/lib/labelBits';
import { NotesCell } from '@/components/user/NotesCell';
import { VerseText } from '@/components/highlights/VerseText';
import { HoverVerseBar, openHoverVerseBarFromTap } from './HoverVerseBar';
import { InlineDateInfo } from './InlineDateInfo';
import { HybridCell } from './HybridCell';
import { MasterColumnPanel } from './MasterColumnPanel';
import { UnifiedProphecyCell } from './UnifiedProphecyCell';
import { hyperlinkTracker } from '@/lib/hyperlinkTracking';
import { logger } from '@/lib/logger';
import { getCfRestRanges, parseConsecutiveReference, getCombinedVerseText } from '@/data/BibleDataAPI';
import { getColumnWidthStyle } from '@/utils/columnWidth';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface VirtualRowProps {
  verseID: string;
  rowIndex: number;
  rowHeight: number;
  columnData: any;
  getVerseText: (verseID: string, translationCode: string) => string;
  getMainVerseText: (verseID: string) => string;
  activeTranslations: string[];
  mainTranslation: string;
  translationsVersion: number; // Reactive counter - triggers re-render when translations load
  onVerseClick: (ref: string) => void;
  onExpandVerse?: (verse: BibleVerse) => void;
  onDoubleClick?: () => void;
  getVerseLabels?: (verseReference: string) => Record<string, string[]>;
  centerVerseRef?: string; // For hybrid column - always shows data for center anchor verse
  stickyHeaderOffset?: number; // Dynamic header offset for sticky positioning
  onOpenProphecy?: (prophecyId: number) => void;
  onNavigateToVerse?: (ref: string) => void; // For prophecy overlay navigation
  visibleColumnsConfig?: ReadonlyArray<any>; // MEMORY OPT: Precomputed column config from parent
  isCenterRow?: boolean; // Marks this row as the center of the viewport for navigation tracking
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
  return (
    <div 
      className="cell-ref font-medium glass-morphism glass-reference-cell flex-shrink-0 border-r"
      data-column="reference"
      style={{
        color: 'var(--text-primary)',
        borderColor: 'var(--border-color)'
      }}
    >
      {verse.reference}
    </div>
  );
}

interface ReferenceCellWithOverflowProps {
  slot: number;
  verse: BibleVerse;
  columnStyle: any;
  config: any;
  columnId: string;
  showDates: boolean;
}

function ReferenceCellWithOverflow({ slot, verse, columnStyle, config, columnId, showDates }: ReferenceCellWithOverflowProps) {
  const refCellRef = useRef<HTMLDivElement | null>(null);
  const refSpanRef = useRef<HTMLSpanElement | null>(null);
  const [useVertical, setUseVertical] = useState(false);
  const [textSizeMult, setTextSizeMult] = useState(1.0);

  const HYSTERESIS = 4;

  // PERF FIX: Use shared text measurement utility and viewport store
  const viewportW = useViewportStore(s => s.viewportW);
  const orientation = useViewportStore(s => s.orientation);
  
  // PERF FIX: Consume reference column width from centralized observer instead of creating own ResizeObserver
  const referenceColumnWidth = useLayoutStore(s => s.referenceColumnWidth);
  
  // Track text size multiplier changes from display settings
  useEffect(() => {
    const handleSizeChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.textSize) {
        setTextSizeMult(customEvent.detail.textSize);
      }
    };

    // Listen for manual size changes
    window.addEventListener('manualSizeChange', handleSizeChange);

    // Initialize from CSS variable
    const initialMult = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--text-size-mult') || '1.0'
    );
    setTextSizeMult(initialMult);

    return () => {
      window.removeEventListener('manualSizeChange', handleSizeChange);
    };
  }, []);

  useEffect(() => {
    const cell = refCellRef.current;
    const span = refSpanRef.current;
    if (!cell || !span) return;

    let raf = 0;

    const compute = () => {
      const spanStyle = window.getComputedStyle(span);
      
      // PERF FIX: Use shared measurement utility instead of creating ghost element
      const textNaturalWidth = measureTextWidth({
        text: span.textContent || '',
        fontFamily: spanStyle.fontFamily,
        fontSize: spanStyle.fontSize,
        fontWeight: spanStyle.fontWeight,
        letterSpacing: spanStyle.letterSpacing,
        textTransform: spanStyle.textTransform,
        fontVariant: spanStyle.fontVariant,
        wordSpacing: spanStyle.wordSpacing,
        lineHeight: spanStyle.lineHeight,
      });

      const cellStyle = window.getComputedStyle(cell);
      const paddingLeft = parseFloat(cellStyle.paddingLeft || '0');
      const paddingRight = parseFloat(cellStyle.paddingRight || '0');
      const borderLeft = parseFloat(cellStyle.borderLeftWidth || '0');
      const borderRight = parseFloat(cellStyle.borderRightWidth || '0');
      const usable = cell.clientWidth - paddingLeft - paddingRight - borderLeft - borderRight;

      const rotateThreshold = usable;
      const unrotateThreshold = usable - HYSTERESIS;

      let nextVertical = useVertical;
      if (!useVertical) {
        nextVertical = textNaturalWidth > rotateThreshold;
      } else {
        nextVertical = !(textNaturalWidth <= unrotateThreshold);
      }

      if (nextVertical !== useVertical) setUseVertical(nextVertical);
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        requestAnimationFrame(compute);
      });
    };

    schedule();

    // PERF FIX: Removed ResizeObserver - centralized observer in useReferenceColumnObserver
    // referenceColumnWidth from layoutStore triggers re-computation when column resizes
    // This eliminates 120 ResizeObserver instances (240 element observations)

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [useVertical, viewportW, orientation, referenceColumnWidth, textSizeMult]);

  return (
    <div
      className="bible-column columnGroup border-r border-gray-200 dark:border-gray-700"
      style={{
        ...columnStyle,
        padding: 0,
        margin: 0
      }}
      data-column={config.type}
      data-col-key={columnId}
    >
      <div
        ref={refCellRef}
        className={`text-xs font-medium text-gray-700 dark:text-gray-300 cell-content cell-ref h-full m-0 p-0 ${
          useVertical
            ? 'flex flex-row items-center justify-center gap-0'
            : 'flex flex-col items-center justify-center'
        }`}
      >
        <span
          ref={refSpanRef}
          className={`leading-none m-0 p-0 ${useVertical ? 'vertical-text' : 'truncate'}`}
          style={{ whiteSpace: 'nowrap' }}
        >
          {verse.reference}
        </span>

        {showDates && (
          <InlineDateInfo
            verseId={verse.reference}
            className={useVertical ? 'vertical-text' : 'mt-0.5 px-0'}
          />
        )}
      </div>
    </div>
  );
}

function CrossReferencesCell({ verse, getVerseText, mainTranslation, onVerseClick, getVerseLabels }: CellProps) {
  const crossRefStatus = useBibleStore(s => s.crossRefs[verse.reference]);
  const activeLabels = useBibleStore(s => s.activeLabels);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasRestRange, setHasRestRange] = useState<boolean | null>(null);
  
  const crossRefData = crossRefStatus?.data || [];
  const status = crossRefStatus?.status || 'none';
  
  // Check if this verse has a rest range (more than 5 cross references total)
  useEffect(() => {
    const checkRestRange = async () => {
      try {
        const restRanges = await getCfRestRanges();
        // Use verse.reference directly since it's already in canonical format
        setHasRestRange(!!restRanges[verse.reference]);
      } catch (error) {
        logger.error('WIN', 'Failed to check rest ranges:', error);
        setHasRestRange(false);
      }
    };
    
    if (status === 'top5') {
      checkRestRange();
    } else {
      setHasRestRange(false);
    }
  }, [verse.reference, status]);

  const handleCrossRefClick = async (ref: string, e: React.MouseEvent | React.TouchEvent) => {
    logger.debug('WIN', `🔗 Cross-reference clicked: ${ref} from ${verse.reference}`, { hasHandler: !!onVerseClick });

    // Stop all event propagation to prevent scroll interference
    e.stopPropagation();
    e.preventDefault();

    // Track the hyperlink click for user history
    try {
      // Use the actual verse reference from this row instead of trying to detect it
      const currentVerse = verse.reference;
      const currentTranslation = hyperlinkTracker.getCurrentTranslation();
      const context = {
        ...hyperlinkTracker.getCurrentContext(),
        panel: 'cross-reference',
        column: 'cross-refs'
      };
      
      await hyperlinkTracker.trackCrossReferenceClick(
        currentVerse,
        ref,
        currentTranslation,
        context
      );
    } catch (trackingError) {
      logger.warn('WIN', '⚠️ Failed to track cross-reference click:', trackingError);
    }

    if (onVerseClick) {
      logger.debug('WIN', '🔗 Calling onVerseClick with:', ref);
      onVerseClick(ref);
      logger.debug('WIN', '🔗 onVerseClick called successfully');
    } else {
      logger.warn('WIN', '⚠️ No onVerseClick handler available');
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

  // TWO-STAGE: Determine what to show based on status and expansion
  // Show different behavior based on loading status
  const visibleCrossRefs = isExpanded ? crossRefData : crossRefData.slice(0, 5);
  const hasMoreRefsToShow = crossRefData.length > 5; // More refs in current data
  const hasMoreRefsToLoad = status === 'top5' && hasRestRange === true; // More refs available on server


  // Event delegation handler for hover interactions on individual verse references
  const handleCellHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const verseButton = target.closest('[data-verse-ref]') as HTMLElement;
    
    if (verseButton && verseButton.dataset.verseRef) {
      const verseRef = verseButton.dataset.verseRef;
      const translation = verseButton.dataset.translation || mainTranslation;
      const verseText = verseButton.dataset.verseText || '';
      
      logger.debug('WIN', `🎯 Cross-ref hover detected: ${verseRef}`, { translation });
      
      // Create a synthetic verse object for the hovered verse
      const syntheticVerse: BibleVerse = {
        id: verseRef,
        reference: verseRef,
        book: verseRef.split('.')[0],
        chapter: parseInt(verseRef.split('.')[1]),
        verse: parseInt(verseRef.split('.')[2]),
        text: { [translation]: verseText }
      };
      
      
      // Open hover bar for this specific verse reference
      openHoverVerseBarFromTap({
        verseKey: verseRef,
        anchorEl: verseButton,
        verse: syntheticVerse,
        translation
      });
    }
  };

  // Handle mobile tap events
  const handleCellTap = (e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const verseButton = target.closest('[data-verse-ref]') as HTMLElement;
    
    if (verseButton && verseButton.dataset.verseRef) {
      const verseRef = verseButton.dataset.verseRef;
      const translation = verseButton.dataset.translation || mainTranslation;
      const verseText = verseButton.dataset.verseText || '';
      
      // Create a synthetic verse object for the tapped verse
      const syntheticVerse: BibleVerse = {
        id: verseRef,
        reference: verseRef,
        book: verseRef.split('.')[0],
        chapter: parseInt(verseRef.split('.')[1]),
        verse: parseInt(verseRef.split('.')[2]),
        text: { [translation]: verseText }
      };
      
      // Open hover bar for this specific verse reference
      openHoverVerseBarFromTap({
        verseKey: verseRef,
        anchorEl: verseButton,
        verse: syntheticVerse,
        translation
      });
      
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div 
      className="px-2 py-1 text-sm cell-content cross-ref-cell"
      style={{
        display: 'block',
        alignSelf: 'flex-start',
      }}
      onMouseMove={(e) => {
        logger.debug('WIN', '🔥 Cross-ref cell mouse move detected');
        handleCellHover(e);
      }}
      onMouseEnter={(e) => {
        logger.debug('WIN', '🔥 Cross-ref cell mouse enter detected');
        handleCellHover(e);
      }}
      onTouchStart={handleCellTap}
    >
      {crossRefData.length > 0 ? (
        <div className="space-y-0">
          {visibleCrossRefs.map((ref, i) => {
            // Parse consecutive verse references (e.g., "John.1:1#John.1:2#John.1:3")
            const { display, verses } = parseConsecutiveReference(ref);
            
            // Get combined text for consecutive verses or single verse text
            let refText = '';
            if (getVerseText && mainTranslation) {
              if (verses.length > 1) {
                // Consecutive verses - combine text
                refText = getCombinedVerseText(verses, mainTranslation, getVerseText);
              } else {
                // Single verse
                refText = getVerseText(ref, mainTranslation) || '';
              }
            }

            // MOBILE-AWARE LAYOUT: Use tighter spacing for ALL mobile devices (portrait and landscape)
            const isMobileDevice = window.innerWidth <= 1024;
            
            return (
              <div key={i} className={`cross-ref-item block w-full ${isMobileDevice ? 'mb-0.5' : 'mb-1'}`} style={{background: 'none', border: 'none', padding: '0'}}>
                <button
                  type="button"
                  className="xref-btn font-mono text-sm font-semibold cursor-pointer inline-block leading-tight"
                  style={{
                    color: 'var(--link-color)', 
                    background: 'none', 
                    border: 'none', 
                    padding: 0,
                    textDecoration: 'none',
                    minWidth: '60px',
                    touchAction: 'manipulation',
                    display: 'inline-block',
                    height: 'auto',
                    minHeight: 0,
                    alignSelf: 'flex-start',
                  }}
                  data-verse-ref={verses[0]}
                  data-translation={mainTranslation}
                  data-verse-text={refText}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                    e.currentTarget.style.color = 'var(--link-hover-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                    e.currentTarget.style.color = 'var(--link-color)';
                  }}
                  onClick={(e) => handleCrossRefClick(verses[0], e)}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => handleCrossRefClick(verses[0], e)}
                >
                  {display}
                </button>
                <div className="text-sm leading-tight whitespace-normal break-words" style={{color: 'var(--text-primary)', background: 'none', padding: '0'}}>
                  <div className="text-sm leading-tight" style={{background: 'none', padding: '0', border: 'none', boxShadow: 'none'}}>
                    {refText ? (
                      activeLabels && activeLabels.length > 0 ? 
                        renderTextWithLabels(refText, verses[0]) : 
                        <VerseText
                          verseRef={verses[0]}
                          translation={mainTranslation}
                          text={refText}
                        />
                    ) : '—'}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Two-stage Load More button */}
          {(hasMoreRefsToShow || hasMoreRefsToLoad) && !isExpanded && (
            <button
              onClick={async () => {
                if (hasMoreRefsToLoad) {
                  // Load remaining cross-references from server
                  setIsLoadingMore(true);
                  try {
                    const { ensureFullCrossRefs } = await import('@/hooks/useCrossRefLoader');
                    await ensureFullCrossRefs([verse.reference]);
                  } catch (error) {
                    logger.error('WIN', 'Failed to load more cross-references:', error);
                  } finally {
                    setIsLoadingMore(false);
                  }
                }
                setIsExpanded(true);
              }}
              disabled={isLoadingMore}
              className="w-full text-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 py-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'none', border: 'none' }}
            >
              {isLoadingMore ? (
                'Loading...'
              ) : hasMoreRefsToLoad ? (
                'Load More (from server)'
              ) : (
                `Load More (${crossRefData.length - 5} more)`
              )}
            </button>
          )}
          
          {/* Show total count when expanded */}
          {isExpanded && crossRefData.length > 5 && (
            <div className="text-center text-xs text-gray-400 mt-1">
              {crossRefData.length} total references
            </div>
          )}
        </div>
      ) : (
        <span className="text-gray-400 italic text-sm">—</span>
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

  // MOBILE-AWARE LAYOUT: Rotate text on ALL mobile devices (portrait and landscape)
  const isMobileDevice = window.innerWidth <= 1024;
  const shouldRotate = isMobile || isMobileDevice;

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
  getVerseLabels,
  isBookmarked = false,
  bookmarksData,
  onExpandVerse,
  onOpenProphecy,
  onNavigateToVerse
}: {
  verse: BibleVerse;
  getVerseText: (reference: string, translation: string) => string;
  mainTranslation: string;
  getVerseLabels?: (verseReference: string) => any;
  isBookmarked?: boolean;
  bookmarksData?: any[];
  onExpandVerse?: (verse: BibleVerse) => void;
  onOpenProphecy?: (prophecyId: number) => void;
  onNavigateToVerse?: (ref: string) => void;
}) {
  const store = useBibleStore();
  const activeLabels = store.activeLabels || [];
  const { showContext } = store;
  const isMobile = useIsMobile();
  const [tapStart, setTapStart] = useState<{x:number;y:number;t:number} | null>(null);

  // Tap detection handlers for touch devices (works on all orientations)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' || !e.isPrimary) return;
    setTapStart({ x: e.clientX, y: e.clientY, t: Date.now() });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' || !e.isPrimary || !tapStart) return;
    
    const dx = Math.abs(e.clientX - tapStart.x);
    const dy = Math.abs(e.clientY - tapStart.y);
    const dt = Date.now() - tapStart.t;
    const isTap = dx < 6 && dy < 6 && dt < 300; // tiny move, quick release

    if (isTap) {
      openHoverVerseBarFromTap({ 
        verseKey: verse.reference, 
        anchorEl: e.currentTarget, 
        verse,
        translation: mainTranslation 
      });
      e.preventDefault();
      e.stopPropagation();
    }
    setTapStart(null);
  };

  // Use useContextBoundaries hook for proper boundary detection
  const { isContextStart, isContextEnd, getContextBoundary } = useContextBoundaries();

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

  // Context boundaries as borders around entire verse groups - MUST be before any returns
  const contextBorderClasses = useMemo(() => {
    if (!showContext) return '';

    const contextBoundary = getContextBoundary(verse.reference);
    if (!contextBoundary) return '';

    const isStart = isContextStart(verse.reference);
    const isEnd = isContextEnd(verse.reference);
    
    // Build border classes for group boundaries
    const borderColor = 'border-blue-400 dark:border-blue-600';
    let classes = '';
    
    // Top border for first verse in group
    if (isStart) {
      classes += ` border-t-2 ${borderColor}`;
    }
    
    // Bottom border for last verse in group  
    if (isEnd) {
      classes += ` border-b-2 ${borderColor}`;
    }
    
    // Left and right borders for all verses in any group
    classes += ` border-l-2 border-r-2 ${borderColor}`;
    
    // Light background to show group cohesion
    classes += ' bg-blue-50/20 dark:bg-blue-900/10';
    
    return classes.trim();
  }, [showContext, verse.reference, getContextBoundary, isContextStart, isContextEnd]);

  // MainTranslationCell debug removed for performance

  // Handle empty verse text - just return empty instead of loading message
  if (!verseText) {
    return (
      <div className="verse-text p-2 text-sm leading-relaxed text-gray-400">
        —
      </div>
    );
  }

  const handleCopy = () => {
    const text = `${verse.reference} (${mainTranslation}) - ${verseText}`;
    navigator.clipboard.writeText(text);
  };

  const handleBookmark = () => {
    // Would trigger bookmark creation with the verse reference
    logger.debug('WIN', 'Bookmark verse:', verse.reference);
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
      onOpenProphecy={onOpenProphecy}
      onOpenStrongs={onExpandVerse ? () => onExpandVerse(verse) : undefined}
      onNavigateToVerse={onNavigateToVerse}
      wrapperClassName="h-full max-h-full"
      isBookmarked={isBookmarked}
      bookmarksData={bookmarksData}
    >
      <div 
        className={`relative px-2 py-1 text-sm cell-content h-full max-h-full overflow-y-auto whitespace-pre-wrap break-words leading-tight glass-morphism glass-verse-cell ${contextBorderClasses}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
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
  rowIndex,
  rowHeight,
  columnData,
  getVerseText,
  getMainVerseText,
  activeTranslations,
  onVerseClick,
  onExpandVerse,
  onDoubleClick,
  getVerseLabels,
  centerVerseRef,
  stickyHeaderOffset,
  onOpenProphecy,
  onNavigateToVerse,
  visibleColumnsConfig,
  isCenterRow = false
}: VirtualRowProps) {
  // FIX #1: Use translation store as SINGLE source of truth for mainTranslation
  const store = useBibleStore();
  const { showCrossRefs, showNotes, showDates, showProphecies, showHybrid, showContext, columnState } = store;
  const { main: mainTranslation, alternates } = useTranslationMaps();
  
  // Use context boundaries hook for divider rendering
  const { isContextEnd } = useContextBoundaries();
  
  // PERF FIX: Memoize verse object to make React.memo work
  const verse = useMemo(() => {
    const parts = verseID.split('.');
    const book = parts[0];
    const chapterVerse = parts[1].split(':');
    const chapter = parseInt(chapterVerse[0]);
    const verseNum = parseInt(chapterVerse[1]);

    // Build text object for all active translations
    const textObj: Record<string, string> = {};
    const mainText = getVerseText(verseID, mainTranslation);
    if (mainText) {
      textObj[mainTranslation] = mainText;
    }

    activeTranslations.forEach(translationCode => {
      if (translationCode !== mainTranslation) {
        const altText = getVerseText(verseID, translationCode);
        if (altText) {
          textObj[translationCode] = altText;
        }
      }
    });

    return {
      id: `${book.toLowerCase()}-${chapter}-${verseNum}-${rowIndex}`,
      index: rowIndex,
      book,
      chapter,
      verse: verseNum,
      reference: verseID,
      text: textObj,
      crossReferences: [],
      strongsWords: [],
      labels: [],
      contextGroup: "standard" as const
    };
  }, [verseID, rowIndex, mainTranslation, activeTranslations, getVerseText]);
  
  // PERF FIX: Use centralized viewport store instead of per-row listeners
  const isPortrait = useViewportStore(s => s.orientation === 'portrait');
  
  // Load Strong's data for Master column when this is the center verse
  useEffect(() => {
    if (verse.reference !== centerVerseRef) return;
    
    // Use store's loadStrongsData function
    store.loadStrongsData([verse.reference]);
  }, [verse.reference, centerVerseRef, store]);
  
  // Load prophecy data for Master column when shown (independent of showProphecies toggle)
  useEffect(() => {
    if (!showHybrid) return; // Only load if Master column is shown
    if (store.prophecyData !== undefined) return; // Already loaded
    
    // Load prophecy data globally
    import('@/data/BibleDataAPI').then(async ({ loadProphecyData }) => {
      try {
        const { verseRoles, prophecyIndex } = await loadProphecyData();
        store.setProphecyData(verseRoles);
        store.setProphecyIndex(prophecyIndex);
      } catch (err) {
        console.error('Failed to load prophecy data for Master column:', err);
      }
    });
  }, [showHybrid, store]);

  // Ensure data loading is triggered when columns are enabled
  useColumnData();
  const isMobile = useIsMobile();
  const screenSize = useScreenSize();
  const responsiveConfig = useResponsiveColumns();

  // Get active labels from store for component logic
  const activeLabels = store.activeLabels || [];


  // Handle double-tap (but not double-tap-hold) to open Strong's overlay
  const handleDoubleTap = () => {
    logger.debug('WIN', `🔍 VirtualRow handleDoubleTap called for ${verse.reference}`);
    
    // Guard: Don't open Strong's overlay if text is currently selected
    const selection = window.getSelection();
    if (selection && selection.type === 'Range' && selection.toString().trim().length > 0) {
      logger.debug('WIN', `🔍 Text is selected, preventing Strong's overlay from opening`);
      return;
    }
    
    logger.debug('WIN', `🔍 onExpandVerse available:`, !!onExpandVerse);
    if (onExpandVerse) {
      logger.debug('WIN', `🔍 Calling onExpandVerse for ${verse.reference}`);
      onExpandVerse(verse);
    } else {
      logger.warn('WIN', `⚠️ onExpandVerse not available for ${verse.reference}`);
    }
  };


  // MEMORY OPTIMIZATION: Use precomputed visible columns from parent if available
  // This eliminates 220 rows × heavy array allocations on every render
  let visibleColumns: any[];
  
  if (visibleColumnsConfig && visibleColumnsConfig.length > 0) {
    // Use precomputed configuration from parent (massive memory savings!)
    visibleColumns = visibleColumnsConfig as any[];
  } else {
    // FALLBACK: Compute columns locally (only if parent didn't provide config)
    const slotConfig: Record<number, SlotConfig> = {};
    
    slotConfig[0] = { type: 'reference', header: '#', visible: true };
    slotConfig[1] = { type: 'notes', header: 'Notes', visible: showNotes };
    slotConfig[2] = { type: 'main-translation', header: mainTranslation, translationCode: mainTranslation, visible: true };
    
    if (columnState?.columns) {
      columnState.columns.forEach(col => {
        switch (col.slot) {
          case 1:
            slotConfig[1] = { type: 'notes', header: 'Notes', visible: col.visible && showNotes };
            break;
          case 2:
            slotConfig[2] = { type: 'main-translation', header: mainTranslation, translationCode: mainTranslation, visible: col.visible };
            break;
          case 15:
            slotConfig[15] = { type: 'cross-refs', header: 'Cross Refs', visible: col.visible && showCrossRefs };
            break;
          case 16:
            slotConfig[16] = { type: 'prophecy', header: 'Prophecy', visible: col.visible && showProphecies };
            break;
          case 19:
            slotConfig[19] = { type: 'hybrid', header: 'Master', visible: col.visible && showHybrid };
            break;
        }
      });
    }
    
    const activeAlternates = alternates.filter(translationCode => translationCode !== mainTranslation);
    activeAlternates.forEach((translationCode, index) => {
      const slotNumber = 3 + index;
      if (slotNumber <= 14) {
        slotConfig[slotNumber] = { 
          type: 'alt-translation', 
          header: translationCode, 
          translationCode, 
          visible: true
        };
      }
    });
    
    const getDefaultWidth = (slot: number): number => {
      switch (slot) {
        case 0: return 5;
        case 1: return 16;
        case 2: return 20;
        case 3: case 4: case 5: case 6: case 7: case 8: case 9: case 10:
        case 11: case 12: case 13: case 14: return 18;
        case 15: return 18;
        case 16: return 18;
        case 19: return 20;
        default: return 16;
      }
    };
    
    let allColumns = Object.entries(slotConfig)
      .map(([slotStr, config]) => ({
        slot: parseInt(slotStr),
        config,
        widthRem: getDefaultWidth(parseInt(slotStr)),
        visible: config?.visible !== false
      }))
      .filter(col => col.config && col.visible);
    
    if (columnState?.columns) {
      const slotToDisplayOrder = new Map();
      columnState.columns.forEach(col => {
        if (col.visible) {
          slotToDisplayOrder.set(col.slot, col.displayOrder);
        }
      });
      allColumns.forEach((col: any) => {
        col.displayOrder = slotToDisplayOrder.get(col.slot) ?? col.slot;
      });
      allColumns.sort((a: any, b: any) => (a.displayOrder ?? a.slot) - (b.displayOrder ?? b.slot));
    } else {
      allColumns.sort((a, b) => a.slot - b.slot);
    }
    
    const { getVisibleSlice } = useBibleStore();
    const visibleSlice = getVisibleSlice();
    const alwaysVisibleTypes = ['reference'];
    const alwaysVisibleColumns = allColumns.filter(col => alwaysVisibleTypes.includes(col.config?.type));
    const hybridColumn = allColumns.filter(col => col.config?.type === 'hybrid');
    const navigableColumns = allColumns.filter(col => !alwaysVisibleTypes.includes(col.config?.type) && col.config?.type !== 'hybrid');
    
    const shiftedNavigableColumns = navigableColumns.slice(visibleSlice.start, visibleSlice.end);
    visibleColumns = [...alwaysVisibleColumns, ...shiftedNavigableColumns, ...hybridColumn];
    
    visibleColumns = visibleColumns.map((col, index) => ({
      ...col,
      slot: index,
      originalSlot: col.slot
    }));
    
    // MOBILE-AWARE LAYOUT: Use mobile layout for ALL mobile devices (portrait and landscape)
    const isMobileDevice = window.innerWidth <= 1024;
    const isPortraitMode = window.innerHeight > window.innerWidth;
    const useMobileLayout = isMobileDevice; // True for both portrait and landscape on mobile
    
    if (useMobileLayout) {
      visibleColumns = visibleColumns.filter(col => col.config?.type !== 'context');
    }
  }

  // Helper function to get default widths per UI Layout Spec (aligned with columnLayout.ts)
  function getDefaultWidth(slot: number): number {
    switch (slot) {
      case 0: return 5;   // Reference
      case 1: return 16;  // Notes (canonical slot 1)
      case 2: return 20;  // Main translation (canonical slot 2)  
      case 3: case 4: case 5: case 6: case 7: case 8: case 9: case 10:
      case 11: case 12: case 13: case 14: return 18; // Alternate translations (slots 3-14)
      case 15: return 18; // Cross References (slot 15)
      case 16: return 18; // Unified Prophecy column (slot 16)
      case 19: return 20; // Master/Hybrid column (slot 19)
      default: return 16;
    }
  }

  // Debug logging for first verse
  if (verse.reference === "Gen 1:1") {
    logger.debug('WIN', '🔍 VirtualRow Debug - Translation state:', { mainTranslation, alternates });
    logger.debug('WIN', '🔍 VirtualRow Debug - Show states:', { showCrossRefs, showProphecies, showNotes, showDates });
    logger.debug('WIN', '🔍 VirtualRow Debug - Visible columns:', visibleColumns.map(c => `slot ${c.slot} (${c.config?.type}: ${c.config?.header})`));
    logger.debug('WIN', '🔍 VirtualRow Debug - Verse data:', { verseID: verse.id, reference: verse.reference });
    logger.debug('WIN', '🔍 VirtualRow Debug - onVerseClick handler:', !!onVerseClick);
    logger.debug('WIN', '🔍 VirtualRow Debug - Main verse text:', getMainVerseText(verse.reference));
    logger.debug('WIN', '🔍 VirtualRow Debug - Actual column keys being rendered:', visibleColumns.map(c => c.config?.type));
    logger.debug('WIN', '🔍 VirtualRow Debug - KJV verse text:', getVerseText(verse.reference, 'KJV'));

    // Debug cross-references data
    const { crossRefs } = useBibleStore.getState();
    logger.debug('WIN', '🔍 VirtualRow Debug - Cross refs for verse:', crossRefs[verse.reference]?.data);
    logger.debug('WIN', '🔍 VirtualRow Debug - All cross refs keys:', Object.keys(crossRefs).slice(0, 10));
  }

  const renderSlot = (column: any) => {
    const { slot, config, originalSlot } = column;
    const isMain = config.translationCode === mainTranslation;

    // 🎯 CELL RENDER LOGGING - Track each cell render
    const cellStartTime = performance.now();
    
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
        case 'prophecy':
          return 'prophecy';
        case 'alt-translation':
          return `alt-translation-${config.translationCode}`;
        case 'hybrid':
          return 'hybrid';
        default:
          return config.type;
      }
    };

    const columnId = getColumnId(config);

    // CELL RENDER LOGGING DISABLED FOR PERFORMANCE
    const logCellState = (cellType: string, dataState: string, dataDetails: any = {}) => {
      // Logging disabled for performance
    };

    // Use shared utility for consistent column width calculation with RowSkeleton
    // This ensures zero layout shift when skeleton→content swap happens
    const columnStyle = {
      width: getColumnWidthStyle(column),
      flexShrink: 0,
      boxSizing: 'border-box' as const
    };

    const bgClass = "";

    switch (config.type) {
      case 'reference':
        logCellState('reference', 'always-ready', { reference: verse.reference });
        
        return (
          <ReferenceCellWithOverflow 
            key={slot}
            slot={slot}
            verse={verse}
            columnStyle={columnStyle}
            config={config}
            columnId={columnId}
            showDates={showDates}
          />
        );

      case 'notes':
        logCellState('notes', 'user-data', { hasNotes: 'unknown' });
        
        return (
          <div 
            key={slot} 
            className="bible-column border-r border-gray-200 dark:border-gray-700" 
            style={columnStyle}
            data-column={config.type}
            data-col-key={columnId}
          >
            <ErrorBoundary componentName="NotesCell">
              <NotesCell verseRef={verse.reference} className="h-full" onVerseClick={onVerseClick} />
            </ErrorBoundary>
          </div>
        );

      case 'main-translation':
        const mainVerseText = getVerseText(verse.reference, mainTranslation);
        const hasMainText = !!mainVerseText && mainVerseText !== '';
        
        logCellState('main-translation', hasMainText ? 'loaded' : 'empty', {
          translation: mainTranslation,
          textLength: mainVerseText?.length || 0,
          hasText: hasMainText
        });
        
        // Extract bookmark data from columnData to avoid individual network requests
        const isMainVerseBookmarked = columnData?.isVerseBookmarked?.(verse.reference) || false;
        
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
              isBookmarked={isMainVerseBookmarked}
              bookmarksData={columnData?.bookmarksData}
              onExpandVerse={onExpandVerse}
              onOpenProphecy={onOpenProphecy}
              onNavigateToVerse={onNavigateToVerse}
            />
          </div>
        );

      case 'alt-translation':
        // Debug translation lookup for first verse
        if (verse.reference === "Gen 1:1") {
          logger.debug('WIN', '🔍 Translation Debug:', {
            verseRef: verse.reference,
            translationCode: config.translationCode,
            getVerseTextResult: getVerseText(verse.reference, config.translationCode),
            getMainVerseTextResult: getMainVerseText(verse.reference)
          });
        }

        // Alternate translations with labels support - NO KJV FALLBACK
        let verseText = getVerseText(verse.reference, config.translationCode) || '';
        const hasAltText = !!verseText && verseText !== '';
        
        logCellState('alt-translation', hasAltText ? 'loaded' : 'empty', {
          translation: config.translationCode,
          textLength: verseText?.length || 0,
          hasText: hasAltText
        });

        // Get labels for this verse if we have active labels
        const shouldUseLabeledText = activeLabels && activeLabels.length > 0;
        const verseLabels = shouldUseLabeledText && getVerseLabels ? getVerseLabels(verse.reference) : {};

        // Copy/bookmark/share handlers for alternate translations
        const handleAltCopy = () => {
          const text = `${verse.reference} (${config.translationCode}) - ${verseText}`;
          navigator.clipboard.writeText(text);
        };

        const handleAltBookmark = () => {
          logger.debug('WIN', `Bookmark verse: ${verse.reference} from ${config.translationCode}`);
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

        // Extract bookmark data from columnData to avoid individual network requests
        const isAltVerseBookmarked = columnData?.isVerseBookmarked?.(verse.reference) || false;
        
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
              onOpenProphecy={onOpenProphecy}
              onOpenStrongs={onExpandVerse ? () => onExpandVerse(verse) : undefined}
              onNavigateToVerse={onNavigateToVerse}
              wrapperClassName="h-full max-h-full"
              isBookmarked={isAltVerseBookmarked}
              bookmarksData={columnData?.bookmarksData}
            >
              <div className="px-2 py-1 text-sm cell-content h-full max-h-full overflow-y-auto">
                {verseText ? (
                  shouldUseLabeledText ? (
                    <span
                      data-verse-ref={verse.reference}
                      data-translation={config.translationCode}
                      className="verse-text"
                    >
                      <LabeledText
                        text={verseText}
                        labelData={verseLabels}
                        activeLabels={activeLabels}
                        verseKey={`${verse.reference}-${config.translationCode}`}
                        translationCode={config.translationCode}
                      />
                    </span>
                  ) : (
                    <VerseText
                      verseRef={verse.reference}
                      translation={config.translationCode}
                      text={verseText}
                    />
                  )
                ) : (
                  `[${config.translationCode} loading...]`
                )}
              </div>
            </HoverVerseBar>
          </div>
        );

      case 'cross-refs':
        const { crossRefs } = store;
        
        // Canonicalize verse reference for lookup in crossRefs store
        const canonicalizeVerseReference = (ref: string): string => {
          return ref.trim().replace(/\s+(\d+):/, '.$1:');
        };
        
        const canonicalVerseRef = canonicalizeVerseReference(verse.reference);
        const verseCrossRefStatus = crossRefs[canonicalVerseRef];
        const verseCrossRefs = verseCrossRefStatus?.data || [];
        const hasCrossRefs = verseCrossRefs.length > 0;
        
        // Debug logging for first few verses to understand key format mismatch
        if (verse.index != null && verse.index < 5) {
          logger.debug('WIN', `🔍 CROSSREF DEBUG [${verse.index}]:`, {
            originalRef: verse.reference,
            canonicalRef: canonicalVerseRef,
            foundInStore: !!verseCrossRefStatus,
            crossRefsData: verseCrossRefs.length,
            storeKeySample: Object.keys(crossRefs).slice(0, 5)
          });
        }
        
        
        logCellState('cross-refs', hasCrossRefs ? 'loaded' : 'empty', {
          refsCount: verseCrossRefs.length,
          hasRefs: hasCrossRefs,
          totalStoreSize: Object.keys(crossRefs).length
        });
        
        return (
          <div 
            key={slot} 
            className="bible-column columnGroup border-r border-gray-200 dark:border-gray-700 items-start" 
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

      case 'prophecy':
        const { prophecyData } = store;
        const prophecyRoles = prophecyData?.[verse.reference];
        const hasProphecyData = prophecyRoles && (
          (prophecyRoles.P && prophecyRoles.P.length > 0) ||
          (prophecyRoles.F && prophecyRoles.F.length > 0) ||
          (prophecyRoles.V && prophecyRoles.V.length > 0)
        );
        
        logCellState('prophecy', hasProphecyData ? 'loaded' : 'empty', {
          hasData: hasProphecyData,
          totalStoreSize: Object.keys(prophecyData || {}).length
        });
        
        return (
          <div 
            key={slot} 
            className="bible-column border-r border-gray-200 dark:border-gray-700 items-start" 
            style={columnStyle}
            data-column={config.type}
            data-col-key={columnId}
          >
            {prophecyRoles ? (
              <div className="cell-content h-full">
                <UnifiedProphecyCell
                  prophecyRoles={prophecyRoles}
                  getVerseText={getVerseText}
                  getVerseLabels={getVerseLabels}
                  mainTranslation={mainTranslation}
                  onVerseClick={onVerseClick}
                />
              </div>
            ) : (
              <div className="px-2 py-1 text-sm cell-content">
                <div className="text-gray-400 text-center text-sm">—</div>
              </div>
            )}
          </div>
        );

      case 'hybrid':
        // Placeholder column to maintain grid layout
        // Actual Master column is rendered as persistent overlay in VirtualBibleTable
        return (
          <div 
            key={slot} 
            className="bible-column master-column-placeholder" 
            style={{
              ...columnStyle,
              height: `${rowHeight}px`,
            }}
            data-column={config.type}
            data-col-key={columnId}
          />
        );

      default:
        return null;
    }
  };

  // Calculate actual total width using CSS variables - SYNC with NewColumnHeaders
  const actualTotalWidth = useMemo(() => {
    if (typeof window === 'undefined') return 0;
    
    let totalWidth = 0;
    
    visibleColumns.forEach(col => {
      const config = col.config;
      if (!config || !config.visible) return;
      
      let columnWidth = 0;
      
      // Use the same CSS variable logic as NewColumnHeaders
      switch (config.type) {
        case 'reference':
          // Get reference width from CSS variable
          const refWidthVar = getComputedStyle(document.documentElement).getPropertyValue('--adaptive-ref-width').trim();
          columnWidth = refWidthVar ? parseInt(refWidthVar) : 50;
          break;
          
        case 'main-translation':
          // Get main translation width from CSS variable
          const mainWidthVar = getComputedStyle(document.documentElement).getPropertyValue('--adaptive-main-width').trim();
          columnWidth = mainWidthVar ? parseInt(mainWidthVar) : 300;
          break;
          
        case 'cross-refs':
          // Get cross-refs width from CSS variable
          const crossWidthVar = getComputedStyle(document.documentElement).getPropertyValue('--adaptive-cross-width').trim();
          columnWidth = crossWidthVar ? parseInt(crossWidthVar) : 300;
          break;
          
        case 'alt-translation':
        case 'prophecy':
        case 'notes':
        case 'hybrid':
          // All other columns use the same width as main translation
          const standardWidthVar = getComputedStyle(document.documentElement).getPropertyValue('--adaptive-main-width').trim();
          columnWidth = standardWidthVar ? parseInt(standardWidthVar) : 300;
          break;
          
        default:
          columnWidth = 300; // fallback
          break;
      }
      
      totalWidth += columnWidth;
    });
    
    
    return totalWidth;
  }, [visibleColumns]);

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

  // Check if this verse is at a context boundary for divider rendering
  const shouldShowContextDivider = showContext && isContextEnd(verse.reference);

  // RESPONSIVE COLUMN WIDTHS - Optimize space utilization
  return (
    <>
      <div 
        className="border-b border-gray-200 dark:border-gray-700 bible-verse-row"
        style={{ 
          height: rowHeight,
          width: needsHorizontalScroll ? `${actualTotalWidth}px` : '100%',
          minWidth: `${responsiveMinWidth}px`,
          display: 'flex',
          gap: 0,
          padding: 0
        }}
        data-verse-ref={verse.reference}
        data-center-index={isCenterRow ? rowIndex : undefined}
        onDoubleClick={handleDoubleTap}
      >
        {/* Fixed-width layout - all columns maintain exact widths */}
        {visibleColumns.map(renderSlot)}
      </div>

      {/* Context Group Divider - Blue line when at context boundary */}
      {shouldShowContextDivider && (
        <div 
          className="context-divider w-full"
          style={{
            height: '3px',
            backgroundColor: '#3b82f6', // Blue color matching the image
            margin: '0',
            flexShrink: 0
          }}
          data-context-boundary={verse.reference}
        />
      )}
    </>
  );
};

// Memoize VirtualRow to prevent cascade re-renders
// Only re-render when actual verse data or critical display props change
const MemoizedVirtualRow = React.memo(VirtualRow, (prevProps, nextProps) => {
  // Re-render if verse ID changed (different verse entirely)
  if (prevProps.verseID !== nextProps.verseID) return false;
  
  // Re-render if row index changed (scroll position changed)
  if (prevProps.rowIndex !== nextProps.rowIndex) return false;
  
  // Re-render if center verse changed (affects hybrid column highlighting)
  if (prevProps.centerVerseRef !== nextProps.centerVerseRef) return false;
  
  // Re-render if row height changed (presentation mode toggle)
  if (prevProps.rowHeight !== nextProps.rowHeight) return false;
  
  // Re-render if main translation changed
  if (prevProps.mainTranslation !== nextProps.mainTranslation) return false;
  
  // Re-render if active translations array changed (shallow compare by reference)
  if (prevProps.activeTranslations !== nextProps.activeTranslations) return false;
  
  // Re-render if translations version changed (new translation data loaded)
  if (prevProps.translationsVersion !== nextProps.translationsVersion) return false;
  
  // Re-render if columnData reference changed (parent should memoize this)
  if (prevProps.columnData !== nextProps.columnData) return false;
  
  // Re-render if sticky header offset changed (orientation/resize)
  if (prevProps.stickyHeaderOffset !== nextProps.stickyHeaderOffset) return false;
  
  // CRITICAL: Re-render if visible columns config changed (column navigation/toggling)
  if (prevProps.visibleColumnsConfig !== nextProps.visibleColumnsConfig) return false;
  
  // Functions should be stable (parent should wrap in useCallback)
  // We check reference equality - if parent doesn't memoize, we re-render
  if (prevProps.getVerseText !== nextProps.getVerseText) return false;
  if (prevProps.getMainVerseText !== nextProps.getMainVerseText) return false;
  if (prevProps.onVerseClick !== nextProps.onVerseClick) return false;
  if (prevProps.getVerseLabels !== nextProps.getVerseLabels) return false;
  if (prevProps.onOpenProphecy !== nextProps.onOpenProphecy) return false;
  if (prevProps.onNavigateToVerse !== nextProps.onNavigateToVerse) return false;
  
  // If all checks passed, props are equal - skip re-render
  return true;
});

MemoizedVirtualRow.displayName = 'VirtualRow';

export default MemoizedVirtualRow;

interface TranslationCellProps {
  verse: BibleVerse;
  translation: string;
  getVerseText: (verseID: string, translationCode: string) => string | undefined;
  isMain?: boolean;
}

function TranslationCell({ verse, translation, getVerseText, isMain }: TranslationCellProps) {
  const verseText = getVerseText(verse.reference, translation) ?? verse.text?.[translation] ?? "";

  return (
    <div 
      className={`${isMain ? 'cell-main' : 'cell-alt'} px-2 py-1 text-sm flex-shrink-0 overflow-hidden`}
      data-column={isMain ? "main-translation" : "alt-translation"}
    >
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