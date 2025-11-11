import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotesCache } from './useNotesCache';
import { upsertNote, deleteNote } from '@/lib/userDataApi';
import type { Note } from '@shared/schema';
import { useTranslationMaps } from './useTranslationMaps';

export function useNotes(verseRef?: string) {
  const { user } = useAuth();
  const { getCachedNotes, isLoading, updateCache } = useNotesCache();
  const { mainTranslation } = useTranslationMaps();
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
    if (!user?.id || !verseRef || !text.trim()) return;
    
    try {
      // Use the new contract-based API function
      await upsertNote(user.id, verseRef, text, mainTranslation);
      
      // Create a temporary note object for optimistic updates
      const tempNote: Note = {
        id: Date.now(), // Temporary ID
        user_id: user.id,
        verse_ref: verseRef,
        text: text
      };
      
      // Update local state optimistically
      setNotes((n) => [tempNote, ...n]);
      // Update global cache optimistically  
      updateCache(verseRef, (n) => [tempNote, ...n]);
      
      // Note: The cache will be refreshed automatically by the batch loading system
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  }, [user?.id, verseRef, updateCache]);

  const updateNote = useCallback(async (id: number, text: string) => {
    if (!user?.id || !verseRef) return;
    
    try {
      // Use the new contract-based API function (upsert will handle updates)
      await upsertNote(user.id, verseRef, text, mainTranslation);
      
      // Update local state optimistically
      setNotes((n) => n.map((x) => (x.id === id ? { ...x, text } : x)));
      // Update global cache optimistically
      if (verseRef) {
        updateCache(verseRef, (n) => n.map((x) => (x.id === id ? { ...x, text } : x)));
      }
      
      // Note: The cache will be refreshed automatically by the batch loading system
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  }, [user?.id, verseRef, updateCache]);

  const deleteNoteById = useCallback(async (id: number) => {
    if (!user?.id) return;
    
    try {
      // Use the new contract-based API function
      await deleteNote(user.id, id.toString());
      
      // Update local state
      setNotes((n) => n.filter((x) => x.id !== id));
      // Update global cache
      if (verseRef) {
        updateCache(verseRef, (n) => n.filter((x) => x.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }, [user?.id, verseRef, updateCache]);

  return { notes, loading, addNote, updateNote, deleteNote: deleteNoteById };
}