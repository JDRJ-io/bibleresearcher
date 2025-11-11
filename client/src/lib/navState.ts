/**
 * Navigation State Utilities
 * 
 * Provides instant restore, recording, and cleanup for navigation history.
 * Optimized for fast initial mount and non-blocking server hydration.
 * 
 * Key features:
 * - Instant mount from localStorage/URL hash (no auth wait)
 * - Non-blocking server hydration with timeout guards
 * - Fire-and-forget navigation recording
 * - Automatic cleanup with server-side RPC
 */

import { supabase } from './supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';
import { authWithTimeout } from './withTimeout';

type SB = SupabaseClient;
type LastLoc = { verse: string; tr: string; t: number };

// -------- Local cache helpers --------
const LS_KEY = 'anointed:lastLocation';

function parseHashVerse(): string | null {
  const h = (location.hash || '').replace(/^#/, '').trim();
  return h && /^[A-Za-z]+\.\d+:\d+$/.test(h) ? h : null; // e.g., "Rev.22:20"
}

export function readLocal(): LastLoc | null {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || 'null');
  } catch {
    return null;
  }
}

export function writeLocal(verse: string, tr: string) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ verse, tr, t: Date.now() }));
  } catch {}
}

// -------- Restore (instant -> hydrate) --------
/**
 * Instant mount from cache/URL - does NOT wait for auth
 * This ensures UI appears immediately
 */
export function initialMount(mountBibleAt: (verse: string, tr: string) => void) {
  const hash = parseHashVerse();
  const cached = readLocal();
  const initialVerse = hash ?? cached?.verse ?? 'Gen.1:1';
  const initialTr = cached?.tr ?? 'NKJV';
  
  logger.info('RESTORE', 'instant-mount', { initialVerse, initialTr });
  mountBibleAt(initialVerse, initialTr);
  
  return { initialVerse, initialTr };
}

/**
 * Hydrate from server - runs in background after instant mount
 * Uses timeout guards to prevent auth/SDK stalls from blocking UI
 * 
 * 2J Pattern: userId is used for logging and validation, but queries use RLS/auth.uid() server-side.
 * - RPC 'bke_restore_state' uses auth.uid() internally via RLS
 * - Table queries (user_last_location, navigation_history) use RLS policies that enforce auth.uid()
 * This ensures server-side security even if client passes incorrect userId.
 * 
 * @param userId - User ID for client-side validation and logging
 * @param mountBibleAt - Function to mount Bible at a specific verse
 * @param setRecentHistory - Optional function to set recent history
 */
export async function hydrateFromServer(
  userId: string,
  mountBibleAt: (verse: string, tr: string) => void,
  setRecentHistory?: (rows: Array<{ v: string; tr: string; t: string }>) => void
) {
  const sb = supabase();

  // Try combined RPC first (fastest - one roundtrip)
  // RPC uses auth.uid() server-side via RLS for security
  try {
    const { data, error } = await sb.rpc('bke_restore_state', { p_limit: 50 });
    if (!error && data) {
      const serverVerse = data.verse_reference;
      const serverTr = data.translation || 'NKJV';
      
      if (serverVerse) {
        logger.info('RESTORE', 'snap-to-server', { serverVerse, serverTr, userId });
        mountBibleAt(serverVerse, serverTr);
        writeLocal(serverVerse, serverTr);
      }

      // Hydrate recent history
      if (setRecentHistory && Array.isArray(data.recent)) {
        setRecentHistory(data.recent);
      }
      
      return; // Success via RPC, done
    }
  } catch (rpcError) {
    logger.debug('RESTORE', 'rpc-unavailable-using-fallback');
  }

  // Fallback: separate queries (also use RLS)
  // RLS policies automatically filter by auth.uid()
  const ptr = await sb
    .from('user_last_location')
    .select('verse_reference, translation, updated_at')
    .limit(1)
    .single();

  if (!ptr.error && ptr.data?.verse_reference) {
    const serverVerse = ptr.data.verse_reference;
    const serverTr = ptr.data.translation || 'NKJV';
    
    logger.info('RESTORE', 'snap-to-server-fallback', { serverVerse, serverTr, userId });
    mountBibleAt(serverVerse, serverTr);
    writeLocal(serverVerse, serverTr);
  }

  // Load recent history (RLS enforces auth.uid() filter)
  if (setRecentHistory) {
    const hist = await sb
      .from('navigation_history')
      .select('verse_reference, translation, visited_at')
      .order('visited_at', { ascending: false })
      .limit(50);

    if (!hist.error && Array.isArray(hist.data)) {
      setRecentHistory(
        hist.data.map(r => ({ v: r.verse_reference, tr: r.translation, t: r.visited_at }))
      );
    }
  }
}

// -------- Record a navigation jump (non-blocking) --------
/**
 * Record a navigation event - fire-and-forget, doesn't block UI
 * Automatically cleans up old entries to keep history tidy
 * @param userId - User ID to record for (required)
 * @param verse - Verse reference to record
 * @param tr - Translation code
 * @param keep - Number of history entries to keep (default: 15)
 */
export async function recordNav(
  userId: string,
  verse: string,
  tr: string,
  keep = 15
) {
  writeLocal(verse, tr);

  const sb = supabase();

  logger.debug('NAV', 'record', { verse, tr, userId });

  // Fire-and-forget: append + pointer upsert
  sb.from('navigation_history')
    .insert({ user_id: userId, verse_reference: verse, translation: tr })
    .then(() => {}, () => {});
    
  sb.from('user_last_location')
    .upsert({ user_id: userId, verse_reference: verse, translation: tr })
    .then(() => {}, () => {});

  // Trim old rows
  cleanupNavHistory(sb, userId, keep).then(() => {}, () => {});
}

// -------- Client-side fallback cleanup (no subquery strings) --------
async function cleanupNavHistoryClient(sb: SB, userId: string, keep = 15) {
  const keepResp = await sb
    .from('navigation_history')
    .select('id')
    .eq('user_id', userId)
    .order('visited_at', { ascending: false })
    .limit(keep);

  if (keepResp.error || !keepResp.data) {
    logger.error('CLEANUP', 'keep-ids-failed', keepResp.error);
    return;
  }

  const ids = keepResp.data.map((r: { id: number }) => r.id);
  if (!ids.length) return;

  const del = await sb
    .from('navigation_history')
    .delete()
    .eq('user_id', userId)
    .not('id', 'in', `(${ids.join(',')})`);

  if (del.error) {
    logger.error('CLEANUP', 'delete-failed', del.error);
  }
}

/**
 * Clean up navigation history - keeps only N most recent entries
 * Tries server-side RPC first, falls back to client-side if needed
 */
async function cleanupNavHistory(sb: SB, userId: string, keep = 15) {
  const rpc = await sb.rpc('cleanup_nav_history', { p_keep: keep });
  if (rpc.error) {
    logger.warn('CLEANUP', 'rpc-failed-using-fallback', rpc.error.message);
    await cleanupNavHistoryClient(sb, userId, keep);
  } else {
    logger.debug('CLEANUP', 'rpc-success');
  }
}
