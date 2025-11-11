// client/src/lib/redemption.ts
import { supabase } from '@/lib/supabaseClient';

export type Profile = {
  id: string;
  tier: 'free' | 'premium' | 'staff';
  premium_until: string | null;
  role: 'user' | 'mod' | 'admin';
  // add other safe fields you display if needed
};

export interface RedemptionResult {
  redemption: { ok: boolean; kind?: string; code?: string; error?: string };
  profile: Profile;
}

function normalizeCode(input: string) {
  // Mirror the SQL's case-insensitive behavior: trim and strip spaces
  return input.trim();
}

export async function redeemCode(userId: string, rawCode: string): Promise<RedemptionResult> {
  const code = normalizeCode(rawCode);

  // Must be authenticated
  if (!userId) {
    throw new Error('You need to be signed in to redeem a code.');
  }

  // Call the RPC
  const { data, error } = await supabase().rpc('redeem_coupon', { p_code: code });

  if (error || !data?.ok) {
    // Prefer DB-sent error text if present
    const msg = data?.error ?? error?.message ?? 'Redemption failed';
    throw new Error(msg);
  }

  // Fetch fresh profile (minimal fields)
  const { data: profile, error: profErr } = await supabase()
    .from('profiles')
    .select('id,tier,premium_until,role')
    .eq('id', userId)
    .single();

  if (profErr || !profile) {
    throw new Error('Code redeemed, but failed to refresh your profile.');
  }

  return { redemption: data, profile };
}