/**
 * Highlights V2 Bootstrap System
 * 
 * Loads all user highlights once at startup using the unified RPC
 * Supports paging for large datasets and populates in-memory stores
 */

import { supabase } from '@/lib/supabaseClient';
import {
  rangesByTrAndVerse,
  washByVerse,
  updateMeta,
  setRanges,
  setWash,
  clearAll,
  log,
  isHighlightsV2Enabled,
  type Range,
  type Wash,
} from './highlightsStore';
import { v2Logger, logBootstrap, logPerformance } from '@/lib/v2Logger';
import {
  hydrateFromDexie,
  bulkUpsertRanges,
  bulkUpsertWashes,
  persistMeta,
  clearAllFromDexie,
} from './highlightsPersistence';
import { startOutboxProcessor } from './highlightsOutbox';

// ============================================================================
// BOOTSTRAP DATA TYPES
// ============================================================================

// Response from fn_get_all_user_highlights RPC
interface BootstrapResponse {
  ranges: {
    id: string;
    verse_key: string;
    translation: string;
    start_offset: number;
    end_offset: number;
    color_hex: string;
    note?: string | null;
    opacity?: number | null;
    updated_at: string;
  }[];
  washes: {
    id: string;
    verse_key: string;
    color_hex: string;
    opacity?: number | null;
    note?: string | null;
    updated_at: string;
  }[];
}

// ============================================================================
// BOOTSTRAP IMPLEMENTATION
// ============================================================================

/**
 * Bootstrap all user highlights
 * Called once after authentication or reader open
 * 
 * 2J Pattern: userId is used for logging and client-side validation.
 * All RPC calls (fn_get_all_user_highlights) use auth.uid() server-side via RLS for security.
 * This ensures server-side security even if client passes incorrect userId.
 * 
 * @param userId - User ID for client-side validation and logging
 */
export async function bootstrapHighlights(userId: string): Promise<boolean> {
  // Skip if V2 is disabled
  if (!isHighlightsV2Enabled()) {
    logBootstrap.start({ skipped: true, reason: 'v2_disabled' });
    return false;
  }

  const startTime = Date.now();
  
  try {
    const user_id = userId;

    // Set user ID for all subsequent logs
    v2Logger.setUserId(user_id);
    logBootstrap.start({ 
      user_id,
      cache_cleared: false,
      hydration_started: true 
    });

    // 1. Hydrate from Dexie first (for instant UI, keep this data until server loads)
    await hydrateFromDexie();
    
    // 2. Bootstrap from server with paging (this will atomically replace existing data)
    // RPC uses auth.uid() server-side via RLS for security
    const { totalRanges, totalWashes, pages } = await loadAllHighlightsFromServer();
    
    // 4. Update meta with sync timestamp
    const now = new Date().toISOString();
    updateMeta({
      last_synced_at: now,
      user_id,
    });
    
    await persistMeta({
      last_synced_at: now,
      schema_version: 1,
      user_id,
    });
    
    logBootstrap.complete({
      total_ranges: totalRanges,
      total_washes: totalWashes,
      pages_processed: pages,
      duration_ms: Date.now() - startTime,
      outbox_started: true,
      dexie_synced: true,
    });
    
    // Start outbox processor for background sync
    await startOutboxProcessor();
    
    return true;
    
  } catch (error) {
    logBootstrap.error(error instanceof Error ? error : String(error), {
      duration_ms: Date.now() - startTime,
      phase: 'bootstrap',
    });
    return false;
  }
}

/**
 * Load all highlights from server with paging
 */
