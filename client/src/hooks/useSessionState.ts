import { supabase } from '@/lib/supabaseClient';
import { getCurrentVerseKey, collectAllMenuToggles } from '@/lib/sessionCollector';
import { logger } from '@/lib/logger';
import { useEffect, useRef } from 'react';

let dirty = false;
let debounceTimer: number | undefined;
let saveEnabled = false; // Block saves during initial restore
let cachedUserId: string | undefined; // Cache userId to avoid redundant auth calls

// Enable session saves (call after initial restore is complete)
export function enableSessionSaves() {
  saveEnabled = true;
  logger.debug('SESSION', 'saves-enabled');
}

// Set cached userId (call from AuthContext after authentication)
export function setCachedUserId(userId: string | undefined) {
  cachedUserId = userId;
  logger.debug('SESSION', 'user-id-cached', { userId: userId ? 'set' : 'cleared' });
}

// Mark dirty and schedule save (event-driven with 1s debounce)
export function markDirty() {
  if (!saveEnabled) {
    logger.debug('SESSION', 'save-blocked-during-restore');
    return;
  }
  dirty = true;
  clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(flushSnapshot, 1000); // 1s debounce
}

// Flush snapshot to Supabase or localStorage
async function flushSnapshot(userId?: string) {
  if (!dirty) return;
  dirty = false;

  try {
    const verseKey = getCurrentVerseKey();
    const toggles = collectAllMenuToggles();
    
    // Check authentication - use provided userId, cached userId, or fallback to getSession()
    let user_id = userId || cachedUserId;
    if (!user_id) {
      const { data: { session } } = await supabase().auth.getSession();
      
      if (!session) {
        // Guest user - save to localStorage
        try {
          const guestState = {
            last_verse_key: verseKey,
            last_toggles: toggles,
            saved_at: new Date().toISOString()
          };
          localStorage.setItem('bible_guest_session', JSON.stringify(guestState));
          logger.debug('SESSION', 'guest-save-success', { verseKey });
        } catch (e) {
          logger.warn('SESSION', 'guest-save-failed', { error: e });
        }
        return;
      }
      user_id = session.user.id;
    }

    // Authenticated user - save to database
    logger.debug('SESSION', 'save-snapshot', { verseKey, toggleCount: Object.keys(toggles).length });
    
    const { error } = await supabase().rpc('save_session_state', {
      p_last_verse_key: verseKey,
      p_last_toggles: toggles
    });
    
    if (error) {
      logger.error('SESSION', 'save-failed', { error });
    } else {
      logger.debug('SESSION', 'save-success');
    }
  } catch (error) {
    logger.error('SESSION', 'save-exception', { error });
  }
}

// Merge guest localStorage state to database after sign-in
export async function mergeGuestSession(userId?: string) {
  try {
    const guestData = localStorage.getItem('bible_guest_session');
    if (!guestData) {
      logger.debug('SESSION', 'no-guest-data-to-merge');
      return;
    }

    // Check authentication - use provided userId or fallback to getSession()
    let user_id = userId;
    if (!user_id) {
      const { data: { session } } = await supabase().auth.getSession();
      if (!session) {
        logger.debug('SESSION', 'merge-skipped-not-authenticated');
        return;
      }
      user_id = session.user.id;
    }

    const guestState = JSON.parse(guestData);
    logger.info('SESSION', 'merging-guest-session', { verseKey: guestState.last_verse_key });

    // Save guest state to database
    const { error } = await supabase().rpc('save_session_state', {
      p_last_verse_key: guestState.last_verse_key,
      p_last_toggles: guestState.last_toggles
    });

    if (error) {
      logger.error('SESSION', 'merge-failed', { error });
    } else {
      // Clear guest session from localStorage after successful merge
      localStorage.removeItem('bible_guest_session');
      logger.info('SESSION', 'merge-success');
    }
  } catch (error) {
    logger.error('SESSION', 'merge-exception', { error });
  }
}

// Load guest session from localStorage
export function loadGuestSession() {
  try {
    const guestData = localStorage.getItem('bible_guest_session');
    if (!guestData) return null;

    const guestState = JSON.parse(guestData);
    logger.info('SESSION', 'guest-session-loaded', { verseKey: guestState.last_verse_key });
    return {
      last_verse_key: guestState.last_verse_key,
      last_toggles: guestState.last_toggles
    };
  } catch (error) {
    logger.warn('SESSION', 'guest-load-failed', { error });
    return null;
  }
}

// Flush with keepalive for page close
async function flushWithKeepAlive(userId?: string) {
  if (!dirty) return;
  
  try {
    // Check authentication - use provided userId, cached userId, or fallback to getSession()
    let user_id = userId || cachedUserId;
    let access_token: string | undefined;
    
    if (!user_id) {
      const { data: session } = await supabase().auth.getSession();
      if (!session?.session?.access_token) {
        // No auth, fallback to regular flush
        return flushSnapshot();
      }
      user_id = session.session.user.id;
      access_token = session.session.access_token;
    } else {
      // If userId is provided/cached, still need access token
      const { data: session } = await supabase().auth.getSession();
      if (!session?.session?.access_token) {
        return flushSnapshot();
      }
      access_token = session.session.access_token;
    }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/save_session_state`;
    const body = JSON.stringify({
      p_last_verse_key: getCurrentVerseKey(),
      p_last_toggles: collectAllMenuToggles()
    });

    fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json'
      },
      body,
      keepalive: true
    }).catch(() => {
      // Silent fail on keepalive (page is closing anyway)
    });
  } catch (error) {
    // Silent fail
  }
}

// Hook to setup event listeners
export function useSessionState() {
  const listenersSetup = useRef(false);
  
  useEffect(() => {
    if (listenersSetup.current) return;
    listenersSetup.current = true;
    
    // Wrap flushWithKeepAlive to handle event parameter
    const handlePageHide = () => flushWithKeepAlive();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushWithKeepAlive();
      }
    };
    
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    logger.info('SESSION', 'listeners-setup');
    
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return { markDirty, flushSnapshot };
}
