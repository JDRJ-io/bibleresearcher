import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import type { BibleVerse, Translation, UserNote, Highlight } from '@/types/bible';

interface VerseRowProps {
  verse: BibleVerse;
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

  const activeTranslations = selectedTranslations.filter(t => t.selected);

  return (
    <div 
      data-verse-ref={verse.reference}
      className="grid grid-cols-[80px_1fr_1fr_auto] gap-2 px-4 py-2 border-b hover:bg-muted/50"
    >
      {/* Index */}
      <div className="text-sm text-muted-foreground flex items-center">
        {verse.book} {verse.chapter}:{verse.verse}
      </div>

      {/* Verse Column */}
      <div className="h-[120px] overflow-y-auto border rounded p-2 text-xs">
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {verse.text['KJV'] || (
            <span className="text-muted-foreground italic">Loading verse...</span>
          )}
        </div>
      </div>

      {/* Cross References */}
      <div className="h-[120px] overflow-y-auto border rounded p-2 text-xs">
        {verse.crossReferences && verse.crossReferences.length > 0 ? (
          verse.crossReferences.map((ref, index) => (
            <div key={index} className="mb-1">
              <button 
                onClick={() => onNavigateToVerse(ref.reference)}
                className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                {ref.reference}
              </button>
              <div className="text-muted-foreground break-words">{ref.text}</div>
            </div>
          ))
        ) : (
          <span className="text-muted-foreground italic">No cross references</span>
        )}
      </div>

      {/* Translation Columns */}
      <div className="flex gap-2">
        {selectedTranslations.map(translation => {
          const verseText = verse.text[translation.id];
          return (
            <div key={translation.id} className="min-w-[120px] h-[120px] overflow-y-auto border rounded p-2 text-xs">
              <div className="whitespace-pre-wrap break-words">
                {verseText ? (
                  <span className="leading-relaxed">{verseText}</span>
                ) : (
                  <span className="text-muted-foreground italic">No text available</span>
                )}
              </div>
            </div>
          );
        })}
        
        {showNotes && (
          <div className="min-w-[120px] h-[120px] overflow-y-auto border rounded p-2 text-xs">
            {userNote ? (
              <div className="whitespace-pre-wrap break-words">{userNote.note}</div>
            ) : (
              <span className="text-muted-foreground italic">No notes</span>
            )}
          </div>
        )}
        
        {showProphecy && (
          <div className="min-w-[120px] h-[120px] overflow-y-auto border rounded p-2 text-xs">
            {verse.prophecy ? (
              <div className="space-y-1">
                {verse.prophecy.predictions && verse.prophecy.predictions.length > 0 && (
                  <div>
                    <div className="font-medium text-green-600">Predictions:</div>
                    {verse.prophecy.predictions.map((pred, i) => (
                      <div key={i} className="text-green-700 break-words">{pred}</div>
                    ))}
                  </div>
                )}
                {verse.prophecy.fulfillments && verse.prophecy.fulfillments.length > 0 && (
                  <div>
                    <div className="font-medium text-blue-600">Fulfillments:</div>
                    {verse.prophecy.fulfillments.map((ful, i) => (
                      <div key={i} className="text-blue-700 break-words">{ful}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground italic">No prophecy data</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
