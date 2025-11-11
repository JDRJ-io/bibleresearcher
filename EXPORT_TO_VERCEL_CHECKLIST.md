# 🚀 Export to Vercel - Security Checklist

## ✅ COMPLETED - Safe to Export Now

### 1. Security Analysis ✓
- **No hardcoded secrets found** - All sensitive values use `process.env.*`
- **Service role key is SAFE** - Only used in server-side code (`server/routes/auth.ts`), never exposed to browser
- **.gitignore properly configured** - `.env` files, Replit files, and build artifacts excluded
- **Security headers configured** - `vercel.json` has CSP, HSTS, X-Frame-Options, etc.

### 2. Files Updated ✓
- **`.gitignore`** - Added Replit files (`.replit`, `replit.nix`) and Vercel artifacts (`.vercel/`, `.out/`)
- **`public/site.webmanifest`** - Created PWA manifest
- **Icon placeholders created** - See `public/README-ICONS.md` for replacement instructions

---

## 🔐 Service Role Key - Why It's Safe

Your `SUPABASE_SERVICE_ROLE_KEY` is **SAFE** because:

1. ✅ **Only used in server-side code** (`server/routes/auth.ts`)
2. ✅ **Never exposed to frontend** (not prefixed with `VITE_`)
3. ✅ **Stored as environment variable** (not hardcoded)
4. ✅ **Only used for authorized admin operations** (username checks, profile creation)

