import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import type { Note } from '@shared/schema';

interface NotesCache {
  [verseRef: string]: Note[];
}

interface PendingRequest {
  verseRefs: string[];
  timestamp: number;
}

// Global cache shared across all components
const globalNotesCache: NotesCache = {};
const loadingVerses = new Set<string>();
const pendingRequests = new Map<string, PendingRequest>();
let isPrefetched = false; // Track if we've already prefetched for this user
let currentUserId: string | null = null; // Track which user's notes are cached

export function useNotesCache() {
  const { user } = useAuth();
  const [, setForceUpdate] = useState(0);
  const batchTimeoutRef = useRef<NodeJS.Timeout>();

  // Force re-render when cache updates
  const forceUpdate = useCallback(() => {
    setForceUpdate(prev => prev + 1);
  }, []);

  // Batch load notes for multiple verses
  const batchLoadNotes = useCallback(async (verseRefs: string[]) => {
    if (!user || verseRefs.length === 0) return;

    const uniqueRefs = Array.from(new Set(verseRefs));
    const refsToLoad = uniqueRefs.filter(ref => 
      !globalNotesCache.hasOwnProperty(ref) && !loadingVerses.has(ref)
    );

    if (refsToLoad.length === 0) return;

    // Mark as loading
    refsToLoad.forEach(ref => loadingVerses.add(ref));

    console.log(`📝 Batch loading notes for ${refsToLoad.length} verses:`, refsToLoad.slice(0, 5));

    try {
      const { data, error } = await supabase()
        .from('user_notes')
        .select('id, verse_key, translation, body, created_at, updated_at')
        .eq('user_id', user.id) // CRITICAL: Only load notes for the logged-in user
        .in('verse_key', refsToLoad);

      if (error) {
        console.error('📝 Error batch loading notes:', error);
        return;
      }

      // Initialize empty arrays for all requested verses
      refsToLoad.forEach(ref => {
        if (!globalNotesCache.hasOwnProperty(ref)) {
          globalNotesCache[ref] = [];
        }
      });

      // Populate cache with actual notes
      if (data) {
        data.forEach(dbNote => {
          // Convert database fields to Note interface format
          const note = {
            id: dbNote.id,
            user_id: user.id,
            verse_ref: dbNote.verse_key, // Convert verse_key to verse_ref
            text: dbNote.body, // Convert body to text
            translation: dbNote.translation,
            created_at: dbNote.created_at,
            updated_at: dbNote.updated_at
          };
          
          if (!globalNotesCache[note.verse_ref]) {
            globalNotesCache[note.verse_ref] = [];
          }
          globalNotesCache[note.verse_ref].push(note);
        });
      }

      console.log(`📝 Batch loaded notes for ${refsToLoad.length} verses, found ${data?.length || 0} actual notes`);
      
    } catch (error) {
      console.error('📝 Error in batch notes loading:', error);
    } finally {
      // Remove loading markers
      refsToLoad.forEach(ref => loadingVerses.delete(ref));
      forceUpdate();
    }
  }, [user?.id, forceUpdate]);

  // Prefetch ALL user notes at once (called on login)
  const prefetchAllNotes = useCallback(async () => {
    if (!user) return;

    // Don't prefetch if already done for this user
    if (isPrefetched && currentUserId === user.id) {
      console.log('📝 Notes already prefetched for this user');
      return;
    }

    console.log('📝 Prefetching all notes for user...');
    const startTime = Date.now();

    try {
      const { data, error } = await supabase()
        .from('user_notes')
        .select('id, verse_key, translation, body, created_at, updated_at')
        .eq('user_id', user.id);

      if (error) {
        console.error('📝 Error prefetching notes:', error);
        return;
      }

      // Clear existing cache
      Object.keys(globalNotesCache).forEach(key => delete globalNotesCache[key]);

      // Group notes by verse_ref
      const notesByVerse: NotesCache = {};
      if (data) {
        data.forEach(dbNote => {
          // Convert database fields to Note interface format
          const note: Note = {
            id: dbNote.id,
            user_id: user.id,
            verse_ref: dbNote.verse_key, // Convert verse_key to verse_ref
            text: dbNote.body // Convert body to text
          };
          
          if (!notesByVerse[note.verse_ref]) {
            notesByVerse[note.verse_ref] = [];
          }
          notesByVerse[note.verse_ref].push(note);
        });
      }

      // Copy to global cache
      Object.assign(globalNotesCache, notesByVerse);

      // Mark as prefetched
      isPrefetched = true;
      currentUserId = user.id;

      const duration = Date.now() - startTime;
      const verseCount = Object.keys(notesByVerse).length;
      const noteCount = data?.length || 0;
      console.log(`📝 ✅ Prefetched ${noteCount} notes across ${verseCount} verses in ${duration}ms`);

      forceUpdate();
    } catch (error) {
      console.error('📝 Error in notes prefetch:', error);
    }
  }, [user?.id, forceUpdate]);

  // Request notes for a verse (with batching)
  const requestNotes = useCallback((verseRef: string) => {
    if (!user || !verseRef || globalNotesCache.hasOwnProperty(verseRef) || loadingVerses.has(verseRef)) {
      return;
    }

    // Add to pending requests
    const userId = user.id;
    const key = `${userId}:${verseRef}`;
    
    if (!pendingRequests.has(key)) {
      pendingRequests.set(key, { verseRefs: [verseRef], timestamp: Date.now() });
    }

    // Clear existing timeout and set new one
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Batch requests over 10ms window (reduced since we prefetch)
    batchTimeoutRef.current = setTimeout(() => {
      const allPendingRefs = Array.from(pendingRequests.values())
        .flatMap(req => req.verseRefs);
      
      pendingRequests.clear();
      
      if (allPendingRefs.length > 0) {
        batchLoadNotes(allPendingRefs);
      }
    }, 10);
  }, [user?.id, batchLoadNotes]);

  // Get cached notes for a verse
  const getCachedNotes = useCallback((verseRef: string): Note[] | null => {
    if (!verseRef || !user) return null;
    
    if (globalNotesCache.hasOwnProperty(verseRef)) {
      return globalNotesCache[verseRef];
    }
    
    // Request the notes if not cached
    requestNotes(verseRef);
    return null;
  }, [user, requestNotes]);

  // Check if notes are loading for a verse
  const isLoading = useCallback((verseRef: string): boolean => {
    return loadingVerses.has(verseRef);
  }, []);

  // Update cache when note is added/updated/deleted
  const updateCache = useCallback((verseRef: string, updater: (notes: Note[]) => Note[]) => {
    if (globalNotesCache.hasOwnProperty(verseRef)) {
      globalNotesCache[verseRef] = updater(globalNotesCache[verseRef]);
      forceUpdate();
    }
  }, [forceUpdate]);

  // Clear cache (for user logout, etc.)
  const clearCache = useCallback(() => {
    Object.keys(globalNotesCache).forEach(key => delete globalNotesCache[key]);
    loadingVerses.clear();
    pendingRequests.clear();
    isPrefetched = false;
    currentUserId = null;
    forceUpdate();
  }, [forceUpdate]);

  // Prefetch notes when user logs in
  useEffect(() => {
    if (!user) {
      clearCache();
    } else if (user.id !== currentUserId) {
      // User logged in or changed - prefetch their notes
      prefetchAllNotes();
    }
  }, [user?.id, clearCache, prefetchAllNotes]);

  return {
    getCachedNotes,
    isLoading,
    updateCache,
    clearCache,
    batchLoadNotes,
    prefetchAllNotes
  };
}