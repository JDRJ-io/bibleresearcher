import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bookmark, BookmarkPlus } from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BookmarkButtonProps {
  className?: string;
}

export function BookmarkButton({ className }: BookmarkButtonProps) {
  console.log('🔖 BookmarkButton: Component mounting/rendering');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [bookmarkName, setBookmarkName] = useState('');
  const [color, setColor] = useState('#ef4444');

  console.log('🔖 BookmarkButton: Auth state - user:', user?.id || 'NO USER');

  // Only initialize useBookmarks when user is available to avoid errors
  const bookmarksHook = useBookmarks();
  const { addBookmark, loading } = bookmarksHook || { addBookmark: async () => {}, loading: false };

  console.log('🔖 BookmarkButton: Hooks initialized - loading:', loading);

  if (!user) {
    console.log('🔖 BookmarkButton: No user, returning null');
    return null;
  }

  console.log('🔖 BookmarkButton: Rendering with user:', user.id);

  // Add debugging for when button is clicked
  const handleOpenDialog = () => {
    console.log('BookmarkButton: Dialog open requested');
    setIsOpen(true);
  };

  const handleSaveBookmark = async () => {
    if (!bookmarkName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a bookmark name",
        variant: "destructive"
      });
      return;
    }

    try {
      await addBookmark(bookmarkName, color);
      toast({
        title: "Bookmark saved",
        description: `"${bookmarkName}" has been bookmarked`
      });
      setIsOpen(false);
      setBookmarkName('');
      setColor('#ef4444');
    } catch (error) {
      console.error('Bookmark insert failed:', error);
      toast({
        title: "Error", 
        description: "Failed to save bookmark",
        variant: "destructive"
      });
    }
  };

  const colorOptions = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`text-muted-foreground hover:text-foreground ${className || ''}`}
          onClick={handleOpenDialog}
        >
          <BookmarkPlus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Bookmark</DialogTitle>
          <DialogDescription>
            Save your current reading position for quick access later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="bookmark-name" className="text-sm font-medium">
              Bookmark Name
            </label>
            <Input
              id="bookmark-name"
              value={bookmarkName}
              onChange={(e) => setBookmarkName(e.target.value)}
              placeholder="Enter bookmark name..."
              className="w-full"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Color</label>
            <div className="flex gap-2">
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption}
                  onClick={() => setColor(colorOption)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === colorOption ? 'border-foreground' : 'border-muted'
                  }`}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveBookmark}
            disabled={loading || !bookmarkName.trim()}
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Save Bookmark
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}