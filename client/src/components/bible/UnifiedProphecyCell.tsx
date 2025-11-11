import React, { useState, useMemo } from 'react';
import { useBibleStore } from '@/App';
import { VerseText } from '@/components/highlights/VerseText';
import LabeledText from './LabeledText';
import { LabelName } from '@/lib/labelBits';
import { expandVerseRange, getFirstVerseFromRange, isVerseRange } from '@/lib/verseRangeUtils';

interface UnifiedProphecyCellProps {
  prophecyRoles: { P?: number[]; F?: number[]; V?: number[] };
  getVerseText: (verseID: string, translationCode: string) => string | undefined;
  getVerseLabels?: (verseReference: string) => Record<string, string[]>;
  mainTranslation: string;
  onVerseClick?: (verseRef: string) => void;
}

export function UnifiedProphecyCell({ 
  prophecyRoles,
  getVerseText,
  getVerseLabels, 
  mainTranslation,
  onVerseClick
}: UnifiedProphecyCellProps) {
  const { activeLabels } = useBibleStore();
  const [selectedProphecyIndex, setSelectedProphecyIndex] = useState(0);
  const [prophecyTableOffset, setProphecyTableOffset] = useState(0);
  const [visibleVerseCount, setVisibleVerseCount] = useState(20); // Start with 20 verses
  const store = useBibleStore();

  const uniqueProphecies = useMemo(() => {
    if (!prophecyRoles || !store.prophecyIndex) return [];

    const allProphecyIds = [
      ...(prophecyRoles.P || []),
      ...(prophecyRoles.F || []),
      ...(prophecyRoles.V || [])
    ];
    const uniqueProphecyIds = Array.from(new Set(allProphecyIds));

    return uniqueProphecyIds.map(id => ({
      id,
      data: store.prophecyIndex?.[id]
    })).filter(p => p.data);
  }, [prophecyRoles, store.prophecyIndex]);

  const prophecyColumns = useMemo(() => {
    if (uniqueProphecies.length === 0) {
      return [
        { title: 'Prediction', verses: [] },
        { title: 'Fulfillment', verses: [] },
        { title: 'Verification', verses: [] }
      ];
    }

    const selectedProphecy = uniqueProphecies[selectedProphecyIndex];
    if (!selectedProphecy?.data) {
      return [
        { title: 'Prediction', verses: [] },
        { title: 'Fulfillment', verses: [] },
        { title: 'Verification', verses: [] }
      ];
    }

    return [
      { title: 'Prediction', verses: selectedProphecy.data.prophecy || [] },
      { title: 'Fulfillment', verses: selectedProphecy.data.fulfillment || [] },
      { title: 'Verification', verses: selectedProphecy.data.verification || [] }
    ];
  }, [uniqueProphecies, selectedProphecyIndex]);

  // Helper function to render text with labels
  const renderTextWithLabels = (text: string, reference: string) => {
    if (!text) return '—';

    // If no active labels or no label function, use plain VerseText
    if (!activeLabels || activeLabels.length === 0 || !getVerseLabels) {
      return (
        <VerseText
          verseRef={reference}
          translation={mainTranslation}
          text={text}
        />
      );
    }

    // Get labels for this verse
    const labelData: Partial<Record<LabelName, string[]>> = {};
    const verseLabels = getVerseLabels(reference);
    activeLabels.forEach((labelName) => {
      if (verseLabels[labelName]) {
        labelData[labelName as LabelName] = verseLabels[labelName];
      }
    });

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

  if (uniqueProphecies.length === 0) {
    return (
      <div className="text-gray-400 text-center text-sm">—</div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-scroll prophecy-cell-scroll">
      {/* Prophecy Number and Summary Header */}
      <div className="bg-gray-50 dark:bg-gray-900 px-1 py-0.5 border-b border-gray-300 dark:border-gray-600">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-800 dark:text-gray-200" style={{ fontSize: 'calc(11px * var(--text-size-mult, 1))' }}>
              Prophecy #{uniqueProphecies[selectedProphecyIndex]?.id}
            </div>
            <div className="text-gray-600 dark:text-gray-400 mt-0.5 break-words" style={{ fontSize: 'calc(10px * var(--text-size-mult, 1))' }}>
              {uniqueProphecies[selectedProphecyIndex]?.data?.summary}
            </div>
          </div>
          {uniqueProphecies.length > 1 && (
            <div className="flex gap-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedProphecyIndex(Math.max(0, selectedProphecyIndex - 1));
                  setProphecyTableOffset(0);
                  setVisibleVerseCount(20);
                }}
                disabled={selectedProphecyIndex === 0}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                data-testid="prophecy-prev"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedProphecyIndex(Math.min(uniqueProphecies.length - 1, selectedProphecyIndex + 1));
                  setProphecyTableOffset(0);
                  setVisibleVerseCount(20);
                }}
                disabled={selectedProphecyIndex === uniqueProphecies.length - 1}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                data-testid="prophecy-next"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Prediction/Fulfillment/Verification Tabs - Sticky */}
      <div className="flex border-b border-gray-300 dark:border-gray-600 sticky top-0 z-10 bg-white dark:bg-gray-900">
        {prophecyColumns.map((col, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setProphecyTableOffset(idx);
              setVisibleVerseCount(20);
            }}
            className={`flex-1 px-1 py-0.5 font-bold transition-colors ${
              prophecyTableOffset === idx
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            style={{ fontSize: 'calc(11px * var(--text-size-mult, 1))' }}
            data-testid={`prophecy-tab-${col.title.toLowerCase()}`}
          >
            {col.title}
          </button>
        ))}
      </div>
      
      {/* Tab Content - Progressive Loading */}
      <div>
        {prophecyColumns[prophecyTableOffset].verses.length > 0 ? (
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {prophecyColumns[prophecyTableOffset].verses.slice(0, visibleVerseCount).map((verseRef, i) => {
                // Check if this is a verse range (e.g., "Gen.7:17-23")
                const isRange = isVerseRange(verseRef);
                const displayRef = verseRef;
                const navigationRef = isRange ? getFirstVerseFromRange(verseRef) : verseRef;
                
                // For ranges, expand to get all verse references and combine their text
                const verseRefs = isRange ? expandVerseRange(verseRef) : [verseRef];
                
                return (
                  <div 
                    key={i} 
                    className="px-1 py-0.5 space-y-0.5"
                  >
                    <button
                      type="button"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-mono font-semibold"
                      style={{ fontSize: 'calc(13px * var(--text-size-mult, 1))' }}
                      onClick={() => onVerseClick?.(navigationRef)}
                      data-testid={`prophecy-${prophecyColumns[prophecyTableOffset].title.toLowerCase()}-${i}`}
                      title={isRange ? `Jump to ${navigationRef}` : undefined}
                    >
                      {displayRef}
                    </button>
                    <div className="leading-tight whitespace-normal break-words">
                      {verseRefs.map((singleVerseRef, verseIdx) => {
                        const verseText = getVerseText(singleVerseRef, mainTranslation) || '';
                        if (!verseText) return null;
                        
                        return (
                          <span key={verseIdx}>
                            {verseIdx > 0 && ' '}
                            {renderTextWithLabels(verseText, singleVerseRef)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {visibleVerseCount < prophecyColumns[prophecyTableOffset].verses.length && (
              <div className="px-1 py-2 text-center border-t border-gray-300 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => setVisibleVerseCount(prev => prev + 20)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  data-testid="load-more-verses"
                >
                  Load {Math.min(20, prophecyColumns[prophecyTableOffset].verses.length - visibleVerseCount)} more verses ({prophecyColumns[prophecyTableOffset].verses.length - visibleVerseCount} remaining)
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="px-1 py-0.5 text-gray-500 dark:text-gray-400 text-center italic" style={{ fontSize: 'calc(11px * var(--text-size-mult, 1))' }}>None</div>
        )}
      </div>
    </div>
  );
}
