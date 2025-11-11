import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { code } = await req.json().catch(() => ({}));
  if (!code) return resp('Missing code', 400);

  /* 1. current user from JWT */
  const { data: { user } } = await supabase.auth.getUser(req);
  if (!user) return resp('Unauthorized', 401);

  /* 2. lookup code */
  const { data: access } = await supabase
    .from('access_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (!access)                     return resp('Invalid code',   400);
  if (access.expires_at && new Date(access.expires_at) < new Date())
                                   return resp('Code expired',   400);
  if (access.used_count >= access.max_uses)
                                   return resp('Code exhausted', 400);

  /* 3. upgrade profile */
  const { error: upErr } = await supabase
    .from('profiles')
    .update({ tier: access.tier })
    .eq('id', user.id);
  if (upErr) return resp(upErr.message, 400);

  /* 4. increment use counter */
  await supabase
    .from('access_codes')
    .update({ used_count: access.used_count + 1 })
    .eq('code', code);

  return resp('ok', 200);

  function resp(msg: string, status = 200) {
    return new Response(JSON.stringify({ message: msg }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});