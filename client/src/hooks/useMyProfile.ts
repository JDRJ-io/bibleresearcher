import { useEffect, useState } from "react";
import { User } from '@supabase/supabase-js';
import { supabase } from "@/lib/supabaseClient";

console.log("HOOK FILE LOADED");

/* ------------ types ------------- */
export interface ProfileData {
  name: string | null;
  bio: string | null;
  tier: "free" | "premium" | "lifetime";
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
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("name, bio, tier")
          .eq("id", user.id)
          .single<ProfileData>();

        console.log("PROFILE ↩️", data, error);
        if (error) setError(error);
        else setProfile(data);
      } catch (err) {
        console.error("🔥 useMyProfile threw", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user]); // re-run if session changes

  /* helper to save edits */
  const save = async (update: Partial<ProfileData>) => {
    if (!user) throw new Error("no user");
    const { error } = await supabase
      .from("profiles")
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) throw error;
    setProfile((prev) => (prev ? { ...prev, ...update } : prev));
  };

  return { profile, profileLoading, error, save };
}
