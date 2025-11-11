-- Drop and recreate the save_session_state function to match actual table structure
-- Run this in your Supabase SQL Editor

DROP FUNCTION IF EXISTS save_session_state(TEXT, JSONB);

CREATE OR REPLACE FUNCTION save_session_state(
  p_last_verse_key TEXT,
  p_last_toggles JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Upsert into user_sessions table (using actual column names)
  INSERT INTO user_sessions (
    user_id,
    last_verse_position,
    session_data,
    last_active
  )
  VALUES (
    auth.uid(),
    p_last_verse_key,
    p_last_toggles::text,
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_verse_position = EXCLUDED.last_verse_position,
    session_data = EXCLUDED.session_data,
    last_active = NOW();
END;
$$;
