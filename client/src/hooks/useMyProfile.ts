import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Profile {
  id: string;
  name: string | null;
  bio: string | null;
  tier: string;
  created_at?: string;
  updated_at?: string;
}

export function useMyProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      console.log('USER ↩️', user, userErr);

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('name, bio, tier')
        .eq('id', user.id)
        .single();

      console.log('PROFILE ↩️', data, error);

      if (error) {
        setError(error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    })();
  }, []);

  // Temporarily remove loadProfile function for diagnostic

  async function save(update: { name: string; bio: string }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const { error } = await supabase
        .from('profiles')
        .update({
          name: update.name,
          bio: update.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => prev ? { ...prev, ...update } : null);
      
      return true;
    } catch (err) {
      console.error('Profile save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
      throw err;
    }
  }

  async function refreshProfile() {
    await loadProfile();
  }

  return { 
    profile, 
    loading, 
    error, 
    save, 
    refreshProfile 
  };
}