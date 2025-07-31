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

// Helper to get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Notes API
export const notesApi = {
  async getAll(): Promise<UserNote[]> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(noteData: Omit<InsertUserNote, 'userId'>): Promise<UserNote> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_notes')
      .insert({ ...noteData, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: number, noteData: Partial<Omit<InsertUserNote, 'userId'>>): Promise<UserNote> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_notes')
      .update({ ...noteData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: number): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_notes')
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
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(highlightData: Omit<InsertHighlight, 'userId'>): Promise<Highlight> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('highlights')
      .insert({ ...highlightData, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
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
    return data || [];
  },

  async create(bookmarkData: Omit<InsertBookmark, 'userId'>): Promise<Bookmark> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ ...bookmarkData, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: number, bookmarkData: Partial<Pick<Bookmark, 'name' | 'color'>>): Promise<Bookmark> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('bookmarks')
      .update(bookmarkData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: number): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
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
    return data;
  },

  async upsert(preferencesData: Omit<InsertUserPreferences, 'userId'>): Promise<UserPreferences> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({ ...preferencesData, user_id: userId, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};