import { supabase } from './supabaseClient';

// Sign up function that works with confirmations ON or OFF
export async function signUp(email: string, password: string, meta?: Record<string, any>) {
  const { data, error } = await supabase().auth.signUp({
    email,
    password,
    options: { data: meta ?? {} },
  });
  if (error) throw new Error(error.message);
  // If confirmations ON -> data.session === null (email sent).
  // If confirmations OFF -> data.session exists (user is logged in).
  return data;
}

// Sign in function
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase().auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data; // session now stored in browser
}

// Sign out function
export async function signOut() {
  const { error } = await supabase().auth.signOut();
  if (error) throw new Error(error.message);
}

// Listen for auth changes
export function onAuthStateChange(callback: (evt: string, session: any) => void) {
  return supabase().auth.onAuthStateChange(callback);
}