import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, Edit3, X } from 'lucide-react';
import { useCreateNote, useUpdateNote, useDeleteNote, useUserNotes } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { UserNote } from '@shared/schema';

interface NotesCellProps {
  verseRef: string;
  className?: string;
}

export function NotesCell({ verseRef, className }: NotesCellProps) {
  const { isLoggedIn } = useAuth();
  const { data: notes = [], isLoading } = useUserNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const { toast } = useToast();
  
  const [noteText, setNoteText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [existingNote, setExistingNote] = useState<UserNote | null>(null);

  // Find existing note for this verse
  useEffect(() => {
    const note = notes.find(n => n.verseRef === verseRef);
    setExistingNote(note || null);
    setNoteText(note?.note || '');
  }, [notes, verseRef]);

  if (!isLoggedIn) {
    return (
      <div className={`p-2 text-sm text-muted-foreground ${className}`}>
        Sign in to add notes
      </div>
    );
  }

  if (isLoading) {
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
          await deleteNote.mutateAsync(existingNote.id);
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
        await updateNote.mutateAsync({ id: existingNote.id, note: noteText });
        toast({ title: "Note updated" });
      } else {
        await createNote.mutateAsync({ verseRef, note: noteText });
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
    setNoteText(existingNote?.note || '');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!existingNote) return;
    
    try {
      await deleteNote.mutateAsync(existingNote.id);
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
          {existingNote?.note}
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
          disabled={createNote.isPending || updateNote.isPending}
        >
          <X className="w-3 h-3" />
        </Button>
        {existingNote && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={deleteNote.isPending}
            className="text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={createNote.isPending || updateNote.isPending}
        >
          <Save className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}