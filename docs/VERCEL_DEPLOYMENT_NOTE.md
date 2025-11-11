# Vercel Deployment - Important Note

## Current Architecture Limitation

Your Anointed.io Biblical Research Platform uses a **hybrid Express + Vite architecture** where:
- Express server runs the backend API routes
- Vite middleware serves the frontend in development
- Both run as a single long-running process

**This architecture is NOT directly compatible with Vercel's serverless platform.**

---

## Why Vercel Deployment is Challenging

Vercel uses **serverless functions** that:
1. Are stateless and short-lived (max 10 seconds per request)
2. Cannot run persistent processes like Express with Vite middleware
3. Require separate builds for static assets and API routes

Your current `server/index.ts` expects to:
- Start a Vite dev server
- Run Express middleware continuously
- Serve both frontend and backend from a single process

This model works perfectly on **Replit** or traditional servers, but not on Vercel.

---

## Recommended Deployment Options

### Option 1: Deploy to Replit (Recommended for Current Setup)

**Pros:**
- ✅ Zero code changes required
- ✅ Your hybrid architecture works out of the box
- ✅ Simple deployment with `npm run dev`
- ✅ Continuous uptime
- ✅ Easy scaling with Replit Autoscale

**Steps:**
1. Your app is already configured for Replit
2. Set environment variables in Replit Secrets
3. Deploy with one click
4. Connect custom domain (anointed.io)

**Cost:** ~$20-40/month for reserved VM

---

### Option 2: Deploy to Railway, Render, or Fly.io

Similar to Replit, these platforms support Node.js servers with persistent processes.

**Pros:**
- ✅ No code changes
- ✅ Affordable ($5-20/month)
- ✅ Easy deployment
- ✅ Custom domains included

**Platforms:**
- [Railway](https://railway.app/) - Simple, modern interface
- [Render](https://render.com/) - Free tier available
- [Fly.io](https://fly.io/) - Edge deployment

---

### Option 3: Adapt for Vercel (Requires Refactoring)

To deploy on Vercel, you would need to:

1. **Separate frontend and backend:**
   - Build frontend as static SPA → Deploy to Vercel
   - Run backend separately → Deploy to Replit/Railway/etc.

2. **Convert to Vercel serverless functions:**
   - Create `api/` directory with individual route handlers
   - Convert Express routes to Vercel function format
   - Remove Vite middleware (not compatible)
   - Build frontend separately with `vite build`

**Example structure:**
```
api/
  health.ts
  email/
    send-magic-link.ts
  users/
    [...].ts
client/
  dist/  (built by vite build)
vercel.json
```

**Pros:**
- ✅ Vercel's edge network (global CDN)
- ✅ Free tier available
- ✅ Automatic HTTPS

**Cons:**
- ❌ Requires significant refactoring
- ❌ Cold starts on serverless functions
- ❌ More complex architecture

---

## Recommended Path Forward

### For Immediate Launch:

**Use Replit Deployments** - Your app is already optimized for this:

1. **Set up Replit Deployment:**
   - Go to Replit → Your Repl → Deployments tab
   - Click "Deploy"
   - Choose "Reserved VM" for consistent uptime

2. **Add Environment Variables:**
   - Copy all vars from `.env` to Replit Secrets
   - Include: `POSTMARK_SERVER_TOKEN`, `STRIPE_SECRET_KEY`, etc.

3. **Connect Custom Domain:**
   - In Deployment settings, add `anointed.io`
   - Update DNS to point to Replit

4. **Enable Autoscaling (Optional):**
   - Configure based on traffic
   - Pays only for usage

### Cost Comparison:

| Platform | Monthly Cost | Setup Effort | Best For |
|----------|--------------|--------------|----------|
| Replit   | $20-40       | None (ready) | Current setup |
| Railway  | $5-20        | Minimal      | Cost-conscious |
| Vercel   | $0-20        | High (refactor) | Global edge |

---

## If You Still Want Vercel:

### Step 1: Separate Client & Server

Create two deployment paths:

**Frontend (Vercel):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "client/dist",
  "framework": null
}
```

**Backend (Railway/Render):**
- Deploy Express server separately
- Update client to use backend URL

### Step 2: Update Client API Calls

```typescript
// Instead of: /api/users
// Use: https://api.anointed.io/api/users

const API_BASE = import.meta.env.VITE_API_URL || '/api';
```

### Step 3: Configure CORS

Update `server/cors-config.ts`:
```typescript
const allowedOrigins = [
  'https://anointed.io',         // Vercel frontend
  'https://api.anointed.io',    // Railway backend
  'http://localhost:5000'        // Local dev
];
```

---

## Verdict

**For your current architecture, deploy to Replit or Railway.**

Vercel is excellent for:
- Pure static sites
- Next.js applications
- Serverless API routes

But your Express + Vite hybrid architecture is better suited for platforms that support persistent Node.js processes.

---

## Questions?

If you want to proceed with:
- **Replit Deployment:** Use the existing setup, no changes needed
- **Vercel Refactor:** I can help restructure the app (significant work)
- **Alternative Platform:** Railway/Render work with minimal config changes

Let me know which path you'd like to take!
