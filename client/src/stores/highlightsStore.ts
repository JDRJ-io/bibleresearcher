/**
 * Highlights V2 Store - Local-First with Bulk Prefetch
 * 
 * Data Flow:
 * 1. Bootstrap: Load all user highlights once at startup
 * 2. Memory: Store in fast lookup maps (rangesByTrAndVerse, washByVerse)
 * 3. Render: Read from memory maps (zero network during scroll)
 * 4. Updates: Apply optimistically to memory, queue in outbox, sync in background
 * 5. Realtime: Live updates from other devices via Supabase subscriptions
 * 6. Persistence: Optional Dexie for offline capability
 */

import { z } from 'zod';
import { create } from 'zustand';
import { db } from '@/offline/offlineDB';
import { logger } from '@/lib/logger';

// ============================================================================
// DATA MODELS
// ============================================================================

// Range highlight - individual text selection with start/end offsets
export const RangeSchema = z.object({
  id: z.string(),
  verse_key: z.string(),
  translation: z.string(),
  start_offset: z.number(),
  end_offset: z.number(),
  color_hex: z.string(),
  note: z.string().nullable().optional(),
  opacity: z.number().nullable().optional(),
  updated_at: z.string(), // ISO timestamp
  // V2 metadata fields for instrumentation
  origin: z.enum(['server', 'local']),
  pending: z.boolean(),
  tombstone: z.boolean(),
  lastAckAt: z.string().optional(), // ISO timestamp when server ACKed
});

// Whole-verse wash highlight - fills entire verse background
export const WashSchema = z.object({
  id: z.string(),
  verse_key: z.string(),
  color_hex: z.string(),
  opacity: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  updated_at: z.string(), // ISO timestamp
  // V2 metadata fields for instrumentation
  origin: z.enum(['server', 'local']),
  pending: z.boolean(),
  tombstone: z.boolean(),
  lastAckAt: z.string().optional(), // ISO timestamp when server ACKed
});

// Outbox entry for pending mutations
export const OutboxEntrySchema = z.object({
  id: z.string(),
  type: z.enum(['add_range', 'paint_range', 'trim', 'erase', 'wash_upsert', 'delete_ranges', 'delete_translation', 'delete_all']),
  payload: z.any(), // Specific to mutation type
  created_at: z.string(),
  attempts: z.number().default(0),
  status: z.enum(['pending', 'sending', 'retrying', 'failed', 'completed']),
  error: z.string().nullable().optional(),
  retryAfter: z.number().optional(), // Timestamp for retry scheduling
});

// Meta information for tracking sync state
export const MetaSchema = z.object({
  last_synced_at: z.string().nullable(),
  schema_version: z.number().default(1),
  user_id: z.string().nullable(),
});

export type Range = z.infer<typeof RangeSchema>;
export type Wash = z.infer<typeof WashSchema>;
export type OutboxEntry = z.infer<typeof OutboxEntrySchema>;
export type Meta = z.infer<typeof MetaSchema>;

// ============================================================================
// IN-MEMORY STORES (Source of Truth for Rendering)
// ============================================================================

/**
 * Primary store for range highlights
 * Structure: translation -> verse_key -> Range[]
 * Enables O(1) lookup: getRanges(translation, verseKey)
 */
export const rangesByTrAndVerse = new Map<string, Map<string, Range[]>>();

/**
 * Primary store for whole-verse wash highlights  
 * Structure: verse_key -> Wash | null
 * Enables O(1) lookup: getWash(verseKey)
 */
export const washByVerse = new Map<string, Wash | null>();

/**
 * Outbox for pending mutations (reliable background sync)
 */
export const outboxQueue = new Map<string, OutboxEntry>();

/**
 * Tombstone set for preventing resurrection of deleted items
 */
export const tombstones = new Set<string>();

/**
 * State snapshots for RPC failure rollback
 */
type StateSnapshot = {
  id: string;
  timestamp: string;
  operation: string;
  rangeSnapshots: Map<string, Map<string, Range[]>>; // translation -> verseKey -> ranges
  washSnapshots: Map<string, Wash | null>; // verseKey -> wash
  tombstoneSnapshot: Set<string>;
};
const snapshots = new Map<string, StateSnapshot>();

/**
 * Create a snapshot of current state before optimistic operation
 */
