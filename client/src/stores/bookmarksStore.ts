/**
 * Bookmarks Store - Local-First with Bootstrap Pattern
 * 
 * Data Flow:
 * 1. Bootstrap: Load all user bookmarks once at startup
 * 2. Memory: Store in fast lookup maps (bookmarksByVerse)
 * 3. Render: Read from memory maps (zero network during scroll)
 * 4. Updates: Apply optimistically to memory, sync in background
 * 5. Persistence: Store in IndexedDB for offline capability
 */

import { z } from 'zod';
import { create } from 'zustand';

// ============================================================================
// DATA MODELS
// ============================================================================

export const BookmarkSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  translation: z.string(),
  verse_key: z.string(),
  label: z.string().nullable().optional(), // Optional bookmark name
  color_hex: z.string().nullable().optional(), // Optional color in hex format
  created_at: z.string().nullable().optional(), // ISO timestamp
  updated_at: z.string().nullable().optional(), // ISO timestamp
  // Local metadata for sync tracking
  origin: z.enum(['server', 'local']).default('server'),
  pending: z.boolean().default(false),
});

export type Bookmark = z.infer<typeof BookmarkSchema>;

// ============================================================================
// IN-MEMORY STORES (Source of Truth for Rendering)
// ============================================================================

/**
 * Primary store for bookmarks
 * Structure: verse_key -> Map<translation, Bookmark>
 * Enables O(1) lookup: getBookmark(verseKey, translation)
 */
export const bookmarksByVerse = new Map<string, Map<string, Bookmark>>();

/**
 * Secondary index for faster user queries
 * Structure: user_id -> Map<verse_key, Map<translation, Bookmark>>
 */
export const bookmarksByUser = new Map<string, Map<string, Map<string, Bookmark>>>();

/**
 * Pending mutations queue for background sync
 */
export const bookmarkMutations = new Map<string, {
  id: string;
  type: 'toggle' | 'update' | 'delete';
  payload: any;
  created_at: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}>();

/**
 * Meta information for tracking sync state
 */
export let bookmarksMeta = {
  last_synced_at: null as string | null,
  user_id: null as string | null,
  total_count: 0,
};

// ============================================================================
// REACTIVE STORE (Zustand for automatic re-renders)
// ============================================================================

interface BookmarksStore {
  // Trigger counter for forcing re-renders
  updateCounter: number;
  // Increment to trigger re-renders of all hooks
  triggerUpdate: () => void;
  // Trigger update for specific verse
  triggerVerseUpdate: (verseKey: string) => void;
}

export const useBookmarksStore = create<BookmarksStore>((set) => ({
  updateCounter: 0,
  triggerUpdate: () => set((state) => ({ updateCounter: state.updateCounter + 1 })),
  triggerVerseUpdate: (verseKey: string) => {
    // For now, trigger global update - could be optimized per-verse later
    set((state) => ({ updateCounter: state.updateCounter + 1 }));
  },
}));

// ============================================================================
// CORE STORE OPERATIONS
// ============================================================================

/**
 * Get bookmark for a specific verse and translation
 * O(1) lookup from memory
 */
export function getBookmark(verseKey: string, translation: string): Bookmark | null {
  const verseBookmarks = bookmarksByVerse.get(verseKey);
  if (!verseBookmarks) return null;
  
  return verseBookmarks.get(translation) || null;
}

/**
 * Check if a verse is bookmarked for a specific translation
 * O(1) lookup from memory
 */
export function isVerseBookmarked(verseKey: string, translation: string): boolean {
  return getBookmark(verseKey, translation) !== null;
}

/**
 * Get all bookmarks for a user
 * O(1) lookup from memory
 */
export function getUserBookmarks(userId: string): Bookmark[] {
  const userBookmarks = bookmarksByUser.get(userId);
  if (!userBookmarks) return [];
  
  const allBookmarks: Bookmark[] = [];
  userBookmarks.forEach(verseMap => {
    verseMap.forEach(bookmark => {
      allBookmarks.push(bookmark);
    });
  });
  
  return allBookmarks.sort((a, b) => {
    const aTime = a.updated_at || a.created_at || '';
    const bTime = b.updated_at || b.created_at || '';
    return bTime.localeCompare(aTime); // Most recent first
  });
}

/**
 * Get bookmarks for multiple verses (batch lookup)
 * O(n) where n = verse count
 */
export function getBookmarksForVerses(verseKeys: string[], translation: string): Map<string, Bookmark> {
  const results = new Map<string, Bookmark>();
  
  for (const verseKey of verseKeys) {
    const bookmark = getBookmark(verseKey, translation);
    if (bookmark) {
      results.set(verseKey, bookmark);
    }
  }
  
  return results;
}

