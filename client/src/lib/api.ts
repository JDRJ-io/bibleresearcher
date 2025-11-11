import { supabase } from './supabaseClient';
import type { 
  UserNote, 
  InsertUserNote, 
  Highlight, 
  InsertHighlight, 
  Bookmark, 
  InsertBookmark,
  UserPreferences,
  InsertUserPreferences
} from '@shared/schema';

// Notes API
export const notesApi = {
  async getAll(userId: string): Promise<UserNote[]> {
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase()
      .from('user_notes')
      .select('id, verse_key, translation, body, created_at, updated_at')
      .order('id', { ascending: false });

    if (error) throw error;
    return (data as UserNote[]) || [];
  },

  async create(userId: string, noteData: Omit<InsertUserNote, 'user_id'>): Promise<UserNote> {
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase()
      .from('user_notes')
      .insert(noteData)
      .select()
      .single();

    if (error) throw error;
    return data as UserNote;
  },

  async update(userId: string, id: number, noteData: Partial<Omit<InsertUserNote, 'user_id'>>): Promise<UserNote> {
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase()
      .from('user_notes')
      .update({ ...noteData })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as UserNote;
  },

  async delete(userId: string, id: number): Promise<void> {
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase()
      .from('user_notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Highlights API
export const highlightsApi = {
  async getAll(userId: string): Promise<Highlight[]> {
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase()
      .from('highlights')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: false });

    if (error) throw error;
    return (data as Highlight[]) || [];
  },

  async create(userId: string, highlightData: Omit<InsertHighlight, 'user_id'>): Promise<Highlight> {
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase()
      .from('highlights')
      .insert({ 
        verse_ref: highlightData.verse_ref,
        translation: highlightData.translation,
        start_pos: highlightData.start_pos,
        end_pos: highlightData.end_pos,
        color_hsl: highlightData.color_hsl,
        user_id: userId 
      })
      .select()
      .single();

    if (error) throw error;
    return data as Highlight;
  },

  async delete(userId: string, id: number): Promise<void> {
    if (!userId) throw new Error('User not authenticated');

    console.log('🎯 Deleting individual highlight:', { id, userId });

    const { error } = await supabase()
      .from('highlights')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('🎯 Individual delete error:', error);
      throw error;
    } else {
      console.log('🎯 Successfully deleted individual highlight:', id);
    }
  },

  // Bulletproof function to delete all highlights for a specific verse, user, and translation
  async deleteAllForVerse(userId: string, verseRef: string, translation: string): Promise<void> {
    if (!userId) throw new Error('User not authenticated');

    // Normalize verse reference to avoid hidden differences
    const normalizedVerseRef = verseRef.trim();
    const normalizedTranslation = translation.trim();

    console.log('🎯 Bulletproof delete - Step 1: Fetching highlights to delete:', {
      userId,
      verseRef: normalizedVerseRef,
      translation: normalizedTranslation
    });

    // Step 1: Fetch all matching highlight IDs
    const { data: highlights, error: selectError } = await supabase()
      .from('highlights')
      .select('id, verse_ref, translation, start_pos, end_pos, color_hsl')
      .eq('user_id', userId)
      .eq('verse_ref', normalizedVerseRef)
      .eq('translation', normalizedTranslation);

    if (selectError) {
      console.error('🎯 Error fetching highlights for delete:', selectError);
      throw selectError;
    }

    if (!highlights?.length) {
      console.log('🎯 No highlights found to delete for:', { verseRef: normalizedVerseRef, translation: normalizedTranslation });
      return;
    }

    const ids = highlights.map(h => h.id);
    console.log('🎯 Bulletproof delete - Step 2: Deleting highlights by IDs:', { 
      highlightCount: highlights.length,
      ids,
      highlights 
    });

    // Step 2: Delete using IDs (bypasses any RLS or verse_ref ambiguity)
    const { error: deleteError } = await supabase()
      .from('highlights')
      .delete()
      .in('id', ids);

    if (deleteError) {
      console.error('🎯 Delete error:', deleteError);
      throw deleteError;
    } else {
      console.log(`🎯 Successfully deleted ${ids.length} highlight(s) for ${normalizedVerseRef}`);
    }
  }
};

// Bookmarks API
export const bookmarksApi = {
  async getAll(userId: string): Promise<Bookmark[]> {
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase()
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Bookmark[]) || [];
  },

  async create(userId: string, bookmarkData: Omit<InsertBookmark, 'user_id'>): Promise<Bookmark> {
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase()
      .from('bookmarks')
      .insert({ ...bookmarkData, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data as Bookmark;
  },

  async update(userId: string, name: string, bookmarkData: Partial<Pick<Bookmark, 'verse_ref' | 'color' | 'index_value'>>): Promise<Bookmark> {
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase()
      .from('bookmarks')
      .update(bookmarkData)
      .eq('name', name)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Bookmark;
  },

  async delete(userId: string, name: string): Promise<void> {
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase()
      .from('bookmarks')
      .delete()
      .eq('name', name)
      .eq('user_id', userId);

    if (error) throw error;
  }
};

// User Preferences API
export const preferencesApi = {
  async get(userId: string): Promise<UserPreferences | null> {
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase()
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data as UserPreferences | null;
  },

  async upsert(userId: string, preferencesData: Omit<InsertUserPreferences, 'userId'>): Promise<UserPreferences> {
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase()
      .from('user_preferences')
      .upsert({ ...preferencesData, userId: userId, updatedAt: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    return data as UserPreferences;
  }
};