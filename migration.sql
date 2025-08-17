-- Single SQL migration to fix the database schema
-- Run this once in Supabase SQL editor

-- 1) Drop existing tables to start clean
DROP TABLE IF EXISTS navigation_history CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_highlights CASCADE;
DROP TABLE IF EXISTS user_bookmarks CASCADE;
DROP TABLE IF EXISTS user_notes CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2) Create core tables with proper schema
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_bookmarks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  translation TEXT NOT NULL,
  verse_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, translation, verse_key)
);

CREATE TABLE IF NOT EXISTS user_notes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  translation TEXT NOT NULL,
  verse_key TEXT NOT NULL,
  note_text TEXT NOT NULL,
  server_rev INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, translation, verse_key)
);

CREATE TABLE IF NOT EXISTS user_highlights (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  translation TEXT NOT NULL,
  verse_key TEXT NOT NULL,
  segments JSONB NOT NULL,
  text_len INTEGER,
  server_rev INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, translation, verse_key)
);

CREATE TABLE IF NOT EXISTS navigation_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  verse_reference TEXT NOT NULL,
  translation TEXT NOT NULL,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  last_verse_position TEXT,
  current_translation TEXT DEFAULT 'KJV',
  layout_preferences TEXT DEFAULT '{}',
  scroll_position INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  session_data TEXT DEFAULT '{}'
);

-- 3) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_highlights_user_id ON user_highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_navigation_history_user_visited ON navigation_history(user_id, visited_at DESC);

-- 4) Enable Row Level Security
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 5) Create RLS policies
CREATE POLICY "Users can access their own bookmarks" ON user_bookmarks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own notes" ON user_notes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own highlights" ON user_highlights
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own history" ON navigation_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own sessions" ON user_sessions
  FOR ALL USING (auth.uid() = user_id);