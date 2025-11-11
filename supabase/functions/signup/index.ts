// supabase/functions/signup/index.ts
import { createClient } from '../_shared/deps.ts'
import { withCORS, json } from '../_shared/cors.ts'

const PROJECT_URL = Deno.env.get('PROJECT_URL')!
const SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!
const DEBUG = Deno.env.get('DEBUG_SIGNUP') === 'true'

function isStrongPassword(pw: string) {
  return !!pw && pw.length >= 10 &&
    /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)
}
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const userRe  = /^[a-z0-9_]{3,30}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return withCORS(new Response(null, { status: 204 }))
  if (req.method !== 'POST')   return json({ ok:false, error:'method-not-allowed' }, 405)

  const { email, password, username, display_name, marketing_opt_in } =
    await req.json().catch(() => ({} as any))

  const emailN = String(email ?? '').trim().toLowerCase()
  if (!emailRe.test(emailN))                 return json({ ok:false, error:'invalid-email' }, 400)
  if (!isStrongPassword(String(password)))   return json({ ok:false, error:'weak-password' }, 400)
  if (!userRe.test(String(username)))        return json({ ok:false, error:'invalid-username' }, 400)
  if (!display_name || String(display_name).length > 60)
                                            return json({ ok:false, error:'invalid-display-name' }, 400)

  const admin = createClient(PROJECT_URL, SERVICE_KEY)

  // Precheck username (DB unique index is still the authority)
  const { count, error: preErr } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .ilike('username', username)
  if (preErr) return json({ ok:false, error:'precheck-failed' }, 500)
  if ((count ?? 0) > 0) return json({ ok:false, error:'username-taken' }, 409)

  // Create confirmed user (no emails; works with confirmations OFF)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: emailN,
    password,
    email_confirm: true,
    user_metadata: { display_name, username, marketing_opt_in: !!marketing_opt_in }
  })
  if (createErr || !created?.user?.id) {
    const msg = createErr?.message || ''
    const dup = /already registered|already exists|user exists/i.test(msg)
    return json({ ok:false, error: dup ? 'email-taken' : 'create-user-failed' }, dup ? 409 : 400)
  }

  const userId = created.user?.id

  // sanity guards (keep while debugging)
  const uuidV4ish = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!userId || userId === '00000000-0000-0000-0000-000000000000' || !uuidV4ish.test(userId)) {
    return json({ ok:false, error: 'invalid-user-id', userId }, 500)
  }

  // Use UPSERT to make profile write idempotent
  const { error: profErr } = await admin
    .from('profiles')
    .upsert([{
      id: userId,
      username,
      display_name,
      email: emailN,
      marketing_opt_in: !!marketing_opt_in
    }], { onConflict: 'id' })

  if (profErr) {
    // optional: if you *really* want to roll back the auth user on any profile error
    await admin.auth.admin.deleteUser(userId)
    const msg = (profErr.message || '').toLowerCase()
    if (msg.includes('duplicate') && msg.includes('username')) return json({ ok:false, error:'username-taken' }, 409)
    if (msg.includes('duplicate') && msg.includes('email'))    return json({ ok:false, error:'email-taken' }, 409)
    return json({ ok:false, error: DEBUG ? `profile-upsert-failed: ${profErr.message}` : 'profile-upsert-failed' }, 400)
  }

  return json({ ok:true, user_id: userId, needsConfirmation: false })
})