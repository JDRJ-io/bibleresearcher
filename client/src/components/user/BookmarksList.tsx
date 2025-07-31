import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bookmark, Edit3, Trash2, ExternalLink } from 'lucide-react';
import { useUserBookmarks, useUpdateBookmark, useDeleteBookmark } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { Bookmark as BookmarkType } from '@shared/schema';

interface BookmarksListProps {
  onNavigateToVerse?: (indexValue: number) => void;
  className?: string;
}

export function BookmarksList({ onNavigateToVerse, className }: BookmarksListProps) {
  const { isLoggedIn } = useAuth();
  const { data: bookmarks = [], isLoading } = useUserBookmarks();
  const updateBookmark = useUpdateBookmark();
  const deleteBookmark = useDeleteBookmark();
  const { toast } = useToast();
  
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null);
  const [editName, setEditName] = useState('');

  if (!isLoggedIn) {
    return (
      <div className={`text-center p-4 text-muted-foreground ${className}`}>
        Sign in to view your bookmarks
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`p-4 space-y-2 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded h-16"></div>
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className={`text-center p-4 text-muted-foreground ${className}`}>
        <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No bookmarks yet</p>
        <p className="text-sm">Click the bookmark button next to verses to save them</p>
      </div>
    );
  }

  const handleEdit = (bookmark: BookmarkType) => {
    setEditingBookmark(bookmark);
    setEditName(bookmark.name);
  };

  const handleSaveEdit = async () => {
    if (!editingBookmark || !editName.trim()) return;

    try {
      await updateBookmark.mutateAsync({
        id: editingBookmark.id,
        name: editName.trim()
      });
      
      toast({ title: "Bookmark updated" });
      setEditingBookmark(null);
      setEditName('');
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to update bookmark", 
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async (bookmark: BookmarkType) => {
    try {
      await deleteBookmark.mutateAsync(bookmark.id);
      toast({ title: "Bookmark deleted" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete bookmark", 
        variant: "destructive" 
      });
    }
  };

  const handleNavigate = (bookmark: BookmarkType) => {
    if (onNavigateToVerse) {
      onNavigateToVerse(bookmark.indexValue);
      toast({ title: `Navigated to bookmark: ${bookmark.name}` });
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 p-4 border-b">
        <Bookmark className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold">Your Bookmarks</h3>
        <span className="text-sm text-muted-foreground">({bookmarks.length})</span>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted group"
            >
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: bookmark.color || '#ef4444' }}
              />
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {bookmark.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(bookmark.createdAt!), { addSuffix: true })}
                </div>
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onNavigateToVerse && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleNavigate(bookmark)}
                    title="Go to verse"
                    className="h-8 w-8 p-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(bookmark)}
                  title="Edit bookmark"
                  className="h-8 w-8 p-0"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(bookmark)}
                  title="Delete bookmark"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  disabled={deleteBookmark.isPending}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={!!editingBookmark} onOpenChange={() => setEditingBookmark(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Bookmark</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">
                Bookmark Title
              </label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter bookmark title"
                autoFocus
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setEditingBookmark(null)}
                disabled={updateBookmark.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateBookmark.isPending || !editName.trim()}
              >
                {updateBookmark.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}