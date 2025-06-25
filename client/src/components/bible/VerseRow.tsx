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
    <>
      {/* Context Boundary (when enabled) */}
      {showContext && verse.contextGroup && (
        <div 
          className="my-2 mx-4 border-l-4 pl-4 py-2"
          style={{ 
            borderColor: 'var(--accent-color)', 
            backgroundColor: 'var(--hover-bg)' 
          }}
        >
          <div className="text-xs font-medium opacity-75">
            Context: {verse.contextGroup.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        </div>
      )}
      
      <div
        className="flex border-b hover:bg-opacity-50 transition-all duration-200 group min-w-max"
        style={{ borderColor: 'var(--border-color)', height: 'var(--row-height-base)' }}
        data-verse-id={verse.id}
      >
        {/* Notes Column (when enabled) */}
        {showNotes && (
          <div className="w-48 border-r flex-shrink-0 bible-cell" style={{ borderColor: 'var(--border-color)' }}>
            <div className="bible-cell-content">
              <Textarea
                placeholder="Add personal notes..."
                value={noteText}
                onChange={(e) => handleNoteChange(e.target.value)}
                onBlur={handleNoteBlur}
                className="w-full h-full resize-none border-0 bg-transparent text-sm"
                style={{ color: 'var(--text-color)' }}
              />
            </div>
          </div>
        )}

        {/* Index Column */}
        <div className="w-24 border-r flex items-center justify-center font-medium text-sm flex-shrink-0 bible-cell" style={{ borderColor: 'var(--border-color)' }}>
          <span style={{ color: 'var(--accent-color)' }}>
            {verse.reference}
          </span>
        </div>

        {/* Verse Text Columns */}
        {activeTranslations.map((translation) => (
          <div
            key={translation.id}
            className="flex-1 min-w-96 border-r flex-shrink-0 bible-cell"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="bible-cell-content">
              <div
                className="verse-text text-sm cursor-pointer select-text"
                onDoubleClick={handleDoubleClick}
                onMouseUp={handleMouseUp}
                dangerouslySetInnerHTML={{
                  __html: applyLabels(verse.text[translation.id] || '', verse.labels)
                }}
              />
            </div>
          </div>
        ))}

        {/* Cross References Column */}
        <div className="w-80 border-r flex-shrink-0 bible-cell" style={{ borderColor: 'var(--border-color)' }}>
          <div className="bible-cell-content">
            <div className="space-y-1 text-sm w-full">
              {verse.crossReferences?.map((ref, index) => (
                <div key={index}>
                  <div className="text-xs font-medium opacity-75">{ref.reference}</div>
                  <div className="text-xs leading-relaxed">{ref.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Prophecy Columns (when enabled) */}
        {showProphecy && (
          <>
            <div className="w-64 border-r flex-shrink-0 bible-cell" style={{ borderColor: 'var(--border-color)' }}>
              <div className="bible-cell-content">
                <div className="text-xs opacity-75 w-full">
                  {verse.prophecy?.predictions?.join(', ') || ''}
                </div>
              </div>
            </div>
            <div className="w-64 border-r flex-shrink-0 bible-cell" style={{ borderColor: 'var(--border-color)' }}>
              <div className="bible-cell-content">
                <div className="text-xs opacity-75 w-full">
                  {verse.prophecy?.fulfillments?.join(', ') || ''}
                </div>
              </div>
            </div>
            <div className="w-64 flex-shrink-0 bible-cell">
              <div className="bible-cell-content">
                <div className="text-xs opacity-75 w-full">
                  {verse.prophecy?.verifications?.join(', ') || ''}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
