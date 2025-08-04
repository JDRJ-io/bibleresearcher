import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // const [profile, setProfile] = useState<{ name?: string; bio?: string; tier?: string } | null>(null); // 🔥 commented out - using useMyProfile instead
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  // 🔥 refreshProfile commented out - using useMyProfile instead
  // const refreshProfile = async () => {
  //   if (!user) {
  //     setProfile(null);
  //     return;
  //   }

  //   try {
  //     // Fetch profile directly from Supabase
  //     const { data: profileData, error } = await supabase
  //       .from('profiles')
  //       .select('*')
  //       .eq('id', user.id)
  //       .single();

  //     if (error && error.code !== 'PGRST116') { // Ignore "not found" errors
  //       console.error('Profile fetch error:', error);
  //       return;
  //     }

  //     setProfile(profileData || { tier: 'free' });
  //   } catch (error) {
  //     console.error('Failed to fetch profile:', error);
  //   }
  // };

  // 🔥 updateProfile commented out - using useMyProfile instead
  // const updateProfile = async (data: { name: string; bio: string }) => {
  //   if (!user) throw new Error('No authenticated user');

  //   try {
  //     // Update profile directly with Supabase
  //     const { data: updatedProfile, error } = await supabase
  //       .from('profiles')
  //       .update({
  //         name: data.name,
  //         bio: data.bio,
  //         updated_at: new Date().toISOString()
  //       })
  //       .eq('id', user.id)
  //       .select()
  //       .single();

  //     if (error) throw error;

  //     setProfile(updatedProfile);
  //     return updatedProfile;
  //   } catch (error) {
  //     console.error('Profile update error:', error);
  //     throw new Error('Failed to update profile');
  //   }
  // };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Persist for hard refresh **inside Supabase**
        if (session) {
          await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // 🔥 Load profile when user changes - commented out, using useMyProfile instead
  // useEffect(() => {
  //   if (user) {
  //     refreshProfile();
  //   } else {
  //     setProfile(null);
  //   }
  // }, [user, refreshProfile]);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};