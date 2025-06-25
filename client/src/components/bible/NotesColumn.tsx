import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit3, Save, X } from 'lucide-react';

interface NotesColumnProps {
  verseRef: string;
  existingNote?: string;
  onSaveNote: (verseRef: string, note: string) => void;
  onDeleteNote: (verseRef: string) => void;
}

export function NotesColumn({ verseRef, existingNote, onSaveNote, onDeleteNote }: NotesColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState(existingNote || '');

  const handleSave = () => {
    if (noteText.trim()) {
      onSaveNote(verseRef, noteText.trim());
    } else if (existingNote) {
      onDeleteNote(verseRef);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNoteText(existingNote || '');
    setIsEditing(false);
  };

  return (
    <div className="border-r p-2 w-64 h-[120px] bg-yellow-50 dark:bg-yellow-900/20">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Notes</div>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-6 w-6 p-0"
          >
            <Edit3 className="w-3 h-3" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add your note..."
            className="text-xs h-16 resize-none"
            autoFocus
          />
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className="h-6 px-2 text-xs"
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-6 px-2 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <ScrollArea className="h-[90px]">
          {existingNote ? (
            <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {existingNote}
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">
              Click to add a note...
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}