/**
 * User-Specific Data API
 * Handles bookmarks, highlights, notes, and profile management with proper RLS authentication
 * 
 * 2J AUTH PATTERN: All functions accept userId as the FIRST parameter
 * No getUser() calls - userId is always required and passed by callers
 */

import { supabase } from './supabaseClient';
import { Segment } from '@shared/highlights';
import { logger } from '@/lib/logger';

// ============= PROFILE MANAGEMENT =============

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string): Promise<{ ok: boolean; reason?: string }> {
  const clean = username.trim().toLowerCase();
  if (!/^[a-z0-9_.]{3,32}$/.test(clean)) {
    return { ok: false, reason: 'invalid' };
  }

  // Check if taken in profiles
  const { data } = await supabase()
    .from('profiles')
    .select('id')
    .ilike('username', clean)
    .maybeSingle();

  return { ok: !data };
}

/**
 * Get current user's profile
 */
export async function getMyProfile(userId: string) {
  const { data, error } = await supabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Update user profile
 */
export async function updateMyProfile(userId: string, patch: { display_name?: string; avatar_url?: string; bio?: string }) {
  const { error } = await supabase()
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', userId);
    
  if (error) throw error;
}

/**
 * Set or update username
 */
export async function setUsername(userId: string, username: string) {
  const availability = await isUsernameAvailable(username);
  if (!availability.ok) {
    throw new Error('Username not available');
  }
  
  const clean = username.trim().toLowerCase();
  
  const { error } = await supabase()
    .from('profiles')
    .update({ 
      username: clean, 
      display_name: clean,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
    
  if (error) throw error;
}

/**
 * Sign up with username and profile creation
 */
export async function signUpWithProfile(email: string, password: string, username: string, displayName?: string) {
  const { data, error } = await supabase().auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName ?? username
      }
    }
  });
  
  if (error) throw error;
  
  // Ensure profile is created
  if (data.user) {
    const { error: profileError } = await supabase()
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: data.user.email!,
        username: username.trim().toLowerCase(),
        display_name: displayName ?? username
      }, { onConflict: 'id' });
      
    if (profileError) throw profileError;
  }
  
  return data.user;
}

// ============= NAVIGATION & SESSION =============

/**
 * Add to navigation history
 */
export async function addToHistory(userId: string, verseRef: string, translation = 'NKJV'): Promise<void> {
  const { error } = await supabase()
    .from('navigation_history')
    .insert({
      user_id: userId,
      verse_reference: verseRef,
      translation
    });

  if (error && import.meta.env.DEV) {
    console.error('[HISTORY] insert failed', { verseRef, translation, error });
  }
}

/**
 * Load navigation history (last 15 entries, newest first)
 */
export async function loadHistory(userId: string, limit = 15): Promise<Array<{ verse_reference: string; translation: string; visited_at: string }>> {
  const { data, error } = await supabase()
    .from('navigation_history')
    .select('verse_reference, translation, visited_at')
    .eq('user_id', userId)
    .order('visited_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (import.meta.env.DEV) console.error('[HISTORY] load failed', error);
    return [];
  }
  return data ?? [];
}

/**
 * Save user session data
 */
export async function saveSession(userId: string, payload: {
  last_verse_position?: string;
  current_translation?: string;
  layout_preferences?: any;
  scroll_position?: number;
  session_data?: any;
}): Promise<void> {
  await supabase().from('user_sessions').upsert({
    user_id: userId,
    last_verse_position: payload.last_verse_position,
    current_translation: payload.current_translation ?? 'NKJV',
    layout_preferences: JSON.stringify(payload.layout_preferences ?? {}),
    scroll_position: payload.scroll_position ?? 0,
    session_data: JSON.stringify(payload.session_data ?? {}),
    last_active: new Date().toISOString()
  }, { onConflict: 'user_id' });
}

// ============= CONTRACT-BASED API FUNCTIONS =============

/**
 * Load user data for visible verses (Contract Function A)
 * Batch-loads highlights, bookmarks, and notes for viewport efficiency
 */
