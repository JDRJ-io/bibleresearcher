import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
  verseReference: string;
  isLoading?: boolean;
}

const BOOKMARK_COLORS = [
  '#ef4444', // red
  '#f97316', // orange  
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export function BookmarkModal({ isOpen, onClose, onSave, verseReference, isLoading = false }: BookmarkModalProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(BOOKMARK_COLORS[0]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), selectedColor);
      setName('');
      setSelectedColor(BOOKMARK_COLORS[0]);
      onClose();
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedColor(BOOKMARK_COLORS[0]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Save Bookmark</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto flex-1">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Verse Reference
            </Label>
            <div className="mt-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
              {verseReference}
            </div>
          </div>

          <div>
            <Label htmlFor="bookmark-name" className="text-sm font-medium">
              Bookmark Name
            </Label>
            <Input
              id="bookmark-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter bookmark name..."
              className="mt-1"
              maxLength={50}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">
              Color
            </Label>
            <div className="mt-2 flex gap-2 flex-wrap">
              {BOOKMARK_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? 'border-foreground scale-110'
                      : 'border-muted-foreground/30 hover:border-foreground/50'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Saving...' : 'Save Bookmark'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}