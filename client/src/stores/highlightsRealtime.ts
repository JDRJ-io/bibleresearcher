/**
 * Highlights V2 Realtime Subscriptions
 * 
 * Handles live updates from other devices via Supabase subscriptions
 * Updates in-memory stores immediately when changes occur
 */

import { supabase } from '@/lib/supabaseClient';
import {
  setRanges,
  setWash,
  getRanges,
  getWash,
  updateMeta,
  log,
  isHighlightsV2Enabled,
  isTombstoned,
  clearTombstones,
  type Range,
  type Wash,
} from './highlightsStore';
import { v2Logger, logRealtime, logCache } from '@/lib/v2Logger';
import {
  persistRange,
  persistWash,
  removeRange,
  removeWash,
  removeAllForVerse,
} from './highlightsPersistence';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

let rangeSubscription: RealtimeChannel | null = null;
let washSubscription: RealtimeChannel | null = null;

/**
 * Start realtime subscriptions for highlights
 * Called after authentication and bootstrap
 * @param userId - User ID to subscribe for (required)
 */
export async function startRealtimeSubscriptions(userId: string): Promise<boolean> {
  if (!isHighlightsV2Enabled()) {
    logRealtime.skip('v2_disabled');
    return false;
  }

  try {
    // Set user ID for session context
    v2Logger.setUserId(userId);
    logRealtime.start({ user_id: userId, channels_count: 2 });

    // Stop existing subscriptions first
    await stopRealtimeSubscriptions();

    // Subscribe to range highlights table
    rangeSubscription = supabase()
      .channel('highlights_ranges')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_highlight_ranges',
          filter: `user_id=eq.${userId}`,
        },
        handleRangeChange
      )
      .subscribe();

    // Subscribe to verse wash highlights table
    washSubscription = supabase()
      .channel('highlights_wash')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_verse_highlights',
          filter: `user_id=eq.${userId}`,
        },
        handleWashChange
      )
      .subscribe();

    logRealtime.subscribed({
      ranges_channel: rangeSubscription.topic,
      ranges_state: rangeSubscription.state,
      wash_channel: washSubscription.topic, 
      wash_state: washSubscription.state,
      filter: `user_id=eq.${userId}`,
      tables: ['user_highlight_ranges', 'user_verse_highlights'],
    });

    return true;

  } catch (error) {
    logRealtime.error(error instanceof Error ? error : String(error), {
      phase: 'subscription_setup',
    });
    return false;
  }
}

/**
 * Stop realtime subscriptions
 * Called on logout or component unmount
 */
export async function stopRealtimeSubscriptions(): Promise<void> {
  // Capture channel states BEFORE nulling them
  const rangeState = rangeSubscription?.state || null;
  const washState = washSubscription?.state || null;
  const rangeTopic = rangeSubscription?.topic || null;
  const washTopic = washSubscription?.topic || null;
  
  // Check if any subscriptions were actually active
  const hasActiveSubscriptions = !!rangeSubscription || !!washSubscription;

  if (rangeSubscription) {
    await supabase().removeChannel(rangeSubscription);
    rangeSubscription = null;
  }

  if (washSubscription) {
    await supabase().removeChannel(washSubscription);
    washSubscription = null;
  }

  // Only log STOP if we actually had active subscriptions
  if (hasActiveSubscriptions) {
    logRealtime.stop({
      ranges_channel: rangeTopic,
      ranges_state: rangeState,
      wash_channel: washTopic,
      wash_state: washState,
      ranges_unsubscribed: !!rangeTopic,
      wash_unsubscribed: !!washTopic,
    });
  } else {
    // Log NOOP when stopping with no active subscriptions
    logRealtime.skip('no_active_subscriptions', {
      called_method: 'stopRealtimeSubscriptions',
    });
  }
}

// ============================================================================
// REALTIME EVENT HANDLERS
// ============================================================================

/**
 * Handle range highlight changes from realtime
 */
