import { createClient, Stripe } from '../_shared/deps.ts'

const json = (d: unknown, s=200) => new Response(JSON.stringify(d), {
  status: s, headers: { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*' }
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status:204, headers:{
    'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'POST,OPTIONS'}})
  if (req.method !== 'POST') return json({ error:'method-not-allowed' },405)

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion:'2024-06-20' })
  const sig = req.headers.get('stripe-signature') ?? ''
  const raw = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
  } catch (err) {
    return json({ error:'invalid-signature', detail:String(err) },400)
  }

  const supabase = createClient(Deno.env.get('PROJECT_URL')!, Deno.env.get('SERVICE_ROLE_KEY')!)

  // Idempotency guard
  const { data: hit } = await supabase.from('stripe_events').select('id').eq('id', event.id).maybeSingle()
  if (hit) return json({ ok:true, deduped:true })
  await supabase.from('stripe_events').insert({ id: event.id, type: event.type })

  const setProfile = async (userId: string, patch: Record<string,unknown>) =>
    supabase.from('profiles').update(patch).eq('id', userId)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        const u = s.metadata?.supabase_user_id || ''
        const subId = typeof s.subscription === 'string' ? s.subscription : s.subscription?.id
        const custId = s.customer as string | undefined
        if (u) {
          await setProfile(u, {
            subscription_id: subId ?? null,
            subscription_status: 'active',
            stripe_customer_id: custId ?? null,
            tier: 'premium'
          })
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        let userId: string | null = null

        if (typeof sub.customer === 'string') {
          const cust = await stripe.customers.retrieve(sub.customer)
          const md: any = (cust as any).metadata || {}
          userId = md.supabase_user_id ?? null
          if (!userId) {
            const { data } = await supabase.from('profiles').select('id')
              .eq('stripe_customer_id', sub.customer).maybeSingle()
            userId = data?.id ?? null
          }
        }

        if (userId) {
          const status = sub.status
          await setProfile(userId, {
            subscription_id: sub.id,
            subscription_status: status,
            tier: (status === 'active' || status === 'trialing') ? 'premium' : 'free',
            premium_until: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice
        const custId = inv.customer as string | undefined
        if (custId) {
          const { data } = await supabase.from('profiles').select('id').eq('stripe_customer_id', custId).maybeSingle()
          if (data?.id) await setProfile(data.id, { subscription_status:'past_due' })
        }
        break
      }

      default:
        // ignore
        break
    }
  } catch (e) {
    return json({ error:'webhook-processing-failed', detail:String(e) },500)
  }

  return json({ ok:true })
})