export async function loadVisibleVerseData(userId: string, visible: string[], tr?: string) {
  const trArg = tr ?? null;

  // Build queries conditionally based on translation
  let bookmarksQuery = supabase()
    .from('user_bookmarks')
    .select('id, verse_key, translation, label, color_hex, created_at, updated_at')
    .eq('user_id', userId)
    .in('verse_key', visible);
  
  if (tr) {
    bookmarksQuery = bookmarksQuery.eq('translation', tr);
  }

  let notesQuery = supabase()
    .from('user_notes')
    .select('id, verse_key, translation, body, updated_at')
    .in('verse_key', visible);
  
  if (tr) {
    notesQuery = notesQuery.eq('translation', tr);
  }

  const [highlights, bookmarks, notes] = await Promise.all([
    supabase().rpc('fn_get_highlight_ranges', { p_verse_keys: visible, p_translation: trArg }),
    bookmarksQuery,
    notesQuery
  ]);

  // Surface errors early
  if (highlights.error) throw highlights.error;
  if (bookmarks.error) throw bookmarks.error;
  if (notes.error) throw notes.error;

  return {
    highlights: highlights.data ?? [],
    bookmarks: bookmarks.data ?? [],
    notes: notes.data ?? []
  };
}

/**
 * Add highlight range (Contract Function B)
 * Input offsets are 0-based, end-exclusive
 */
export async function addHighlight(userId: string, verse: string, start: number, end: number, colorHex: string, tr = 'NKJV', note?: string, opacity = 1) {
  const { error } = await supabase().rpc('fn_add_highlight_range', {
    p_verse_key: verse, 
    p_translation: tr, 
    p_start: start, 
    p_end: end, 
    p_color: colorHex, 
    p_note: note ?? null, 
    p_opacity: opacity
  });
  if (error) throw error;
}

/**
 * Erase highlight portion (Contract Function C)
 * Server handles trim/split logic automatically
 */
export async function eraseHighlightPortion(verse: string, start: number, end: number, tr = 'NKJV') {
  const { data, error } = await rpcAuthed('fn_trim_highlight_selection', {
    p_verse_key: verse,
    p_start: start,
    p_end: end,
    p_translation: tr ?? 'NKJV'
  });
  
  if (error) throw error;
  
  // C) Validate count > 0 for successful erase
  const count = data ?? 0;
  if (count <= 0) {
    throw new Error('Erase operation did not affect any rows - no highlights found in selection');
  }
  
  logger.debug('HIGHLIGHTS', 'rpc-done', {
    fn: 'fn_trim_highlight_selection',
    op: 'erase',
    verse_key: verse,
    tr,
    ok: true,
    dataType: 'int',
    val: count
  });
}

/**
 * Upsert bookmark (Contract Function D)
 */
export async function upsertBookmark(userId: string, verse: string, label = '', tr = 'NKJV', colorHex?: string) {
  const params: any = { 
    p_verse_key: verse, 
    p_translation: tr, 
    p_label: label 
  };
  
  // Add color parameter if provided
  if (colorHex) {
    params.p_color_hex = colorHex;
  }

  const { error } = await supabase().rpc('fn_upsert_bookmark', params);
  if (error) throw error;
}

/**
 * Delete bookmark (Contract Function D)
 */
export async function deleteBookmark(userId: string, id: string) {
  const { error } = await supabase().rpc('fn_delete_bookmark', { p_id: id });
  if (error) throw error;
}

/**
 * Upsert note (Contract Function D)
 */
export async function upsertNote(userId: string, verse: string, body: string, tr = 'NKJV') {
  const { error } = await supabase().rpc('fn_upsert_note', { 
    p_verse_key: verse, 
    p_translation: tr, 
    p_body: body 
  });
  if (error) throw error;
}

/**
 * Delete note (Contract Function D)
 */
export async function deleteNote(userId: string, id: string) {
  const { error } = await supabase().rpc('fn_delete_note', { p_id: id });
  if (error) throw error;
}

