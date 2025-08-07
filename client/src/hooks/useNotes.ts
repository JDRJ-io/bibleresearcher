import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useNotesCache } from './useNotesCache';
import type { Note } from '@shared/schema';

export function useNotes(verseRef?: string) {
  const { user } = useAuth();
  const { getCachedNotes, isLoading, updateCache } = useNotesCache();
  const [notes, setNotes] = useState<Note[]>([]);

  /* Use cached notes instead of individual database queries */
  useEffect(() => {
    if (!user || !verseRef) {
      setNotes([]);
      return;
    }

    const cachedNotes = getCachedNotes(verseRef);
    if (cachedNotes !== null) {
      setNotes(cachedNotes);
    } else {
      setNotes([]);
    }
  }, [user?.id, verseRef, getCachedNotes]);

  // Check if this specific verse is loading
  const loading = verseRef ? isLoading(verseRef) : false;

  /* helpers - now update both local state and global cache */
  const addNote = useCallback(async (text: string) => {
    if (!user || !verseRef) return;
    const { data, error } = await supabase.from('notes').insert({
      user_id: user.id,
      verse_ref: verseRef,
      text,
    }).select().single();
    
    if (!error && data) {
      const newNote = data as Note;
      // Update local state
      setNotes((n) => [newNote, ...n]);
      // Update global cache
      updateCache(verseRef, (n) => [newNote, ...n]);
    }
  }, [user?.id, verseRef, updateCache]);

  const updateNote = useCallback(async (id: number, text: string) => {
    const { data, error } = await supabase
      .from('notes')
      .update({ text })
      .eq('id', id)
      .select('id, user_id, verse_ref, text')
      .single();
      
    if (!error && data) {
      const updatedNote = data as Note;
      // Update local state
      setNotes((n) => n.map((x) => (x.id === id ? updatedNote : x)));
      // Update global cache
      if (verseRef) {
        updateCache(verseRef, (n) => n.map((x) => (x.id === id ? updatedNote : x)));
      }
    }
  }, [verseRef, updateCache]);

  const deleteNote = useCallback(async (id: number) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (!error) {
      // Update local state
      setNotes((n) => n.filter((x) => x.id !== id));
      // Update global cache
      if (verseRef) {
        updateCache(verseRef, (n) => n.filter((x) => x.id !== id));
      }
    }
  }, [verseRef, updateCache]);

  return { notes, loading, addNote, updateNote, deleteNote };
}