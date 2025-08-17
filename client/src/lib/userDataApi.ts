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

    // First check if bookmark exists
    const { data: existing } = await supabase
      .from('user_bookmarks')
      .select('id')
      .eq('translation', translation)
      .eq('verse_key', verse_key)
      .single();

    if (existing) {
      // Remove bookmark
      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .match({ translation, verse_key });
      
      if (error) throw error;
    } else {
      // Add bookmark
      const { error } = await supabase
        .from('user_bookmarks')
        .upsert({
          translation,
          verse_key
        });
      
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
   * Save highlights using the RPC function with conflict resolution
   */
  async save(
    translation: string, 
    verseKey: string, 
    segments: Segment[], 
    serverRev?: number | null,
    textLen?: number | null
  ): Promise<void> {
    await ensureAuth();

    const { error } = await supabase.rpc('save_highlights', {
      p_translation: translation,
      p_verse_key: verseKey,
      p_segments: segments,
      p_client_rev: serverRev ?? null,
      p_text_len: textLen ?? null
    });

    if (error) {
      console.error('Error saving highlights:', error);
      throw error;
    }
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

    const { error } = await supabase
      .from('user_highlights')
      .delete()
      .eq('translation', translation)
      .eq('verse_key', verseKey);

    if (error) throw error;
  }
};

// ============= NOTES API (if needed) =============

export const userNotesApi = {
  /**
   * Save a note for a verse
   */
  async save(verseRef: string, text: string): Promise<void> {
    await ensureAuth();

    const { error } = await supabase
      .from('notes')
      .upsert({
        verse_ref: verseRef,
        text
      });

    if (error) throw error;
  },

  /**
   * Load notes for visible verses
   */
  async loadForVerses(verseRefs: string[]): Promise<Array<{ verse_ref: string; text: string }>> {
    if (!verseRefs.length) return [];
    
    await ensureAuth();

    const { data, error } = await supabase
      .from('notes')
      .select('verse_ref, text')
      .in('verse_ref', verseRefs);

    if (error) throw error;
    return (data || []) as Array<{ verse_ref: string; text: string }>;
  }
};