/**
 * Save user color (Contract Function E)
 */
export async function saveUserColor(userId: string, colorHex: string, label?: string) {
  const { error } = await supabase().rpc('fn_save_color', { 
    p_color: colorHex, 
    p_label: label ?? null 
  });
  if (error) throw error;
}

/**
 * Highlight whole verse across all translations (Contract Function F)
 */
export async function upsertVerseHighlight(userId: string, verse: string, colorHex: string, opacity = 0.95, note?: string) {
  const { error } = await supabase().rpc('fn_upsert_verse_highlight', {
    p_verse_key: verse,
    p_color: colorHex,
    p_opacity: opacity,
    p_note: note ?? null
  });
  if (error) throw error;
}

/**
 * Delete verse-level highlight (Contract Function F)
 */
export async function deleteVerseHighlight(userId: string, verse: string) {
  const { error } = await supabase().rpc('fn_delete_verse_highlight', { 
    p_verse_key: verse 
  });
  if (error) throw error;
}

/**
 * Delete ALL highlights in a verse (both verse-level and range-level)
 */
export async function deleteAllHighlightsInVerse(userId: string, verse: string, translation = 'NKJV') {
  const { error } = await supabase().rpc('fn_delete_highlights_in_verse', {
    p_verse_key: verse,
    p_translation: translation
  });
  if (error) throw error;
}

/**
 * Authentication-guarded RPC wrapper (inspired by troubleshooting guide)
 * Ensures all RPC calls have proper auth tokens
 */
export async function rpcAuthed(name: string, args: Record<string, any>) {
  const { data: sess } = await supabase().auth.getSession();
  if (!sess?.session?.access_token) {
    // try to refresh once
    await supabase().auth.refreshSession();
  }
  const { data: sess2 } = await supabase().auth.getSession();
  if (!sess2?.session?.access_token) {
    throw new Error(`No auth session for RPC ${name}`);
  }
  return supabase().rpc(name, args);
}

/**
 * Enhanced delete all highlights function that returns detailed deletion info
 */
export async function deleteAllForVerse(userId: string, verseKey: string) {
  // V1 Guard: Block legacy calls when V2 is enabled and V1 is disabled
  const V2 = import.meta.env.VITE_HIGHLIGHTS_V2_ENABLED === 'true';
  const V1_OFF = import.meta.env.VITE_HL_V1_DISABLED === 'true';
  const HARD_FAIL = import.meta.env.VITE_HL_V2_HARD_FAIL === 'true';
  
  if (V2 && V1_OFF) {
    const msg = 'V1 highlight delete blocked: V2 integration mode - fn_delete_all_highlights disabled';
    console.error('HL_LEGACY_CALL', { fn: 'fn_delete_all_highlights', verseKey, stack: new Error().stack });
    if (HARD_FAIL) throw new Error(msg);
    console.error(msg);
    return { ok: true, message: 'V2 mode: operation blocked' };
  }

  const { data, error } = await supabase().rpc('fn_delete_all_highlights', { p_verse_key: verseKey });
  if (error || !data?.ok) {
    throw new Error(error?.message ?? data?.error ?? 'Delete failed');
  }

  // V2 GUARD: Only invalidate cache for V1 system - V2 uses optimistic updates
  if (!V2) {
    const { queryClient } = await import('@/lib/queryClient');
    queryClient.invalidateQueries({ queryKey: ['hl:verse', verseKey] });
    queryClient.invalidateQueries({ queryKey: ['hl:ranges', verseKey] });
  }
  
  return data;
}

// ============= UPDATED LEGACY API OBJECTS =============
// Updated to use contract functions where possible