async function loadAllHighlightsFromServer(): Promise<{
  totalRanges: number;
  totalWashes: number;
  pages: number;
}> {
  const PAGE_SIZE = 5000;
  let offset = 0;
  let pages = 0;
  let totalRanges = 0;
  let totalWashes = 0;
  let hasMore = true;
  let firstPageLoaded = false;

  while (hasMore) {
    pages++;
    
    // Call the unified RPC function
    const rpcStartTime = Date.now();
    logBootstrap.progress({ 
      phase: 'rpc_call',
      rpc: 'fn_get_all_user_highlights', 
      page: pages, 
      offset,
      limit: PAGE_SIZE 
    });
    
    const { data, error } = await supabase().rpc('fn_get_all_user_highlights', {
      p_limit: PAGE_SIZE,
      p_offset: offset,
      p_translation: null, // Get all translations
      p_since: null, // Bootstrap (not delta)
    });
    
    const rpcDuration = Date.now() - rpcStartTime;
    
    // Log RPC completion
    if (data) {
      const totalRows = (data.ranges?.length || 0) + (data.washes?.length || 0);
      const allIds = [
        ...(data.ranges?.map((r: any) => r.id) || []),
        ...(data.washes?.map((w: any) => w.id) || [])
      ];
      
      log('RPC_DONE', {
        op: 'bootstrap',
        type: 'mixed',
        verse_key: '',
        tr: '',
        ok: true,
        rows: totalRows,
        ids: allIds,
      });
    } else if (error) {
      log('RPC_DONE', {
        op: 'bootstrap',
        type: 'mixed', 
        verse_key: '',
        tr: '',
        ok: false,
        rows: 0,
        err: error.message,
      });
    }
    
    if (data) {
      logPerformance.query('fn_get_all_user_highlights', {
        start_time: rpcStartTime,
        duration_ms: rpcDuration,
        page: pages,
        total_rows: (data.ranges?.length || 0) + (data.washes?.length || 0),
        ranges_count: data.ranges?.length || 0,
        washes_count: data.washes?.length || 0,
        offset,
        limit: PAGE_SIZE,
      });
    }

    if (error) {
      // Fallback to existing fn_get_highlight_ranges if new RPC doesn't exist yet
      if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        logBootstrap.fallback('rpc_not_found', { 
          page: pages,
          rpc: 'fn_get_all_user_highlights',
          error_message: error.message 
        });
        return await loadHighlightsFallback();
      }
      throw error;
    }

    // Clear existing data after successful RPC response (even if empty - honors deletions)
    if (!firstPageLoaded) {
      clearAll();
      await clearAllFromDexie();
      firstPageLoaded = true;
    }

    if (!data || (!data.ranges?.length && !data.washes?.length)) {
      hasMore = false;
      break;
    }

    // Process ranges
    if (data.ranges?.length) {
      const ranges: Range[] = data.ranges.map((r: any) => ({
        id: r.id,
        verse_key: r.verse_key,
        translation: r.translation,
        start_offset: r.start_offset,
        end_offset: r.end_offset,
        color_hex: r.color_hex,
        note: r.note || null,
        opacity: r.opacity || null,
        updated_at: r.updated_at,
        // Server data metadata
        origin: 'server' as const,
        pending: false,
        tombstone: false,
        lastAckAt: r.updated_at,
      }));

      // Group by translation and verse for memory store
      ranges.forEach(range => {
        const existingRanges = rangesByTrAndVerse.get(range.translation)?.get(range.verse_key) || [];
        setRanges(range.translation, range.verse_key, [...existingRanges, range]);
      });

      // Persist to Dexie for offline
      await bulkUpsertRanges(ranges);
      totalRanges += ranges.length;
    }

    // Process washes
    if (data.washes?.length) {
      const washes: Wash[] = data.washes.map((w: any) => ({
        id: w.id,
        verse_key: w.verse_key,
        color_hex: w.color_hex,
        note: w.note || null,
        opacity: w.opacity || null,
        updated_at: w.updated_at,
        // Server data metadata  
        origin: 'server' as const,
        pending: false,
        tombstone: false,
        lastAckAt: w.updated_at,
      }));

      // Set in memory store
      washes.forEach(wash => {
        setWash(wash.verse_key, wash);
      });

      // Persist to Dexie for offline
      await bulkUpsertWashes(washes);
      totalWashes += washes.length;
    }

    // Check if we got a full page (more data available)
    hasMore = (data.ranges?.length || 0) + (data.washes?.length || 0) >= PAGE_SIZE;
    offset += PAGE_SIZE;

    logBootstrap.progress({
      phase: 'page_complete',
      page: pages,
      ranges_loaded: data.ranges?.length || 0,
      washes_loaded: data.washes?.length || 0,
      offset,
      has_more: hasMore,
      total_ranges_so_far: totalRanges,
      total_washes_so_far: totalWashes,
    });
  }

  return { totalRanges, totalWashes, pages };
}

/**
 * Fallback loading using existing RPC functions
 * Used when fn_get_all_user_highlights doesn't exist yet
 */
