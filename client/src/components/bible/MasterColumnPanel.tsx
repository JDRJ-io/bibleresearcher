 import React, { useEffect, useState } from 'react';
import { useBibleStore } from '@/App';
import { getBibleMetadata, loadBibleMetadata, parseVerseRanges, BibleMetadata } from '@/lib/bibleMetadataLoader';
import type { InterlinearCell } from '@/lib/strongsVerses_fetch';
import { UnifiedProphecyCell } from './UnifiedProphecyCell';
import { useMasterColumnStore, type MasterColumnSectionId } from '@/stores/masterColumnStore';
import { VerseText } from '@/components/highlights/VerseText';
import LabeledText from './LabeledText';
import { LabelName } from '@/lib/labelBits';

interface MasterColumnPanelProps {
  verseRef: string;
  getVerseText: (verseID: string, translationCode: string) => string | undefined;
  getVerseLabels?: (verseReference: string) => Record<string, string[]>;
  mainTranslation: string;
  alternateTranslations?: string[];
  onVerseClick?: (verseRef: string) => void;
  crossRefs?: string[];
  strongsWords?: InterlinearCell[];
  prophecyRoles?: { P?: number[]; F?: number[]; V?: number[] };
  onStrongsClick?: (verseRef: string, strongsKey: string) => void;
}

interface FixedSectionProps {
  title: string;
  content: string | React.ReactNode;
  isEmpty?: boolean;
  scrollable?: boolean;
}

const FixedSection: React.FC<FixedSectionProps> = ({ 
  title, 
  content, 
  isEmpty = false, 
  scrollable = false 
}) => {
  return (
    <div 
      className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-3 flex flex-col"
    >
      <div 
        className="font-semibold opacity-70 text-gray-700 dark:text-gray-300 mb-1"
        style={{ fontSize: 'calc(11px * var(--text-size-mult, 1))' }}
      >
        {title}
      </div>
      <div 
        className={`leading-snug text-gray-900 dark:text-gray-100 ${
          scrollable ? 'overflow-y-auto' : ''
        } ${isEmpty ? 'text-gray-400 dark:text-gray-600 italic' : ''}`}
        style={{ fontSize: isEmpty ? 'calc(10px * var(--text-size-mult, 1))' : 'calc(13px * var(--text-size-mult, 1))' }}
      >
        {isEmpty ? 'No data available' : content}
      </div>
    </div>
  );
};

