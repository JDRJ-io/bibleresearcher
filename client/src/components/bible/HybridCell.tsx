import React, { useMemo } from 'react';
import { BibleVerse } from '../../types/bible';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from '@/store/translationSlice';
import { useNotes } from '@/hooks/useNotes';
import LabeledText from './LabeledText';
import { LabelName } from '@/lib/labelBits';
import { VerseText } from '@/components/highlights/VerseText';
import { HoverVerseBar } from './HoverVerseBar';
import { NotesCell } from '@/components/user/NotesCell';

interface HybridCellProps {
  centerVerseRef: string;
  getVerseText: (verseID: string, translationCode: string) => string | undefined;
  mainTranslation: string;
  onVerseClick?: (verseRef: string) => void;
  getVerseLabels?: (verseReference: string) => Record<string, string[]>;
  onNavigateToVerse?: (ref: string) => void;
}

export function HybridCell({ 
  centerVerseRef, 
  getVerseText, 
  mainTranslation,
  onVerseClick, 
  getVerseLabels,
  onNavigateToVerse
}: HybridCellProps) {
  const store = useBibleStore();
  const { alternates } = useTranslationMaps();
  
  // Get notes for center verse
  const { notes: centerNotes } = useNotes(centerVerseRef);
  
  const {
    crossRefs,
    prophecyData,
    prophecyIndex,
    collapsedProphecies,
    toggleProphecyCollapse,
    activeLabels,
    showNotes,
    datesData
  } = store;

  // Get all data for the center verse
  // centerVerseRef is already passed as a prop
  
  // Main verse text
  const mainVerseText = getVerseText(centerVerseRef, mainTranslation) || '';

  // Cross-references for center verse
  const centerCrossRefs = crossRefs[centerVerseRef]?.data || [];

  // Prophecy data for center verse
  const centerProphecyRoles = prophecyData?.[centerVerseRef];
  const hasGottProphecyData = centerProphecyRoles && (
    (centerProphecyRoles.P && centerProphecyRoles.P.length > 0) ||
    (centerProphecyRoles.F && centerProphecyRoles.F.length > 0) ||
    (centerProphecyRoles.V && centerProphecyRoles.V.length > 0)
  );

  // Date data for center verse - we need to get the verse index
  // For now, use empty string until we connect to BibleDataAPI
  let centerDateText = "";

  // Helper function to render text with labels
  const renderTextWithLabels = (text: string, reference: string) => {
    if (!text) return '—';

    if (!activeLabels || activeLabels.length === 0) {
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
    if (getVerseLabels) {
      const verseLabels = getVerseLabels(reference);
      activeLabels.forEach((labelName) => {
        if (verseLabels[labelName]) {
          labelData[labelName as LabelName] = verseLabels[labelName];
        }
      });
    }

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

  const handleCopy = () => {
    const text = `${centerVerseRef} (${mainTranslation}) - ${mainVerseText}`;
    navigator.clipboard.writeText(text);
  };

  const handleBookmark = () => {
    console.log('Bookmark verse:', centerVerseRef);
  };

  const handleShare = () => {
    const text = `${centerVerseRef} (${mainTranslation}) - ${mainVerseText}`;
    if (navigator.share) {
      navigator.share({
        title: `${centerVerseRef} (${mainTranslation})`,
        text: text,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div 
      className="px-2 py-1 text-sm cell-content h-full max-h-full overflow-y-auto glass-morphism"
      style={{
        touchAction: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
      <div className="space-y-3">
        {/* Center Verse Reference Header */}
        <div className="border-b border-gray-300 dark:border-gray-600 pb-1">
          <div className="font-bold text-blue-600 dark:text-blue-400 text-base">
            📍 {centerVerseRef}
          </div>
          {centerDateText && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              📅 {centerDateText}
            </div>
          )}
        </div>

        {/* Main Translation Text */}
        <div className="space-y-1">
          <div className="font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            {mainTranslation}
          </div>
          <HoverVerseBar
            verse={{ 
              id: centerVerseRef,
              reference: centerVerseRef,
              book: centerVerseRef.split('.')[0] || '',
              chapter: parseInt(centerVerseRef.split('.')[1]?.split(':')[0] || '0'),
              verse: parseInt(centerVerseRef.split(':')[1] || '0'),
              text: { [mainTranslation]: mainVerseText }
            }}
            translation={mainTranslation}
            onCopy={handleCopy}
            onBookmark={handleBookmark}
            onShare={handleShare}
            onNavigateToVerse={onNavigateToVerse}
            wrapperClassName="h-auto"
            isBookmarked={false}
          >
            <div className="text-sm leading-relaxed">
              {renderTextWithLabels(mainVerseText, centerVerseRef)}
            </div>
          </HoverVerseBar>
        </div>

        {/* Alternate Translations */}
        {alternates.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              📖 Alternate Translations
            </div>
            {alternates.slice(0, 2).map((translation) => { // Limit to 2 for space
              const altText = getVerseText(centerVerseRef, translation) || '';
              if (!altText) return null;
              
              return (
                <div key={translation} className="space-y-1">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {translation}
                  </div>
                  <div className="text-sm leading-tight">
                    {renderTextWithLabels(altText, centerVerseRef)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cross References */}
        {centerCrossRefs.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              🔗 Cross References ({centerCrossRefs.length})
            </div>
            <div className="space-y-1">
              {centerCrossRefs.slice(0, 3).map((ref, i) => { // Limit to 3 for space
                const refText = getVerseText(ref, mainTranslation) || '';
                return (
                  <div key={i} className="text-sm">
                    <button
                      type="button"
                      className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onVerseClick && onVerseClick(ref);
                      }}
                    >
                      {ref}
                    </button>
                    {refText && (
                      <div className="text-xs leading-tight mt-0.5">
                        {refText.length > 100 ? (
                          <>
                            {renderTextWithLabels(refText.substring(0, 100), ref)}...
                          </>
                        ) : (
                          renderTextWithLabels(refText, ref)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {centerCrossRefs.length > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                  +{centerCrossRefs.length - 3} more references
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prophecy Data */}
        {hasGottProphecyData && (
          <div className="space-y-2">
            <div className="font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              🔮 Prophecies
            </div>
            {(() => {
              // Get ALL prophecy IDs that touch this verse in ANY role
              const allProphecyIds = [
                ...(centerProphecyRoles.P || []),
                ...(centerProphecyRoles.F || []),
                ...(centerProphecyRoles.V || [])
              ];
              const uniqueProphecyIds = Array.from(new Set(allProphecyIds));

              return uniqueProphecyIds.slice(0, 2).map((prophecyId) => { // Limit to 2 for space
                const prophecyDetails = prophecyIndex?.[prophecyId];
                if (!prophecyDetails) return null;

                const isCollapsed = collapsedProphecies.has(String(prophecyId));

                return (
                  <div key={prophecyId} className="space-y-1">
                    <button
                      onClick={() => toggleProphecyCollapse(String(prophecyId))}
                      className="w-full text-left text-sm"
                    >
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 mr-1">
                        {prophecyId}.
                      </span>
                      <span className="text-sm leading-tight">
                        {prophecyDetails.summary}
                      </span>
                    </button>
                    {!isCollapsed && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                        {prophecyDetails.prophecy.length > 0 && (
                          <div>P: {prophecyDetails.prophecy.slice(0, 2).join(', ')}</div>
                        )}
                        {prophecyDetails.fulfillment.length > 0 && (
                          <div>F: {prophecyDetails.fulfillment.slice(0, 2).join(', ')}</div>
                        )}
                        {prophecyDetails.verification.length > 0 && (
                          <div>V: {prophecyDetails.verification.slice(0, 2).join(', ')}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* Notes Section */}
        {showNotes && (
          <div className="space-y-1">
            <div className="font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              📝 Notes
            </div>
            <div className="h-20 min-h-20"> {/* Fixed height for notes */}
              <NotesCell 
                verseRef={centerVerseRef}
                onVerseClick={onVerseClick}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}