import { useState, useEffect, useRef } from 'react';
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
  const noteContainerRef = useRef<HTMLDivElement>(null);

  // Find existing note for this verse
  useEffect(() => {
    const note = notes[0] || null; // First note since we're filtering by verse
    setExistingNote(note);
    
    // Only update text and edit state if we're not currently editing
    // This prevents auto-save from kicking user out of edit mode
    if (!isEditing) {
      setNoteText(note?.text || '');
      setIsEditing(false);
    }
  }, [notes, isEditing]);

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
    300 // 300ms debounce - reduced for better responsiveness
  );

  // Handle click outside to exit edit mode
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && noteContainerRef.current && !noteContainerRef.current.contains(event.target as Node)) {
        handleExitEditMode();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isEditing) {
        handleExitEditMode();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isEditing]);

  const handleEnterEditMode = () => {
    setIsEditing(true);
  };

  const handleExitEditMode = () => {
    setIsEditing(false);
  };

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

  // Show editing interface
  if (isEditing) {
    return (
      <div ref={noteContainerRef} className={`p-2 ${className} bg-muted/10 rounded border border-primary/20`}>
        <Textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={`Add your note here...
(type verse references like Gen.1:1 to create hyperlinks)

Press Escape or click outside to finish editing.`}
          className="min-h-[80px] text-sm resize-none border-0 focus:ring-0 focus:border-0 p-0 bg-transparent"
          style={{
            overflow: 'auto',
            maxHeight: '200px'
          }}
          autoFocus
        />
      </div>
    );
  }

  // Show view mode with hyperlinks - entire cell is clickable
  return (
    <div 
      ref={noteContainerRef} 
      className={`p-2 min-h-[80px] text-sm cursor-pointer hover:bg-muted/10 rounded transition-colors group ${className}`}
      onMouseDownCapture={(e) => {
        // Check if clicking on a link - if so, let it handle the click
        const target = e.target as HTMLElement;
        if (target.closest('a[data-verse-link]')) {
          // Don't enter edit mode - link will handle this
          e.stopPropagation();
        }
      }}
      onClick={(e) => {
        // Check if we're clicking on a link
        const target = e.target as HTMLElement;
        if (target.closest('a[data-verse-link]')) {
          // Link will handle this - don't enter edit mode
          return;
        }
        
        // Otherwise, enter edit mode
        handleEnterEditMode();
      }}
      data-testid="notes-content-area"
    >
      {noteText.trim() ? (
        <div style={{ pointerEvents: 'auto' }}>
          <NotesTextWithLinks 
            text={noteText} 
            onVerseClick={onVerseClick}
            className="text-sm leading-relaxed"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground italic">
          <Edit3 className="w-3 h-3 mr-2 opacity-60 group-hover:opacity-100 transition-opacity" />
          <span className="group-hover:text-foreground transition-colors">Click to add note</span>
        </div>
      )}
    </div>
  );
}