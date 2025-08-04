import { useEffect, useState } from 'react';
import { supabase }            from '@/lib/supabaseClient';
import { useAuth }             from '@/contexts/AuthContext';

console.log('HOOK FILE LOADED');

/* ---------- types ---------- */
export interface ProfileData {
  name: string | null;
  bio:  string | null;
  tier: 'free' | 'premium' | 'lifetime';
}

/* ---------- hook ----------- */
export function useMyProfile() {
  const { user, loading: authLoading } = useAuth();    // ← use existing user
  const [profile, setProfile]         = useState<ProfileData | null>(null);
  const [profileLoading, setLoading]  = useState(true);
  const [error, setError]             = useState<Error | null>(null);

  useEffect(() => {
    if (authLoading) return;          // wait until AuthContext is ready
    console.log('EFFECT TRIGGERED');

    /* not signed-in tab */
    if (!user) { setLoading(false); return; }

    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, bio, tier')
        .eq('id', user.id)
        .single<ProfileData>();

      console.log('PROFILE ↩️', data, error);

      if (error) setError(error);
      else       setProfile(data);

      setLoading(false);
    })();
  }, [authLoading, user]);            // re-run if session changes

  /* save helper */
  const save = async (update: Partial<ProfileData>) => {
    if (!user) throw new Error('no user');
    const { error } = await supabase
      .from('profiles')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) throw error;
    setProfile(prev => prev ? { ...prev, ...update } : prev);
  };

  return { profile, profileLoading, error, save };
}
