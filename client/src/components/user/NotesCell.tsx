import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, Edit3, X } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { useAuth } from '@/contexts/AuthContext';
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
  const [isEditing, setIsEditing] = useState(false);
  const [existingNote, setExistingNote] = useState<Note | null>(null);

  // Find existing note for this verse
  useEffect(() => {
    const note = notes[0] || null; // First note since we're filtering by verse
    setExistingNote(note);
    setNoteText(note?.text || '');
  }, [notes]);

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

  const handleSave = async () => {
    if (!noteText.trim()) {
      if (existingNote) {
        // Delete empty note
        try {
          await deleteNote(existingNote.id);
          toast({ title: "Note deleted" });
        } catch (error) {
          toast({ 
            title: "Error", 
            description: "Failed to delete note", 
            variant: "destructive" 
          });
        }
      }
      setIsEditing(false);
      return;
    }

    try {
      if (existingNote) {
        await updateNote(existingNote.id, noteText);
        toast({ title: "Note updated" });
      } else {
        await addNote(noteText);
        toast({ title: "Note saved" });
      }
      setIsEditing(false);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to save note", 
        variant: "destructive" 
      });
    }
  };

  const handleCancel = () => {
    setNoteText(existingNote?.text || '');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!existingNote) return;
    
    try {
      await deleteNote(existingNote.id);
      toast({ title: "Note deleted" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete note", 
        variant: "destructive" 
      });
    }
  };

  if (!isEditing && !existingNote) {
    return (
      <div className={`p-2 ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="w-full justify-start text-muted-foreground"
        >
          <Edit3 className="w-3 h-3 mr-1" />
          Add note
        </Button>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className={`p-2 ${className}`}>
        <div 
          className="text-sm cursor-pointer p-2 rounded hover:bg-muted"
          onClick={() => setIsEditing(true)}
        >
          {existingNote?.text}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-2 space-y-2 ${className}`}>
      <Textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder="Add your note here..."
        className="min-h-[60px] text-sm"
        autoFocus
      />
      <div className="flex gap-1 justify-end">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={loading}
        >
          <X className="w-3 h-3" />
        </Button>
        {existingNote && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={loading}
            className="text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={loading}
        >
          <Save className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}