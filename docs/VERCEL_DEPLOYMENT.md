# Vercel Deployment Guide - Anointed.io

**Last Updated:** November 2, 2025  
**Status:** Ready for Deployment  
**Platform:** Vercel (Serverless Functions)

---

## Overview

This project has been migrated from Express to Vercel serverless functions. All frontend code (analytics, Sentry, error boundaries, SEO) remains unchanged. Backend routes are now serverless API functions.

---

## What Changed

### ✅ Frontend (No Changes)
- Analytics + ConsentBanner → Works as-is
- Error Boundaries → Works as-is
- Lazy Loading → Works as-is
- SEO meta tags → Works as-is
- Sentry client → Works as-is

### 🔄 Backend (Migrated to Serverless)
- Express routes → Vercel `/api/*.ts` functions
- Helmet security → `vercel.json` headers
- CORS middleware → Vercel handles automatically
- Shared logic → `server/handlers/email.ts`

---

## File Structure

```
/
├── api/                              # Vercel serverless functions
│   ├── health.ts                     # Health check endpoint
│   ├── support-email.ts              # Support contact form
│   ├── email/
│   │   └── send-notification.ts      # General email sending
│   └── seo/
│       ├── sitemap.xml.ts            # Dynamic sitemap
│       └── robots.txt.ts             # Dynamic robots.txt
├── server/
│   └── lib/
│       └── email.ts                  # Shared Postmark logic (existing)
├── vercel.json                       # Security headers & configuration
└── client/                           # Frontend (unchanged)
```

---

## Environment Variables

### Required in Vercel Dashboard

**Frontend (Vite - accessible in browser):**
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_STRIPE_PUBLIC_KEY=pk_live_xxx  # If using Stripe
```

**Backend (Serverless Functions - server-side only):**
```bash
# Postmark Email
POSTMARK_SERVER_TOKEN=<your-server-token>
POSTMARK_FROM_EMAIL=support@anointed.io
POSTMARK_STREAM=outbound
SUPPORT_INBOX=support@anointed.io

# General
NODE_ENV=production
SITE_URL=https://anointed.io

# Optional: Sentry for API functions
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Optional: Stripe (if using webhooks)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Link to Vercel Project
```bash
vercel link
```
Follow prompts to create/link project.

### 3. Set Environment Variables
Either use Vercel Dashboard or CLI:

```bash
# Frontend variables (exposed to browser)
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_SENTRY_DSN production

# Backend variables (server-side only)
vercel env add POSTMARK_SERVER_TOKEN production
vercel env add POSTMARK_FROM_EMAIL production
vercel env add POSTMARK_STREAM production
vercel env add SUPPORT_INBOX production
vercel env add NODE_ENV production
vercel env add SITE_URL production
```

**Or** add them in Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add each variable for Production environment
3. Save changes

### 4. Deploy to Production
```bash
vercel --prod
```

Wait for deployment to complete (~2-5 minutes).

---

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://anointed.io/api/health
```
**Expected:** `{"ok":true,"ts":"2025-11-02T...","env":"production"}`

### 2. Robots.txt
```bash
curl https://anointed.io/api/seo/robots.txt
```
**Expected:**
```
User-agent: *
Allow: /

Sitemap: https://anointed.io/api/seo/sitemap.xml

Crawl-delay: 1
```

### 3. Sitemap
```bash
curl https://anointed.io/api/seo/sitemap.xml | head -20
```
**Expected:** XML with `/`, `/bible`, `/docs`, `/auth-help` entries

### 4. Email Test (After Postmark DNS Setup)
```bash
curl -X POST https://anointed.io/api/email/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Vercel Deployment Test",
    "text": "Email infrastructure working!"
  }'
```
**Expected:** `{"ok":true,"messageId":"..."}`

Check email headers for:
- ✅ SPF: PASS
- ✅ DKIM: PASS
- ✅ DMARC: PASS

### 5. Security Headers
Open browser DevTools → Network → Select any request → Headers

**Expected Headers:**
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy: default-src 'self'; script-src 'self' https://plausible.io...`

### 6. Frontend Functionality
- [ ] Homepage loads
- [ ] /bible route works
- [ ] Consent banner appears on first visit
- [ ] Analytics loads after accepting cookies
- [ ] Error boundaries catch crashes
- [ ] Lazy-loaded components work (Strong's, Prophecy)
- [ ] Sentry captures errors (test with forced error)

---

## API Endpoints Reference

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "ts": "2025-11-02T12:34:56.789Z",
  "env": "production"
}
```

### POST /api/email/send-notification
Send notification email via Postmark.

**Request:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome!",
  "text": "Plain text version",
  "html": "<p>HTML version</p>"
}
```

