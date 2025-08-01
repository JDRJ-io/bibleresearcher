import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bookmark, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { useCreateBookmark, useDeleteBookmark, useUserBookmarks } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Bookmark as BookmarkType } from '@shared/schema';

interface BookmarkButtonProps {
  verseRef: string;
  indexValue: number;
  className?: string;
}

export function BookmarkButton({ verseRef, indexValue, className }: BookmarkButtonProps) {
  const { isLoggedIn } = useAuth();
  const { data: bookmarks = [] } = useUserBookmarks();
  const createBookmark = useCreateBookmark();
  const deleteBookmark = useDeleteBookmark();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bookmarkName, setBookmarkName] = useState('');

  // Check if this verse is already bookmarked
  const existingBookmark = bookmarks.find(b => b.indexValue === indexValue);

  if (!isLoggedIn) {
    return null;
  }

  const handleCreateBookmark = async () => {
    if (!bookmarkName.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a title for your bookmark",
        variant: "destructive"
      });
      return;
    }

    try {
      await createBookmark.mutateAsync({
        name: bookmarkName,
        indexValue,
        color: '#ef4444', // Default red color
        pending: false
      });
      
      toast({ title: "Bookmark saved" });
      setIsDialogOpen(false);
      setBookmarkName('');
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to save bookmark", 
        variant: "destructive" 
      });
    }
  };

  const handleRemoveBookmark = async () => {
    if (!existingBookmark) return;
    
    try {
      await deleteBookmark.mutateAsync(existingBookmark.id);
      toast({ title: "Bookmark removed" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to remove bookmark", 
        variant: "destructive" 
      });
    }
  };

  // Generate default bookmark name
  const generateDefaultName = () => {
    return `${verseRef} - ${new Date().toLocaleDateString()}`;
  };

  if (existingBookmark) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRemoveBookmark}
        className={`p-1 h-auto text-amber-500 hover:text-amber-600 ${className}`}
        disabled={deleteBookmark.isPending}
        title={`Remove bookmark: ${existingBookmark.name}`}
      >
        <BookmarkCheck className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`p-1 h-auto text-muted-foreground hover:text-amber-500 ${className}`}
          title="Add bookmark"
          onClick={() => {
            setBookmarkName(generateDefaultName());
            setIsDialogOpen(true);
          }}
        >
          <BookmarkPlus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-500" />
            Save Bookmark
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bookmark-name">Bookmark Title</Label>
            <Input
              id="bookmark-name"
              value={bookmarkName}
              onChange={(e) => setBookmarkName(e.target.value)}
              placeholder="Enter a title for this bookmark"
              autoFocus
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <strong>Location:</strong> {verseRef}
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={createBookmark.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBookmark}
              disabled={createBookmark.isPending}
            >
              {createBookmark.isPending ? 'Saving...' : 'Save Bookmark'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}