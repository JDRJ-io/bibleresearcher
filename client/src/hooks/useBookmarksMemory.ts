/**
 * Memory-based bookmark hooks - Zero network requests during scrolling
 * Uses the bootstrapped in-memory store for O(1) lookups
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getBookmark, 
  isVerseBookmarked, 
  getUserBookmarks, 
  getBookmarksForVerses, 
  toggleBookmarkOptimistic,
  useBookmarksStore,
  type Bookmark 
} from '../stores/bookmarksStore';

// ============================================================================
// MEMORY-BASED BOOKMARK HOOKS
// ============================================================================

/**
 * Get bookmarks for multiple verses from memory
 * Replaces useUserBookmarks - zero network requests!
 */
export function useUserBookmarksMemory(visibleVerseKeys: string[], translation: string = 'KJV') {
  const { user } = useAuth();
  
  // Subscribe to store updates
  const updateCounter = useBookmarksStore((state) => state.updateCounter);
  
  const data = useMemo(() => {
    if (!user || !visibleVerseKeys.length) return new Map<string, Bookmark>();
    
    // O(n) where n = visible verses (much better than N network requests!)
    return getBookmarksForVerses(visibleVerseKeys, translation);
  }, [user, visibleVerseKeys, translation, updateCounter]);
  
  // Create helper functions for compatibility with existing code
  const bookmarksData = useMemo(() => ({
    bookmarks: Array.from(data.values()),
    isVerseBookmarked: (verseKey: string) => data.has(verseKey),
  }), [data]);
  
  return {
    data: bookmarksData,
    isLoading: false, // Always instant from memory
    error: null,
  };
}

/**
 * Check if a specific verse is bookmarked from memory
 * Replaces useIsBookmarked - instant O(1) lookup!
 */
export function useIsBookmarkedMemory(translation: string, verse_key: string) {
  const { user } = useAuth();
  
  // Subscribe to store updates  
  const updateCounter = useBookmarksStore((state) => state.updateCounter);
  
  const data = useMemo(() => {
    if (!user || !translation || !verse_key) return false;
    
    // O(1) lookup from memory
    return isVerseBookmarked(verse_key, translation);
  }, [user, translation, verse_key, updateCounter]);
  
  return {
    data,
    isLoading: false, // Always instant
    error: null,
  };
}

/**
 * Get all bookmarks for the current user from memory
 */
export function useAllUserBookmarksMemory() {
  const { user } = useAuth();
  
  // Subscribe to store updates
  const updateCounter = useBookmarksStore((state) => state.updateCounter);
  
  const data = useMemo(() => {
    if (!user) return [];
    
    return getUserBookmarks(user.id);
  }, [user, updateCounter]);
  
  return {
    data,
    isLoading: false,
    error: null,
  };
}

/**
 * Toggle bookmark with optimistic updates
 * Much faster than the old version - updates UI immediately
 */
export function useToggleBookmarkMemory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      translation, 
      verse_key, 
      label, 
      colorHex 
    }: { 
      translation: string; 
      verse_key: string; 
      label?: string; 
      colorHex?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Apply optimistic update immediately (UI updates instantly!)
      const isAdding = toggleBookmarkOptimistic(verse_key, translation, user.id, label, colorHex);
      
      return { isAdding, verse_key, translation };
    },
    onSuccess: ({ isAdding, verse_key }) => {
      // Invalidate any remaining legacy queries (for compatibility)
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmark-check'] });
      
      toast({
        title: isAdding ? "Bookmark added" : "Bookmark removed",
        description: `${verse_key} has been ${isAdding ? 'bookmarked' : 'unbookmarked'}`,
      });
    },
    onError: (error: any) => {
      console.error('Bookmark toggle error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update bookmark",
        variant: "destructive",
      });
    },
  });
}

/**
 * Get specific bookmark data from memory
 */
export function useBookmarkMemory(verseKey: string, translation: string) {
  const { user } = useAuth();
  
  // Subscribe to store updates
  const updateCounter = useBookmarksStore((state) => state.updateCounter);
  
  const data = useMemo(() => {
    if (!user || !verseKey || !translation) return null;
    
    return getBookmark(verseKey, translation);
  }, [user, verseKey, translation, updateCounter]);
  
  return {
    data,
    isLoading: false,
    error: null,
  };
}

// ============================================================================
// COMPATIBILITY HELPERS
// ============================================================================

/**
 * Helper to create the exact same interface as the old useUserBookmarks
 * for drop-in replacement in existing components
 */
export function useUserBookmarksCompat(visibleVerseKeys: string[], translation: string = 'KJV') {
  const result = useUserBookmarksMemory(visibleVerseKeys, translation);
  
  // Return exact same format as old hook
  return {
    data: result.data.bookmarks.length > 0 ? result.data : null,
    isLoading: result.isLoading,
    error: result.error,
    // Add helper function for checking if verse is bookmarked
    isVerseBookmarked: result.data.isVerseBookmarked,
  };
}