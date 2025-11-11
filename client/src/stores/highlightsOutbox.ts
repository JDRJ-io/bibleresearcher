/**
 * Highlights V2 Outbox Processor - Background Sync System
 * 
 * Processes queued highlight mutations in the background:
 * 1. Monitors outbox queue for pending entries
 * 2. Processes entries using appropriate RPC calls
 * 3. Handles retries with exponential backoff
 * 4. Manages conflicts and failures
 */

import { supabase } from '@/lib/supabaseClient';
import { 
  outboxQueue, 
  type OutboxEntry,
  log,
  updateMeta,
  restoreSnapshot,
  clearSnapshot,
} from './highlightsStore';
import { 
  persistOutboxEntry,
  removeOutboxEntry,
} from './highlightsPersistence';
import { persistMeta } from './highlightsPersistence';
import { eraseHighlightPortion } from '@/lib/userDataApi';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BATCH_SIZE = 10; // Process up to 10 entries at once
const MAX_ATTEMPTS = 5; // Maximum retry attempts per entry
const RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff (ms)
const PROCESSOR_INTERVAL = 30000; // Check queue every 30 seconds (reduced from 2s)

// ============================================================================
// OUTBOX PROCESSOR
// ============================================================================

let processorRunning = false;
let processorTimeout: NodeJS.Timeout | null = null;

/**
 * Re-queue expired 'retrying' entries back to 'pending'
 * This handles cases where app restarts before retry timers fire
 */
async function requeueExpiredRetries(): Promise<void> {
  const now = Date.now();
  const expiredEntries: OutboxEntry[] = [];
  
  // Find expired 'retrying' entries
  for (const entry of Array.from(outboxQueue.values())) {
    if (entry.status === 'retrying' && entry.retryAfter && entry.retryAfter <= now) {
      expiredEntries.push(entry);
    }
  }
  
  if (expiredEntries.length === 0) return;
  
  log('OUTBOX_REQUEUE_EXPIRED', { 
    count: expiredEntries.length,
    entries: expiredEntries.map(e => ({ id: e.id, type: e.type, attempts: e.attempts }))
  });
  
  // Convert back to pending and persist
  for (const entry of expiredEntries) {
    entry.status = 'pending';
    entry.retryAfter = undefined; // Clear retry timestamp
    
    // Persist the status change
    await persistOutboxEntry(entry);
  }
}

/**
 * Start the outbox processor
 * Processes queued mutations in the background
 */
export async function startOutboxProcessor(): Promise<void> {
  if (processorRunning) return;
  
  processorRunning = true;
  
  // Re-queue expired 'retrying' entries back to 'pending'
  await requeueExpiredRetries();
  
  scheduleNextProcess();
  
  log('OUTBOX_START', { interval: PROCESSOR_INTERVAL });
}

/**
 * Stop the outbox processor
 */
export function stopOutboxProcessor(): void {
  processorRunning = false;
  
  if (processorTimeout) {
    clearTimeout(processorTimeout);
    processorTimeout = null;
  }
  
  log('OUTBOX_STOP', {});
}

/**
 * Schedule the next processing cycle
 */
function scheduleNextProcess(): void {
  if (!processorRunning) return;
  
  processorTimeout = setTimeout(async () => {
    try {
      await processOutboxBatch();
    } catch (error) {
      console.error('Outbox processor error:', error);
    }
    
    scheduleNextProcess();
  }, PROCESSOR_INTERVAL);
}

/**
 * Process a batch of outbox entries
 */
async function processOutboxBatch(): Promise<void> {
  const pendingEntries = Array.from(outboxQueue.values())
    .filter(entry => entry.status === 'pending')
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(0, BATCH_SIZE);

  if (pendingEntries.length === 0) return;

  log('OUTBOX_BATCH_START', { 
    count: pendingEntries.length,
    types: pendingEntries.map(e => e.type),
  });

  for (const entry of pendingEntries) {
    await processOutboxEntry(entry);
  }
}

/**
 * Process a single outbox entry
 */
