// contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useMyProfile } from "@/hooks/useMyProfile";
import type { Session, User } from "@supabase/supabase-js";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: ReturnType<typeof useMyProfile>["profile"];
  saveProfile: ReturnType<typeof useMyProfile>["save"];
  upgradeToPremium: ReturnType<typeof useMyProfile>["upgradeToPremium"];
  signOut: () => Promise<void>;
}
export const AuthContext = createContext<AuthCtx>(null as never);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  /* ---------- session & user ---------- */
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  /* ---------- auth phase flag ---------- */
  const [authReady, setAuthReady] = useState(false);

  /* 1️⃣  get any existing session once */
  useEffect(() => {
    const initializeAuth = async () => {
      // Check if we're coming from email magic link
      const urlParams = new URLSearchParams(window.location.search);
      const fromEmail = urlParams.get('fromEmail');
      
      // Get existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if we're coming from email magic link and have a session
      if (fromEmail === 'yes' && session) {
        console.log('✅ Magic link authentication successful');
        
        // Clean up URL parameters
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        
        // Show success toast after a brief delay
        setTimeout(() => {
          const event = new CustomEvent('magic-link-success');
          window.dispatchEvent(event);
        }, 500);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setAuthReady(true); // 🔑 flip when done
    };
    
    initializeAuth();

    /*  keep in sync on token refresh / sign-in / sign-out  */
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_evt, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Share auth cookie with *.anointed.io domain for forum integration
        if (newSession?.access_token) {
          try {
            // Create a manual cookie for cross-domain sharing
            document.cookie = `supabase-auth-token=${newSession.access_token}; domain=.anointed.io; path=/; sameSite=lax; secure`;
            console.log('🔗 Auth cookie shared with *.anointed.io domain');
          } catch (error) {
            console.warn('⚠️ Failed to share auth cookie:', error);
          }
        }
      },
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  /* 2️⃣  load profile only after auth is ready */
  const { profile, profileLoading, save, upgradeToPremium } = useMyProfile(
    authReady ? user : null,
    !authReady,
  );

  /* 3️⃣  single loading flag for the whole app */
  const loading = !authReady || profileLoading;

  /* ---------- sign-out helper ---------- */
  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        profile,
        saveProfile: save,
        upgradeToPremium,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
