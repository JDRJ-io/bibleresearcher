import type { Express } from "express";
import Stripe from "stripe";

// Initialize Stripe with your API keys
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export function registerStripeRoutes(app: Express) {
  // Community membership subscription route
  app.post('/api/get-or-create-subscription', async (req, res) => {

    try {
      // For now, create a basic subscription intent
      // This will be enhanced when user authentication is integrated
      const customer = await stripe.customers.create({
        email: req.body.email || 'community@anointed.io',
        name: req.body.name || 'Community Member',
      });

      // For now, create a simple payment intent for $12 community membership
      // Later you can create a subscription product in your Stripe dashboard
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1200, // $12.00 in cents
        currency: "usd",
        metadata: {
          type: 'community_membership',
          email: req.body.email || 'community@anointed.io'
        }
      });

      res.json({
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      });

    } catch (error: any) {
      console.error('Stripe subscription error:', error);
      res.status(400).json({ 
        error: { message: error.message || 'Failed to create subscription' }
      });
    }
  });

  // One-time payment route (for donations or other features)
  app.post("/api/create-payment-intent", async (req, res) => {

    try {
      const { amount = 1200 } = req.body; // Default $12.00 for community membership
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Amount in cents
        currency: "usd",
        metadata: {
          type: 'community_membership'
        }
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Stripe payment intent error:', error);
      res.status(500).json({ 
        error: { message: error.message || 'Failed to create payment intent' }
      });
    }
  });

  console.log(`💳 Stripe routes registered. Status: ACTIVE with API keys`);
}