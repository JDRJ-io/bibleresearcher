/**
 * Bookmarks Bootstrap - Load All User Bookmarks at Startup
 * 
 * Bootstrap Flow:
 * 1. Check authentication
 * 2. Load all user bookmarks from server
 * 3. Populate in-memory stores for O(1) lookups
 * 4. Start background sync processor
 */

import { supabase } from '@/lib/supabaseClient';
import { 
  setBookmark, 
  clearBookmarks, 
  updateBookmarksMeta, 
  bookmarkMutations,
  type Bookmark 
} from './bookmarksStore';
import { logger } from '@/lib/logger';
import { GUEST_BOOKMARKS } from '@/data/guestBookmarks';

// ============================================================================
// TYPES
// ============================================================================

interface BookmarkBootstrapResult {
  success: boolean;
  totalBookmarks: number;
  duration: number;
  error?: string;
}

// ============================================================================
// BOOTSTRAP IMPLEMENTATION
// ============================================================================

/**
 * Bootstrap all user bookmarks
 * Called once after authentication or to load guest bookmarks
 * @param userId - User ID to bootstrap for (required, use 'guest' for non-authenticated users)
 */
export async function bootstrapBookmarks(userId: string): Promise<BookmarkBootstrapResult> {
  const startTime = Date.now();
  
  try {
    // Handle guest users
    if (!userId || userId === 'guest') {
      logger.debug('BOOKMARKS', 'bootstrap-guest', { reason: 'guest_user' });
      return bootstrapGuestBookmarks();
    }

    logger.debug('BOOKMARKS', 'bootstrap-start', { user_id: userId });

    // Clear existing data
    clearBookmarks();
    
    // Load all bookmarks for the user
    const { data: bookmarksData, error } = await supabase()
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      logger.error('BOOKMARKS', 'bootstrap-query-failed', { error });
      return {
        success: false,
        totalBookmarks: 0,
        duration: Date.now() - startTime,
        error: error.message,
      };
    }

    // Populate in-memory stores
    const bookmarks = bookmarksData || [];
    let loadedCount = 0;
    
    for (const bookmarkData of bookmarks) {
      const bookmark: Bookmark = {
        id: bookmarkData.id,
        user_id: bookmarkData.user_id,
        translation: bookmarkData.translation,
        verse_key: bookmarkData.verse_key,
        label: bookmarkData.label,
        color_hex: bookmarkData.color_hex,
        created_at: bookmarkData.created_at,
        updated_at: bookmarkData.updated_at,
        origin: 'server',
        pending: false,
      };
      
      setBookmark(bookmark);
      loadedCount++;
    }

    // Update meta information
    updateBookmarksMeta({
      last_synced_at: new Date().toISOString(),
      user_id: userId,
      total_count: loadedCount,
    });

    const duration = Date.now() - startTime;
    logger.info('BOOKMARKS', 'bootstrap-complete', { count: loadedCount, duration_ms: duration });

    return {
      success: true,
      totalBookmarks: loadedCount,
      duration,
    };
    
  } catch (error) {
    logger.error('BOOKMARKS', 'bootstrap-error', { error });
    return {
      success: false,
      totalBookmarks: 0,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Bootstrap guest bookmarks for non-authenticated users
 * Loads a curated list of featured verses
 */
function bootstrapGuestBookmarks(): BookmarkBootstrapResult {
  const startTime = Date.now();
  
  try {
    // Clear existing data
    clearBookmarks();
    
    // Populate in-memory stores with guest bookmarks
    let loadedCount = 0;
    
    for (let i = 0; i < GUEST_BOOKMARKS.length; i++) {
      const guestBookmark = GUEST_BOOKMARKS[i];
      const bookmark: Bookmark = {
        id: -(i + 1), // Negative IDs for guest bookmarks to avoid conflicts
        user_id: 'guest',
        translation: 'KJV', // Default translation for guest bookmarks
        verse_key: guestBookmark.verse_key,
        label: guestBookmark.label,
        color_hex: guestBookmark.color_hex,
        created_at: null,
        updated_at: null,
        origin: 'local',
        pending: false,
      };
      
      setBookmark(bookmark);
      loadedCount++;
    }

    // Update meta information
    updateBookmarksMeta({
      last_synced_at: new Date().toISOString(),
      user_id: 'guest',
      total_count: loadedCount,
    });

    const duration = Date.now() - startTime;
    logger.info('BOOKMARKS', 'guest-bootstrap-complete', { count: loadedCount, duration_ms: duration });

    return {
      success: true,
      totalBookmarks: loadedCount,
      duration,
    };
  } catch (error) {
    logger.error('BOOKMARKS', 'guest-bootstrap-error', { error });
    return {
      success: false,
      totalBookmarks: 0,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Process pending bookmark mutations in background
 * This handles optimistic updates that need to sync to server
 */
export async function processBookmarkMutations(): Promise<void> {
  const pendingMutations = Array.from(bookmarkMutations.entries())
    .filter(([_, mutation]) => mutation.status === 'pending')
    .slice(0, 10); // Process in batches of 10

  if (pendingMutations.length === 0) return;

  logger.debug('BOOKMARKS', 'sync-processing', { count: pendingMutations.length });

  for (const [mutationId, mutation] of pendingMutations) {
    try {
      mutation.status = 'syncing';
      
      if (mutation.type === 'toggle') {
        const { verseKey, translation, userId, label, colorHex, isAdding } = mutation.payload;
        
        if (isAdding) {
          // Add bookmark to server
          const { error } = await supabase()
            .from('user_bookmarks')
            .insert({
              user_id: userId,
              translation,
              verse_key: verseKey,
              label: label || null,
              color_hex: colorHex || null,
            });
            
          if (error) throw error;
        } else {
          // Remove bookmark from server
          const { error } = await supabase()
            .from('user_bookmarks')
            .delete()
            .eq('user_id', userId)
            .eq('translation', translation)
            .eq('verse_key', verseKey);
            
          if (error) throw error;
        }
      }
      
      // Mark as completed and remove from queue
      bookmarkMutations.delete(mutationId);
      logger.debug('BOOKMARKS', 'mutation-complete', { type: mutation.type, verse: mutation.payload.verseKey });
      
    } catch (error) {
      logger.error('BOOKMARKS', 'mutation-failed', { type: mutation.type, error });
      mutation.status = 'failed';
    }
  }
}

/**
 * Start the bookmark sync processor
 * Runs every 30 seconds to sync pending mutations
 */
let syncInterval: NodeJS.Timeout | null = null;

export function startBookmarkSyncProcessor(): void {
  if (syncInterval) return; // Already running
  
  syncInterval = setInterval(async () => {
    try {
      await processBookmarkMutations();
    } catch (error) {
      logger.error('BOOKMARKS', 'sync-processor-error', { error });
    }
  }, 30000); // 30 seconds
  
  logger.info('BOOKMARKS', 'sync-processor-start');
}

export function stopBookmarkSyncProcessor(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    logger.info('BOOKMARKS', 'sync-processor-stop');
  }
}

/**
 * Force immediate sync of all pending mutations
 */
export async function forceBookmarkSync(): Promise<void> {
  logger.debug('BOOKMARKS', 'force-sync');
  await processBookmarkMutations();
}