async function handleRangeChange(payload: any): Promise<void> {
  try {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    logRealtime.event(eventType, 'ranges', {
      verse_key: newRecord?.verse_key || oldRecord?.verse_key,
      range_id: newRecord?.id || oldRecord?.id,
      translation: newRecord?.translation || oldRecord?.translation,
      has_note: !!(newRecord?.note || oldRecord?.note),
    });

    // Log realtime event
    const record = newRecord || oldRecord;
    if (record) {
      log('REALTIME', {
        table: 'ranges',
        op: eventType.toLowerCase(),
        id: record.id,
        verse_key: record.verse_key,
        tr: record.translation,
      });
    }

    switch (eventType) {
      case 'INSERT':
      case 'UPDATE':
        if (newRecord) {
          await handleRangeInsertOrUpdate(newRecord);
        }
        break;

      case 'DELETE':
        if (oldRecord) {
          await handleRangeDelete(oldRecord);
        }
        break;

      default:
        console.warn('Unknown realtime event type:', eventType);
    }

  } catch (error) {
    logRealtime.error(error instanceof Error ? error : String(error), {
      event_type: payload?.eventType,
      table: 'user_highlight_ranges',
      verse_key: payload?.new?.verse_key || payload?.old?.verse_key,
    });
  }
}

/**
 * Handle wash highlight changes from realtime
 */
async function handleWashChange(payload: any): Promise<void> {
  try {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    logRealtime.event(eventType, 'wash', {
      verse_key: newRecord?.verse_key || oldRecord?.verse_key,
      wash_id: newRecord?.id || oldRecord?.id,
      has_note: !!(newRecord?.note || oldRecord?.note),
    });

    // Log realtime event
    const record = newRecord || oldRecord;
    if (record) {
      log('REALTIME', {
        table: 'wash',
        op: eventType.toLowerCase(),
        id: record.id,
        verse_key: record.verse_key,
        tr: '',
      });
    }

    switch (eventType) {
      case 'INSERT':
      case 'UPDATE':
        if (newRecord) {
          await handleWashInsertOrUpdate(newRecord);
        }
        break;

      case 'DELETE':
        if (oldRecord) {
          await handleWashDelete(oldRecord);
        }
        break;

      default:
        console.warn('Unknown realtime event type:', eventType);
    }

  } catch (error) {
    logRealtime.error(error instanceof Error ? error : String(error), {
      event_type: payload?.eventType,
      table: 'user_verse_highlights',
      verse_key: payload?.new?.verse_key || payload?.old?.verse_key,
    });
  }
}

// ============================================================================
// RANGE HIGHLIGHT HANDLERS
// ============================================================================

/**
 * Handle range highlight insert or update
 */
async function handleRangeInsertOrUpdate(record: any): Promise<void> {
  // *** CRITICAL TOMBSTONE PREVENTION ***
  // Check if this ID is tombstoned (locally deleted) to prevent resurrection
  if (isTombstoned(record.id)) {
    log('REALTIME_BLOCKED', {
      table: 'ranges', 
      op: 'insert/update', 
      id: record.id, 
      verse_key: record.verse_key,
      reason: 'tombstoned'
    });
    return; // Block this realtime update - item was locally deleted
  }

  // Convert database record to internal Range type
  const range: Range = {
    id: record.id,
    verse_key: record.verse_key,
    translation: record.translation,
    start_offset: record.start_offset,
    end_offset: record.end_offset,
    color_hex: record.color_hex,
    note: record.note || null,
    opacity: record.opacity || null,
    updated_at: record.updated_at,
    // Realtime data metadata
    origin: 'server',
    pending: false,
    tombstone: false,
    lastAckAt: record.updated_at,
  };

  // Update memory store - merge with existing ranges
  const existingRanges = getRanges(range.translation, range.verse_key);
  const filteredRanges = existingRanges.filter(r => r.id !== range.id);
  setRanges(range.translation, range.verse_key, [...filteredRanges, range]);

  // Persist to Dexie for offline
  await persistRange(range);

  // Trigger re-render (if using React context or state management)
  triggerRerender('range', range.verse_key);
}

/**
 * Handle range highlight delete
 */
async function handleRangeDelete(record: any): Promise<void> {
  const { id, verse_key, translation } = record;

  // Remove from memory store
  const existingRanges = getRanges(translation, verse_key);
  const filteredRanges = existingRanges.filter(r => r.id !== id);
  setRanges(translation, verse_key, filteredRanges);

  // Remove from Dexie
  await removeRange(id);

  // Clear tombstone since server confirmed deletion
  clearTombstones([id]);

  // Trigger re-render
  triggerRerender('range', verse_key);
}

