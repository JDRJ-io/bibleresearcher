/**
 * Database Setup and Migration
 * Creates all required tables and sets up Row Level Security
 */

import { supabase } from './supabaseClient';

export async function setupDatabase() {
  console.log('🔧 Setting up database tables...');
  
  try {
    // Drop existing tables to start fresh
    const dropTables = `
      DROP TABLE IF EXISTS navigation_history CASCADE;
      DROP TABLE IF EXISTS user_sessions CASCADE;
      DROP TABLE IF EXISTS user_highlights CASCADE;
      DROP TABLE IF EXISTS user_bookmarks CASCADE;
      DROP TABLE IF EXISTS notes CASCADE;
      DROP TABLE IF EXISTS user_preferences CASCADE;
      DROP TABLE IF EXISTS profiles CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `;
    
    await supabase.rpc('execute_sql', { sql_query: dropTables });
    
    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    // Create profiles table
    const createProfilesTable = `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES users(id),
        name TEXT,
        bio TEXT,
        tier TEXT DEFAULT 'free',
        recovery_passkey_hash TEXT,
        marketing_opt_in BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    // Create notes table
    const createNotesTable = `
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) NOT NULL,
        verse_ref TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    // Create user_bookmarks table
    const createBookmarksTable = `
      CREATE TABLE IF NOT EXISTS user_bookmarks (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) NOT NULL,
        translation TEXT NOT NULL,
        verse_key TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, translation, verse_key)
      );
    `;
    
    // Create user_highlights table
    const createHighlightsTable = `
      CREATE TABLE IF NOT EXISTS user_highlights (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) NOT NULL,
        translation TEXT NOT NULL,
        verse_key TEXT NOT NULL,
        segments TEXT NOT NULL,
        server_rev INTEGER NOT NULL DEFAULT 1,
        text_len INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, translation, verse_key)
      );
    `;
    
    // Create navigation_history table
    const createNavigationTable = `
      CREATE TABLE IF NOT EXISTS navigation_history (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) NOT NULL,
        verse_reference TEXT NOT NULL,
        translation TEXT NOT NULL,
        visited_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_navigation_history_user_visited 
      ON navigation_history(user_id, visited_at DESC);
    `;
    
    // Create user_sessions table
    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
        last_verse_position TEXT,
        current_translation TEXT DEFAULT 'KJV',
        layout_preferences TEXT,
        scroll_position INTEGER DEFAULT 0,
        last_active TIMESTAMPTZ DEFAULT NOW(),
        session_data TEXT
      );
    `;
    
    // Create user_preferences table
    const createPreferencesTable = `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
        theme TEXT DEFAULT 'light-mode',
        selected_translations TEXT[] DEFAULT ARRAY['KJV'],
        show_notes BOOLEAN DEFAULT false,
        show_prophecy BOOLEAN DEFAULT false,
        show_context BOOLEAN DEFAULT false,
        font_size TEXT DEFAULT 'medium',
        last_verse_position TEXT,
        column_layout TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Execute all table creation queries
    const queries = [
      createUsersTable,
      createProfilesTable,  
      createNotesTable,
      createBookmarksTable,
      createHighlightsTable,
      createNavigationTable,
      createSessionsTable,
      createPreferencesTable
    ];
    
    for (const query of queries) {
      const { error } = await supabase.rpc('execute_sql', { sql_query: query });
      if (error) {
        console.error('❌ Failed to execute query:', query.substring(0, 100), error);
        throw error;
      }
    }
    
    // Set up Row Level Security
    const rlsPolicies = `
      -- Enable RLS on all tables
      ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY; 
      ALTER TABLE user_highlights ENABLE ROW LEVEL SECURITY;
      ALTER TABLE navigation_history ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "Users can access their own data" ON notes;
      DROP POLICY IF EXISTS "Users can access their own bookmarks" ON user_bookmarks;
      DROP POLICY IF EXISTS "Users can access their own highlights" ON user_highlights;
      DROP POLICY IF EXISTS "Users can access their own history" ON navigation_history;
      DROP POLICY IF EXISTS "Users can access their own sessions" ON user_sessions;
      DROP POLICY IF EXISTS "Users can access their own preferences" ON user_preferences;
      DROP POLICY IF EXISTS "Users can access their own profile" ON profiles;
      
      -- Create RLS policies
      CREATE POLICY "Users can access their own data" ON notes
        FOR ALL USING (auth.uid() = user_id);
        
      CREATE POLICY "Users can access their own bookmarks" ON user_bookmarks
        FOR ALL USING (auth.uid() = user_id);
        
      CREATE POLICY "Users can access their own highlights" ON user_highlights
        FOR ALL USING (auth.uid() = user_id);
        
      CREATE POLICY "Users can access their own history" ON navigation_history
        FOR ALL USING (auth.uid() = user_id);
        
      CREATE POLICY "Users can access their own sessions" ON user_sessions
        FOR ALL USING (auth.uid() = user_id);
        
      CREATE POLICY "Users can access their own preferences" ON user_preferences
        FOR ALL USING (auth.uid() = user_id);
        
      CREATE POLICY "Users can access their own profile" ON profiles
        FOR ALL USING (auth.uid() = id);
    `;
    
    const { error: rlsError } = await supabase.rpc('execute_sql', { sql_query: rlsPolicies });
    if (rlsError) {
      console.error('❌ RLS setup failed:', rlsError);
    } else {
      console.log('🔒 Row Level Security configured');
    }
    
    console.log('✅ Database setup completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return false;
  }
}

// Function to create or get user in users table
export async function ensureUserExists() {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    // Check if user exists in our users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', authUser.email!)
      .single();

    if (!existingUser) {
      // Create user record
      const { error } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.full_name || authUser.email!.split('@')[0]
        });
        
      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error;
      }
      
      console.log('👤 User record created:', authUser.email);
    }
    
    return authUser;
    
  } catch (error) {
    console.error('❌ Failed to ensure user exists:', error);
    return null;
  }
}