import { supabase } from '@/lib/supabaseClient';

export async function sendMagicLink(email: string) {
  const redirect = `${window.location.origin}/auth/callback`;

  const result = await supabase().auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirect,
    },
  });
  
  return result;
}