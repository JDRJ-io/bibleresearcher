import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVerseNav } from './useVerseNav';
import { getVerseKeyByIndex } from '@/lib/verseKeysLoader';
import { upsertBookmark, deleteBookmark as deleteBookmarkById, userBookmarksApi } from '@/lib/userDataApi';
import { useTranslationMaps } from '@/store/translationSlice';
import { supabase } from '@/lib/supabaseClient';
import { GUEST_BOOKMARKS } from '@/data/guestBookmarks';

// Define a simplified bookmark type that matches what we use in the UI
type SimpleBookmark = {
  id?: number | string;
  name: string;
  index_value: number;
  verse_ref?: string;
  color: string | null;
  user_id: string;
  pending?: boolean;
  created_at?: Date | null;
  isGuest?: boolean;
};

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<SimpleBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { main: currentTranslation } = useTranslationMaps();
  // Get current position from reading state or fallback to 0
  const getCurrentIndex = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('readingState') ?? 'null');
      const anchorIndex = saved?.anchorIndex || 0;
      console.log('useBookmarks: getCurrentIndex returning:', anchorIndex, 'from readingState:', saved);
      return anchorIndex;
    } catch (error) {
      console.error('useBookmarks: Error reading readingState:', error);
      return 0;
    }
  };

  useEffect(() => {
    console.log('useBookmarks: useEffect triggered, user:', user?.id);
    if (!user) {
      console.log('useBookmarks: No user, loading guest bookmarks');
      loadGuestBookmarks();
      setLoading(false);
      return;
    }

    loadBookmarks();
  }, [user]);

  const loadGuestBookmarks = () => {
    // Convert guest bookmarks to SimpleBookmark format
    const guestBookmarks: SimpleBookmark[] = GUEST_BOOKMARKS.map((bookmark, index) => ({
      id: `guest-${index}`,
      name: bookmark.label,
      index_value: 0, // Would need to calculate from verse_key if needed
      verse_ref: bookmark.verse_key,
      color: bookmark.color_hex,
      user_id: 'guest',
      isGuest: true,
      created_at: null
    }));

    console.log('useBookmarks: Loaded', guestBookmarks.length, 'guest bookmarks');
    setBookmarks(guestBookmarks);
  };

  const loadBookmarks = async () => {
    if (!user) return;

    console.log('useBookmarks: Starting to load bookmarks for user:', user.id);
    try {
      // Get all bookmarks for the current user and translation
      // We'll load bookmarks for all verses since we don't have a specific list
      // This is inefficient but works as a first step - could be optimized later
      const { data, error } = await supabase()
        .from('user_bookmarks')
        .select('id, verse_key, translation, label, color_hex, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('translation', currentTranslation)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Convert to SimpleBookmark format
      const loadedBookmarks: SimpleBookmark[] = (data || []).map(bookmark => ({
        id: bookmark.id,
        name: bookmark.label || '', // Use actual label from database
        index_value: 0, // Would need to calculate from verse_key if needed
        verse_ref: bookmark.verse_key,
        color: bookmark.color_hex || '#ef4444', // Use actual color or default
        user_id: user.id,
        isGuest: false,
        created_at: bookmark.created_at ? new Date(bookmark.created_at) : null
      }));

      console.log('useBookmarks: Loaded', loadedBookmarks.length, 'bookmarks');
      setBookmarks(loadedBookmarks);
    } catch (error) {
      console.error('useBookmarks: Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBookmark = async (name: string, color = '#ef4444') => {
    if (!user?.id) {
      console.error('useBookmarks: No user available for bookmark save (guest users cannot add bookmarks)');
      return;
    }

    const currentIndex = getCurrentIndex();
    const verseKey = getVerseKeyByIndex(currentIndex);
    console.log('useBookmarks: Creating bookmark with index:', currentIndex, 'verse_key:', verseKey);

    try {
      // Use the new contract-based API function with label and color
      await upsertBookmark(user.id, verseKey, name, currentTranslation, color);
      
      // Reload bookmarks to get the real ID and ensure consistency
      await loadBookmarks();
      
      console.log('useBookmarks: Bookmark saved successfully for:', verseKey);
      
      // Return a temporary bookmark object for immediate feedback
      const tempBookmark: SimpleBookmark = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        name,
        index_value: currentIndex,
        verse_ref: verseKey,
        color,
        pending: false
      };
      
      return tempBookmark;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  };

  const deleteBookmark = async (id: number | string) => {
    if (!user?.id) {
      console.error('useBookmarks: Guest users cannot delete bookmarks');
      return;
    }

    try {
      // Use the new contract-based API function
      await deleteBookmarkById(user.id, id.toString());
      
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw error;
    }
  };

  const updateBookmark = async (id: number, updates: Partial<Pick<SimpleBookmark, 'name' | 'color'>>) => {
    if (!user?.id) {
      console.error('useBookmarks: Guest users cannot update bookmarks');
      return;
    }

    try {
      // Find the bookmark to get its verse_key
      const bookmark = bookmarks.find(b => b.id === id);
      if (!bookmark) {
        throw new Error('Bookmark not found');
      }
      
      // Use upsert with the new name to update
      if (updates.name && bookmark.verse_ref) {
        await upsertBookmark(user.id, bookmark.verse_ref, updates.name, currentTranslation);
      }
      
      // Update local state optimistically
      const updatedBookmark = { ...bookmark, ...updates };
      setBookmarks(prev => prev.map(b => b.id === id ? updatedBookmark : b));
      return updatedBookmark;
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw error;
    }
  };

  return {
    bookmarks,
    loading,
    addBookmark,
    deleteBookmark,
    updateBookmark,
    refresh: loadBookmarks
  };
}