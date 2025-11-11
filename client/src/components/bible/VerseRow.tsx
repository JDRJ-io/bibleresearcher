import type { BibleVerse, Translation, UserNote, Highlight } from '@/types/bible';
import { UnifiedProphecyCell } from './UnifiedProphecyCell';
import { useBibleStore } from '@/App';
import { getLabel } from '@/lib/labelsCache';
import type { LabelName } from '@/lib/labelBits';
import { useEffect, useMemo } from 'react';
import { useLabeledText } from '@/hooks/useLabeledText';
import { classesForMask } from '@/lib/labelRenderer';
import { VerseText } from '@/components/highlights/VerseText';

interface VerseRowProps {
  verse: BibleVerse;
  verseIndex: number;
  selectedTranslations: Translation[];
  showNotes: boolean;
  showProphecy: boolean;
  showContext: boolean;
  contextBoundaries?: Set<string>;
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
  contextBoundaries,
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
  
  // Note: Labels are loaded via VirtualBibleTable's useViewportLabels hook
  // No individual verse-level loading needed here

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

  // Check if this verse is at a context boundary
  const isContextBoundary = showContext && contextBoundaries && contextBoundaries.has(verse.reference);

  return (
    <>
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
      <div 
        className="w-12 flex-shrink-0 flex items-center justify-center border-r px-1 text-xs font-medium"
        style={{
          color: 'var(--text-primary)',
          borderColor: 'var(--border-color)'
        }}
      >
        <span className="transform -rotate-90 whitespace-nowrap origin-center text-center">
          {verse.reference}
        </span>
      </div>

      {/* Translation Text Columns - Dynamic based on selected translations */}
      {selectedTranslations.map((translation) => {
        const verseText = verse.text[translation.id];
        
        // Get label data for this verse using the cached labels
        const labelData = useMemo(() => {
          if (!activeLabels || activeLabels.length === 0) return {};
          
          const data: Partial<Record<LabelName, string[]>> = {};
          
          // Only populate active labels to avoid unnecessary processing
          activeLabels.forEach((labelName) => {
            const labelValues = getLabel(translation.id, verse.reference, labelName as LabelName);
            if (labelValues.length > 0) {
              data[labelName as LabelName] = labelValues;
            }
          });
          
          return data;
        }, [translation.id, verse.reference, activeLabels]);
        
        // Process text with labels if we have both text and active labels
        const segments = useLabeledText(
          verseText || '',
          labelData,
          (activeLabels || []) as LabelName[]
        );
        
        return (
          <div key={translation.id} className="w-80 flex-shrink-0 border-r h-[120px] min-h-0">
            <div 
              className="h-full overflow-y-auto p-3 text-sm"
              style={{
                touchAction: 'auto',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <div className="whitespace-pre-wrap break-words leading-relaxed">
                {verseText ? (
                  <VerseText 
                    verseRef={verse.reference} 
                    translation={translation.id} 
                    text={verseText}
                    labelSegments={activeLabels.length > 0 ? segments : undefined}
                  />
                ) : (
                  (() => {
                    console.log('🐛 DEBUG: No verseText for', verse.reference, translation.id, translation.abbreviation);
                    return (
                      <span className="text-muted-foreground italic">
                        [{verse.reference} - {translation.abbreviation} loading...]
                      </span>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Cross References Column - Fixed Width (matches translation columns) */}
      <div className="w-80 flex-shrink-0 border-r h-[120px] min-h-0">
        <div 
          className="h-full overflow-y-auto p-3 text-sm leading-relaxed"
          style={{
            touchAction: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {(() => {
            // OPTIMIZATION: verse.reference is now dot format - direct lookup
            const crossRefs = store.crossRefs[verse.reference] || [];

            if (crossRefs.length > 0) {
              return crossRefs.map((ref: string, index: number) => {
                // Get verse text using the store's translation data
                const mainTranslation = selectedTranslations[0];
                let refText = '';

                if (mainTranslation && store.translations[mainTranslation.id]) {
                  // OPTIMIZATION: Use consistent dot format for lookup
                  const translationData = store.translations[mainTranslation.id];
                  refText = translationData[ref] || '';
                }

                return (
                  <span key={index} className="block mb-3">
                    <span 
                      onClick={() => onNavigateToVerse(ref)}
                      className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      {ref}
                    </span> {refText || ''}
                  </span>
                );
              });
            } else {
              return <span className="text-muted-foreground italic">No cross references</span>;
            }
          })()}
        </div>
      </div>

      {/* Prophecy Column - Unified System */}
      {showProphecy && (
        <div className="w-[300px] flex-shrink-0 border-r h-[120px] min-h-0">
          <UnifiedProphecyCell
            prophecyRoles={store.prophecyData?.[verse.reference] || {}}
            getVerseText={(verseRef: string, translationCode: string) => {
              const translationData = store.translations[translationCode];
              return translationData?.[verseRef] || '';
            }}
            mainTranslation={selectedTranslations[0]?.id || 'KJV'}
            onVerseClick={onNavigateToVerse}
          />
        </div>
      )}

      {/* Labels Column */}
      {activeLabels.length > 0 && (
        <div className="w-60 flex-shrink-0 border-r h-[120px] min-h-0">
          <div 
            className="h-full overflow-y-auto p-3 text-xs"
            style={{
              touchAction: 'auto',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}
          >
            {(() => {
              // Use main translation from Bible store for consistency
              if (!mainTranslation) {
                return <span className="text-muted-foreground italic">No main translation selected</span>;
              }
              
              return (
                <div className="space-y-2">
                  <div className="text-xs mb-2" style={{color: 'var(--text-secondary)'}}>
                    Labels ({mainTranslation})
                  </div>
                  {(activeLabels as LabelName[]).map((labelName) => {
                    const labelValues = getLabel(mainTranslation, verse.reference, labelName);
                    
                    if (labelValues && labelValues.length > 0) {
                      return (
                        <div key={labelName} className="mb-2">
                          <div className="text-xs font-medium mb-1" style={{color: 'var(--text-secondary)'}}>
                            {labelName}:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {labelValues.map((value, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-1 text-xs rounded-full"
                                style={{
                                  backgroundColor: 'var(--highlight-bg)',
                                  color: 'var(--text-primary)'
                                }}
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
                  {(activeLabels as LabelName[]).every((labelName) => 
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
        <div className="w-60 flex-shrink-0 border-r h-[120px] min-h-0">
          <div 
            className="h-full overflow-y-auto p-3 text-xs"
            style={{
              touchAction: 'auto',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}
          >
            {userNote ? (
              <div className="whitespace-pre-wrap break-words">{userNote.note}</div>
            ) : (
              <span className="text-muted-foreground italic">Add notes...</span>
            )}
          </div>
        </div>
      )}

      </div>

      {/* Context Group Divider - Blue line when at context boundary */}
      {isContextBoundary && (
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
}