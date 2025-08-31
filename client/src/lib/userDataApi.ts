/**
 * User-Specific Data API
 * Handles bookmarks, highlights, notes, and profile management with proper RLS authentication
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
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', clean)
    .maybeSingle();

  return { ok: !data };
}

/**
 * Get current user's profile
 */
export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Update user profile
 */
export async function updateMyProfile(patch: { display_name?: string; avatar_url?: string; bio?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { error } = await supabase
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', user.id);
    
  if (error) throw error;
}

/**
 * Set or update username
 */
export async function setUsername(username: string) {
  const availability = await isUsernameAvailable(username);
  if (!availability.ok) {
    throw new Error('Username not available');
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const clean = username.trim().toLowerCase();
  
  const { error } = await supabase
    .from('profiles')
    .update({ 
      username: clean, 
      display_name: clean,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);
    
  if (error) throw error;
}

/**
 * Sign up with username and profile creation
 */
export async function signUpWithProfile(email: string, password: string, username: string, displayName?: string) {
  const { data, error } = await supabase.auth.signUp({
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
    const { error: profileError } = await supabase
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

// ============= BOOKMARKS API =============

export const userBookmarksApi = {
  /**
   * Toggle bookmark on/off for a verse
   */
  async toggle(translation: string, verse_key: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if already bookmarked
    const { data: existing } = await supabase
      .from('user_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('translation', translation)
      .eq('verse_key', verse_key)
      .maybeSingle();

    if (existing) {
      // Remove bookmark
      await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('translation', translation)
        .eq('verse_key', verse_key);
    } else {
      // Add bookmark
      await supabase
        .from('user_bookmarks')
        .upsert(
          { user_id: user.id, translation, verse_key },
          { onConflict: 'user_id,translation,verse_key' }
        );
    }
  },

  /**
   * Load bookmarks for visible verses
   */
  async loadForVerses(visibleVerseKeys: string[]): Promise<Array<{ translation: string; verse_key: string }>> {
    if (!visibleVerseKeys.length) return [];
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('translation, verse_key')
      .eq('user_id', user.id)
      .in('verse_key', visibleVerseKeys);

    if (error) throw error;
    return (data || []) as Array<{ translation: string; verse_key: string }>;
  },

  /**
   * Check if a verse is bookmarked
   */
  async isBookmarked(translation: string, verse_key: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('user_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('translation', translation)
      .eq('verse_key', verse_key)
      .single();

    return !!data;
  }
};

// ============= COMPREHENSIVE SAVE FUNCTION =============

/**
 * Save all user data at once - session, preferences, and current state
 */
export async function saveAllUserData(): Promise<{ success: boolean; message: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'Please sign in to save your data.' };
    }

    // Gather current session data
    const currentPath = window.location.pathname;
    const verseMatch = currentPath.match(/\/([^\/]+)\.(\d+):(\d+)/);
    const lastVersePosition = verseMatch ? `${verseMatch[1]}.${verseMatch[2]}:${verseMatch[3]}` : 'Gen.1:1';

    // Get current translation and layout preferences
    const currentTranslation = localStorage.getItem('currentTranslation') || 'KJV';
    const layoutPreferences = {
      showNotes: localStorage.getItem('showNotes') === 'true',
      showProphecy: localStorage.getItem('showProphecy') === 'true',
      showContext: localStorage.getItem('showContext') === 'true',
      fontSize: localStorage.getItem('fontSize') || 'medium',
      theme: localStorage.getItem('theme') || 'dark'
    };

    // Save session data
    await supabase.from('user_sessions').upsert({
      user_id: user.id,
      last_verse_position: lastVersePosition,
      current_translation: currentTranslation,
      layout_preferences: JSON.stringify(layoutPreferences),
      scroll_position: window.scrollY || 0,
      session_data: JSON.stringify({ timestamp: Date.now() }),
      last_active: new Date().toISOString()
    }, { onConflict: 'user_id' });

    // Save user preferences
    await supabase.from('user_preferences').upsert({
      userId: user.id,
      theme: layoutPreferences.theme,
      selectedTranslations: [currentTranslation],
      showNotes: layoutPreferences.showNotes,
      showProphecy: layoutPreferences.showProphecy,
      showContext: layoutPreferences.showContext,
      fontSize: layoutPreferences.fontSize,
      lastVersePosition: lastVersePosition,
      updatedAt: new Date().toISOString()
    }, { onConflict: 'userId' });

    console.log('💾 All user data saved successfully:', lastVersePosition);
    return { success: true, message: `Study data saved at ${lastVersePosition}` };

  } catch (error) {
    console.error('❌ Failed to save all user data:', error);
    return { success: false, message: 'Failed to save. Please try again.' };
  }
}

// ============= NAVIGATION & SESSION =============

/**
 * Add to navigation history
 */
export async function addToHistory(verse_reference: string, translation: string = 'KJV'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('navigation_history').insert({
    user_id: user.id,
    verse_reference,
    translation
  });
}

/**
 * Save user session data
 */
export async function saveSession(payload: {
  last_verse_position?: string;
  current_translation?: string;
  layout_preferences?: any;
  scroll_position?: number;
  session_data?: any;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('user_sessions').upsert({
    user_id: user.id,
    last_verse_position: payload.last_verse_position,
    current_translation: payload.current_translation ?? 'KJV',
    layout_preferences: JSON.stringify(payload.layout_preferences ?? {}),
    scroll_position: payload.scroll_position ?? 0,
    session_data: JSON.stringify(payload.session_data ?? {}),
    last_active: new Date().toISOString()
  }, { onConflict: 'user_id' });
}

// ============= HIGHLIGHTS API =============

export const userHighlightsApi = {
  /**
   * Save highlights
   */
  async save(translation: string, verse_key: string, segments: Segment[], textLen: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await supabase.from('user_highlights').upsert({
      user_id: user.id,
      translation,
      verse_key,
      segments: JSON.stringify(segments),
      text_len: textLen,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,translation,verse_key' });

    console.log('💾 Highlights saved:', verse_key, segments.length, 'segments');
  },

  /**
   * Load highlights for visible verses
   */
  async loadForVerses(translation: string, visibleVerseKeys: string[]): Promise<Array<{ verse_key: string; segments: Segment[] }>> {
    if (!visibleVerseKeys.length) return [];
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_highlights')
      .select('verse_key, segments')
      .eq('user_id', user.id)
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
  async getForVerse(translation: string, verse_key: string): Promise<{ segments: Segment[] } | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_highlights')
      .select('segments')
      .eq('user_id', user.id)
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
  async deleteForVerse(translation: string, verse_key: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_highlights')
      .delete()
      .eq('user_id', user.id)
      .eq('translation', translation)
      .eq('verse_key', verse_key);

    if (error) throw error;
    console.log('🗑️ Highlights deleted for:', verse_key);
  }
};

// ============= NOTES API =============

export const userNotesApi = {
  /**
   * Save a note for a verse
   */
  async save(translation: string, verse_key: string, text: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await supabase.from('user_notes').upsert({
      user_id: user.id,
      translation,
      verse_key,
      note_text: text,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,translation,verse_key' });
    
    console.log('📝 Note saved for:', verse_key);
  },

  /**
   * Load notes for visible verses
   */
  async loadForVerses(translation: string, verseKeys: string[]): Promise<Array<{ verse_key: string; note_text: string }>> {
    if (!verseKeys.length) return [];
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_notes')
      .select('verse_key, note_text')
      .eq('user_id', user.id)
      .eq('translation', translation)
      .in('verse_key', verseKeys);

    if (error) throw error;
    return (data || []) as Array<{ verse_key: string; note_text: string }>;
  }
};