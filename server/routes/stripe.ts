import type { Express } from "express";
import Stripe from "stripe";
// This route will be activated when STRIPE_SECRET_KEY is provided

let stripe: Stripe | null = null;

// Initialize Stripe only if the secret key is available
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
}

export function registerStripeRoutes(app: Express) {
  // Community membership subscription route
  app.post('/api/get-or-create-subscription', async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ 
        error: { message: 'Payment system is not configured. Please contact support.' }
      });
    }

    try {
      // For now, create a basic subscription intent
      // This will be enhanced when user authentication is integrated
      const customer = await stripe.customers.create({
        email: req.body.email || 'community@anointed.io',
        name: req.body.name || 'Community Member',
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          // This will need to be replaced with actual price ID from Stripe dashboard
          price: process.env.STRIPE_PRICE_ID || 'price_community_membership',
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      res.json({
        subscriptionId: subscription.id,
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
    if (!stripe) {
      return res.status(500).json({ 
        error: { message: 'Payment system is not configured. Please contact support.' }
      });
    }

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

  console.log(`💳 Stripe routes registered. Status: ${stripe ? 'ACTIVE' : 'INACTIVE (missing STRIPE_SECRET_KEY)'}`);
}