async function processOutboxEntry(entry: OutboxEntry): Promise<void> {
  try {
    // Mark as sending
    entry.status = 'sending';
    entry.attempts += 1;
    
    log('OUTBOX_ENTRY_START', {
      id: entry.id,
      type: entry.type,
      attempt: entry.attempts,
    });

    // Process based on type
    let success = false;
    switch (entry.type) {
      case 'add_range':
        success = await syncAddRange(entry);
        break;
      case 'paint_range':
        success = await syncPaintRange(entry);
        break;
      case 'wash_upsert':
        success = await syncWashUpsert(entry);
        break;
      case 'delete_ranges':
        success = await syncDeleteRanges(entry);
        break;
      case 'delete_translation':
        success = await syncDeleteTranslation(entry);
        break;
      case 'delete_all':
        success = await syncDeleteAll(entry);
        break;
      case 'trim':
        // TODO: Implement trim operations  
        success = true; // Skip for now
        break;
      case 'erase':
        // Erase highlights from a specific text range
        if (entry.payload && 'verseKey' in entry.payload && 'translation' in entry.payload && 
            'startOffset' in entry.payload && 'endOffset' in entry.payload) {
          const { verseKey, translation, startOffset, endOffset } = entry.payload as any;
          await eraseHighlightPortion(verseKey, startOffset, endOffset, translation);
          success = true;
        } else {
          console.error('Invalid erase payload:', entry.payload);
          success = false;
        }
        break;
      default:
        console.warn('Unknown outbox entry type:', entry.type);
        success = true; // Mark as completed to avoid infinite retries
    }

    if (success) {
      // Remove from outbox queue
      outboxQueue.delete(entry.id);
      await removeOutboxEntry(entry.id);
      
      // Clear snapshot since operation succeeded
      clearSnapshot(entry.id);
      
      log('OUTBOX_ENTRY_SUCCESS', {
        id: entry.id,
        type: entry.type,
      });
    } else {
      // Handle failure
      await handleEntryFailure(entry);
    }

  } catch (error) {
    console.error('Failed to process outbox entry:', error);
    await handleEntryFailure(entry, error);
  }
}

/**
 * Handle outbox entry failure
 */
