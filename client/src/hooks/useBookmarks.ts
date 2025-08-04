import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useVerseNav } from './useVerseNav';
import type { Bookmark, InsertBookmark } from '@shared/schema';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  // Get current position from URL or localStorage
  const getCurrentIndex = () => {
    const saved = JSON.parse(localStorage.getItem('readingState') ?? 'null');
    return saved?.anchorIndex || 0;
  };

  useEffect(() => {
    if (!user) {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    loadBookmarks();
  }, [user]);

  const loadBookmarks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id, name, index_value, color, user_id, pending')
        .eq('user_id', user.id);

      if (error) throw error;
      setBookmarks((data as Bookmark[]) || []);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBookmark = async (name: string, color = '#ef4444') => {
    if (!user) return;

    try {
      const newBookmark = {
        user_id: user.id,
        name,
        index_value: getCurrentIndex(),
        color,
        pending: false
      };

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