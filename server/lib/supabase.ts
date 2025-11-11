import { createClient } from '@supabase/supabase-js';

export const supabaseClient = createClient(
  process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      flowType: 'pkce', // good default for SPA
    },
  }
);

export const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);