-- Add username availability check function
-- This function checks if a username is available (not taken)

CREATE OR REPLACE FUNCTION username_available(u text) 
RETURNS boolean AS $$
BEGIN
  -- Check if username is valid format
  IF u IS NULL OR length(u) < 3 OR length(u) > 24 OR u !~ '^[A-Za-z0-9_]+$' THEN
    RETURN false;
  END IF;
  
  -- Check if username exists in profiles table
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles WHERE username = u
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION username_available(text) TO authenticated;

-- Add username column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Update the trigger to set username from user_metadata on signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'username',
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();