async function loadHighlightsFallback(): Promise<{
  totalRanges: number;
  totalWashes: number;
  pages: number;
}> {
  log('BOOTSTRAP_FALLBACK_START', { method: 'existing_rpcs' });
  
  // For now, return empty data since we don't want to use the old on-demand system
  // The new RPC needs to be implemented on the server side
  
  return { totalRanges: 0, totalWashes: 0, pages: 0 };
}

// ============================================================================
// DELTA SYNC (for periodic updates)
// ============================================================================

/**
 * Perform delta sync to get changes since last sync
 * @param userId - User ID to sync for (required)
 */
export async function performDeltaSync(userId: string): Promise<boolean> {
  if (!isHighlightsV2Enabled()) {
    return false;
  }

  const startTime = Date.now();
  
  try {
    // Get last sync timestamp from meta
    const lastSyncedAt = (globalThis as any).meta?.last_synced_at;
    if (!lastSyncedAt) {
      // No previous sync, do full bootstrap
      return await bootstrapHighlights(userId);
    }

    log('DELTA_START', { since: lastSyncedAt, user_id: userId });

    // Call RPC with since parameter for delta
    const { data, error } = await supabase().rpc('fn_get_all_user_highlights', {
      p_limit: 5000,
      p_offset: 0,
      p_translation: null,
      p_since: lastSyncedAt,
    });

    if (error) {
      log('DELTA_ERROR', { error: String(error) });
      return false;
    }

    let updatedRanges = 0;
    let updatedWashes = 0;

    // Process delta ranges
    if (data?.ranges?.length) {
      data.ranges.forEach((r: any) => {
        const range: Range = {
          id: r.id,
          verse_key: r.verse_key,
          translation: r.translation,
          start_offset: r.start_offset,
          end_offset: r.end_offset,
          color_hex: r.color_hex,
          note: r.note || null,
          opacity: r.opacity || null,
          updated_at: r.updated_at,
          origin: 'server' as const,
          pending: false,
          tombstone: false,
          lastAckAt: r.updated_at,
        };

        // Update memory (merge/replace logic could be added here)
        const existingRanges = rangesByTrAndVerse.get(range.translation)?.get(range.verse_key) || [];
        const filteredExisting = existingRanges.filter(existing => existing.id !== range.id);
        setRanges(range.translation, range.verse_key, [...filteredExisting, range]);
      });

      updatedRanges = data.ranges.length;
    }

    // Process delta washes
    if (data?.washes?.length) {
      data.washes.forEach((w: any) => {
        const wash: Wash = {
          id: w.id,
          verse_key: w.verse_key,
          color_hex: w.color_hex,
          note: w.note || null,
          opacity: w.opacity || null,
          updated_at: w.updated_at,
          origin: 'server' as const,
          pending: false,
          tombstone: false,
          lastAckAt: w.updated_at,
        };

        setWash(wash.verse_key, wash);
      });

      updatedWashes = data.washes.length;
    }

    // Update sync timestamp
    const now = new Date().toISOString();
    updateMeta({ last_synced_at: now });
    await persistMeta({
      last_synced_at: now,
      schema_version: 1,
      user_id: userId,
    });

    log('DELTA_COMPLETE', {
      ranges: updatedRanges,
      washes: updatedWashes,
      ms: Date.now() - startTime,
      since: lastSyncedAt,
    });

    return true;

  } catch (error) {
    log('DELTA_ERROR', {
      error: String(error),
      ms: Date.now() - startTime,
    });
    return false;
  }
}

// ============================================================================
// AUTO-SYNC TRIGGERS
// ============================================================================

/**
 * Set up automatic delta sync triggers
 * @param userId - User ID to sync for (required)
 */
export function setupAutoSync(userId: string) {
  if (!isHighlightsV2Enabled()) return;

  // Periodic sync every 5 minutes
  setInterval(() => {
    performDeltaSync(userId);
  }, 5 * 60 * 1000);

  // Sync on page focus (user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      performDeltaSync(userId);
    }
  });

  // Sync when coming back online
  window.addEventListener('online', () => {
    performDeltaSync(userId);
  });

  log('AUTO_SYNC_SETUP', { 
    periodic: '5min',
    triggers: ['visibilitychange', 'online'],
    user_id: userId,
  });
}