-- Create save_session_state RPC function
CREATE OR REPLACE FUNCTION save_session_state(
  p_last_verse_key TEXT,
  p_last_toggles JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Upsert into user_sessions table
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
    last_active = EXCLUDED.last_active;
END;
$$;
