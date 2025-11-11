-- Hyperlink Click Tracking
-- Tracks detailed context for all types of hyperlink navigation
-- including cross-references, prophecies, search results, Strong's clicks, etc.

-- Create the hyperlink_clicks table
CREATE TABLE IF NOT EXISTS public.hyperlink_clicks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  click_type TEXT NOT NULL, -- 'cross_ref', 'prophecy', 'search', 'strongs', 'verse_jump', 'back', 'forward'
  from_ref TEXT, -- Source verse reference
  to_ref TEXT, -- Target verse reference
  source_panel TEXT, -- Which panel/column the click came from
  translation TEXT, -- Active translation at time of click
  meta JSONB DEFAULT '{}'::jsonb, -- Additional metadata (prophecyId, searchTerm, strongsKey, scrollDistance, etc.)
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast user queries
CREATE INDEX IF NOT EXISTS idx_hyperlink_clicks_user_clicked 
  ON public.hyperlink_clicks(user_id, clicked_at DESC);

-- Enable Row Level Security
ALTER TABLE public.hyperlink_clicks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only access their own clicks
CREATE POLICY "Users can access their own hyperlink clicks" 
  ON public.hyperlink_clicks
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RPC Function: Push a hyperlink click and auto-cleanup old entries
CREATE OR REPLACE FUNCTION public.fn_push_hyperlink_click(
  p_click_type TEXT,
  p_from_ref TEXT DEFAULT NULL,
  p_to_ref TEXT DEFAULT NULL,
  p_source_panel TEXT DEFAULT NULL,
  p_translation TEXT DEFAULT NULL,
  p_meta JSONB DEFAULT '{}'::jsonb,
  p_keep_n INT DEFAULT 50
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  -- If called without a logged-in user, do nothing
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  -- Insert the new click
  INSERT INTO public.hyperlink_clicks (
    user_id, 
    click_type, 
    from_ref, 
    to_ref, 
    source_panel, 
    translation, 
    meta
  )
  VALUES (
    v_uid, 
    p_click_type, 
    p_from_ref, 
    p_to_ref, 
    p_source_panel, 
    p_translation, 
    p_meta
  );

  -- Clean up old entries (keep only p_keep_n newest)
  WITH keep AS (
    SELECT id 
    FROM public.hyperlink_clicks
    WHERE user_id = v_uid
    ORDER BY clicked_at DESC
    LIMIT p_keep_n
  )
  DELETE FROM public.hyperlink_clicks h
  WHERE h.user_id = v_uid
    AND NOT EXISTS (SELECT 1 FROM keep k WHERE k.id = h.id);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.fn_push_hyperlink_click(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, INT) TO authenticated;

-- RPC Function: Get recent hyperlink clicks
CREATE OR REPLACE FUNCTION public.fn_get_recent_clicks(p_limit INT DEFAULT 50)
RETURNS TABLE (
  id INT,
  click_type TEXT,
  from_ref TEXT,
  to_ref TEXT,
  source_panel TEXT,
  translation TEXT,
  meta JSONB,
  clicked_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  -- If called without a logged-in user, return empty
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  -- Return recent clicks for this user
  RETURN QUERY
  SELECT 
    h.id,
    h.click_type,
    h.from_ref,
    h.to_ref,
    h.source_panel,
    h.translation,
    h.meta,
    h.clicked_at
  FROM public.hyperlink_clicks h
  WHERE h.user_id = v_uid
  ORDER BY h.clicked_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.fn_get_recent_clicks(INT) TO authenticated;
