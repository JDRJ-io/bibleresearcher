import { createClient } from '../_shared/deps.ts'
import { withCORS, json } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return withCORS(new Response(null, { status: 204 }))
  if (req.method !== 'POST') return json({ ok: false, error: 'method-not-allowed' }, 405)

  try {
    const { u } = await req.json().catch(() => ({}))
    
    if (typeof u !== 'string' || u.trim().length < 3) {
      return json({ ok: false, error: 'invalid-username' }, 400)
    }

    const admin = createClient(
      Deno.env.get('PROJECT_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    )

    const { count, error } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .ilike('username', u)

    if (error) return json({ ok: false, error: error.message }, 500)
    return json({ ok: true, available: (count ?? 0) === 0 })

  } catch (error) {
    console.error('Username availability function error:', error)
    return json({ ok: false, error: 'internal-error' }, 500)
  }
})