**Response:**
```json
{
  "ok": true,
  "messageId": "12345-67890-abcdef"
}
```

### POST /api/support-email
Send support message to SUPPORT_INBOX.

**Request:**
```json
{
  "from": "user@example.com",
  "message": "I need help with..."
}
```

**Response:**
```json
{
  "ok": true
}
```

### GET /api/seo/sitemap.xml
Dynamic sitemap with all public routes.

**Response:** XML sitemap

### GET /api/seo/robots.txt
Dynamic robots.txt (environment-aware).

**Response:** Plain text robots directives

---

## Files to Ignore/Delete

These Express-specific files are no longer needed on Vercel:

### Can Delete (Not Used in Vercel):
- `server/index.ts` - Express app setup
- `server/security.ts` - Helmet middleware (replaced by vercel.json)
- `server/cors-config.ts` - CORS middleware (Vercel handles it)
- `server/routes/seo.ts` - Old Express SEO router (replaced by api/seo/*.ts)
- `server/routes/email.ts` - Old Express email routes (if exists)
- Any Express rate limiting files

### Keep (Still Used):
- `server/lib/email.ts` - Shared Postmark logic for API functions (existing)
- All files in `client/` - Frontend unchanged
- `vercel.json` - Vercel configuration
- All files in `api/` - Serverless functions

---

## Manual Actions Still Required

These actions are the same regardless of hosting platform:

### 1. Supabase RLS Migration (15 minutes)
```sql
-- Execute in Supabase Dashboard → SQL Editor (Production)
-- File: supabase/migrations/002_enable_profiles_rls.sql

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

**Verify:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
-- Expected: 2 policies
```

### 2. Storage Bucket Verification (30 minutes)
Follow guide: `docs/STORAGE_BUCKET_SECURITY_VERIFICATION.md`

**Summary:**
1. Verify avatar bucket policies in Supabase Dashboard
2. Test cross-user access (User B can't delete User A's avatar)
3. Document verification sign-off

### 3. Postmark DNS Setup (1-2 hours + 24-48h propagation)
1. Add domain to Postmark
2. Configure DNS records:
   - **SPF:** `v=spf1 include:spf.postmarkapp.com ~all`
   - **DKIM:** (custom value from Postmark)
   - **Return-Path:** CNAME to `pm.mtasv.net`
   - **DMARC:** `v=DMARC1; p=none; pct=100; rua=mailto:postmaster@anointed.io`
3. Wait for DNS propagation (24-48 hours)
4. Test email with headers verification

---

## Troubleshooting

### API Functions Return 500
**Check:** Environment variables set in Vercel Dashboard  
**Fix:** Ensure all required env vars are present for Production environment

### Postmark Emails Fail
**Check:** DNS records verified in Postmark Dashboard  
**Fix:** Wait for DNS propagation, verify all 4 records (SPF, DKIM, Return-Path, DMARC)

### Security Headers Missing
**Check:** `vercel.json` deployed correctly  
**Fix:** Verify file exists in repo root, redeploy with `vercel --prod`

### Frontend Env Vars Undefined
**Check:** Variables must use `VITE_` prefix for Vite  
**Fix:** Rename `NEXT_PUBLIC_*` to `VITE_*` or vice versa based on your build tool

### CORS Errors
**Check:** Vercel handles CORS automatically, but Supabase needs correct URL  
**Fix:** Verify `VITE_SUPABASE_URL` matches your Supabase project URL exactly

---

## Production Checklist

### Pre-Deployment
- [x] All Vercel API functions created
- [x] `vercel.json` configured with security headers
- [ ] All environment variables added to Vercel Dashboard
- [ ] Postmark DNS records configured
- [ ] Supabase RLS migration ready

### Deployment
- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Verify deployment URL works
- [ ] Test all API endpoints (health, email, sitemap, robots)
- [ ] Verify security headers in browser

### Post-Deployment
- [ ] Execute Supabase RLS migration
- [ ] Verify storage bucket policies
- [ ] Test email with SPF/DKIM/DMARC headers
- [ ] Confirm analytics loads after consent
- [ ] Test error boundaries with forced error
- [ ] Verify Sentry captures events
- [ ] Run Lighthouse audit (LCP <2.5s, CLS <0.1)

---

## Support & References

### Documentation
- `docs/PRE_LAUNCH.md` - Production launch checklist
- `docs/SECURITY_AUDIT_REPORT.md` - Security configuration
- `docs/SEO_VERIFICATION_REPORT.md` - SEO implementation
- `docs/STORAGE_BUCKET_SECURITY_VERIFICATION.md` - Storage security

### External Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Postmark Documentation](https://postmarkapp.com/developer)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Deployment Status:** Ready for Production Launch 🚀

Execute the 3 manual actions, deploy to Vercel, and you're live!