export const userBookmarksApi = {
  /**
   * Toggle bookmark on/off for a verse (uses contract functions)
   */
  async toggle(userId: string, translation: string, verse_key: string): Promise<void> {
    // Check if already bookmarked first
    const isBookmarked = await this.isBookmarked(userId, translation, verse_key);
    
    if (isBookmarked) {
      // Get bookmark ID to delete (RLS handles user filtering)
      const { data } = await supabase()
        .from('user_bookmarks')
        .select('id')
        .eq('translation', translation)
        .eq('verse_key', verse_key)
        .single();

      if (data?.id) {
        await deleteBookmark(userId, data.id);
      }
    } else {
      await upsertBookmark(userId, verse_key, '', translation);
    }
  },

  /**
   * Load bookmarks for visible verses
   */
  async loadForVerses(userId: string, visibleVerseKeys: string[]): Promise<Array<{ translation: string; verse_key: string }>> {
    if (!visibleVerseKeys.length) return [];

    const { data, error } = await supabase()
      .from('user_bookmarks')
      .select('translation, verse_key')
      .in('verse_key', visibleVerseKeys);

    if (error) throw error;
    return (data || []) as Array<{ translation: string; verse_key: string }>;
  },

  /**
   * Check if a verse is bookmarked
   */
  async isBookmarked(userId: string, translation: string, verse_key: string): Promise<boolean> {
    const { data } = await supabase()
      .from('user_bookmarks')
      .select('id')
      .eq('translation', translation)
      .eq('verse_key', verse_key)
      .single();

    return !!data;
  }
};

export const userHighlightsApi = {
  /**
   * Save highlights (updated to use contract when range-based)
   */
  async save(userId: string, translation: string, verse_key: string, segments: Segment[], serverRev?: number | null, textLen?: number | null): Promise<void> {
    await supabase().from('user_highlights').upsert({
      translation,
      verse_key,
      segments: JSON.stringify(segments),
      text_len: textLen ?? 0,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,translation,verse_key' });

    console.log('💾 Highlights saved:', verse_key, segments.length, 'segments');
  },

  /**
   * Load highlights for visible verses
   */
  async loadForVerses(userId: string, translation: string, visibleVerseKeys: string[]): Promise<Array<{ verse_key: string; segments: Segment[] }>> {
    if (!visibleVerseKeys.length) return [];

    const { data, error } = await supabase()
      .from('user_highlights')
      .select('verse_key, segments')
      .eq('translation', translation)
      .in('verse_key', visibleVerseKeys);

    if (error) throw error;
    
    return (data || []).map((row: any) => ({
      verse_key: row.verse_key as string,
      segments: JSON.parse(row.segments as string) as Segment[]
    }));
  },

  /**
   * Get highlights for a specific verse
   */
  async getForVerse(userId: string, translation: string, verse_key: string): Promise<{ segments: Segment[] } | null> {
    const { data, error } = await supabase()
      .from('user_highlights')
      .select('segments')
      .eq('translation', translation)
      .eq('verse_key', verse_key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      segments: JSON.parse(data.segments as string) as Segment[]
    };
  },

  /**
   * Delete all highlights for a verse
   */
  async deleteForVerse(userId: string, translation: string, verse_key: string): Promise<void> {
    const { error } = await supabase()
      .from('user_highlights')
      .delete()
      .eq('translation', translation)
      .eq('verse_key', verse_key);

    if (error) throw error;
    console.log('🗑️ Highlights deleted for:', verse_key);
  }
};

export const userNotesApi = {
  /**
   * Save a note for a verse (uses contract function)
   */
  async save(userId: string, translation: string, verse_key: string, text: string): Promise<void> {
    await upsertNote(userId, verse_key, text, translation);
    console.log('📝 Note saved for:', verse_key);
  },

  /**
   * Load notes for visible verses
   */
  async loadForVerses(userId: string, translation: string, verseKeys: string[]): Promise<Array<{ verse_key: string; body: string }>> {
    if (!verseKeys.length) return [];

    const { data, error } = await supabase()
      .from('user_notes')
      .select('verse_key, body')
      .eq('translation', translation)
      .in('verse_key', verseKeys);

    if (error) throw error;
    return (data || []) as Array<{ verse_key: string; body: string }>;
  }
};
