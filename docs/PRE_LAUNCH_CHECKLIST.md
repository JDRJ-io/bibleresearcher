# Pre-Launch Checklist for Anointed.io

Comprehensive guide for deploying your Biblical Research Platform to Vercel with proper security, email, and monitoring.

---

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Vercel Deployment](#vercel-deployment)
3. [DNS Configuration](#dns-configuration)
4. [Postmark Email Setup](#postmark-email-setup)
5. [Security Verification](#security-verification)
6. [Performance & SEO](#performance--seo)
7. [Post-Launch Monitoring](#post-launch-monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Environment Setup

### Required Environment Variables

Add these to your Vercel project settings (Settings → Environment Variables):

```bash
# Node Environment
NODE_ENV=production

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Stripe Payments
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key

# Postmark Email
POSTMARK_SERVER_TOKEN=your-postmark-server-token
POSTMARK_FROM_EMAIL=no-reply@mail.anointed.io

# Application
PORT=3001
```

### Environment Variable Checklist

- [ ] All Supabase keys set (URL, anon key, service role key)
- [ ] Database URL configured
- [ ] Stripe keys set (both secret and publishable)
- [ ] Postmark token and from email configured
- [ ] NODE_ENV set to `production` for production deployment

---

## Deployment Platform Selection

### ⚠️ Important: Vercel Compatibility Note

**Your current architecture (Express + Vite hybrid) is NOT compatible with Vercel's serverless platform.**

See `docs/VERCEL_DEPLOYMENT_NOTE.md` for detailed explanation and alternatives.

**Recommended Platforms:**
1. **Replit Deployments** (Zero config, works immediately)
2. **Railway** (Simple, affordable)
3. **Render** (Free tier available)
4. **Fly.io** (Edge deployment)

### Replit Deployment (Recommended)

Your app is already optimized for Replit. Follow these steps:

1. **Set up Deployment:**
   - Go to Replit → Your Repl → Deployments tab
   - Click "Deploy"
   - Choose "Reserved VM" for consistent uptime

2. **Add Environment Variables:**
   - Copy all vars from `.env` to Replit Secrets
   - Use the Secrets tab in your Repl

3. **Connect Custom Domain:**
   - In Deployment settings, add `anointed.io`
   - Update DNS to point to Replit's provided address

4. **Deploy:**
   - Click "Deploy" button
   - Wait for build (~2-3 minutes)
   - Your app will be live!

### Railway/Render Deployment (Alternative)

Both platforms support Node.js servers with minimal config:

1. Connect your Git repository
2. Set environment variables
3. Deploy with one click
4. Add custom domain

---

## DNS Configuration

### Primary Domain (anointed.io)

Add these DNS records at your domain registrar:

| Type  | Name | Value                      | TTL  |
|-------|------|----------------------------|------|
| A     | @    | 76.76.21.21                | 3600 |
| CNAME | www  | cname.vercel-dns.com       | 3600 |

> **Note:** Vercel's IP may vary. Use the exact values provided in your Vercel domain settings.

### Email Subdomain (mail.anointed.io)

See [POSTMARK_DNS_SETUP.md](./POSTMARK_DNS_SETUP.md) for detailed email DNS configuration.

Quick reference:
- DKIM: TXT record on `[selector].mail.anointed.io`
- Return-Path: CNAME `pm-bounces.mail.anointed.io` → `pm.mtasv.net`
- SPF: TXT on `mail.anointed.io` → `v=spf1 include:spf.mtasv.net ~all`
- DMARC: TXT on `_dmarc.mail.anointed.io` → `v=DMARC1; p=none; rua=mailto:dmarc@anointed.io`

### DNS Propagation

- DNS changes can take 5 minutes to 48 hours to propagate globally
- Check status: [DNS Checker](https://dnschecker.org/)
- Vercel usually shows "Valid Configuration" within 30 minutes

---

## Postmark Email Setup

### 1. Create Postmark Account

1. Sign up at [Postmark](https://postmarkapp.com/)
2. Create a new server (name it "Anointed Production")
3. Go to Sender Signatures → Add Domain → Enter `mail.anointed.io`

### 2. Verify Domain

1. Postmark will show DNS records to add
2. Add all records to your DNS (see DNS Configuration above)
3. Wait for DNS propagation (15 minutes to 2 hours)
4. Click "Verify" in Postmark dashboard

### 3. Get API Token

1. In Postmark, go to your server → API Tokens
2. Copy the Server API Token
3. Add to Vercel environment variables:
   ```
   POSTMARK_SERVER_TOKEN=your-token-here
   POSTMARK_FROM_EMAIL=no-reply@mail.anointed.io
   ```

### 4. Test Email Sending

```bash
curl -X POST https://anointed.io/api/email/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "magicLink": "https://anointed.io/auth/callback?token=test123"
  }'
```

Check your inbox for the magic link email.

### 5. Configure Message Streams

- **Transactional** (default "Outbound"): Magic links, password resets
- **Broadcast** (create new): Newsletters, announcements

---

## Security Verification

### 1. Run RLS Audit Script

Before launch, verify all database tables have Row-Level Security enabled:

```bash
npx tsx scripts/rls-audit.ts
```

Expected output: All user-data tables should show ✅ RLS ENABLED

### 2. Verify Security Headers

Test your deployed site:

```bash
curl -I https://anointed.io
```

Check for:
- ✅ `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- ✅ `X-Frame-Options: DENY`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `Content-Security-Policy: ...`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`

### 3. Test HTTPS & HSTS

1. Visit `http://anointed.io` - should redirect to `https://`
2. Check for secure connection (🔒 in browser)
3. Verify certificate is valid (click lock icon)

### 4. Supabase RLS Testing

1. Create a test user account
2. Try accessing another user's data
3. Should fail with permission denied error

### 5. API Rate Limiting Test

```bash
# Try hitting an endpoint 150 times in a row (should get rate limited after 100)
for i in {1..150}; do
  curl https://anointed.io/api/health
done
```

You should see `429 Too Many Requests` after hitting the limit.

### 6. Secret Key Audit

- [ ] No API keys committed to Git repository
- [ ] Service role key never sent to client
- [ ] Stripe secret key server-side only
- [ ] Postmark token server-side only
- [ ] All secrets in Vercel environment variables only

---

## Performance & SEO

### 1. Core Web Vitals

Test your site: [PageSpeed Insights](https://pagespeed.web.dev/)

Target metrics:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### 2. Verify Sitemap & Robots.txt

- Visit `https://anointed.io/sitemap.xml` - should show XML sitemap
- Visit `https://anointed.io/robots.txt` - should allow crawling in production

### 3. Submit to Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://anointed.io`
3. Verify ownership (use DNS method recommended)
4. Submit sitemap: `https://anointed.io/sitemap.xml`

### 4. Test Open Graph Tags

Share a link to your site on:
- Twitter
- Facebook
- LinkedIn
- Discord/Slack

Verify the preview shows correct title, description, and image.

### 5. Font Preloading

Check that critical fonts are preloaded in `index.html`:

```html
<link rel="preload" href="/fonts/your-font.woff2" as="font" type="font/woff2" crossorigin>
```

---

## Post-Launch Monitoring

### 1. Set Up Health Check Monitoring

Use a service like:
- [UptimeRobot](https://uptimerobot.com/) (free)
- [Pingdom](https://www.pingdom.com/)
- [Vercel Monitoring](https://vercel.com/docs/concepts/observability)

Monitor endpoint: `https://anointed.io/api/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-30T12:00:00.000Z"
}
```

### 2. Error Tracking (Optional but Recommended)

**Sentry Setup:**

1. Create account at [Sentry.io](https://sentry.io/)
2. Create new project for React + Node.js
3. Install Sentry:
   ```bash
   npm install @sentry/react @sentry/node
   ```
4. Add DSN to environment variables
5. Initialize in client and server

### 3. Analytics (Optional)

Consider adding:
- **Google Analytics** for traffic insights
- **Plausible** for privacy-friendly analytics
- **Vercel Analytics** (built-in, no config needed)

### 4. Email Monitoring

Check daily for first 2 weeks:
- Postmark Activity dashboard
- Bounce rate (should be < 5%)
- Spam complaint rate (should be < 0.1%)
- Delivery rate (should be > 95%)

### 5. DMARC Reports

- Set up email forwarding for `dmarc@anointed.io`
- Review weekly reports
- After 2-4 weeks of monitoring, upgrade DMARC from `p=none` to `p=quarantine`

---

## Troubleshooting

### Deployment Fails

**Issue:** Build fails on Vercel

**Solutions:**
1. Check build logs in Vercel dashboard
2. Verify all dependencies in `package.json`
3. Ensure environment variables are set
4. Test build locally: `npm run build`

---

### Emails Not Sending

**Issue:** Magic link emails not arriving

**Solutions:**
1. Check Postmark Activity dashboard for errors
2. Verify POSTMARK_SERVER_TOKEN is set in Vercel
3. Confirm DNS records are verified in Postmark
4. Check spam folder
5. Test with different email providers (Gmail, Outlook, iCloud)

---

### Database Connection Errors

**Issue:** Cannot connect to Supabase

**Solutions:**
1. Verify DATABASE_URL is correct
2. Check Supabase project status
3. Confirm IP allowlist (Vercel IPs should be whitelisted)
4. Test connection with Supabase client

---

### CORS Errors

**Issue:** API requests blocked by CORS

**Solutions:**
1. Check `server/cors-config.ts` includes your domain
2. Add production domain to allowed origins:
   ```typescript
   'https://anointed.io',
   'https://www.anointed.io'
   ```
3. Redeploy to Vercel

---

### Rate Limiting Issues

**Issue:** Getting 429 errors unexpectedly

**Solutions:**
1. Check `server/rate-limit.ts` configuration
2. Adjust limits if needed for production traffic
3. Use different rate limiters for different endpoints

---

## Launch Day Checklist

### Pre-Launch (1 Day Before)

- [ ] All environment variables set in Vercel
- [ ] DNS records configured and propagated
- [ ] Postmark domain verified
- [ ] Test emails sending successfully
- [ ] RLS audit passed (all tables secured)
- [ ] Security headers verified
- [ ] SSL certificate active
- [ ] Custom domain working (anointed.io)
- [ ] Health check endpoint responding
- [ ] Build succeeds on Vercel
- [ ] Test user can sign in/sign out

### Launch Day

- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Test all critical user flows:
  - [ ] Homepage loads
  - [ ] User can sign up
  - [ ] Magic link email arrives
  - [ ] User can access Bible study tools
  - [ ] Bookmarks save correctly
  - [ ] Notes sync properly
  - [ ] Stripe payment works (if applicable)
- [ ] Submit sitemap to Google Search Console
- [ ] Enable uptime monitoring
- [ ] Announce launch! 🎉

### Post-Launch (First Week)

- [ ] Monitor error rates daily
- [ ] Check email delivery metrics
- [ ] Review performance metrics
- [ ] Monitor server costs
- [ ] Respond to user feedback
- [ ] Fix any critical bugs immediately

---

## Support Resources

### Vercel
- [Documentation](https://vercel.com/docs)
- [Community](https://github.com/vercel/vercel/discussions)
- [Support](https://vercel.com/support)

### Postmark
- [Documentation](https://postmarkapp.com/support)
- [API Reference](https://postmarkapp.com/developer)
- [Support](mailto:support@postmarkapp.com)

### Supabase
- [Documentation](https://supabase.com/docs)
- [Discord Community](https://discord.supabase.com/)
- [Support](https://supabase.com/support)

---

## Quick Commands Reference

```bash
# Run RLS audit
npx tsx scripts/rls-audit.ts

# Test email sending locally
curl -X POST http://localhost:5000/api/email/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","magicLink":"http://localhost:5000/auth/callback?token=test"}'

# Check health endpoint
curl https://anointed.io/api/health

# View sitemap
curl https://anointed.io/sitemap.xml

# View robots.txt
curl https://anointed.io/robots.txt

# Check security headers
curl -I https://anointed.io
```

---

**You're ready to launch! 🚀**

If you encounter any issues not covered here, refer to the specific documentation files:
- `POSTMARK_DNS_SETUP.md` - Detailed email configuration
- `SECURITY_AUDIT_REPORT.md` - Security implementation details
- `replit.md` - Project architecture and features