async function handleEntryFailure(entry: OutboxEntry, error?: any): Promise<void> {
  if (entry.attempts >= MAX_ATTEMPTS) {
    // Mark as permanently failed
    entry.status = 'failed';
    entry.error = error?.message || 'Max attempts exceeded';
    
    // Restore snapshot to revert optimistic changes
    const snapshotRestored = restoreSnapshot(entry.id);
    clearSnapshot(entry.id);
    
    // Show error toast to user
    if (typeof window !== 'undefined') {
      try {
        const { toast } = await import('@/hooks/use-toast');
        const operation = entry.type.replace('_', ' ');
        toast({
          title: "Highlight sync failed",
          description: `Failed to ${operation}. Changes have been reverted.`,
          variant: "destructive",
        });
      } catch (toastError) {
        console.warn('Failed to show error toast:', toastError);
      }
    }
    
    log('OUTBOX_ENTRY_FAILED', {
      id: entry.id,
      type: entry.type,
      attempts: entry.attempts,
      error: entry.error,
      snapshotRestored,
    });
    
    // Optionally remove from queue or keep for manual retry
    // For now, keep failed entries for debugging
    await persistOutboxEntry(entry);
    
  } else {
    // Schedule retry with exponential backoff
    entry.status = 'retrying';
    entry.error = error?.message || null;
    
    const delay = RETRY_DELAYS[entry.attempts - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
    const retryTime = Date.now() + delay;
    entry.retryAfter = retryTime;
    
    log('OUTBOX_ENTRY_RETRY', {
      id: entry.id,
      type: entry.type,
      attempts: entry.attempts,
      retryIn: delay,
      retryAfter: new Date(retryTime).toISOString(),
    });
    
    // Schedule retry - set status back to pending after delay
    setTimeout(async () => {
      if (outboxQueue.has(entry.id)) {
        entry.status = 'pending';
        delete entry.retryAfter;
        // Persist the status change to storage
        await persistOutboxEntry(entry);
      }
    }, delay);
    
    await persistOutboxEntry(entry);
  }
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Sync range creation to server
 */
async function syncAddRange(entry: OutboxEntry): Promise<boolean> {
  const { translation, verseKey, startOffset, endOffset, colorHex, note, opacity, tempId } = entry.payload;

  const { data: serverId, error } = await supabase().rpc('fn_add_highlight_range', {
    p_verse_key: verseKey,
    p_translation: translation,
    p_start_offset: startOffset,
    p_end_offset: endOffset,
    p_color_hex: colorHex,
    p_note: note || null,
    p_opacity: opacity || null,
  });

  // Log RPC completion
  log('RPC_DONE', {
    fn: 'fn_add_highlight_range',
    op: 'add',
    type: 'range',
    verse_key: verseKey,
    tr: translation,
    ok: !error,
    dataType: 'uuid',
    val: error ? null : serverId,
    ...(error && { err: error.message }),
  });

  if (error) {
    console.error('Failed to sync range creation:', error);
    return false;
  }

  // D) Replace tempId with server ID on success
  if (tempId && serverId) {
    const { swapTempId } = await import('@/stores/highlightsStore');
    const swapped = swapTempId(tempId, serverId);
    if (!swapped) {
      console.warn('HL_TEMP_ID_SWAP_FAILED', { tempId, serverId, verse_key: verseKey, tr: translation });
    }
  }

  return true;
}

/**
 * Sync paint range operation to server
 */
async function syncPaintRange(entry: OutboxEntry): Promise<boolean> {
  const { verseKey, translation, startOffset, endOffset, colorHex, note, opacity, tempId } = entry.payload;

  const { data: serverId, error } = await supabase().rpc('fn_paint_highlight_range', {
    p_verse_key: verseKey,
    p_start: startOffset,
    p_end: endOffset,
    p_color: colorHex,
    p_translation: translation,
    p_note: note || null,
    p_opacity: opacity || null,
  });

  // Log RPC completion
  log('RPC_DONE', {
    fn: 'fn_paint_highlight_range',
    op: 'paint',
    type: 'range',
    verse_key: verseKey,
    tr: translation,
    ok: !error,
    dataType: 'uuid',
    val: error ? null : serverId,
    ...(error && { err: error.message }),
  });

  if (error) {
    console.error('Failed to sync paint range:', error);
    return false;
  }

  if (!serverId) {
    console.error('No server ID returned from paint range RPC');
    return false;
  }

  // V2 - No invalidation! Just swap temp ID with server ID in memory
  log('V2_TEMP_SWAP', { temp_id: tempId, server_id: serverId, verse_key: verseKey, tr: translation });
  
  // Import and use swapTempId function
  const { swapTempId } = await import('@/stores/highlightsStore');
  const swapped = swapTempId(tempId, serverId);
  if (!swapped) {
    console.warn('HL_TEMP_ID_SWAP_FAILED', { tempId, serverId, verse_key: verseKey, tr: translation });
  }

  return true;
}

/**
 * Normalize hex color format
 */
function normHex(c: string): string {
  if (!c) return '#000000';
  c = c.trim().toLowerCase();
  return /^[0-9a-f]{6}$/.test(c) ? '#' + c : c;
}

/**
 * Sync wash upsert to server
 */
async function syncWashUpsert(entry: OutboxEntry): Promise<boolean> {
  const { verseKey, colorHex, note, opacity } = entry.payload;
  
  // Normalize color format
  const hexColor = normHex(colorHex);
  
  // Add 30-second logging to prove it works
  console.log('WASH_RPC_CALL', {
    p_verse_key: verseKey,
    p_color: hexColor,
    p_opacity: opacity ?? 1,
    p_note: note ?? null,
    session_present: !!(await supabase().auth.getSession()).data.session
  });

  const { data, error } = await supabase().rpc('fn_upsert_verse_highlight', {
    p_verse_key: verseKey,
    p_color: hexColor,        // Fixed: was p_color_hex, now p_color
    p_note: note || null,
    p_opacity: opacity || null,
  });
  
  console.log('WASH_RPC_RESULT', { data, error });

  // Log RPC completion
  log('RPC_DONE', {
    op: 'wash_upsert',
    type: 'wash',
    verse_key: verseKey,
    tr: '',
    ok: !error,
    rows: error ? 0 : 1,
    ids: error ? [] : [entry.id],
    ...(error && { err: error.message }),
  });

  if (error) {
    console.error('Failed to sync wash upsert:', error);
    return false;
  }
  
  // Handle return type - RPC returns UUID string directly
  const serverId = typeof data === 'string' ? data : null;
  if (!serverId) {
    console.error('wash upsert: missing uuid, got:', data);
    return false;
  }
  
  // V2 - Swap temp ID with server ID in memory
  log('V2_WASH_TEMP_SWAP', { temp_id: entry.id, server_id: serverId, verse_key: verseKey });
  
  // For wash highlights, we don't need to swap temp IDs since they use verse_key as identifier
  // The server ID is mainly for tracking and debugging purposes
  log('V2_WASH_SERVER_ID', { temp_id: entry.id, server_id: serverId, verse_key: verseKey });

  return true;
}

/**
 * Sync range deletion to server
 */
async function syncDeleteRanges(entry: OutboxEntry): Promise<boolean> {
  const { rangeIds, verseKey, translation } = entry.payload;

  const { data, error } = await supabase().rpc('fn_delete_highlight_ranges', {
    p_range_ids: rangeIds,
  });

  // Log RPC completion
  log('RPC_DONE', {
    op: 'delete',
    type: 'range',
    verse_key: verseKey || '',
    tr: translation || '',
    ok: !error,
    rows: error ? 0 : rangeIds?.length || 0,
    ids: error ? [] : rangeIds || [],
    ...(error && { err: error.message }),
  });

  if (error) {
    console.error('Failed to sync range deletion:', error);
    return false;
  }

  return true;
}

/**
 * Sync delete translation-specific highlights to server
 */
async function syncDeleteTranslation(entry: OutboxEntry): Promise<boolean> {
  const { verseKey, translation } = entry.payload;

  const { data, error } = await supabase().rpc('fn_delete_highlights_in_verse', {
    p_verse_key: verseKey,
    p_translation: translation
  });

  // Log RPC completion with integer count
  log('RPC_DONE', {
    fn: 'fn_delete_highlights_in_verse',
    op: 'delete_translation',
    type: 'range',
    verse_key: verseKey,
    tr: translation,
    ok: !error,
    dataType: 'int',
    val: error ? 0 : (data ?? 0),
    ...(error && { err: error.message }),
  });

  if (error) {
    console.error('Failed to sync translation deletion:', error);
    return false;
  }

  if ((data ?? 0) < 0) {
    console.error('Unexpected negative delete count:', data);
    return false;
  }

  return true;
}

/**
 * Sync delete all highlights for verse to server
 */
async function syncDeleteAll(entry: OutboxEntry): Promise<boolean> {
  const { verseKey, washOnly } = entry.payload;

  let error: any = null;
  let dataType = 'int';
  let val: any = 0;
  
  if (washOnly) {
    // Delete only wash highlight - returns integer
    const result = await supabase().rpc('fn_delete_verse_highlight', {
      p_verse_key: verseKey,
    });
    error = result.error;
    val = result.data ?? 0;
  } else {
    // Delete all highlights for verse - returns JSON with ok:true
    const { data, error: rpcError } = await supabase().rpc('fn_delete_all_highlights', {
      p_verse_key: verseKey
    });
    error = rpcError || (!data?.ok ? new Error('delete_all failed') : null);
    dataType = 'json';
    val = data;
  }

  // Log RPC completion
  log('RPC_DONE', {
    fn: washOnly ? 'fn_delete_verse_highlight' : 'fn_delete_all_highlights',
    op: washOnly ? 'wash_delete' : 'delete_all',
    type: washOnly ? 'wash' : 'range',
    verse_key: verseKey,
    tr: '',
    ok: !error,
    dataType,
    val,
    ...(error && { err: error.message }),
  });

  if (error) {
    console.error(`Failed to sync ${washOnly ? 'wash' : 'delete all'}:`, error);
    return false;
  }

  return true;
}

// ============================================================================
// MANUAL OPERATIONS
// ============================================================================

/**
 * Force process all pending entries immediately (for testing)
 */
export async function forceProcessOutbox(): Promise<void> {
  const pendingEntries = Array.from(outboxQueue.values())
    .filter(entry => entry.status === 'pending');

  log('OUTBOX_FORCE_PROCESS', { count: pendingEntries.length });

  for (const entry of pendingEntries) {
    await processOutboxEntry(entry);
  }
}

/**
 * Clear all failed entries from outbox
 */
export function clearFailedEntries(): void {
  const failedEntries = Array.from(outboxQueue.values())
    .filter(entry => entry.status === 'failed');

  for (const entry of failedEntries) {
    outboxQueue.delete(entry.id);
    removeOutboxEntry(entry.id);
  }

  log('OUTBOX_CLEAR_FAILED', { count: failedEntries.length });
}

/**
 * Get outbox statistics
 */
export function getOutboxStats() {
  const entries = Array.from(outboxQueue.values());
  
  const stats = {
    total: entries.length,
    pending: entries.filter(e => e.status === 'pending').length,
    sending: entries.filter(e => e.status === 'sending').length,
    failed: entries.filter(e => e.status === 'failed').length,
    completed: entries.filter(e => e.status === 'completed').length,
    types: {} as Record<string, number>,
  };

  entries.forEach(entry => {
    stats.types[entry.type] = (stats.types[entry.type] || 0) + 1;
  });

  return stats;
}