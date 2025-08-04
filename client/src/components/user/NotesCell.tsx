import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Edit3, X } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { useAuth } from '@/contexts/AuthContext';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { useToast } from '@/hooks/use-toast';
import type { Note } from '@shared/schema';

interface NotesCellProps {
  verseRef: string;
  className?: string;
}

export function NotesCell({ verseRef, className }: NotesCellProps) {
  const { user } = useAuth();
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes(verseRef);
  const { toast } = useToast();
  
  const [noteText, setNoteText] = useState('');
  const [existingNote, setExistingNote] = useState<Note | null>(null);

  // Find existing note for this verse
  useEffect(() => {
    const note = notes[0] || null; // First note since we're filtering by verse
    setExistingNote(note);
    setNoteText(note?.text || '');
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

  // Always show the notes area for seamless editing
  return (
    <div className={`p-1 ${className}`}>
      <Textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder="Add your note here..."
        className="min-h-[80px] text-sm resize-none border-0 focus:ring-0 focus:border-0 p-2 bg-transparent"
        style={{
          overflow: 'auto',
          maxHeight: '200px'
        }}
      />
    </div>
  );
}