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

    const uniqueRefs = [...new Set(verseRefs)];
    const refsToLoad = uniqueRefs.filter(ref => 
      !globalNotesCache.hasOwnProperty(ref) && !loadingVerses.has(ref)
    );

    if (refsToLoad.length === 0) return;

    // Mark as loading
    refsToLoad.forEach(ref => loadingVerses.add(ref));

    console.log(`📝 Batch loading notes for ${refsToLoad.length} verses:`, refsToLoad.slice(0, 5));

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id, user_id, verse_ref, text')
        .eq('user_id', user.id)
        .in('verse_ref', refsToLoad);

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
        (data as Note[]).forEach(note => {
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

    // Batch requests over 100ms window
    batchTimeoutRef.current = setTimeout(() => {
      const allPendingRefs = Array.from(pendingRequests.values())
        .flatMap(req => req.verseRefs);
      
      pendingRequests.clear();
      
      if (allPendingRefs.length > 0) {
        batchLoadNotes(allPendingRefs);
      }
    }, 100);
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
    forceUpdate();
  }, [forceUpdate]);

  // Clear cache when user changes
  useEffect(() => {
    if (!user) {
      clearCache();
    }
  }, [user?.id, clearCache]);

  return {
    getCachedNotes,
    isLoading,
    updateCache,
    clearCache,
    batchLoadNotes
  };
}