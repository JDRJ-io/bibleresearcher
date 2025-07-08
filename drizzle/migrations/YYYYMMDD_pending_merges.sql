-- Create pending_merges table for max retry failures
CREATE TABLE IF NOT EXISTS pending_merges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  item_type TEXT NOT NULL, -- 'bookmark', 'note', 'highlight'
  item_data JSONB NOT NULL,
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  conflict_reason TEXT
);