export function captureSnapshot(operationId: string, operation: string): void {
  const snapshot: StateSnapshot = {
    id: operationId,
    timestamp: new Date().toISOString(),
    operation,
    rangeSnapshots: new Map(Array.from(rangesByTrAndVerse.entries()).map(([translation, verseMap]) => 
      [translation, new Map(verseMap)]
    )),
    washSnapshots: new Map(washByVerse),
    tombstoneSnapshot: new Set(tombstones),
  };
  
  snapshots.set(operationId, snapshot);
  log('SNAPSHOT_CREATED', { operationId, operation, rangesCount: snapshot.rangeSnapshots.size, washesCount: snapshot.washSnapshots.size });
}

/**
 * Restore state from snapshot (used on RPC failure)
 */
export function restoreSnapshot(operationId: string): boolean {
  const snapshot = snapshots.get(operationId);
  if (!snapshot) {
    log('SNAPSHOT_NOT_FOUND', { operationId });
    return false;
  }
  
  // Restore state
  rangesByTrAndVerse.clear();
  snapshot.rangeSnapshots.forEach((verseMap, translation) => {
    rangesByTrAndVerse.set(translation, verseMap);
  });
  
  washByVerse.clear();
  snapshot.washSnapshots.forEach((wash, verseKey) => {
    if (wash) washByVerse.set(verseKey, wash);
  });
  
  tombstones.clear();
  snapshot.tombstoneSnapshot.forEach(id => tombstones.add(id));
  
  // Trigger reactive updates for all affected verses
  const affectedVerses = new Set<string>();
  snapshot.rangeSnapshots.forEach(verseMap => {
    verseMap.forEach((_, verseKey) => affectedVerses.add(verseKey));
  });
  snapshot.washSnapshots.forEach((_, verseKey) => affectedVerses.add(verseKey));
  
  affectedVerses.forEach(verseKey => {
    useHighlightsStore.getState().triggerVerseUpdate(verseKey);
  });
  
  log('SNAPSHOT_RESTORED', { operationId, operation: snapshot.operation, affectedVerses: affectedVerses.size });
  return true;
}

/**
 * Remove snapshot (after successful RPC or timeout)
 */
export function clearSnapshot(operationId: string): void {
  snapshots.delete(operationId);
  log('SNAPSHOT_CLEARED', { operationId });
}

/**
 * Pending tempId to server ID mappings
 * Map<tempId, Promise<serverId>> for tracking add operations
 */
export const pendingIdReplacements = new Map<string, { translation: string, verseKey: string }>();

/**
 * Meta information for sync tracking
 */
export let meta: Meta = {
  last_synced_at: null,
  schema_version: 1,
  user_id: null,
};

// ============================================================================
// REACTIVE STORE (Zustand for automatic re-renders)
// ============================================================================

interface HighlightsStore {
  // Trigger counter for forcing re-renders
  updateCounter: number;
  // Increment to trigger re-renders of all hooks
  triggerUpdate: () => void;
  // Trigger update for specific verse
  triggerVerseUpdate: (verseKey: string) => void;
}