export function MasterColumnPanel({ 
  verseRef,
  getVerseText,
  getVerseLabels, 
  mainTranslation,
  alternateTranslations = [],
  onVerseClick,
  crossRefs = [],
  strongsWords = [],
  prophecyRoles,
  onStrongsClick
}: MasterColumnPanelProps) {
  const { activeLabels } = useBibleStore();
  const [metadata, setMetadata] = useState<BibleMetadata | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const { sectionVisibility } = useMasterColumnStore();

  // Load metadata after hooks
  useEffect(() => {
    loadBibleMetadata().then(() => {
      setIsLoaded(true);
      setMetadata(getBibleMetadata(verseRef));
    });
  }, [verseRef]);

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

  // Helper functions
  const handleStrongsClick = (strongsNumber: string) => {
    console.log('Strong\'s clicked:', strongsNumber, 'for verse:', verseRef);
    if (onStrongsClick) {
      onStrongsClick(verseRef, strongsNumber);
    }
  };

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const verseText = getVerseText(verseRef, mainTranslation);
  const verseRanges = metadata?.verificationVerses ? parseVerseRanges(metadata.verificationVerses) : [];

  // Helper to render section if visible
  const renderSection = (
    sectionId: MasterColumnSectionId,
    title: string,
    content: React.ReactNode,
    hasData: boolean,
    scrollable: boolean = false
  ) => {
    if (!sectionVisibility[sectionId]) return null;
    
    return (
      <FixedSection
        title={title}
        content={content}
        isEmpty={!hasData}
        scrollable={scrollable}
      />
    );
  };

  return (
    <div className="h-full w-full overflow-y-auto master-column-scroll px-1 py-2">
      {/* Verse Reference */}
      {renderSection(
        'verse-reference',
        `Verse: ${verseRef}`,
        verseText ? renderTextWithLabels(verseText, verseRef) : 'Loading verse...',
        !!verseText,
        false
      )}

      {/* Date & Place */}
      {renderSection(
        'date-place',
        'Date & Place Written',
        metadata ? (
          <span className="verse-text" style={{ userSelect: 'text', cursor: 'text' }}>
            {metadata.dateWritten}{metadata.placeWritten ? `, ${metadata.placeWritten}` : ''}
          </span>
        ) : '',
        !!metadata,
        false
      )}
      
      {/* Author & Audience */}
      {renderSection(
        'author-audience',
        'Author & Audience',
        metadata ? (
          <span className="verse-text" style={{ userSelect: 'text', cursor: 'text' }}>
            {metadata.authors}{metadata.audienceContext ? `; ${metadata.audienceContext}` : ''}
          </span>
        ) : '',
        !!metadata,
        false
      )}
      
      {/* Verses of Authorship */}
      {renderSection(
        'authorship-verses',
        'Verses of Authorship',
        <div className="space-y-2">
          {verseRanges.map((range, i) => {
            return (
              <div key={i}>
                <button
                  type="button"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-mono font-semibold"
                  style={{ fontSize: 'calc(13px * var(--text-size-mult, 1))' }}
                  onClick={() => range.refs[0] && onVerseClick?.(range.refs[0])}
                  data-testid={`verse-authorship-${i}`}
                >
                  {range.display}
                </button>
                <div className="mt-0.5 leading-tight">
                  {range.refs.map((ref, verseIdx) => {
                    const text = getVerseText(ref, mainTranslation);
                    if (!text) return null;
                    return (
                      <span key={verseIdx}>
                        {verseIdx > 0 && ' '}
                        {renderTextWithLabels(text, ref)}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>,
        verseRanges.length > 0,
        true
      )}

      {/* Strong's Analysis */}
      {renderSection(
        'strongs-analysis',
        "Strong's Analysis",
        <div className="overflow-y-auto max-h-[300px] -mx-1 px-1">
          <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-2 pb-2">
            {strongsWords.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleStrongsClick(item.strongsKey)}
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 px-2 py-2 rounded-lg cursor-pointer transition-colors aspect-square flex flex-col items-center justify-center text-center"
                data-testid={`strongs-block-${item.strongsKey}`}
                style={{ fontSize: 'calc(11px * var(--text-size-mult, 1))' }}
              >
                <div className="flex flex-col gap-1 w-full overflow-hidden">
                  <div 
                    className="font-bold text-gray-900 dark:text-gray-100 leading-tight truncate"
                    style={{ fontSize: 'calc(22px * var(--text-size-mult, 1))' }}
                    title={item.original}
                  >
                    {item.original}
                  </div>
                  {item.gloss && (
                    <div 
                      className="font-semibold text-green-700 dark:text-green-400 leading-tight line-clamp-2"
                      style={{ fontSize: 'calc(14px * var(--text-size-mult, 1))' }}
                      title={item.gloss}
                    >
                      {item.gloss}
                    </div>
                  )}
                  {item.morphology && (
                    <div 
                      className="text-gray-600 dark:text-gray-400 leading-tight mt-0.5 truncate"
                      style={{ fontSize: 'calc(10px * var(--text-size-mult, 1))' }}
                      title={item.morphology}
                    >
                      {item.morphology}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>,
        strongsWords.length > 0,
        false
      )}

      {/* Cross References */}
      {renderSection(
        'cross-references',
        'Cross References',
        <div className="space-y-2">
          {crossRefs.map((item, i) => {
            const verses = item.includes('#') ? item.split('#') : [item];
            const displayRef = verses.length > 1 
              ? `${verses[0]}-${verses[verses.length - 1].split(':')[1] || verses[verses.length - 1]}`
              : verses[0];
            
            return (
              <div key={i}>
                <button
                  type="button"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-mono font-semibold"
                  style={{ fontSize: 'calc(13px * var(--text-size-mult, 1))' }}
                  onClick={() => onVerseClick?.(verses[0])}
                  data-testid={`cross-ref-${i}`}
                >
                  {displayRef}
                </button>
                <div className="mt-0.5 leading-tight">
                  {verses.map((verseRef, verseIdx) => {
                    const text = getVerseText(verseRef, mainTranslation);
                    if (!text) return null;
                    return (
                      <span key={verseIdx}>
                        {verseIdx > 0 && ' '}
                        {renderTextWithLabels(text, verseRef)}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>,
        crossRefs.length > 0,
        true
      )}

      {/* Prophecy */}
      {renderSection(
        'prophecy',
        'Prophecy',
        <UnifiedProphecyCell
          prophecyRoles={prophecyRoles!}
          getVerseText={getVerseText}
          getVerseLabels={getVerseLabels}
          mainTranslation={mainTranslation}
          onVerseClick={onVerseClick}
        />,
        !!prophecyRoles,
        false
      )}
    </div>
  );
}
