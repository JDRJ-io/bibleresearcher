import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseBrowser';
import type { User } from '@shared/schema';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser) {
          const mappedUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.name || 'User',
            createdAt: new Date(supabaseUser.created_at || '')
          };
          setUser(mappedUser);
        }
      } catch (error) {
        console.info('Auth check completed, no active session');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data: { user: supabaseUser }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (supabaseUser) {
        const mappedUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || 'User',
          createdAt: new Date(supabaseUser.created_at || '')
        };
        setUser(mappedUser);
        return { user: mappedUser, error: null };
      }
      return { user: null, error: 'Login failed' };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data: { user: supabaseUser }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) throw error;
      if (supabaseUser) {
        const mappedUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: name,
          createdAt: new Date(supabaseUser.created_at || '')
        };
        setUser(mappedUser);
        return { user: mappedUser, error: null };
      }
      return { user: null, error: 'Sign up failed' };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isLoggedIn: !!user,
  };
}
