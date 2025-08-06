import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Edit3, Eye } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { useAuth } from '@/contexts/AuthContext';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { useToast } from '@/hooks/use-toast';
import { NotesTextWithLinks } from './NotesTextWithLinks';
import type { Note } from '@shared/schema';

interface NotesCellProps {
  verseRef: string;
  className?: string;
  onVerseClick?: (reference: string) => void;
}

export function NotesCell({ verseRef, className, onVerseClick }: NotesCellProps) {
  const { user } = useAuth();
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes(verseRef);
  const { toast } = useToast();
  
  const [noteText, setNoteText] = useState('');
  const [existingNote, setExistingNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Find existing note for this verse
  useEffect(() => {
    const note = notes[0] || null; // First note since we're filtering by verse
    setExistingNote(note);
    setNoteText(note?.text || '');
    // Auto-start editing mode if there's no note yet, but don't switch back to view mode automatically
    if (!note && !isEditing) {
      setIsEditing(true);
    }
  }, [notes]);

  // Auto-save with debounce
  useDebouncedEffect(
    () => {
      if (!noteText.trim() && !existingNote) return;
      
      if (!noteText.trim() && existingNote) {
        // Delete empty note
        deleteNote(existingNote.id);
        return;
      }

      if (existingNote) {
        updateNote(existingNote.id, noteText);
      } else if (noteText.trim()) {
        addNote(noteText);
      }
    },
    [noteText],
    500 // 500ms debounce
  );

  if (!user) {
    return (
      <div className={`p-2 text-sm text-muted-foreground ${className}`}>
        Sign in to add notes
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`p-2 ${className}`}>
        <div className="animate-pulse bg-muted rounded h-8"></div>
      </div>
    );
  }

  const handleToggleMode = () => {
    setIsEditing(!isEditing);
  };

  // Show editing interface
  if (isEditing) {
    return (
      <div className={`p-1 ${className}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Editing note</span>
          {existingNote && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleMode}
              className="h-6 px-2 text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
          )}
        </div>
        <Textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add your note here... (Type verse references like Gen.1:1 to create hyperlinks)"
          className="min-h-[80px] text-sm resize-none border-0 focus:ring-0 focus:border-0 p-2 bg-transparent"
          style={{
            overflow: 'auto',
            maxHeight: '200px'
          }}
        />
      </div>
    );
  }

  // Show view mode with hyperlinks
  return (
    <div className={`p-1 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">Note</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleMode}
          className="h-6 px-2 text-xs"
        >
          <Edit3 className="w-3 h-3 mr-1" />
          Edit
        </Button>
      </div>
      <div className="min-h-[80px] p-2 text-sm">
        {noteText.trim() ? (
          <NotesTextWithLinks 
            text={noteText} 
            onVerseClick={onVerseClick}
            className="text-sm leading-relaxed"
          />
        ) : (
          <span className="text-muted-foreground italic">No note added yet</span>
        )}
      </div>
    </div>
  );
}