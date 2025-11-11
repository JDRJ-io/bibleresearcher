import type { Express } from "express";
import Stripe from "stripe";

// Initialize Stripe with your API keys
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export function registerStripeRoutes(app: Express) {
  // DEPRECATED: Legacy Express Stripe routes - replaced with Supabase Edge Functions
  // These routes are disabled in favor of the new Supabase billing functions:
  // - billing_create_checkout (replaces get-or-create-subscription)
  // - billing_portal (for subscription management)
  // - billing_webhook (for webhook handling)

  app.post('/api/get-or-create-subscription', async (req, res) => {
    res.status(410).json({ 
      error: { 
        message: 'This endpoint has been deprecated. Please use the new Supabase billing functions.' 
      }
    });
  });

  app.post("/api/create-payment-intent", async (req, res) => {
    res.status(410).json({ 
      error: { 
        message: 'This endpoint has been deprecated. Please use the new Supabase billing functions.' 
      }
    });
  });

  console.log(`💳 Legacy Stripe routes registered. Status: DEPRECATED - Use Supabase Edge Functions`);
}