/**
 * Set bookmark in memory (used during bootstrap and realtime updates)
 */
export function setBookmark(bookmark: Bookmark): void {
  const { verse_key, translation, user_id } = bookmark;
  
  // Update primary index
  if (!bookmarksByVerse.has(verse_key)) {
    bookmarksByVerse.set(verse_key, new Map());
  }
  bookmarksByVerse.get(verse_key)!.set(translation, bookmark);
  
  // Update user index
  if (!bookmarksByUser.has(user_id)) {
    bookmarksByUser.set(user_id, new Map());
  }
  if (!bookmarksByUser.get(user_id)!.has(verse_key)) {
    bookmarksByUser.get(user_id)!.set(verse_key, new Map());
  }
  bookmarksByUser.get(user_id)!.get(verse_key)!.set(translation, bookmark);
  
  // Trigger reactive update
  useBookmarksStore.getState().triggerVerseUpdate(verse_key);
}

/**
 * Remove bookmark from memory
 */
export function removeBookmark(verseKey: string, translation: string, userId: string): void {
  // Remove from primary index
  const verseBookmarks = bookmarksByVerse.get(verseKey);
  if (verseBookmarks) {
    verseBookmarks.delete(translation);
    if (verseBookmarks.size === 0) {
      bookmarksByVerse.delete(verseKey);
    }
  }
  
  // Remove from user index
  const userBookmarks = bookmarksByUser.get(userId);
  if (userBookmarks) {
    const userVerseBookmarks = userBookmarks.get(verseKey);
    if (userVerseBookmarks) {
      userVerseBookmarks.delete(translation);
      if (userVerseBookmarks.size === 0) {
        userBookmarks.delete(verseKey);
      }
    }
    if (userBookmarks.size === 0) {
      bookmarksByUser.delete(userId);
    }
  }
  
  // Trigger reactive update
  useBookmarksStore.getState().triggerVerseUpdate(verseKey);
}

/**
 * Toggle bookmark optimistically
 * Updates memory immediately, queues for background sync
 */
export function toggleBookmarkOptimistic(
  verseKey: string,
  translation: string,
  userId: string,
  label?: string,
  colorHex?: string
): boolean {
  const existingBookmark = getBookmark(verseKey, translation);
  const isAdding = !existingBookmark;
  
  if (isAdding) {
    // Add new bookmark optimistically
    const tempBookmark: Bookmark = {
      id: Date.now(), // Temporary ID, will be replaced by server
      user_id: userId,
      translation,
      verse_key: verseKey,
      label: label || null,
      color_hex: colorHex || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      origin: 'local',
      pending: true,
    };
    
    setBookmark(tempBookmark);
  } else {
    // Remove existing bookmark
    removeBookmark(verseKey, translation, userId);
  }
  
  // Queue for background sync
  const mutationId = `toggle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  bookmarkMutations.set(mutationId, {
    id: mutationId,
    type: 'toggle',
    payload: { verseKey, translation, userId, label, colorHex, isAdding },
    created_at: new Date().toISOString(),
    status: 'pending',
  });
  
  console.log(`Bookmark ${isAdding ? 'added' : 'removed'} optimistically:`, { verseKey, translation });
  
  return isAdding;
}

/**
 * Clear all bookmarks from memory (used during logout or re-bootstrap)
 */
export function clearBookmarks(): void {
  bookmarksByVerse.clear();
  bookmarksByUser.clear();
  bookmarkMutations.clear();
  bookmarksMeta = {
    last_synced_at: null,
    user_id: null,
    total_count: 0,
  };
  
  useBookmarksStore.getState().triggerUpdate();
}

/**
 * Update meta information
 */
export function updateBookmarksMeta(meta: Partial<typeof bookmarksMeta>): void {
  Object.assign(bookmarksMeta, meta);
}

/**
 * Get debug information about the bookmarks store
 */
export function getBookmarksDebugInfo() {
  const verseCount = bookmarksByVerse.size;
  const userCount = bookmarksByUser.size;
  const totalBookmarks = Array.from(bookmarksByVerse.values())
    .reduce((sum, verseMap) => sum + verseMap.size, 0);
  
  return {
    versesWithBookmarks: verseCount,
    usersWithBookmarks: userCount,
    totalBookmarks,
    pendingMutations: bookmarkMutations.size,
    lastSyncedAt: bookmarksMeta.last_synced_at,
    memoryEstimateKB: Math.round((totalBookmarks * 200) / 1024), // Rough estimate
  };
}