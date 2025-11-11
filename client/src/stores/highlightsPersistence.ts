/**
 * Highlights V2 Persistence Layer - Dexie Integration
 * 
 * Provides functions to:
 * 1. Hydrate in-memory stores from Dexie on startup
 * 2. Persist changes to Dexie for offline capability
 * 3. Manage outbox queue for reliable sync
 */

import { db, HlRange, HlWash, HlMeta, HlOutbox } from '@/offline/offlineDB';
import {
  rangesByTrAndVerse,
  washByVerse,
  outboxQueue,
  meta,
  updateMeta,
  setRanges,
  setWash,
  queueOutboxEntry,
  log,
  type Range,
  type Wash,
  type OutboxEntry,
  type Meta,
} from './highlightsStore';

// ============================================================================
// HYDRATION (Load from Dexie to Memory on Startup)
// ============================================================================

/**
 * Hydrate in-memory stores from Dexie
 * Called on app startup for instant UI
 */
export async function hydrateFromDexie(): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Load all data in parallel
    const [ranges, washes, metaRecord, outboxEntries] = await Promise.all([
      db.hl_ranges.toArray(),
      db.hl_wash.toArray(),
      db.hl_meta.get('global'),
      db.hl_outbox.where('status').anyOf(['pending', 'failed']).toArray(),
    ]);
    
    // Hydrate ranges by translation and verse
    ranges.forEach(range => {
      const memoryRange: Range = {
        id: range.id,
        verse_key: range.verse_key,
        translation: range.translation,
        start_offset: range.start_offset,
        end_offset: range.end_offset,
        color_hex: range.color_hex,
        note: range.note || null,
        opacity: range.opacity || null,
        updated_at: range.updated_at,
      };
      
      // Get existing ranges for this verse
      const existingRanges = rangesByTrAndVerse.get(range.translation)?.get(range.verse_key) || [];
      setRanges(range.translation, range.verse_key, [...existingRanges, memoryRange]);
    });
    
    // Hydrate wash highlights
    washes.forEach(wash => {
      const memoryWash: Wash = {
        id: wash.id,
        verse_key: wash.verse_key,
        color_hex: wash.color_hex,
        note: wash.note || null,
        opacity: wash.opacity || null,
        updated_at: wash.updated_at,
      };
      
      setWash(wash.verse_key, memoryWash);
    });
    
    // Hydrate meta
    if (metaRecord) {
      updateMeta({
        last_synced_at: metaRecord.last_synced_at,
        schema_version: metaRecord.schema_version,
        user_id: metaRecord.user_id,
      });
    }
    
    // Hydrate outbox
    outboxEntries.forEach(entry => {
      const memoryEntry: OutboxEntry = {
        id: entry.id,
        type: entry.type,
        payload: entry.payload,
        created_at: entry.created_at,
        attempts: entry.attempts,
        status: entry.status,
        error: entry.error || undefined,
      };
      
      outboxQueue.set(entry.id, memoryEntry);
    });
    
    log('HYDRATE_DEXIE', {
      ranges: ranges.length,
      washes: washes.length,
      outboxEntries: outboxEntries.length,
      hasMeta: !!metaRecord,
      ms: Date.now() - startTime,
    });
    
  } catch (error) {
    console.error('Failed to hydrate from Dexie:', error);
    log('HYDRATE_ERROR', { error: String(error), ms: Date.now() - startTime });
  }
}

// ============================================================================
// PERSISTENCE (Save to Dexie for Offline)
// ============================================================================

/**
 * Persist a range highlight to Dexie
 */
export async function persistRange(range: Range): Promise<void> {
  try {
    const dexieRange: HlRange = {
      id: range.id,
      verse_key: range.verse_key,
      translation: range.translation,
      start_offset: range.start_offset,
      end_offset: range.end_offset,
      color_hex: range.color_hex,
      note: range.note || null,
      opacity: range.opacity || null,
      updated_at: range.updated_at,
    };
    
    await db.hl_ranges.put(dexieRange);
    
  } catch (error) {
    console.error('Failed to persist range to Dexie:', error);
  }
}

/**
 * Persist a wash highlight to Dexie
 */
export async function persistWash(wash: Wash): Promise<void> {
  try {
    const dexieWash: HlWash = {
      id: wash.id,
      verse_key: wash.verse_key,
      color_hex: wash.color_hex,
      note: wash.note || null,
      opacity: wash.opacity || null,
      updated_at: wash.updated_at,
    };
    
    await db.hl_wash.put(dexieWash);
    
  } catch (error) {
    console.error('Failed to persist wash to Dexie:', error);
  }
}

/**
 * Remove a range highlight from Dexie
 */
export async function removeRange(rangeId: string): Promise<void> {
  try {
    await db.hl_ranges.delete(rangeId);
  } catch (error) {
    console.error('Failed to remove range from Dexie:', error);
  }
}

/**
 * Remove a wash highlight from Dexie
 */
