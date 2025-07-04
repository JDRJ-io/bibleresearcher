import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import type { BibleVerse, Translation, UserNote, Highlight } from '@/types/bible';

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
}: VerseRowProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState(userNote?.note || '');
  
  // Create preferences object for consistency
  const preferences = {
    showNotes,
    showProphecy,
    showContext,
  };



  const saveNoteMutation = useMutation({
    mutationFn: async ({ verseRef, note }: { verseRef: string; note: string }) => {
      if (userNote) {
        return apiRequest('PUT', `/api/notes/${userNote.id}`, { note });
      } else {
        return apiRequest('POST', '/api/notes', {
          userId: user?.id,
          verseRef,
          note,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/notes`] });
    },
  });

  const handleNoteChange = (value: string) => {
    setNoteText(value);
    // Debounced save could be implemented here
  };

  const handleNoteBlur = () => {
    if (noteText !== (userNote?.note || '')) {
      saveNoteMutation.mutate({ verseRef: verse.reference, note: noteText });
    }
  };

  const handleDoubleClick = () => {
    onExpandVerse(verse);
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      onHighlight(verse.reference, selection);
    }
  };

  const applyLabels = (text: string, labels: string[] = []) => {
    let styledText = text;
    
    // Apply label effects (simplified for this example)
    labels.forEach(label => {
      // In a real implementation, this would be more sophisticated
      if (label === 'who') {
        styledText = `<strong>${styledText}</strong>`;
      }
    });

    return styledText;
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
      {/* Reference Column - Fixed Width */}
      <div className="w-24 flex-shrink-0 flex items-center justify-center border-r px-2 text-sm font-medium">
        {verse.reference}
      </div>

      {/* Translation Text Columns - Dynamic based on selected translations */}
      {selectedTranslations.map((translation) => (
        <div key={translation.id} className="w-80 flex-shrink-0 border-r">
          <div className="h-[120px] overflow-y-auto p-3 text-sm">
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {verse.text[translation.id] || (
                <span className="text-muted-foreground italic">
                  [{verse.reference} - {translation.abbreviation} loading...]
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Cross References Column - Fixed Width */}
      <div className="w-60 flex-shrink-0 border-r">
        <div className="h-[120px] overflow-y-auto p-3 text-xs">
          {verse.crossReferences && verse.crossReferences.length > 0 ? (
            verse.crossReferences.map((ref, index) => (
              <div key={index} className="mb-2">
                <button 
                  onClick={() => onNavigateToVerse(ref.reference)}
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  {ref.reference}
                </button>
                <div className="text-muted-foreground break-words mt-1">{ref.text}</div>
              </div>
            ))
          ) : (
            <span className="text-muted-foreground italic">No cross references</span>
          )}
        </div>
      </div>

      {/* Prophecy Column - Only show if enabled */}
      {preferences.showProphecy && (
        <div className="w-64 flex-shrink-0 border-r">
          <div className="h-[120px] overflow-y-auto p-3 text-xs">
            {verse.prophecy ? (
              <div className="space-y-2">
                {verse.prophecy.predictions && verse.prophecy.predictions.length > 0 && (
                  <div>
                    <div className="font-medium text-blue-600 dark:text-blue-400 text-xs">Predictions:</div>
                    {verse.prophecy.predictions.slice(0, 2).map((pred, idx) => (
                      <div key={idx} className="text-muted-foreground text-xs">{pred.substring(0, 80)}...</div>
                    ))}
                  </div>
                )}
                {verse.prophecy.fulfillments && verse.prophecy.fulfillments.length > 0 && (
                  <div>
                    <div className="font-medium text-green-600 dark:text-green-400 text-xs">Fulfillments:</div>
                    {verse.prophecy.fulfillments.slice(0, 2).map((ful, idx) => (
                      <div key={idx} className="text-muted-foreground text-xs">{ful.substring(0, 80)}...</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground italic">Loading prophecy data...</span>
            )}
          </div>
        </div>
      )}

      {/* Additional Translation Columns */}
      {selectedTranslations.filter(t => t.selected && t.id !== 'KJV').map(translation => (
        <div key={translation.id} className="w-80 flex-shrink-0 border-r">
          <div className="h-[120px] overflow-y-auto p-3 text-sm">
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {verse.text[translation.id] ? (
                verse.text[translation.id]
              ) : (
                <span className="text-muted-foreground italic">No {translation.abbreviation} text</span>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {/* Notes Column */}
      {preferences.showNotes && (
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
      
      {/* Prophecy Column */}
      {preferences.showProphecy && (
        <div className="w-64 flex-shrink-0">
          <div className="h-[120px] overflow-y-auto p-3 text-xs">
            {verse.prophecy ? (
              <div className="space-y-2">
                {verse.prophecy.predictions && verse.prophecy.predictions.length > 0 && (
                  <div>
                    <div className="font-medium text-blue-600 dark:text-blue-400 text-xs">Predictions:</div>
                    {verse.prophecy.predictions.slice(0, 2).map((pred, idx) => (
                      <div key={idx} className="text-muted-foreground text-xs">{pred.substring(0, 80)}...</div>
                    ))}
                  </div>
                )}
                {verse.prophecy.fulfillments && verse.prophecy.fulfillments.length > 0 && (
                  <div>
                    <div className="font-medium text-green-600 dark:text-green-400 text-xs">Fulfillments:</div>
                    {verse.prophecy.fulfillments.slice(0, 2).map((ful, idx) => (
                      <div key={idx} className="text-muted-foreground text-xs">{ful.substring(0, 80)}...</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground italic">Loading prophecy data...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
