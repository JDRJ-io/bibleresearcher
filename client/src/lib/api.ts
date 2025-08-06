import { supabase } from './supabaseClient';
import type { 
  Note, 
  InsertNote, 
  Highlight, 
  InsertHighlight, 
  Bookmark, 
  InsertBookmark,
  UserPreferences,
  InsertUserPreferences
} from '@shared/schema';

// Helper to get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Notes API
export const notesApi = {
  async getAll(): Promise<Note[]> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: false });

    if (error) throw error;
    return (data as Note[]) || [];
  },

  async create(noteData: Omit<InsertNote, 'user_id'>): Promise<Note> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('notes')
      .insert({ ...noteData, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data as Note;
  },

  async update(id: number, noteData: Partial<Omit<InsertNote, 'user_id'>>): Promise<Note> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('notes')
      .update({ ...noteData })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Note;
  },

  async delete(id: number): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }
};

// Highlights API
export const highlightsApi = {
  async getAll(): Promise<Highlight[]> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: false });

    if (error) throw error;
    return (data as Highlight[]) || [];
  },

  async create(highlightData: Omit<InsertHighlight, 'user_id'>): Promise<Highlight> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
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

  async delete(id: number): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // New function to delete all highlights for a specific verse, user, and translation
  async deleteAllForVerse(verseRef: string, translation: string): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('user_id', userId)
      .eq('verse_ref', verseRef)
      .eq('translation', translation);

    if (error) throw error;
  }
};

// Bookmarks API
export const bookmarksApi = {
  async getAll(): Promise<Bookmark[]> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Bookmark[]) || [];
  },

  async create(bookmarkData: Omit<InsertBookmark, 'user_id'>): Promise<Bookmark> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ ...bookmarkData, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data as Bookmark;
  },

  async update(name: string, bookmarkData: Partial<Pick<Bookmark, 'verse_ref' | 'color' | 'index_value'>>): Promise<Bookmark> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('bookmarks')
      .update(bookmarkData)
      .eq('name', name)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Bookmark;
  },

  async delete(name: string): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('name', name)
      .eq('user_id', userId);

    if (error) throw error;
  }
};

// User Preferences API
export const preferencesApi = {
  async get(): Promise<UserPreferences | null> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data as UserPreferences | null;
  },

  async upsert(preferencesData: Omit<InsertUserPreferences, 'userId'>): Promise<UserPreferences> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({ ...preferencesData, userId: userId, updatedAt: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    return data as UserPreferences;
  }
};