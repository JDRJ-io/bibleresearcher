import { useEffect, useState } from "react";
import { User } from '@supabase/supabase-js';
import { supabase } from "@/lib/supabaseClient";
import { withTimeout } from "@/lib/withTimeout";

console.log("HOOK FILE LOADED");

/* ------------ types ------------- */
export interface ProfileData {
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  tier: "free" | "premium" | "lifetime";
  role: "user" | "mod" | "admin" | "staff";
  subscription_status: string | null;
  stripe_customer_id: string | null;
}

/* ------------ hook -------------- */
export function useMyProfile(user: User | null, authLoading: boolean) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (authLoading) return; // wait until AuthContext ready
    console.log("EFFECT TRIGGERED", { hasUser: !!user });

    /* not signed-in tab */
    if (!user) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Create AbortController for request cancellation
    const abortController = new AbortController();
    let isStale = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Create the profile fetch promise with 1.5s timeout
        const fetchPromise = (async () => {
          return await supabase()
            .from("profiles")
            .select("display_name, bio, avatar_url, tier, role, subscription_status, stripe_customer_id")
            .eq("id", user.id)
            .single();
        })();

        // Use withTimeout helper (1.5s timeout)
        const result = await withTimeout(fetchPromise, 1500);
        
        // Handle timeout
        if (!result) {
          console.warn("⏱️ Profile fetch timed out, using guest defaults");
          setProfile({
            name: null,
            bio: null,
            avatarUrl: null,
            tier: "free",
            role: "user",
            subscription_status: null,
            stripe_customer_id: null
          });
          setLoading(false);
          return;
        }
        
        const { data, error } = result as any;

        // Check if request was cancelled
        if (abortController.signal.aborted || isStale) {
          return;
        }
        
        if (error) {
          if (error.code === 'PGRST116') {
            // No rows found - create default profile
            console.log("📝 No profile found, using defaults");
            setProfile({
              name: null,
              bio: null,
              avatarUrl: null,
              tier: "free",
              role: "user",
              subscription_status: null,
              stripe_customer_id: null
            });
          } else {
            setError(error);
          }
        } else {
          setProfile({
            name: data?.display_name,
            bio: data?.bio,
            avatarUrl: data?.avatar_url,
            tier: data?.tier || "free",
            role: data?.role || "user", 
            subscription_status: data?.subscription_status,
            stripe_customer_id: data?.stripe_customer_id
          });
        }
      } catch (err) {
        if (abortController.signal.aborted || isStale) {
          console.log("🚫 Profile fetch cancelled");
          return;
        }
        
        console.error("🔥 useMyProfile threw", err);
        setError(err as Error);
        
        // Fallback profile on error
        setProfile({
          name: null,
          bio: null,
          avatarUrl: null,
          tier: "free",
          role: "user",
          subscription_status: null,
          stripe_customer_id: null
        });
      } finally {
        if (!isStale) {
          setLoading(false);
        }
      }
    })();

    // Cleanup function
    return () => {
      isStale = true;
      abortController.abort();
    };
  }, [authLoading, user]); // re-run if session changes

  /* helper to save edits */
  const save = async (update: { name?: string; bio?: string; avatarUrl?: string }) => {
    if (!user) throw new Error("no user");
    
    // Only update safe profile fields
    const safeUpdate: any = {};
    if (update.name !== undefined) safeUpdate.display_name = update.name;
    if (update.bio !== undefined) safeUpdate.bio = update.bio;
    if (update.avatarUrl !== undefined) safeUpdate.avatar_url = update.avatarUrl;
    safeUpdate.updated_at = new Date().toISOString();
    
    const { error } = await supabase()
      .from("profiles")
      .update(safeUpdate)
      .eq("id", user.id);
    if (error) throw error;
    setProfile((prev) => (prev ? { ...prev, ...update } : prev));
  };


  /* helper to manage billing */
  const manageBilling = async () => {
    if (!user) return { ok: false, msg: "No user logged in" };
    
    try {
      const { billing } = await import("@/lib/billing");
      await billing.openPortal();
      return { ok: true, msg: "Redirecting to billing portal..." };
    } catch (error) {
      console.error('Billing portal error:', error);
      return { ok: false, msg: error instanceof Error ? error.message : "Failed to open billing portal" };
    }
  };

  /* helper to update avatar */
  const updateAvatar = async (newAvatarUrl: string) => {
    await save({ avatarUrl: newAvatarUrl });
  };

  return { profile, profileLoading, error, save, updateAvatar, manageBilling };
}
