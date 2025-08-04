import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useVerseNav } from './useVerseNav';
import type { Bookmark, InsertBookmark } from '@shared/schema';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
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
      console.log('useBookmarks: No user, setting empty bookmarks');
      setBookmarks([]);
      setLoading(false);
      return;
    }

    loadBookmarks();
  }, [user]);

  const loadBookmarks = async () => {
    if (!user) return;

    console.log('useBookmarks: Starting to load bookmarks for user:', user.id);
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id, name, index_value, color, user_id, pending')
        .eq('user_id', user.id);

      if (error) {
        console.error('useBookmarks: Database error during load:', error);
        throw error;
      }
      console.log('useBookmarks: Successfully loaded', data?.length || 0, 'bookmarks');
      setBookmarks((data as Bookmark[]) || []);
    } catch (error) {
      console.error('useBookmarks: Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBookmark = async (name: string, color = '#ef4444') => {
    if (!user) {
      console.error('useBookmarks: No user available for bookmark save');
      return;
    }

    const currentIndex = getCurrentIndex();
    console.log('useBookmarks: Creating bookmark with index:', currentIndex);

    try {
      const newBookmark = {
        user_id: user.id,
        name,
        index_value: currentIndex,
        color,
        pending: false
      };

      console.log('useBookmarks: Inserting bookmark:', newBookmark);

      const { data, error } = await supabase
        .from('bookmarks')
        .insert(newBookmark)
        .select('id, name, index_value, color, user_id, pending')
        .single();

      if (error) throw error;

      setBookmarks(prev => [data as Bookmark, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding bookmark - raw database error:', error);
      throw error;
    }
  };

  const deleteBookmark = async (id: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw error;
    }
  };

  const updateBookmark = async (id: number, updates: Partial<Pick<Bookmark, 'name' | 'color'>>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, name, index_value, color, user_id, pending')
        .single();

      if (error) throw error;

      setBookmarks(prev => prev.map(b => b.id === id ? data as Bookmark : b));
      return data;
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