**Where it's used:**
- Checking username availability (read-only)
- Creating user profiles after signup (write-only to user's own data)
- Supabase Edge Functions (server-side only)

**Keep it secret by:**
- Adding it to Vercel Environment Variables (NOT in code)
- Never committing `.env` files to Git
- Never prefixing it with `VITE_` (which would expose it to browser)

---

## 📁 GitHub: Public or Private?

### ✅ **SAFE TO MAKE PUBLIC** if:
- `.env` files are never committed (they're gitignored ✓)
- No secrets in code (verified ✓)
- Environment variables set in Vercel (not in code) ✓

### 🔒 **MAKE IT PRIVATE** if:
- You prefer to keep business logic confidential
- You want extra peace of mind
- You have proprietary algorithms or trade secrets

**Recommendation:** Start **PUBLIC** for:
- Better SEO (open source projects rank higher)
- Community contributions
- Transparency builds trust
- Free GitHub Actions unlimited minutes

You can always make it private later if needed.

---

## 🚨 ACTION REQUIRED BEFORE LAUNCH

### 1. Replace Placeholder Icons (CRITICAL)
**Location:** `/public/README-ICONS.md`

Current status:
- ⚠️ **Missing:** `favicon.ico`, `favicon-48.png`, `apple-touch-icon.png`, `og-image.png`
- ⚠️ **Missing:** `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/icon-512-maskable.png`
- ✅ **Created:** `site.webmanifest`, placeholder SVG icons

**Quick fix:**
```bash
# Use https://realfavicongenerator.net/ to generate all icons
# Or convert your logo with ImageMagick:
convert logo.svg -resize 192x192 public/icons/icon-192.png
convert logo.svg -resize 512x512 public/icons/icon-512.png
convert logo.svg -resize 180x180 public/apple-touch-icon.png
```

### 2. Set Environment Variables in Vercel

**Frontend (safe to expose):**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_SENTRY_DSN=https://...@sentry.io/...
SITE_URL=https://anointed.io
```

**Backend (SECRETS - never commit):**
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   # CRITICAL - Admin access
POSTMARK_SERVER_TOKEN=...               # Email sending
POSTMARK_FROM_EMAIL=support@anointed.io
POSTMARK_MESSAGE_STREAM=outbound
SUPPORT_INBOX=support@anointed.io
SENTRY_DSN=...                          # Server-side error tracking
NODE_ENV=production
```

**Optional flags:**
```bash
SUPPORT_PRELAUNCH_MODE=false            # Set false to enable real emails
VITE_SUPPORT_PRELAUNCH_MODE=false
```

### 3. Postmark Email Setup
1. **Verify domain** in Postmark dashboard
2. **Add DNS records:**
   - SPF: `v=spf1 include:spf.mtasv.net ~all`
   - DKIM: (provided by Postmark)
   - DMARC: `v=DMARC1; p=none; rua=mailto:postmaster@anointed.io`
3. **Test email delivery:**
```bash
curl -X POST https://anointed.io/api/support/feedback \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","message":"Test from production"}'
```

### 4. Plausible Analytics Setup
1. Create account at **plausible.io**
2. Add domain: `anointed.io`
3. Your consent gate is already implemented ✓ (`client/src/lib/analytics.ts`)
4. UTM parameter tracking is enabled ✓ (auto-captures campaign attribution)

### 5. Search Console Setup (CRITICAL for SEO)
1. **Google Search Console:**
   - Go to https://search.google.com/search-console
   - Add property: `anointed.io`
   - Verify ownership (DNS TXT record or HTML file)
   - Submit sitemap: `https://anointed.io/api/seo/sitemap.xml`
2. **Optional - Bing Webmaster Tools:**
   - Same process at https://www.bing.com/webmasters

### 6. Future: Ad Pixels (Only When Running Paid Campaigns)
**DO NOT enable these until you're running ads:**
- Edit `client/src/lib/analytics.ts`
- Change `ENABLE_AD_PIXELS = false` to `true`
- Add Meta Pixel ID and TikTok Pixel ID
- Infrastructure is ready, just disabled by default ✓

### 7. Vercel Deployment Steps

**Option A: From Replit (Recommended)**
1. In Replit, click "Export to GitHub"
2. Choose repository (public or private)
3. Go to Vercel → "Import Project"
4. Select your GitHub repo
5. Add environment variables
6. Deploy

**Option B: Manual Git Push**
```bash
git remote add origin https://github.com/yourusername/anointed-io.git
git push -u origin main
```

Then import in Vercel.

### 8. Custom Domain in Vercel
1. Go to Vercel → Your Project → Settings → Domains
2. Add `anointed.io` and `www.anointed.io`
3. Update DNS with Vercel's records:
   - `A` record: `76.76.21.21`
   - `CNAME` for www: `cname.vercel-dns.com`

### 9. GitHub Security (if public)
1. **Enable secret scanning** (Settings → Security → Code security)
2. **Enable Dependabot** (automatic security updates)
3. **Add branch protection** (optional - require PR reviews)

---

## ✅ POST-LAUNCH VERIFICATION

### Test Checklist:
```bash
# 1. Health check
curl https://anointed.io/api/health

# 2. Security headers
curl -sI https://anointed.io | grep -i "strict-transport\|x-frame\|content-security"

# 3. SEO files
curl https://anointed.io/api/seo/robots.txt
curl https://anointed.io/api/seo/sitemap.xml

# 4. Icons load
curl -I https://anointed.io/favicon.ico
curl -I https://anointed.io/site.webmanifest

# 5. Test authentication flow
# (Open https://anointed.io and try signing up)

# 6. Test analytics consent
# (Check browser console for Plausible script after consent)
```

### Browser Testing:
1. **Open DevTools → Application:**
   - Manifest should show all icons ✓
   - Service Worker should register (if enabled) ✓
   - Theme color should match brand ✓

2. **Open DevTools → Network:**
   - Check CSP headers are applied ✓
   - Verify no mixed content warnings ✓
   - Confirm HTTPS is enforced ✓

3. **Test social sharing:**
   - Share link on Twitter/LinkedIn/Facebook
   - Verify OG image appears correctly

---

## 🔒 SECURITY BEST PRACTICES

### DO:
✅ Keep `.env` files local only (gitignored)
✅ Use environment variables for all secrets
✅ Rotate API keys if ever committed to Git
✅ Use `SUPABASE_SERVICE_ROLE_KEY` only in server code
✅ Prefix frontend env vars with `VITE_`

### DON'T:
❌ Commit `.env` files to Git
❌ Use service role key in frontend code
❌ Hardcode API keys or secrets
❌ Expose admin credentials in client code
❌ Use `process.env` in frontend (use `import.meta.env`)

---

## 📊 Current Environment Variable Audit

**Frontend (exposed to browser):**
- `VITE_SUPABASE_URL` ✓ Safe (public URL)
- `VITE_SUPABASE_ANON_KEY` ✓ Safe (designed to be public)
- `VITE_SENTRY_DSN` ✓ Safe (browser monitoring only)
- `VITE_HIGHLIGHTS_V2_ENABLED` ✓ Safe (feature flag)

**Backend (secrets):**
- `SUPABASE_SERVICE_ROLE_KEY` 🔐 **CRITICAL** - Admin access
- `POSTMARK_SERVER_TOKEN` 🔐 Secret - Email API
- `SENTRY_DSN` 🔐 Secret - Server error tracking
- `POSTMARK_FROM_EMAIL` 🔒 Semi-sensitive (email address)

**Status:** All sensitive keys properly isolated ✅

---

## 🎯 Launch Timeline

**Now:**
1. ✅ Security audit complete
2. ✅ `.gitignore` updated
3. ✅ Manifest created
4. ⚠️ Replace icon placeholders

**Before pushing to GitHub:**
1. ⚠️ Create proper brand icons
2. ✅ Verify `.env` is not committed
3. ✅ Run final security scan

**After deploying to Vercel:**
1. Add environment variables
2. Configure custom domain
3. Set up Postmark DNS
4. Enable Plausible analytics
5. Test all features

**Launch day:**
1. Monitor Sentry for errors
2. Check Plausible for traffic
3. Test email delivery
4. Verify authentication flow

---

## 🆘 IF SOMETHING GOES WRONG

### Secret accidentally committed to Git:
```bash
# 1. IMMEDIATELY rotate the key (Postmark/Supabase/Stripe dashboard)
# 2. Remove from Git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all

# 3. Force push (WARNING: destructive)
git push origin --force --all
```

### Deployment fails:
1. Check Vercel logs for specific error
2. Verify all environment variables are set
3. Ensure build command is `npm run build`
4. Confirm Node.js version matches (20.x)

### Icons not loading:
1. Check `/public/` folder contains all icon files
2. Verify `site.webmanifest` is accessible
3. Clear browser cache and test
4. Check Vercel build output includes `/public/*`

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Postmark Docs:** https://postmarkapp.com/developer
- **Plausible Docs:** https://plausible.io/docs

---

**Ready to launch?** You're 95% there! Just replace the icon placeholders and you're good to go. 🚀
