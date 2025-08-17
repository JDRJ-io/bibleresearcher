/**
 * User-Specific Data API
 * Handles bookmarks, highlights, and notes with proper RLS authentication
 */

import { supabase } from './supabaseClient';
import { Segment } from '@shared/highlights';

// Auth requirement check
export async function ensureAuth(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated. Please sign in to save data.');
  }
  return true;
}

// ============= BOOKMARKS API =============

export const userBookmarksApi = {
  /**
   * Toggle bookmark on/off for a verse
   */
  async toggle(translation: string, verse_key: string): Promise<void> {
    await ensureAuth();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');

    // Is it already bookmarked for THIS user?
    const { data: existing, error: selErr } = await supabase
      .from('user_bookmarks')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('translation', translation)
      .eq('verse_key', verse_key)
      .maybeSingle();
    if (selErr) throw selErr;

    if (existing) {
      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('translation', translation)
        .eq('verse_key', verse_key);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_bookmarks')
        .upsert(
          { user_id: user.id, translation, verse_key },
          { onConflict: 'user_id,translation,verse_key' }
        );
      if (error) throw error;
    }
  },

  /**
   * Load bookmarks for visible verses (batch)
   */
  async loadForVerses(visibleVerseKeys: string[]): Promise<Array<{ translation: string; verse_key: string }>> {
    if (!visibleVerseKeys.length) return [];
    
    await ensureAuth();

    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('translation, verse_key')
      .in('verse_key', visibleVerseKeys);

    if (error) throw error;
    return (data || []) as Array<{ translation: string; verse_key: string }>;
  },

  /**
   * Check if a verse is bookmarked
   */
  async isBookmarked(translation: string, verse_key: string): Promise<boolean> {
    await ensureAuth();

    const { data } = await supabase
      .from('user_bookmarks')
      .select('id')
      .eq('translation', translation)
      .eq('verse_key', verse_key)
      .single();

    return !!data;
  }
};

// ============= HIGHLIGHTS API =============

export const userHighlightsApi = {
  /**
   * Save highlights with proper JSON storage and conflict resolution
   */
  async save(
    translation: string, 
    verseKey: string, 
    segments: Segment[], 
    textLen: number,
    clientRev?: number
  ): Promise<void> {
    await ensureAuth();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');

    // fetch current server_rev
    const { data: row, error: getErr } = await supabase
      .from('user_highlights')
      .select('server_rev')
      .eq('user_id', user.id)
      .eq('translation', translation)
      .eq('verse_key', verseKey)
      .maybeSingle();
    if (getErr) throw getErr;

    const nextRev = (clientRev ?? row?.server_rev ?? 0) + 1;

    const { error } = await supabase
      .from('user_highlights')
      .upsert({
        user_id: user.id,
        translation,
        verse_key: verseKey,
        segments,                // <-- send array, NOT JSON.stringify
        text_len: textLen,
        server_rev: nextRev,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,translation,verse_key' });

    if (error) throw error;
    console.log('💾 Highlights saved:', verseKey, segments.length, 'segments');
  },

  /**
   * Load highlights for visible verses (batch)
   */
  async loadForVerses(
    translation: string, 
    visibleVerseKeys: string[]
  ): Promise<Array<{ verse_key: string; segments: Segment[]; server_rev: number }>> {
    if (!visibleVerseKeys.length) return [];
    
    await ensureAuth();

    const { data, error } = await supabase
      .from('user_highlights')
      .select('verse_key, segments, server_rev')
      .eq('translation', translation)
      .in('verse_key', visibleVerseKeys);

    if (error) throw error;
    
    return (data || []).map((row: any) => ({
      verse_key: row.verse_key as string,
      segments: JSON.parse(row.segments as string) as Segment[],
      server_rev: row.server_rev as number
    }));
  },

  /**
   * Get highlights for a specific verse
   */
  async getForVerse(
    translation: string, 
    verseKey: string
  ): Promise<{ segments: Segment[]; server_rev: number } | null> {
    await ensureAuth();

    const { data, error } = await supabase
      .from('user_highlights')
      .select('segments, server_rev')
      .eq('translation', translation)
      .eq('verse_key', verseKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No data found
      throw error;
    }

    return {
      segments: JSON.parse(data.segments as string) as Segment[],
      server_rev: data.server_rev as number
    };
  },

  /**
   * Delete all highlights for a verse
   */
  async deleteForVerse(translation: string, verseKey: string): Promise<void> {
    await ensureAuth();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');

    const { error } = await supabase
      .from('user_highlights')
      .delete()
      .eq('user_id', user.id)
      .eq('translation', translation)
      .eq('verse_key', verseKey);

    if (error) throw error;
    console.log('🗑️ Highlights deleted for:', verseKey);
  }
};

// ============= NOTES API =============

export const userNotesApi = {
  /**
   * Save a note for a verse with proper conflict resolution
   */
  async save(translation: string, verseKey: string, text: string, clientRev?: number): Promise<void> {
    await ensureAuth();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');

    // get server_rev
    const { data: row, error: getErr } = await supabase
      .from('user_notes')
      .select('server_rev')
      .eq('user_id', user.id)
      .eq('translation', translation)
      .eq('verse_key', verseKey)
      .maybeSingle();
    if (getErr) throw getErr;

    const nextRev = (row?.server_rev ?? 0) + 1;

    const { error } = await supabase
      .from('user_notes')
      .upsert({
        user_id: user.id,
        translation,
        verse_key: verseKey,
        note_text: text,
        server_rev: clientRev ?? nextRev,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,translation,verse_key' });

    if (error) throw error;
    console.log('📝 Note saved for:', verseKey);
  },

  /**
   * Load notes for visible verses
   */
  async loadForVerses(translation: string, verseKeys: string[]): Promise<Array<{ verse_key: string; note_text: string; server_rev: number }>> {
    if (!verseKeys.length) return [];
    
    await ensureAuth();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');

    const { data, error } = await supabase
      .from('user_notes')
      .select('verse_key, note_text, server_rev')
      .eq('user_id', user.id)
      .eq('translation', translation)
      .in('verse_key', verseKeys);

    if (error) throw error;
    return (data || []) as Array<{ verse_key: string; note_text: string; server_rev: number }>;
  }
};