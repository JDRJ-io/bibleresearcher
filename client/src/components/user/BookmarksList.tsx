import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Bookmark, Edit3, Trash2, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { Bookmark as BookmarkType } from '@shared/schema';


interface BookmarksListProps {
  onNavigateToVerse?: (reference: string) => void;
  className?: string;
}

export function BookmarksList({ onNavigateToVerse, className }: BookmarksListProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Direct Supabase query for bookmarks
  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['user-bookmarks'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('BookmarksList: Error loading bookmarks:', error);
        throw error;
      }
      return (data || []) as BookmarkType[];
    },
    enabled: !!user,
  });

  // Update bookmark mutation (using composite key: user_id + name)
  const updateBookmark = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('bookmarks')
        .update({ name: newName })
        .eq('user_id', user.id)
        .eq('name', oldName);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
    },
  });

  // Delete bookmark mutation (using composite key: user_id + name)
  const deleteBookmark = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('name', name);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
      toast({ title: "Bookmark deleted successfully" });
      setDeletingBookmark(null);
    },
    onError: (error) => {
      console.error('BookmarksList: Delete error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to delete bookmark", 
        variant: "destructive" 
      });
    },
  });
  
  // Local state for editing and deleting bookmarks
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingBookmark, setDeletingBookmark] = useState<BookmarkType | null>(null);

  if (!user) {
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
        oldName: editingBookmark.name,
        newName: editName.trim()
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

  const handleDelete = (bookmark: BookmarkType) => {
    setDeletingBookmark(bookmark);
  };

  const confirmDelete = async () => {
    if (!deletingBookmark) return;
    await deleteBookmark.mutateAsync(deletingBookmark.name);
  };

  const handleNavigate = (bookmark: BookmarkType) => {
    if (!onNavigateToVerse) return;
    
    // Use verse_ref directly if available, fallback to index conversion
    const verseRef = bookmark.verse_ref || `Index:${bookmark.index_value}`;
    console.log('🔖 BookmarksList: Navigating to bookmark:', {
      name: bookmark.name,
      verse_ref: bookmark.verse_ref,
      index: bookmark.index_value,
      navigatingTo: verseRef
    });
    
    onNavigateToVerse(verseRef);
    toast({ title: `Navigated to ${verseRef}` });
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
              key={`${bookmark.user_id}-${bookmark.name}`}
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted group"
            >
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: bookmark.color || '#ef4444' }}
              />
              
              <div 
                className="flex-1 min-w-0 cursor-pointer" 
                onClick={() => handleNavigate(bookmark)}
              >
                <div className="font-medium text-sm truncate">
                  {bookmark.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {bookmark.verse_ref || `Index: ${bookmark.index_value}`}
                </div>
              </div>
              
              <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                {onNavigateToVerse && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(bookmark);
                    }}
                    title="Go to verse"
                    className="h-8 w-8 p-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(bookmark);
                  }}
                  title="Edit bookmark"
                  className="h-8 w-8 p-0"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(bookmark);
                  }}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingBookmark} onOpenChange={() => setDeletingBookmark(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bookmark</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the bookmark "{deletingBookmark?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBookmark.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteBookmark.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBookmark.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}