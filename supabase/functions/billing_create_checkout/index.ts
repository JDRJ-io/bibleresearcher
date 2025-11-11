import { createClient, Stripe } from '../_shared/deps.ts'

const json = (d: unknown, s=200) => new Response(JSON.stringify(d), {
  status: s, headers: { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*' }
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'POST,OPTIONS'}})
  if (req.method !== 'POST') return json({ error:'method-not-allowed' },405)

  try {
    const supabase = createClient(Deno.env.get('PROJECT_URL')!, Deno.env.get('SERVICE_ROLE_KEY')!)
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ','')
    const { data:{ user } } = await supabase.auth.getUser(jwt)
    if (!user) return json({ error:'unauthorized' },401)

    const { price_id } = await req.json()
    if (typeof price_id !== 'string' || !price_id.startsWith('price_')) return json({ error:'invalid-price' },400)

    const { data: profile } = await supabase.from('profiles')
      .select('id,email,stripe_customer_id').eq('id', user.id).single()
    if (!profile) return json({ error:'profile-not-found' },404)

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion:'2024-06-20' })

    let customerId = profile.stripe_customer_id as string | null
    if (!customerId) {
      const cust = await stripe.customers.create({
        email: profile.email ?? user.email ?? undefined,
        metadata: { supabase_user_id: user.id }
      })
      customerId = cust.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      mode:'subscription',
      customer: customerId!,
      line_items:[{ price: price_id, quantity:1 }],
      allow_promotion_codes: true,
      success_url: `${Deno.env.get('SUCCESS_URL')}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: Deno.env.get('CANCEL_URL')!,
      metadata: { supabase_user_id: user.id }
    })

    return json({ url: session.url })
  } catch (e) {
    return json({ error:'checkout-create-failed', detail:String(e) },500)
  }
})