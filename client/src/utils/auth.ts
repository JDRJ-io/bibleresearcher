import { supabase } from '@/lib/supabaseClient';

export async function sendMagicLink(email: string) {
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : 'https://b5a59dfe-123c-4bf8-be2f-a0f11519d56d-00-17yiegmsu8rtl.riker.replit.dev/auth/callback';

  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo }
  });
}