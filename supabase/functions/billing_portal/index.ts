import { createClient, Stripe } from '../_shared/deps.ts'

const json = (d: unknown, s=200) => new Response(JSON.stringify(d), {
  status: s, headers: { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*' }
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null,{ status:204, headers:{
    'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'POST,OPTIONS'}})
  if (req.method !== 'POST') return json({ error:'method-not-allowed' },405)

  try {
    const supabase = createClient(Deno.env.get('PROJECT_URL')!, Deno.env.get('SERVICE_ROLE_KEY')!)
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ','')
    const { data:{ user } } = await supabase.auth.getUser(jwt)
    if (!user) return json({ error:'unauthorized' },401)

    const { data: profile } = await supabase.from('profiles')
      .select('id,stripe_customer_id').eq('id', user.id).single()
    if (!profile?.stripe_customer_id) return json({ error:'no-stripe-customer' },400)

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion:'2024-06-20' })
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id, return_url: Deno.env.get('SITE_URL')!
    })

    return json({ url: session.url })
  } catch (e) {
    return json({ error:'portal-create-failed', detail:String(e) },500)
  }
})