// ============================================================================
// WASH HIGHLIGHT HANDLERS
// ============================================================================

/**
 * Handle wash highlight insert or update
 */
async function handleWashInsertOrUpdate(record: any): Promise<void> {
  // *** CRITICAL TOMBSTONE PREVENTION ***
  // Check if this ID is tombstoned (locally deleted) to prevent resurrection
  if (isTombstoned(record.id)) {
    log('REALTIME_BLOCKED', {
      table: 'wash', 
      op: 'insert/update', 
      id: record.id, 
      verse_key: record.verse_key,
      reason: 'tombstoned'
    });
    return; // Block this realtime update - item was locally deleted
  }

  // Convert database record to internal Wash type
  const wash: Wash = {
    id: record.id,
    verse_key: record.verse_key,
    color_hex: record.color_hex,
    note: record.note || null,
    opacity: record.opacity || null,
    updated_at: record.updated_at,
    // Realtime data metadata
    origin: 'server',
    pending: false,
    tombstone: false,
    lastAckAt: record.updated_at,
  };

  // Update memory store
  setWash(wash.verse_key, wash);

  // Persist to Dexie for offline
  await persistWash(wash);

  // Trigger re-render
  triggerRerender('wash', wash.verse_key);
}

/**
 * Handle wash highlight delete
 */
async function handleWashDelete(record: any): Promise<void> {
  const { id, verse_key } = record;

  // Remove from memory store
  setWash(verse_key, null);

  // Remove from Dexie
  await removeWash(id);

  // Clear tombstone since server confirmed deletion
  clearTombstones([id]);

  // Trigger re-render
  triggerRerender('wash', verse_key);
}

// ============================================================================
// RE-RENDER TRIGGERING
// ============================================================================

// Simple event system for triggering re-renders
type RealtimeEventType = 'range' | 'wash';
type RealtimeCallback = (type: RealtimeEventType, verseKey: string) => void;

const realtimeCallbacks: RealtimeCallback[] = [];

/**
 * Register callback for realtime updates
 * Used by React components to listen for changes
 */
export function onRealtimeUpdate(callback: RealtimeCallback): () => void {
  realtimeCallbacks.push(callback);
  
  // Return cleanup function
  return () => {
    const index = realtimeCallbacks.indexOf(callback);
    if (index > -1) {
      realtimeCallbacks.splice(index, 1);
    }
  };
}

/**
 * Trigger re-render for components listening to this verse
 */
function triggerRerender(type: RealtimeEventType, verseKey: string): void {
  realtimeCallbacks.forEach(callback => {
    try {
      callback(type, verseKey);
    } catch (error) {
      console.error('Error in realtime callback:', error);
    }
  });
}

// ============================================================================
// SUBSCRIPTION STATUS
// ============================================================================

/**
 * Get current subscription status
 */
export function getSubscriptionStatus() {
  return {
    ranges: {
      connected: rangeSubscription?.state === 'joined',
      topic: rangeSubscription?.topic || null,
    },
    wash: {
      connected: washSubscription?.state === 'joined',
      topic: washSubscription?.topic || null,
    },
    isV2Enabled: isHighlightsV2Enabled(),
  };
}

/**
 * Force reconnect subscriptions
 * Useful for debugging or network recovery
 * @param userId - User ID to subscribe for (required)
 */
export async function reconnectSubscriptions(userId: string): Promise<boolean> {
  logRealtime.reconnect('manual', { manual: true });
  await stopRealtimeSubscriptions();
  return await startRealtimeSubscriptions(userId);
}

// ============================================================================
// AUTO-SETUP
// ============================================================================

/**
 * Initialize realtime subscriptions when user signs in
 * Should be called from authentication flow
 * 
 * Note: Cleanup on sign-out is handled by AuthContext
 * @param userId - User ID to subscribe for (required)
 */
export function initializeRealtimeForUser(userId: string): void {
  if (!isHighlightsV2Enabled()) return;

  // Start subscriptions after small delay to ensure bootstrap is complete
  setTimeout(() => {
    startRealtimeSubscriptions(userId);
  }, 1000);
}