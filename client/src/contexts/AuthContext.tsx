// contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useMyProfile } from "@/hooks/useMyProfile";
import type { Session, User } from "@supabase/supabase-js";
import { initializeRealtimeForUser, stopRealtimeSubscriptions } from "@/stores/highlightsRealtime";
import { bootstrapHighlights } from "@/stores/highlightsBootstrap";
import { bootstrapBookmarks, startBookmarkSyncProcessor } from "@/stores/bookmarksBootstrap";
import { logger } from "@/lib/logger";
import { loadSessionState, restoreSessionState } from '@/lib/sessionRestore';
import { navigationHistory } from '@/lib/navigationHistory';
import { hydrateFromServer } from '@/lib/navState';
import { useToast } from '@/hooks/use-toast';
import { mergeGuestSession, loadGuestSession, enableSessionSaves } from '@/hooks/useSessionState';

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  profile: ReturnType<typeof useMyProfile>["profile"];
  saveProfile: ReturnType<typeof useMyProfile>["save"];
  updateAvatar: ReturnType<typeof useMyProfile>["updateAvatar"];
  manageBilling: ReturnType<typeof useMyProfile>["manageBilling"];
  signOut: () => Promise<void>;
}
export const AuthContext = createContext<AuthCtx | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Silenced render noise
  
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  
  // Refs at component level (hook rules)
  const userDataInitializedRef = useRef(false);
  const initializingPromise = useRef<Promise<void> | null>(null);
  const bootedRef = useRef(false); // Track boot completion at component level
  const userRef = useRef<User | null>(null); // Track live user value

  /* 🚀 Initialize user data systems once when user is authenticated */
  const initializeUserData = async (userId: string): Promise<void> => {
    // If already initialized, skip
    if (userDataInitializedRef.current) {
      logger.debug('AUTH', 'user-data-skip', { reason: 'already_initialized' });
      return;
    }
    
    // If currently initializing, wait for the in-flight promise
    if (initializingPromise.current) {
      logger.debug('AUTH', 'user-data-wait', { reason: 'initialization_in_flight' });
      return initializingPromise.current;
    }
    
    logger.debug('AUTH', 'user-data-init-start', { userId });
    
    // Create and store the initialization promise
    initializingPromise.current = (async () => {
      try {
        // Start both highlights and bookmarks bootstrap in parallel (no timeout - let them complete)
        await Promise.all([
          bootstrapHighlights(userId),
          bootstrapBookmarks(userId),
        ]);
        
        logger.info('BOOKMARKS', 'ready');
        logger.info('HIGHLIGHTS', 'ready');
        
        // Start background sync processors
        initializeRealtimeForUser(userId); // Highlights realtime sync
        startBookmarkSyncProcessor(); // Bookmarks background sync
        
        userDataInitializedRef.current = true;
        logger.info('AUTH', 'user-data-ready');
        
        // Only enable session saves after successful bootstrap
        enableSessionSaves();
        logger.debug('AUTH', 'session-saves-enabled-after-bootstrap');
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('AUTH', 'user-data-error', { error: errorMessage });
        
        // Still start background systems to avoid blocking the app
        initializeRealtimeForUser(userId);
        startBookmarkSyncProcessor();
        userDataInitializedRef.current = true;
        
        // Enable saves even on error to avoid blocking the app
        enableSessionSaves();
        logger.debug('AUTH', 'session-saves-enabled-after-error');
      } finally {
        initializingPromise.current = null; // Clear the promise
      }
    })();
    
    return initializingPromise.current;
  };

  /* Sync userRef with user state */
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  /* 1️⃣  Truth-first boot: Read session ONCE, then attach listener */
  useEffect(() => {
    logger.debug('AUTH', 'init-start');
    
    let unsub: { data: { subscription: { unsubscribe(): void } } } | null = null;
    const sb = supabase();

    (async () => {
      // ===== STEP 1: Single authoritative session read (BEFORE listening to events) =====
      logger.debug('AUTH', 'session-get-authoritative');
      const { data: sessData, error } = await sb.auth.getSession();
      const session = error ? null : sessData.session ?? null;
      
      // Update user state ONCE with authoritative session
      setSession(session);
      setUser(session?.user ?? null);
      userRef.current = session?.user ?? null; // Sync ref immediately
      
      logger.debug('AUTH', 'session-retrieved', { hasSession: !!session, userId: session?.user?.id });
      
      // ===== STEP 2: TWO-PHASE BOOT - Set ready IMMEDIATELY, then bootstrap in background =====
      setAuthReady(true);
      bootedRef.current = true;
      logger.info('AUTH', 'auth-ready', { userId: session?.user?.id });
      logger.info('AUTH', 'boot-complete');
      
      if (session?.user) {
        // Check if we're coming from email magic link
        const urlParams = new URLSearchParams(window.location.search);
        const fromEmail = urlParams.get('fromEmail');
        
        if (fromEmail === 'yes') {
          logger.info('AUTH', 'magic-link-success');
          
          // Clean up URL parameters
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
          
          // Show success toast after a brief delay
          setTimeout(() => {
            const event = new CustomEvent('magic-link-success');
            window.dispatchEvent(event);
          }, 500);
        }
        
        // 🚀 ALL BOOTSTRAP IN BACKGROUND (non-blocking two-phase pattern)
        (async () => {
          try {
            // Load session state (toggles/preferences) from user_sessions
            const sessionState = await loadSessionState(session.user.id);
            if (sessionState && sessionState.last_toggles) {
              // Restore all toggles/preferences
              restoreSessionState(sessionState);
              logger.info('AUTH', 'session-toggles-restored');
            }
            
            // Load actual last verse position from user_last_location
            await hydrateFromServer(
              session.user.id, // Pass userId as first parameter
              (verse: string, tr: string) => {
                // Dispatch custom event for Bible page to handle navigation
                window.dispatchEvent(new CustomEvent('restore-verse-position', {
                  detail: { verseKey: verse, translation: tr }
                }));
                logger.info('AUTH', 'verse-position-restored', { verse, translation: tr });
              },
              undefined // No recent history callback for now
            );
            
            // Initialize navigation history with userId (no boot-time getUser() spam)
            await navigationHistory.initialize(session.user.id);
            logger.info('AUTH', 'navigation-history-initialized', { userId: session.user.id });
            
            // Initialize user data systems (bookmarks, highlights)
            await initializeUserData(session.user.id);
          } catch (error) {
            logger.error('AUTH', 'background-bootstrap-failed', { error });
          }
        })();
      } else {
        // Guest mode - also bootstrap in background
        (async () => {
          logger.debug('AUTH', 'loading-guest-data');
          try {
            await bootstrapBookmarks('guest');
            
            const guestSession = loadGuestSession();
            if (guestSession && guestSession.last_verse_key) {
              restoreSessionState(guestSession);
              window.dispatchEvent(new CustomEvent('restore-verse-position', {
                detail: { verseKey: guestSession.last_verse_key }
              }));
            }
            
            // Enable session saves for guests
            enableSessionSaves();
            logger.info('AUTH', 'guest-data-ready');
          } catch (error) {
            logger.error('AUTH', 'guest-data-error', { error });
            // Enable saves even on error
            enableSessionSaves();
          }
        })();
      }
      
      // ===== STEP 3: NOW attach listener (after boot is complete) =====
      unsub = sb.auth.onAuthStateChange(async (event, newSession) => {
        // Ignore all events until boot is complete
        if (!bootedRef.current) {
          logger.debug('AUTH', 'ignoring-pre-boot-event', { event });
          return;
        }
        
        const prevUser = userRef.current; // Use ref for accurate previous value
        logger.debug('AUTH', 'state-change', { event, userId: newSession?.user?.id, timestamp: new Date().toISOString() });
        
        // Update user state for all events
        setSession(newSession);
        setUser(newSession?.user ?? null);
        userRef.current = newSession?.user ?? null; // Sync ref
        
        // Handle subsequent sign-in (when user changes from null to a user)
        if (event === 'SIGNED_IN' && newSession?.user && !prevUser) {
          // Merge guest session to database before initializing user data
          try {
            await mergeGuestSession();
            logger.info('AUTH', 'guest-merge-complete');
            
            // Restore verse position after merging guest session
            try {
              // Load session state (toggles/preferences) from user_sessions
              const sessionState = await loadSessionState(newSession.user.id);
              if (sessionState && sessionState.last_toggles) {
                // Restore all toggles/preferences
                restoreSessionState(sessionState);
                logger.info('AUTH', 'session-toggles-restored-after-login');
              }
              
              // Load actual last verse position from user_last_location
              await hydrateFromServer(
                newSession.user.id, // Pass userId as first parameter
                (verse: string, tr: string) => {
                  // Dispatch custom event for Bible page to handle navigation
                  window.dispatchEvent(new CustomEvent('restore-verse-position', {
                    detail: { verseKey: verse, translation: tr }
                  }));
                  logger.info('AUTH', 'verse-position-restored-after-login', { verse, translation: tr });
                },
                undefined // No recent history callback for now
              );
            } catch (error) {
              logger.error('AUTH', 'post-login-restore-failed', { error });
            }
            
            // Initialize navigation history with userId
            try {
              await navigationHistory.initialize(newSession.user.id);
              logger.info('AUTH', 'navigation-history-initialized-after-login', { userId: newSession.user.id });
            } catch (error) {
              logger.error('AUTH', 'navigation-history-init-failed-after-login', { error });
            }
          } catch (error) {
            logger.error('AUTH', 'guest-merge-error', { error });
          }
          
          // Await in-flight initialization if it's happening, otherwise start new one
          await initializeUserData(newSession.user.id);
        }
        
        // Load guest bookmarks on sign-out (when user changes from a user to null)
        if (event === 'SIGNED_OUT' && !newSession?.user) {
          logger.debug('AUTH', 'loading-guest-data-after-signout');
          try {
            await bootstrapBookmarks('guest'); // This will load guest bookmarks
            stopRealtimeSubscriptions(); // Stop realtime subscriptions on sign out
            userDataInitializedRef.current = false; // Reset initialization flag
            logger.info('AUTH', 'guest-data-ready-after-signout');
          } catch (error) {
            logger.error('AUTH', 'guest-data-error-after-signout', { error });
          }
          
          // Reset user data
          userDataInitializedRef.current = false;
          initializingPromise.current = null; // Clear any in-flight initialization
          stopRealtimeSubscriptions(); // Clean up realtime channels
          console.log('🔄 USER DATA: Reset on sign out');
        }
        
        // Share auth cookie with *.anointed.io domain for forum integration
        if (newSession?.access_token) {
          try {
            // Create a manual cookie for cross-domain sharing
            document.cookie = `supabase-auth-token=${newSession.access_token}; domain=.anointed.io; path=/; sameSite=lax; secure`;
            logger.debug('AUTH', 'cookie-shared');
          } catch (error) {
            logger.warn('AUTH', 'cookie-share-failed', { error });
          }
        }
      });
    })();
    
    return () => {
      unsub?.data.subscription.unsubscribe();
      stopRealtimeSubscriptions(); // Clean up on unmount
    };
  }, []); // Empty dependency array - this should only run once on mount

  /* 2️⃣  load profile only after auth is ready */
  const { profile, profileLoading, save, updateAvatar, manageBilling } = useMyProfile(
    authReady ? user : null,
    !authReady,
  );

  const loading = !authReady;

  async function signOut() {
    await supabase().auth.signOut();
    setSession(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        profileLoading,
        profile,
        saveProfile: save,
        updateAvatar,
        manageBilling,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