export async function removeWash(washId: string): Promise<void> {
  try {
    await db.hl_wash.delete(washId);
  } catch (error) {
    console.error('Failed to remove wash from Dexie:', error);
  }
}

/**
 * Remove all highlights for a verse from Dexie
 */
export async function removeAllForVerse(verseKey: string): Promise<void> {
  try {
    await Promise.all([
      db.hl_ranges.where('verse_key').equals(verseKey).delete(),
      db.hl_wash.where('verse_key').equals(verseKey).delete(),
    ]);
  } catch (error) {
    console.error('Failed to remove all highlights for verse from Dexie:', error);
  }
}

/**
 * Persist meta information to Dexie
 */
export async function persistMeta(metaData: Meta): Promise<void> {
  try {
    const dexieMeta: HlMeta = {
      key: 'global',
      last_synced_at: metaData.last_synced_at,
      schema_version: metaData.schema_version,
      user_id: metaData.user_id,
    };
    
    await db.hl_meta.put(dexieMeta);
    
  } catch (error) {
    console.error('Failed to persist meta to Dexie:', error);
  }
}

/**
 * Persist outbox entry to Dexie
 */
export async function persistOutboxEntry(entry: OutboxEntry): Promise<void> {
  try {
    const dexieEntry: HlOutbox = {
      id: entry.id,
      type: entry.type,
      payload: entry.payload,
      created_at: entry.created_at,
      attempts: entry.attempts,
      status: entry.status,
      error: entry.error || null,
    };
    
    await db.hl_outbox.put(dexieEntry);
    
  } catch (error) {
    console.error('Failed to persist outbox entry to Dexie:', error);
  }
}

/**
 * Remove outbox entry from Dexie (after successful sync)
 */
export async function removeOutboxEntry(entryId: string): Promise<void> {
  try {
    await db.hl_outbox.delete(entryId);
  } catch (error) {
    console.error('Failed to remove outbox entry from Dexie:', error);
  }
}

/**
 * Update outbox entry status in Dexie
 */
export async function updateOutboxEntryStatus(
  entryId: string, 
  status: OutboxEntry['status'], 
  error?: string
): Promise<void> {
  try {
    await db.hl_outbox.update(entryId, { 
      status, 
      error: error || null,
      attempts: status === 'failed' ? (await db.hl_outbox.get(entryId))?.attempts || 0 : undefined,
    });
  } catch (error) {
    console.error('Failed to update outbox entry status in Dexie:', error);
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Clear all highlights data from Dexie (used for user logout)
 */
export async function clearAllFromDexie(): Promise<void> {
  try {
    await Promise.all([
      db.hl_ranges.clear(),
      db.hl_wash.clear(),
      db.hl_meta.clear(),
      db.hl_outbox.clear(),
    ]);
    
    log('CLEAR_DEXIE', { success: true });
    
  } catch (error) {
    console.error('Failed to clear highlights from Dexie:', error);
    log('CLEAR_DEXIE_ERROR', { error: String(error) });
  }
}

/**
 * Bulk upsert ranges to Dexie (used during bootstrap)
 */
export async function bulkUpsertRanges(ranges: Range[]): Promise<void> {
  try {
    const dexieRanges: HlRange[] = ranges.map(range => ({
      id: range.id,
      verse_key: range.verse_key,
      translation: range.translation,
      start_offset: range.start_offset,
      end_offset: range.end_offset,
      color_hex: range.color_hex,
      note: range.note || null,
      opacity: range.opacity || null,
      updated_at: range.updated_at,
    }));
    
    await db.hl_ranges.bulkPut(dexieRanges);
    
  } catch (error) {
    console.error('Failed to bulk upsert ranges to Dexie:', error);
  }
}

/**
 * Bulk upsert washes to Dexie (used during bootstrap)
 */
export async function bulkUpsertWashes(washes: Wash[]): Promise<void> {
  try {
    const dexieWashes: HlWash[] = washes.map(wash => ({
      id: wash.id,
      verse_key: wash.verse_key,
      color_hex: wash.color_hex,
      note: wash.note || null,
      opacity: wash.opacity || null,
      updated_at: wash.updated_at,
    }));
    
    await db.hl_wash.bulkPut(dexieWashes);
    
  } catch (error) {
    console.error('Failed to bulk upsert washes to Dexie:', error);
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get Dexie storage statistics
 */
export async function getDexieStats() {
  try {
    const [rangeCount, washCount, outboxCount] = await Promise.all([
      db.hl_ranges.count(),
      db.hl_wash.count(),
      db.hl_outbox.count(),
    ]);
    
    return {
      ranges: rangeCount,
      washes: washCount,
      outboxEntries: outboxCount,
      isSupported: 'indexedDB' in window,
    };
    
  } catch (error) {
    console.error('Failed to get Dexie stats:', error);
    return {
      ranges: 0,
      washes: 0,
      outboxEntries: 0,
      isSupported: false,
    };
  }
}