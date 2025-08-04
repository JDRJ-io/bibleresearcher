import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

console.log('HOOK FILE LOADED');               // proves this file is imported

/* ---------- types ---------------------------------------------------- */
export interface ProfileData {
  name: string | null;
  bio:  string | null;
  tier: 'free' | 'premium' | 'lifetime';
}

/* ---------- hook ----------------------------------------------------- */
export function useMyProfile() {
  const [profile,         setProfile] = useState<ProfileData | null>(null);
  const [profileLoading,  setLoading] = useState(true);
  const [error,           setError]   = useState<Error | null>(null);

  /* fetch once on mount */
  useEffect(() => {
    console.log('EFFECT TRIGGERED');          // 🆕 1
    (async () => {
      console.log('EFFECT TRIGGERED');          // 🆕 1
      try {
        /* 1️⃣ who is signed-in? */
        const { data: { user }, error: uErr } = await supabase.auth.getUser();
        console.log('USER ↩️', user, uErr);

        if (!user) {                     // not logged-in tab
          setLoading(false);
          return;
        }

        /* 2️⃣ fetch the profile row */
        const { data, error } = await supabase
          .from('profiles')
          .select('name, bio, tier')
          .eq('id', user.id)
          .single<ProfileData>();

        console.log('PROFILE ↩️', data, error);

        if (error) setError(error);
        else       setProfile(data);
      }
      catch (err) {
        console.error('🔥 useMyProfile threw', err);  // 🆕 2
        setError(err as Error);
      }
      /* 3️⃣ always drop spinner */
      setLoading(false);
    })();                               // 🟢 invoke the async IIFE
  }, []);

  /* save helper ------------------------------------------------------- */
  const save = async (update: Partial<ProfileData>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('no user');

    const { error } = await supabase
      .from('profiles')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) throw error;
    setProfile(prev => prev ? { ...prev, ...update } : prev);
  };

  return { profile, profileLoading, error, save };
}          // ← closes the function
/* end of file                                                          */
