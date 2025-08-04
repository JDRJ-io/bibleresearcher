import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

console.log('HOOK FILE LOADED'); // Fast test to verify this file is being imported

export function useMyProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user }, error: uErr } = await supabase.auth.getUser();
      console.log('USER ↩️', user, uErr);          // ★ must print

      if (!user) {                     // not logged-in tab
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('name, bio, tier')
        .eq('id', user.id)
        .single();

      console.log('PROFILE ↩️', data, error);      // ★ must print

      if (error) setError(error);
      else       setProfile(data);

      setLoading(false);               // always flip the flag
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