export const useHighlightsStore = create<HighlightsStore>((set) => ({
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
 * Get ranges for a specific verse and translation
 * O(1) lookup from memory
 */
export function getRanges(translation: string, verseKey: string): Range[] {
  const translationMap = rangesByTrAndVerse.get(translation);
  if (!translationMap) return [];
  
  return translationMap.get(verseKey) || [];
}

/**
 * Get wash highlight for a specific verse
 * O(1) lookup from memory
 */
export function getWash(verseKey: string): Wash | null {
  return washByVerse.get(verseKey) || null;
}

/**
 * Set ranges for a specific verse and translation
 * Used during bootstrap and realtime updates
 */
export function setRanges(translation: string, verseKey: string, ranges: Range[]): void {
  if (!rangesByTrAndVerse.has(translation)) {
    rangesByTrAndVerse.set(translation, new Map());
  }
  
  const translationMap = rangesByTrAndVerse.get(translation)!;
  const action = ranges.length === 0 ? 'delete' : translationMap.has(verseKey) ? 'update' : 'insert';
  
  if (ranges.length === 0) {
    translationMap.delete(verseKey);
  } else {
    translationMap.set(verseKey, ranges);
  }
  
  // Log store patch
  log('STORE_PATCH', { 
    action, 
    type: 'range', 
    verse_key: verseKey, 
    tr: translation, 
    ids: ranges.map(r => r.id) 
  });
  
  // Trigger reactive update for hooks
  useHighlightsStore.getState().triggerVerseUpdate(verseKey);
}

/**
 * Set wash highlight for a specific verse
 * Used during bootstrap and realtime updates
 */
export function setWash(verseKey: string, wash: Wash | null): void {
  const action = wash === null ? 'delete' : washByVerse.has(verseKey) ? 'update' : 'insert';
  
  if (wash === null) {
    washByVerse.delete(verseKey);
  } else {
    washByVerse.set(verseKey, wash);
  }
  
  // Log store patch
  log('STORE_PATCH', { 
    action, 
    type: 'wash', 
    verse_key: verseKey, 
    tr: '', 
    ids: wash ? [wash.id] : [] 
  });
  
  // Trigger reactive update for hooks
  useHighlightsStore.getState().triggerVerseUpdate(verseKey);
}

/**
 * Add range highlight optimistically
 * Updates memory immediately, queues for background sync
 */
export function addRangeOptimistic(
  translation: string,
  verseKey: string,
  startOffset: number,
  endOffset: number,
  colorHex: string,
  note?: string,
  opacity?: number
): string {
  // Generate temporary ID for optimistic update
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newRange: Range = {
    id: tempId,
    verse_key: verseKey,
    translation,
    start_offset: startOffset,
    end_offset: endOffset,
    color_hex: colorHex,
    note: note || null,
    opacity: opacity || null,
    updated_at: new Date().toISOString(),
    // V2 metadata fields for instrumentation
    origin: 'local',
    pending: true,
    tombstone: false,
  };
  
  // Log optimistic operation
  log('APPLY_LOCAL', { op: 'add', type: 'range', verse_key: verseKey, tr: translation, id: tempId });
  
  // Update memory immediately
  const currentRanges = getRanges(translation, verseKey);
  setRanges(translation, verseKey, [...currentRanges, newRange]);
  
  // Track for tempId replacement
  pendingIdReplacements.set(tempId, { translation, verseKey });

  // Queue for background sync
  queueOutboxEntry({
    id: tempId,
    type: 'add_range',
    payload: { translation, verseKey, startOffset, endOffset, colorHex, note, opacity, tempId },
    created_at: new Date().toISOString(),
    attempts: 0,
    status: 'pending',
  });
  
  return tempId;
}

// ============================================================================
// PAINT HELPERS - Intuitive highlighting with overlap handling
// ============================================================================

/**
 * Generate temporary ID for optimistic updates
 */
const tempId = () => `tmp_${crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

/**
 * Remove range by ID from array (helper for paint logic)
 */
function removeById(arr: Range[], id: string) {
  const i = arr.findIndex(r => r.id === id);
  if (i >= 0) arr.splice(i, 1);
}

/**
 * Normalize ranges - sort and merge touching same-color ranges
 */
function normalizeRanges(arr: Range[]): Range[] {
  if (arr.length === 0) return arr;
  const a = [...arr].sort((x, y) =>
    x.start_offset - y.start_offset || x.end_offset - y.end_offset
  );
  const out: Range[] = [];
  let cur = { ...a[0] };
  for (let i = 1; i < a.length; i++) {
    const r = a[i];
    if (
      r.color_hex.toLowerCase() === cur.color_hex.toLowerCase() &&
      r.start_offset <= cur.end_offset && // touching or overlapping
      r.verse_key === cur.verse_key &&
      r.translation === cur.translation
    ) {
      cur.end_offset = Math.max(cur.end_offset, r.end_offset);
    } else {
      out.push(cur);
      cur = { ...r };
    }
  }
  out.push(cur);
  return out;
}

/**
 * Paint a new color over [start,end) for a verse/translation.
 * This is the core highlight behavior - replaces overlapping highlights.
 * 
 * - Trims away any existing ranges intersecting the span (any color)
 * - Merges with touching same-color neighbors
 * - Inserts a single clean range for the new color
 * - Returns updated ranges array and the temp id used for optimistic add
 */
export function paintLocal(
  ranges: Range[],
  verse_key: string,
  translation: string,
  start: number,
  end: number,
  newColor: string,
  note: string | null = null,
  opacity = 1.0
): { ranges: Range[]; newTempId?: string } {
  // Guard & normalize inputs
  if (end <= start) return { ranges }; // no-op
  const s = Math.max(0, start);
  const e = Math.max(s + 1, end);
  let color = newColor.trim().toLowerCase();
  if (/^[0-9a-f]{6}$/i.test(color)) color = `#${color}`;
  if (!/^#[0-9a-f]{6}$/i.test(color)) return { ranges }; // invalid color → no-op

  // Work on a copy scoped to verse+translation
  const out: Range[] = [];
  const scoped = ranges.filter(r => r.verse_key === verse_key && r.translation === translation);
  const others = ranges.filter(r => r.verse_key !== verse_key || r.translation !== translation);

  // 1) Trim away any pieces inside [s,e) (any color)
  for (const r of scoped) {
    const a = r.start_offset, b = r.end_offset;
    // no intersection → keep as-is
    if (b <= s || a >= e) { out.push(r); continue; }

    // fully covered → drop (omit)
    if (s <= a && e >= b) { continue; }

    // overlap left edge → keep right trimmed piece [e,b)
    if (s <= a && e <  b) {
      out.push({ ...r, start_offset: e });
      continue;
    }
    // overlap right edge → keep left trimmed piece [a,s)
    if (s >  a && e >= b) {
      out.push({ ...r, end_offset: s });
      continue;
    }
    // middle split → keep left [a,s) and right [e,b)
    // (two ranges; same color/metadata)
    out.push({ ...r, end_offset: s });
    out.push({ ...r, start_offset: e });
  }

  // 2) Merge with touching same-color neighbors (left/right)
  let leftTouch: Range | undefined;
  let rightTouch: Range | undefined;

  for (const r of out) {
    if (r.color_hex.toLowerCase() === color && r.end_offset === s) leftTouch = r;
    if (r.color_hex.toLowerCase() === color && r.start_offset === e) rightTouch = r;
    // Early exit if we found both
    if (leftTouch && rightTouch) break;
  }

  let ns = s, ne = e;

  if (leftTouch) {
    ns = leftTouch.start_offset;
    // remove it from out (we'll replace with expanded)
    removeById(out, leftTouch.id);
  }
  if (rightTouch) {
    ne = rightTouch.end_offset;
    removeById(out, rightTouch.id);
  }

  // 3) Insert the painted span as one range
  const newId = tempId();
  out.push({
    id: newId,
    verse_key,
    translation,
    start_offset: ns,
    end_offset: ne,
    color_hex: color,
    note,
    opacity,
    updated_at: new Date().toISOString(),
    // V2 metadata fields for instrumentation
    origin: 'local',
    pending: true,
    tombstone: false,
  });

  // 4) Normalize (sort + merge touching same-color just in case)
  const normalized = normalizeRanges(out);

  // Recombine with other verses/translations
  const finalRanges = others.concat(normalized).sort((x, y) =>
    x.verse_key === y.verse_key
      ? x.start_offset - y.start_offset || x.end_offset - y.end_offset
      : x.verse_key.localeCompare(y.verse_key)
  );

  return { ranges: finalRanges, newTempId: newId };
}

/**
 * Erase highlights from a text selection optimistically
 * Removes any highlighting in the specified range
 * Updates memory immediately, queues for background sync
 */
export function eraseOptimistic(
  verseKey: string,
  translation: string,
  startOffset: number,
  endOffset: number
): string {
  // Generate temporary ID for optimistic update
  const operationId = tempId();
  
  // Capture snapshot before making changes
  captureSnapshot(operationId, 'erase_range');
  
  // Get current ranges for this verse/translation
  const currentRanges = getRanges(translation, verseKey);
  
  if (currentRanges.length === 0) {
    console.log('No ranges to erase in', { verseKey, translation });
    return operationId;
  }
  
  // Guard & normalize inputs
  const s = Math.max(0, startOffset);
  const e = Math.max(s + 1, endOffset);
  
  // Apply erase logic - remove any ranges that overlap with [s,e)
  const updatedRanges: Range[] = [];
  const idsToTombstone: string[] = [];
  const newRangesToPersist: Range[] = [];
  
  for (const r of currentRanges) {
    const a = r.start_offset, b = r.end_offset;
    
    // No intersection → keep as-is (no changes needed)
    if (b <= s || a >= e) { 
      updatedRanges.push(r); 
      continue; 
    }

    // Range intersects with erase area - mark for tombstoning
    idsToTombstone.push(r.id);
    
    // Fully covered → drop entirely (omit from updatedRanges)
    if (s <= a && e >= b) {
      continue; 
    }

    // Overlap left edge → keep right trimmed piece [e,b)
    if (s <= a && e < b) {
      const trimmed = { 
        ...r, 
        id: tempId(), // NEW ID since old one is being deleted
        start_offset: e, 
        updated_at: new Date().toISOString(),
        origin: 'local' as const,
        pending: true,
        tombstone: false
      };
      updatedRanges.push(trimmed);
      newRangesToPersist.push(trimmed);
      continue;
    }
    
    // Overlap right edge → keep left trimmed piece [a,s)
    if (s > a && e >= b) {
      const trimmed = { 
        ...r, 
        id: tempId(), // NEW ID since old one is being deleted
        end_offset: s, 
        updated_at: new Date().toISOString(),
        origin: 'local' as const,
        pending: true,
        tombstone: false
      };
      updatedRanges.push(trimmed);
      newRangesToPersist.push(trimmed);
      continue;
    }
    
    // Middle split → keep left [a,s) and right [e,b), both with NEW IDs
    const leftPiece = { 
      ...r, 
      id: tempId(), // NEW ID for left piece
      end_offset: s, 
      updated_at: new Date().toISOString(),
      origin: 'local' as const,
      pending: true,
      tombstone: false
    };
    const rightPiece = { 
      ...r, 
      id: tempId(), // NEW ID for right piece
      start_offset: e, 
      updated_at: new Date().toISOString(),
      origin: 'local' as const,
      pending: true,
      tombstone: false
    };
    updatedRanges.push(leftPiece);
    updatedRanges.push(rightPiece);
    newRangesToPersist.push(leftPiece);
    newRangesToPersist.push(rightPiece);
  }

  // Log optimistic operation
  log('APPLY_LOCAL', { 
    op: 'erase', 
    type: 'range', 
    verse_key: verseKey, 
    tr: translation, 
    id: operationId,
    start: startOffset,
    end: endOffset,
    ranges_before: currentRanges.length,
    ranges_after: updatedRanges.length,
    tombstoned_ids: idsToTombstone
  });

  // Tombstone any ranges that were intersected (prevents resurrection via realtime)
  if (idsToTombstone.length > 0) {
    markTombstones(idsToTombstone);
    log('TOMBSTONE_BULK', { op: 'erase', verse_key: verseKey, tr: translation, ids: idsToTombstone });
  }

  // Update memory with new ranges
  setRanges(translation, verseKey, updatedRanges);

  // Persist changes to Dexie for offline capability
  (async () => {
    const { removeRange, persistRange } = await import('./highlightsPersistence');
    
    // Remove old ranges that were trimmed/deleted from Dexie
    for (const id of idsToTombstone) {
      await removeRange(id);
    }
    
    // Persist all modified/new ranges (trimmed and split pieces)
    for (const range of newRangesToPersist) {
      await persistRange(range);
    }
    
    log('PERSIST_ERASE', { 
      verse_key: verseKey, 
      tr: translation, 
      removed: idsToTombstone.length, 
      persisted: newRangesToPersist.length 
    });
  })();

  // Queue for background sync (we can reuse existing RPC or create a new one)
  queueOutboxEntry({
    id: operationId,
    type: 'erase', // Note: This needs to be added to the outbox schema
    payload: { 
      verseKey, 
      translation, 
      startOffset, 
      endOffset,
      tombstonedIds: idsToTombstone
    },
    created_at: new Date().toISOString(),
    attempts: 0,
    status: 'pending',
  });

  return operationId;
}

/**
 * Paint highlight optimistically - replaces overlapping highlights intuitively
 * Updates memory immediately, queues for background sync
 */
export function paintOptimistic(
  verseKey: string,
  translation: string,
  startOffset: number,
  endOffset: number,
  colorHex: string,
  note?: string,
  opacity?: number
): string {
  // Generate temporary ID for optimistic update
  const operationId = tempId();
  
  // Capture snapshot before making changes
  captureSnapshot(operationId, 'paint_range');
  
  // Get current ranges for this verse across all translations
  const allRanges: Range[] = [];
  Array.from(rangesByTrAndVerse.entries()).forEach(([tr, verseMap]) => {
    const ranges = verseMap.get(verseKey) || [];
    allRanges.push(...ranges);
  });

  // Apply paint logic to get updated ranges and new temp ID
  const { ranges: updatedRanges, newTempId } = paintLocal(
    allRanges,
    verseKey,
    translation,
    startOffset,
    endOffset,
    colorHex,
    note || null,
    opacity || 1.0
  );

  if (!newTempId) {
    console.warn('Paint operation failed - no new range created');
    return operationId;
  }

  // Log optimistic operation
  log('APPLY_LOCAL', { 
    op: 'paint', 
    type: 'range', 
    verse_key: verseKey, 
    tr: translation, 
    id: newTempId,
    start: startOffset,
    end: endOffset,
    color: colorHex
  });

  // Update memory with new ranges - organize back into translation maps
  const rangesByTranslation = new Map<string, Range[]>();
  
  updatedRanges.forEach(range => {
    if (range.verse_key === verseKey) {
      if (!rangesByTranslation.has(range.translation)) {
        rangesByTranslation.set(range.translation, []);
      }
      rangesByTranslation.get(range.translation)!.push(range);
    }
  });

  // Update each translation's ranges for this verse
  rangesByTranslation.forEach((ranges, tr) => {
    setRanges(tr, verseKey, ranges);
  });

  // Clear any translations that now have no ranges for this verse
  Array.from(rangesByTrAndVerse.keys()).forEach(tr => {
    if (!rangesByTranslation.has(tr)) {
      setRanges(tr, verseKey, []);
    }
  });

  // Queue for background sync using paint RPC
  queueOutboxEntry({
    id: newTempId,
    type: 'paint_range', // New outbox entry type
    payload: { 
      verseKey, 
      translation, 
      startOffset, 
      endOffset, 
      colorHex, 
      note, 
      opacity, 
      tempId: newTempId 
    },
    created_at: new Date().toISOString(),
    attempts: 0,
    status: 'pending',
  });

  return newTempId;
}

/**
 * Set wash highlight optimistically
 * Updates memory immediately, queues for background sync
 */
export function setWashOptimistic(
  verseKey: string,
  colorHex: string,
  note?: string,
  opacity?: number
): string {
  // Generate temporary ID for optimistic update
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newWash: Wash = {
    id: tempId,
    verse_key: verseKey,
    color_hex: colorHex,
    note: note || null,
    opacity: opacity || null,
    updated_at: new Date().toISOString(),
    // V2 metadata fields for instrumentation
    origin: 'local',
    pending: true,
    tombstone: false,
  };
  
  // Log optimistic operation
  log('APPLY_LOCAL', { op: 'wash_upsert', type: 'wash', verse_key: verseKey, tr: '', id: tempId });
  
  // Update memory immediately
  setWash(verseKey, newWash);
  
  // Queue for background sync
  queueOutboxEntry({
    id: tempId,
    type: 'wash_upsert',
    payload: { verseKey, colorHex, note, opacity },
    created_at: new Date().toISOString(),
    attempts: 0,
    status: 'pending',
  });
  
  return tempId;
}

/**
 * Delete individual range highlight optimistically
 * Updates memory immediately, queues for background sync
 */
export function deleteRangeOptimistic(
  rangeId: string,
  translation: string,
  verseKey: string
): string {
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log optimistic operation
  log('APPLY_LOCAL', { op: 'delete', type: 'range', verse_key: verseKey, tr: translation, id: rangeId });
  
  // E) Add to tombstones to prevent resurrection
  markTombstones([rangeId]);
  
  // Update memory immediately - remove specific range
  const currentRanges = getRanges(translation, verseKey);
  const updatedRanges = currentRanges.filter(range => range.id !== rangeId);
  setRanges(translation, verseKey, updatedRanges);
  
  // Queue for background sync
  queueOutboxEntry({
    id: tempId,
    type: 'delete_ranges',
    payload: { rangeIds: [rangeId], translation, verseKey },
    created_at: new Date().toISOString(),
    attempts: 0,
    status: 'pending',
  });
  
  return tempId;
}

/**
 * Delete wash highlight optimistically
 * Updates memory immediately, clears Dexie storage, queues for background sync
 */
export function deleteWashOptimistic(verseKey: string): string {
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log optimistic operation
  log('APPLY_LOCAL', { op: 'wash_delete', type: 'wash', verse_key: verseKey, tr: '', id: tempId });
  
  // Update memory immediately - remove wash
  setWash(verseKey, null);
  
  // Clear from Dexie storage (for V1 fallback clients)
  db.hl_wash.where('verse_key').equals(verseKey).delete().catch(error => {
    console.error('Failed to delete wash from Dexie:', error);
  });
  
  // Queue for background sync (use delete_all which handles wash deletion)
  queueOutboxEntry({
    id: tempId,
    type: 'delete_all',
    payload: { verseKey, washOnly: true },
    created_at: new Date().toISOString(),
    attempts: 0,
    status: 'pending',
  });
  
  return tempId;
}

/**
 * Delete all highlights for a specific translation optimistically
 * Updates memory immediately, queues for background sync
 */
export function deleteAllInTranslationOptimistic(verseKey: string, translation: string): string {
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log optimistic operation
  log('APPLY_LOCAL', { op: 'delete_translation', type: 'range', verse_key: verseKey, tr: translation, id: tempId });
  
  // *** CRITICAL TOMBSTONE FIX *** 
  // Collect range IDs before deletion to tombstone them (prevents resurrection via realtime)
  const currentRanges = getRanges(translation, verseKey);
  const idsToTombstone = currentRanges.map(r => r.id);
  
  // Mark all IDs as tombstoned before deletion
  if (idsToTombstone.length > 0) {
    markTombstones(idsToTombstone);
    log('TOMBSTONE_BULK', { op: 'delete_translation', verse_key: verseKey, tr: translation, ids: idsToTombstone });
  }
  
  // Update memory immediately - remove ranges for this translation only
  setRanges(translation, verseKey, []);
  
  // Queue for background sync
  queueOutboxEntry({
    id: tempId,
    type: 'delete_translation',
    payload: { verseKey, translation, tombstonedIds: idsToTombstone },
    created_at: new Date().toISOString(),
    attempts: 0,
    status: 'pending',
  });
  
  return tempId;
}

/**
 * Delete all highlights for a verse optimistically
 * Updates memory immediately, queues for background sync
 */
export function deleteAllOptimistic(verseKey: string): string {
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Capture snapshot before making changes
  captureSnapshot(tempId, 'delete_all');
  
  // Log optimistic operation
  log('APPLY_LOCAL', { op: 'delete', type: 'range', verse_key: verseKey, tr: '', id: tempId });
  log('APPLY_LOCAL', { op: 'wash_delete', type: 'wash', verse_key: verseKey, tr: '', id: tempId });
  
  // *** CRITICAL TOMBSTONE FIX ***
  // Collect ALL IDs (ranges + wash) before deletion to tombstone them (prevents resurrection via realtime)
  const allRangeIds: string[] = [];
  
  // Collect range IDs from all translations for this verse
  Array.from(rangesByTrAndVerse.entries()).forEach(([translation, translationMap]) => {
    const ranges = translationMap.get(verseKey) || [];
    ranges.forEach(range => allRangeIds.push(range.id));
  });
  
  // Collect wash ID if it exists
  const currentWash = getWash(verseKey);
  const washIds = currentWash ? [currentWash.id] : [];
  const allIds = [...allRangeIds, ...washIds];
  
  // Mark all IDs as tombstoned before deletion
  if (allIds.length > 0) {
    markTombstones(allIds);
    log('TOMBSTONE_BULK', { op: 'delete_all', verse_key: verseKey, ranges: allRangeIds.length, wash: washIds.length, total_ids: allIds });
  }
  
  // Update memory immediately - remove from all translations
  Array.from(rangesByTrAndVerse.values()).forEach(translationMap => {
    translationMap.delete(verseKey);
  });
  setWash(verseKey, null);
  
  // Queue for background sync
  queueOutboxEntry({
    id: tempId,
    type: 'delete_all',
    payload: { verseKey, tombstonedIds: allIds },
    created_at: new Date().toISOString(),
    attempts: 0,
    status: 'pending',
  });
  
  return tempId;
}

/**
 * Queue an outbox entry for background sync
 */
export function queueOutboxEntry(entry: OutboxEntry): void {
  outboxQueue.set(entry.id, entry);
  
  // Map entry type to operation
  const opMap: Record<string, string> = {
    'add_range': 'add',
    'wash_upsert': 'wash_upsert', 
    'delete_ranges': 'delete',
    'delete_translation': 'delete_translation',
    'delete_all': entry.payload?.washOnly ? 'wash_delete' : 'delete_all',
    'trim': 'trim',
    'erase': 'erase',
  };
  
  // Extract translation and verse_key from payload
  const verse_key = (entry.payload as any)?.verseKey || (entry.payload as any)?.verse_key;
  const tr = (entry.payload as any)?.translation || '';
  
  // Log outbox enqueue
  log('OUTBOX_ENQ', {
    op: opMap[entry.type] || entry.type,
    type: entry.type.includes('wash') ? 'wash' : 'range',
    verse_key,
    tr,
    id: entry.id,
  });
}

/**
 * Update meta information
 */
export function updateMeta(updates: Partial<Meta>): void {
  meta = { ...meta, ...updates };
}

/**
 * Clear all data (used for user logout)
 */
export function clearAll(): void {
  rangesByTrAndVerse.clear();
  washByVerse.clear();
  outboxQueue.clear();
  meta = {
    last_synced_at: null,
    schema_version: 1,
    user_id: null,
  };
  
  // Trigger reactive update for hooks
  useHighlightsStore.getState().triggerUpdate();
}

/**
 * Get statistics for debugging
 */
export function getStats() {
  let totalRanges = 0;
  let totalVerses = 0;
  
  Array.from(rangesByTrAndVerse.values()).forEach(translationMap => {
    totalVerses += translationMap.size;
    Array.from(translationMap.values()).forEach(ranges => {
      totalRanges += ranges.length;
    });
  });
  
  return {
    translations: rangesByTrAndVerse.size,
    versesWithRanges: totalVerses,
    totalRanges,
    versesWithWash: washByVerse.size,
    outboxEntries: outboxQueue.size,
    memoryEstimateKB: Math.round(
      (totalRanges * 150 + washByVerse.size * 100 + outboxQueue.size * 200) / 1024
    ),
  };
}

// ============================================================================
// FEATURE FLAG CHECK
// ============================================================================

// Cache the flag check result and only log once
let _v2EnabledCache: boolean | null = null;
let _hasLoggedFlag = false;

/**
 * Check if highlights V2 is enabled (cached to avoid excessive logging)
 */
export function isHighlightsV2Enabled(): boolean {
  if (_v2EnabledCache === null) {
    const envValue = import.meta.env.VITE_HIGHLIGHTS_V2_ENABLED;
    _v2EnabledCache = envValue === 'true';
    
    // Only log once on first check
    if (!_hasLoggedFlag) {
      logger.debug('HIGHLIGHTS', 'v2-flag-check', { 
        VITE_HIGHLIGHTS_V2_ENABLED: envValue,
        typeofEnvValue: typeof envValue,
        enabled: _v2EnabledCache,
        allViteEnvVars: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
      });
      _hasLoggedFlag = true;
    }
  }
  
  return _v2EnabledCache;
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Structured logging for verification and debugging
 */
export function log(type: string, data: any): void {
  logger.debug('HIGHLIGHTS', type, data, { throttleMs: 1000 });
}

/**
 * Replace tempId with server ID in memory store
 * Critical for preventing accumulation of temporary IDs
 */
export function swapTempId(tempId: string, serverId: string): boolean {
  const replacement = pendingIdReplacements.get(tempId);
  if (!replacement) {
    logger.warn('HIGHLIGHTS', 'temp-id-not-found', { tempId, serverId });
    return false;
  }
  
  const { translation, verseKey } = replacement;
  const ranges = getRanges(translation, verseKey);
  let found = false;
  
  const updatedRanges = ranges.map(range => {
    if (range.id === tempId) {
      found = true;
      logger.debug('HIGHLIGHTS', 'temp-id-swap', { tempId, serverId, verse_key: verseKey, tr: translation });
      return {
        ...range,
        id: serverId,
        origin: 'server' as const,
        pending: false,
        lastAckAt: new Date().toISOString()
      };
    }
    return range;
  });
  
  if (found) {
    setRanges(translation, verseKey, updatedRanges);
    pendingIdReplacements.delete(tempId);
    tombstones.delete(tempId); // Clean up any tombstone entry
  }
  
  return found;
}

/**
 * Mark IDs as tombstoned to prevent resurrection
 */
export function markTombstones(ids: string[]): void {
  ids.forEach(id => {
    tombstones.add(id);
    logger.debug('HIGHLIGHTS', 'tombstone-add', { id }, { throttleMs: 1000 });
  });
}

/**
 * Clear tombstones after successful server deletion
 */
export function clearTombstones(ids: string[]): void {
  ids.forEach(id => {
    tombstones.delete(id);
    logger.debug('HIGHLIGHTS', 'tombstone-clear', { id }, { throttleMs: 1000 });
  });
}

/**
 * Check if ID is tombstoned (should be ignored)
 */
export function isTombstoned(id: string): boolean {
  return tombstones.has(id);
}

/**
 * Log current state for a specific verse
 * HL_STATE { verse_key, tr, ranges:n, washes:n, pending:n, tombstones:n }
 */
export function logVerseState(verse_key: string, tr?: string): void {
  const ranges = tr ? getRanges(tr, verse_key).length : 0;
  const wash = getWash(verse_key);
  const washes = wash ? 1 : 0;
  
  // Count pending and tombstones from all highlights for this verse
  let pending = 0;
  let tombstones = 0;
  
  // Check ranges
  if (tr) {
    const verseRanges = getRanges(tr, verse_key);
    pending += verseRanges.filter(r => r.pending).length;
    tombstones += verseRanges.filter(r => r.tombstone).length;
  }
  
  // Check wash
  if (wash) {
    if (wash.pending) pending++;
    if (wash.tombstone) tombstones++;
  }
  
  log('STATE', { verse_key, tr, ranges, washes, pending, tombstones });
}