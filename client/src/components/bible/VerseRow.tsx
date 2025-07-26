import type { BibleVerse, Translation, UserNote, Highlight } from '@/types/bible';
import { ProphecyColumns } from './ProphecyColumns';
import { useBibleStore } from '@/App';
import { getLabel, LabelName, ensureLabelCacheLoaded, getLabelsForVerses } from '@/lib/labelsCache';
import { useEffect, useMemo } from 'react';
import { LabeledText } from './LabeledText';
import { useLabeledText } from '@/hooks/useLabeledText';

interface VerseRowProps {
  verse: BibleVerse;
  verseIndex: number;
  selectedTranslations: Translation[];
  showNotes: boolean;
  showProphecy: boolean;
  showContext: boolean;
  userNote?: UserNote;
  highlights: Highlight[];
  onExpandVerse: (verse: BibleVerse) => void;
  onHighlight: (verseRef: string, selection: Selection) => void;
  onNavigateToVerse: (reference: string) => void;
  getProphecyDataForVerse?: (verseKey: string) => any[];
  getGlobalVerseText?: (reference: string) => string;
  allVerses: BibleVerse[]; // Add verses for text lookup
}

export function VerseRow({
  verse,
  verseIndex,
  selectedTranslations,
  showNotes,
  showProphecy,
  showContext,
  userNote,
  highlights,
  onExpandVerse,
  onHighlight,
  onNavigateToVerse,
  getProphecyDataForVerse,
  getGlobalVerseText,
  allVerses,
}: VerseRowProps) {
  const { store, activeLabels, translationState } = useBibleStore();
  
  // Use main translation from Bible store for consistency
  const mainTranslation = translationState.main;
  
  // Labels are now loaded at the viewport level, not per verse

  // Create preferences object for consistency
  const preferences = {
    showNotes,
    showProphecy,
    showContext,
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`🔍 VerseRow double-click for ${verse.reference} - opening Strong's overlay`);
    console.log(`🔍 Full verse object:`, { 
      id: verse.id, 
      reference: verse.reference, 
      book: verse.book, 
      chapter: verse.chapter, 
      verse: verse.verse 
    });
    onExpandVerse(verse);
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      onHighlight(verse.reference, selection);
    }
  };

  return (
    <div 
      id={`verse-${verse.id}`}
      data-verse-ref={verse.reference}
      data-verse-index={verseIndex}
      className="verse-row flex min-w-full border-b transition-colors duration-200 cursor-pointer"
      style={{ height: '120px' }}
      onDoubleClick={handleDoubleClick}
      onMouseUp={handleMouseUp}
    >
      {/* Reference Column - Fixed Width with vertical text */}
      <div className="w-12 flex-shrink-0 flex items-center justify-center border-r px-1 text-xs font-medium">
        <span className="transform -rotate-90 whitespace-nowrap origin-center text-center">
          {verse.reference}
        </span>
      </div>

      {/* Translation Text Columns - Dynamic based on selected translations */}
      {selectedTranslations.map((translation) => {
        const verseText = verse.text[translation.id];
        
        // Get label data for this verse using viewport labels hook
        const labelData = useMemo(() => {
          const data: Partial<Record<LabelName, string[]>> = {};
          
          // Only populate active labels to avoid unnecessary processing
          activeLabels.forEach((labelName: LabelName) => {
            const labelValues = getLabel(translation.id, verse.reference, labelName);
            if (labelValues.length > 0) {
              data[labelName] = labelValues;
            }
          });
          
          return data;
        }, [translation.id, verse.reference, activeLabels]);
        
        // Process text with labels if we have both text and active labels
        const segments = useLabeledText({
          text: verseText || '',
          labelData,
          activeLabels: activeLabels || [],
          verseKey: verse.reference,
          translationCode: translation.id
        });
        
        return (
          <div key={translation.id} className="w-80 flex-shrink-0 border-r">
            <div className="h-[120px] overflow-y-auto p-3 text-sm">
              <div className="whitespace-pre-wrap break-words leading-relaxed">
                {verseText ? (
                  activeLabels.length > 0 ? (
                    segments.map((segment, index) => (
                      <LabeledText
                        key={index}
                        text={segment.text}
                        mask={segment.mask}
                        segmentKey={index}
                      />
                    ))
                  ) : (
                    verseText
                  )
                ) : (
                  <span className="text-muted-foreground italic">
                    [{verse.reference} - {translation.abbreviation} loading...]
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Cross References Column - Fixed Width (matches translation columns) */}
      <div className="w-80 flex-shrink-0 border-r">
        <div className="h-[120px] overflow-y-auto p-3 text-xs">
          {/* Cross-reference badge */}
          <div className="flex items-center gap-2 mb-2">
            {(() => {
              const dotFormat = verse.reference.replace(/\s/g, '.');
              const refs = store.crossRefs[dotFormat];
              return refs?.length > 0 && (
                <span className="text-sky-500 text-xs cursor-pointer" aria-label={`${refs.length} cross references`}>
                  📖 {refs.length}
                </span>
              );
            })()}
          </div>

          {(() => {
            const dotFormat = verse.reference.replace(/\s/g, '.');
            const crossRefs = store.crossRefs[dotFormat] || [];

            if (crossRefs.length > 0) {
              return crossRefs.map((ref: string, index: number) => {
                // Get verse text from the main translation (first selected translation)
                const mainTranslation = selectedTranslations[0];
                let refText = '';

                if (mainTranslation) {
                  // Convert reference format for cross-reference lookup
                  const displayRef = ref.replace(/\./g, ' '); // "Gen.1:1" -> "Gen 1:1"
                  const lookupRef = ref; // Keep original dot format as backup

                  // First try to find the cross-referenced verse in the current verses array
                  // This ensures we use the same translation data that's already loaded
                  const crossRefVerse = allVerses.find(v => 
                    v.reference === displayRef || 
                    v.reference === lookupRef ||
                    `${v.book}.${v.chapter}:${v.verse}` === ref ||
                    v.reference.replace(/\s/g, '.') === ref
                  );

                  if (crossRefVerse && crossRefVerse.text && crossRefVerse.text[mainTranslation.id]) {
                    refText = crossRefVerse.text[mainTranslation.id];
                  } else if (getGlobalVerseText) {
                    // Fallback to global verse text getter using the correct translation
                    refText = getGlobalVerseText(displayRef) || getGlobalVerseText(lookupRef) || '';
                  }
                }

                const displayText = refText && refText.length > 150 ? 
                  refText.substring(0, 150) + '...' : refText;

                return (
                  <div key={index} className="mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">
                    <button 
                      onClick={() => onNavigateToVerse(ref)}
                      className="cross-ref-button font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer block mb-1"
                    >
                      {ref.replace(/\./g, ' ')}
                    </button>
                    {displayText && (
                      <div className="text-muted-foreground break-words text-xs leading-relaxed">
                        {displayText}
                      </div>
                    )}
                  </div>
                );
              });
            } else {
              return <span className="text-muted-foreground italic">No cross references</span>;
            }
          })()}
        </div>
      </div>

      {/* Prophecy Columns - New System */}
      {showProphecy && (
        <div className="w-[4800px] flex-shrink-0 border-r">
          <div className="h-[120px]">
            <ProphecyColumns 
              verseIDs={[verse.reference]} 
              onVerseClick={onNavigateToVerse}
              mainTranslation={selectedTranslations[0]?.id}
            />
          </div>
        </div>
      )}

      {/* Labels Column */}
      {activeLabels.length > 0 && (
        <div className="w-60 flex-shrink-0 border-r">
          <div className="h-[120px] overflow-y-auto p-3 text-xs">
            {(() => {
              // Use main translation from Bible store for consistency
              if (!mainTranslation) {
                return <span className="text-muted-foreground italic">No main translation selected</span>;
              }
              
              return (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 mb-2">
                    Labels ({mainTranslation})
                  </div>
                  {activeLabels.map((labelName: LabelName) => {
                    const labelValues = getLabel(mainTranslation, verse.reference, labelName);
                    
                    if (labelValues.length > 0) {
                      return (
                        <div key={labelName} className="mb-2">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {labelName}:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {labelValues.map((value, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                              >
                                {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                  {activeLabels.every((labelName: LabelName) => 
                    getLabel(mainTranslation, verse.reference, labelName).length === 0
                  ) && (
                    <span className="text-muted-foreground italic">No labels found for this verse</span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Notes Column */}
      {showNotes && (
        <div className="w-60 flex-shrink-0 border-r">
          <div className="h-[120px] overflow-y-auto p-3 text-xs">
            {userNote ? (
              <div className="whitespace-pre-wrap break-words">{userNote.note}</div>
            ) : (
              <span className="text-muted-foreground italic">Add notes...</span>
            )}
          </div>
        </div>
      )}

    </div>
  );
}