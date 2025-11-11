import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Bookmark, Edit3, Trash2, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { UserBookmark as BookmarkType } from '@shared/schema';
import { GUEST_BOOKMARKS } from '@/data/guestBookmarks';
import { getVerseIndex } from '@/lib/verseIndexMap';

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

interface BookmarksListProps {
  onNavigateToVerse?: (reference: string) => void;
  className?: string;
}

export function BookmarksList({ onNavigateToVerse, className }: BookmarksListProps) {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Direct Supabase query for bookmarks (or guest bookmarks if not authenticated)
  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['user-bookmarks', user?.id],
    queryFn: async () => {
      if (!user) {
        // Return guest bookmarks for non-authenticated users
        return GUEST_BOOKMARKS.map((gb, index) => ({
          id: index + 1,
          user_id: 'guest',
          translation: 'KJV', // Default translation for guest bookmarks
          verse_key: gb.verse_key,
          label: gb.label,
          color_hex: gb.color_hex,
          created_at: null,
          updated_at: null,
        })) as BookmarkType[];
      }
      
      const { data, error } = await supabase()
        .from('user_bookmarks')
        .select('id, user_id, translation, verse_key, label, color_hex, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('BookmarksList: Error loading bookmarks:', error);
        throw error;
      }
      return (data || []) as BookmarkType[];
    },
  });

  // Update bookmark mutation
  const updateBookmark = useMutation({
    mutationFn: async ({ id, label, color_hex }: { id: number; label?: string; color_hex?: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase()
        .from('user_bookmarks')
        .update({ 
          label: label || null, 
          color_hex: color_hex || '#ef4444',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
      toast({ title: "Bookmark updated successfully" });
      setEditingBookmark(null);
    },
    onError: (error) => {
      console.error('BookmarksList: Update error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update bookmark", 
        variant: "destructive" 
      });
    },
  });

  // Delete bookmark mutation (using ID)
  const deleteBookmark = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase()
        .from('user_bookmarks')
        .delete()
        .eq('id', id);

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
  const [deletingBookmark, setDeletingBookmark] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#ef4444');

  // Sort bookmarks in canonical biblical order (must be before early returns)
  const sortedBookmarks = useMemo(() => {
    return [...bookmarks].sort((a, b) => {
      const indexA = getVerseIndex(a.verse_key);
      const indexB = getVerseIndex(b.verse_key);
      return indexA - indexB;
    });
  }, [bookmarks]);

  const isGuest = !user;

  if (loading || isLoading) {
    return (
      <div className={`p-4 space-y-2 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded h-16"></div>
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0 && user) {
    return (
      <div className={`text-center p-4 text-muted-foreground ${className}`}>
        <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No bookmarks yet</p>
        <p className="text-sm">Click the bookmark button next to verses to save them</p>
      </div>
    );
  }

  // Edit functionality
  const handleEdit = (bookmark: BookmarkType) => {
    setEditingBookmark(bookmark);
    setEditName(bookmark.label || bookmark.verse_key);
    setEditColor(bookmark.color_hex || '#ef4444');
  };

  const handleEditSave = async () => {
    if (!editingBookmark || !editName.trim()) return;
    
    await updateBookmark.mutateAsync({
      id: editingBookmark.id,
      label: editName.trim(),
      color_hex: editColor
    });
  };

  const handleEditCancel = () => {
    setEditingBookmark(null);
    setEditName('');
    setEditColor('#ef4444');
  };

  const handleDelete = (bookmark: any) => {
    setDeletingBookmark(bookmark);
  };

  const confirmDelete = async () => {
    if (!deletingBookmark) return;
    await deleteBookmark.mutateAsync(deletingBookmark.id);
  };

  const handleNavigate = (bookmark: any) => {
    if (!onNavigateToVerse) return;
    
    // Use verse_key from user_bookmarks schema
    const verseRef = bookmark.verse_key;
    console.log('🔖 BookmarksList: Navigating to bookmark:', {
      verse_key: bookmark.verse_key,
      translation: bookmark.translation,
      navigatingTo: verseRef
    });
    
    onNavigateToVerse(verseRef);
    toast({ title: `Navigated to ${verseRef}` });
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-2 p-4 border-b">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold">{isGuest ? 'Featured Bookmarks' : 'Your Bookmarks'}</h3>
          <span className="text-sm text-muted-foreground">({bookmarks.length})</span>
        </div>
        {isGuest && (
          <p className="text-xs text-muted-foreground">
            Preview curated verses. Sign in to create your own bookmarks.
          </p>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedBookmarks.map((bookmark) => (
            <div
              key={`${bookmark.user_id}-${bookmark.verse_key}-${bookmark.translation}`}
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted group"
            >
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: bookmark.color_hex || '#ef4444' }}
              />
              
              <div 
                className="flex-1 min-w-0 cursor-pointer" 
                onClick={() => handleNavigate(bookmark)}
              >
                <div className="font-medium text-sm truncate">
                  {bookmark.label || bookmark.verse_key}
                </div>
                <div className="text-xs text-muted-foreground">
                  {bookmark.verse_key} • {bookmark.translation} • {bookmark.updated_at ? formatDistanceToNow(new Date(bookmark.updated_at), { addSuffix: true }) : ''}
                </div>
              </div>
              
              <div className="flex gap-1 ml-auto">
                {!isGuest && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(bookmark);
                      }}
                      title="Edit bookmark"
                      className="h-8 w-8 p-0 hover:bg-muted-foreground/20"
                      data-testid="button-edit-bookmark"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(bookmark);
                      }}
                      title="Delete bookmark"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      disabled={deleteBookmark.isPending}
                      data-testid="button-delete-bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Edit Bookmark Dialog */}
      <Dialog open={!!editingBookmark} onOpenChange={(isOpen) => { if (!isOpen) handleEditCancel(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Bookmark</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Verse Reference
              </Label>
              <div className="mt-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                {editingBookmark?.verse_key}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-bookmark-name" className="text-sm font-medium">
                Bookmark Name
              </Label>
              <Input
                id="edit-bookmark-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
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
                    onClick={() => setEditColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      editColor === color
                        ? 'border-foreground scale-110'
                        : 'border-muted-foreground/30 hover:border-foreground/50'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                    data-testid={`color-picker-${color.replace('#', '')}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleEditCancel}
                className="flex-1"
                disabled={updateBookmark.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSave}
                disabled={!editName.trim() || updateBookmark.isPending}
                className="flex-1"
                data-testid="button-save-edit"
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
              Are you sure you want to delete the bookmark for "{deletingBookmark?.verse_key}"?
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