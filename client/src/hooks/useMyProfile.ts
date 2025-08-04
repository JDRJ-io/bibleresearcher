import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

console.log('HOOK FILE LOADED'); // Fast test to verify this file is being imported

export function useMyProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      /* 1️⃣ who is signed in? */
      const { data: { user }, error: uErr } = await supabase.auth.getUser();
      console.log('USER ↩️', user, uErr);

      if (!user) {             // not logged-in tab
        setLoading(false);
        return;
      }

      /* 2️⃣ fetch the profile row */
      const { data, error } = await supabase
        .from('profiles')
        .select('name, bio, tier')
        .eq('id', user.id)
        .single();

      console.log('PROFILE ↩️', data, error);

      if (error) setError(error);
      else       setProfile(data);

      /* 3️⃣ always drop the spinner */
      setLoading(false);
    })();
  }, []);



  return { 
    profile, 
    profileLoading, 
    error, 
    save: async (u: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('no user');
      await supabase.from('profiles').update(u).eq('id', user.id);
      setProfile({ ...profile, ...u });
    }
  };
}