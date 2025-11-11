# Security Audit Report

**Date:** October 27, 2025 (Initial Audit)  
**Updated:** November 2, 2025 (Pre-Launch Comprehensive Audit)  
**Project:** Biblical Research Platform  
**Audit Type:** Production Launch Security Assessment

## Executive Summary

Performed comprehensive pre-launch security audit covering Row-Level Security (RLS), storage bucket policies, CORS configuration, environment variables, and security headers. The application has a strong security foundation with several critical protections in place. **Three medium-priority issues identified** that should be addressed before production launch.

**Overall Security Posture:** ✅ STRONG (with recommended fixes)  
**Production Readiness:** ⚠️ CONDITIONAL (fix identified issues first)

---

## Pre-Launch Security Audit (November 2, 2025)

### 1. Row-Level Security (RLS) Audit ✅ MOSTLY SECURE

**Status:** RLS enabled for critical user data tables with proper policies.

**Tables Verified (from `migration.sql`):**

| Table | RLS Enabled | Policy | Status |
|-------|-------------|--------|--------|
| `user_bookmarks` | ✅ Yes | `auth.uid() = user_id` | ✅ Secure |
| `user_notes` | ✅ Yes | `auth.uid() = user_id` | ✅ Secure |
| `user_highlights` | ✅ Yes | `auth.uid() = user_id` | ✅ Secure |
| `navigation_history` | ✅ Yes | `auth.uid() = user_id` | ✅ Secure |
| `user_sessions` | ✅ Yes | `auth.uid() = user_id` | ✅ Secure |

**RLS Policy Pattern (Verified Secure):**
```sql
CREATE POLICY "Users can access their own bookmarks" ON user_bookmarks
  FOR ALL USING (auth.uid() = user_id);
```

**⚠️ Issue #1: Missing RLS for `profiles` Table**

**Finding:** The `profiles` table is not included in `migration.sql` RLS setup. This table stores user profiles and should be protected.

**Risk:** Medium - User profile data could be accessible by other authenticated users if RLS is not enabled.

**Recommendation:**
```sql
-- Add to migration or run in Supabase SQL Editor
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

**Tables Mentioned in `scripts/rls-audit.ts` (Needs Manual Verification):**
- ⚠️ `user_preferences` - Not found in migration.sql
- ⚠️ `user_positions` - Not found in migration.sql  
- ⚠️ `hyperlink_clicks` - Not found in migration.sql
- ⚠️ `forum_posts` - Not found in migration.sql
- ⚠️ `forum_comments` - Not found in migration.sql
- ⚠️ `forum_votes` - Not found in migration.sql

**Action Required:**
1. Run `npx tsx scripts/rls-audit.ts` in production environment to verify all tables
2. Enable RLS on `profiles` table with proper policies
3. Verify if forum-related tables exist and need RLS

**SECURITY DEFINER Functions Found:**
- ✅ `username_available(text)` - Returns boolean, read-only, low risk
- ✅ `handle_new_user()` - Trigger function for user creation, properly scoped
- ⚠️ `fn_set_avatar(p_path text)` - Referenced in code but not found in migration files

**Recommendation:** Document all SECURITY DEFINER functions and verify they don't expose data leaks.

---

### 2. Storage Bucket Policies ⚠️ NEEDS ATTENTION

**Buckets Identified:**

#### `anointed` Bucket (Public Bible Content)
- **Purpose:** Bible translations, metadata, labels, cross-references
- **Access:** Public read (✅ Appropriate for Bible content)
- **Security:** Uses signed URLs in some places, public URLs in others
- **Status:** ✅ SECURE (public content by design)

**Example Usage:**
```typescript
// Public Bible translations
const publicUrl = `${supabaseUrl}/storage/v1/object/public/anointed/translations/${translationId}.txt`;
```

#### `avatars` Bucket (User Profile Pictures)
- **Purpose:** User avatar uploads
- **Access:** ⚠️ Uses `getPublicUrl()` - **potentially insecure**
- **Path Structure:** `avatars/{userId}/{randomUUID}.{ext}`
- **RPC Function:** `fn_set_avatar()` with SECURITY DEFINER

**⚠️ Issue #2: Avatar Bucket May Allow Public Access**

**Finding:** The `uploadAvatar.ts` uses `getPublicUrl()` which suggests the avatars bucket is configured for public access. This is acceptable for profile pictures, but the bucket policies should enforce path-based restrictions.

**Current Implementation:**
```typescript
// Upload to avatars/{userId}/...
const path = `avatars/${userId}/${crypto.randomUUID()}.${ext}`;
const up = await supabase.storage.from('avatars').upload(path, file, { upsert: true });

// Returns public URL (no auth required to view)
const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
```

**Risk:** Low-Medium - If bucket policies are not properly configured, users might be able to upload to other users' folders or access files outside their path.

**Required Storage Policies for `avatars` Bucket:**
```sql
-- Policy 1: Users can only upload to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Everyone can view avatars (public read)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

**Action Required:**
1. Verify these policies exist in Supabase Dashboard → Storage → avatars bucket
2. Test with non-admin user to ensure they can only upload to their own folder
3. Verify `fn_set_avatar()` RPC function exists and is properly secured

---

### 3. CORS Configuration ⚠️ NEEDS PRODUCTION FIX

**File:** `server/cors-config.ts`

**Current Configuration:**
```typescript
const allowedOrigins = new Set([
  'https://anointed.io',            // ✅ Production
  'https://www.anointed.io',        // ✅ Production
  'https://staging.anointed.io',    // ✅ Staging
  'http://localhost:5173',          // ⚠️ Development
  'http://localhost:5000',          // ⚠️ Development
  'http://0.0.0.0:5000',            // ⚠️ Development
  'http://127.0.0.1:5173',          // ⚠️ Development
  'http://127.0.0.1:5000',          // ⚠️ Development
]);
```

**✅ Strengths:**
- No wildcards (`*`) - excellent
- Specific domain allowlist - secure
- Credentials enabled correctly for auth
- Proper HTTP methods configured
- Proper headers allowlist

**⚠️ Issue #3: Localhost Always Allowed in Production**

**Finding:** The CORS configuration includes localhost origins unconditionally. In production, these should be disabled.

**Risk:** Low-Medium - Allows CORS requests from localhost in production, which could be exploited if an attacker tricks a user into running malicious code locally.

**Recommended Fix:**
```typescript
const allowedOrigins = new Set([
  'https://anointed.io',
  'https://www.anointed.io',
  'https://staging.anointed.io',
  ...(process.env.NODE_ENV === 'development' ? [
    'http://localhost:5173',
    'http://localhost:5000',
    'http://0.0.0.0:5000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5000',
  ] : [])
]);
```

**Action Required:**
1. Modify `server/cors-config.ts` to conditionally allow localhost only in development
2. Verify `NODE_ENV=production` is set in production environment
3. Test that localhost is blocked in production deployment

**Other CORS Settings (Verified Secure):**
```typescript
credentials: true,                                          // ✅ Required for auth
methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // ✅ Reasonable
allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // ✅ Minimal
```

---

### 4. Environment Variables Security ✅ SECURE

**File:** `.env.example`

**Audit Results:**

✅ **No hardcoded secrets** - All sensitive values use placeholders  
✅ **Production env vars documented** - Clear instructions provided  
✅ **Proper structure** - All required variables listed  
✅ **Vite prefix pattern** - Client vars properly prefixed with `VITE_`

**Variables Checked:**
```bash
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require ✅
VITE_SUPABASE_URL=https://your-project.supabase.co ✅
VITE_SUPABASE_ANON_KEY=your-anon-key-here ✅
STRIPE_SECRET_KEY=sk_test_... ✅
POSTMARK_SERVER_TOKEN= ✅ (blank for pre-launch)
VITE_SENTRY_DSN= ✅
SENTRY_DSN= ✅
```

**Minor Recommendation:**
The DATABASE_URL example uses "password" as a placeholder. Consider using a clearer placeholder like "YOUR_DATABASE_PASSWORD" to prevent accidental commits.

**✅ Client-Side Environment Variable Usage:**
- Previous audit (Oct 27) verified no `process.env` usage in client code
- All client code uses `import.meta.env.VITE_*` pattern
- No service role keys exposed to client

---

### 5. Security Headers (Helmet) ✅ EXCELLENT

**File:** `server/security.ts`

**Content Security Policy (CSP):**
```javascript
"default-src": ["'self'"],
"script-src": ["'self'", "https://plausible.io", "https://js.stripe.com"],
"style-src": ["'self'", "'unsafe-inline'"], // Tailwind requires inline
"img-src": ["'self'", "data:", "blob:", "https://*.supabase.co"],
"connect-src": ["'self'", supabaseUrl, "https://plausible.io", "https://api.stripe.com", "https://*.sentry.io"],
"frame-src": ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
"frame-ancestors": ["'none'"], // ✅ Prevents clickjacking
```

**✅ Strengths:**
- Strong CSP with minimal allowances
- Frame-ancestors blocks all embedding (prevents clickjacking)
- Only trusted external domains allowed
- Proper HSTS in production

**Other Security Headers:**
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ HSTS enabled in production (max-age=31536000)

---

### 6. Rate Limiting ✅ WELL CONFIGURED

**File:** `server/rate-limit.ts`

**Rate Limiters:**

| Endpoint | Limit | Window | Status |
|----------|-------|--------|--------|
| `/api/auth/*` | 100 req | 15 min | ✅ Appropriate |
| `/api/storage/*` | 1000 req | 15 min | ✅ Appropriate |
| `/api/users/*` | 1000 req | 15 min | ✅ Appropriate |
| `/api/profile/*` | 1000 req | 15 min | ✅ Appropriate |
| Webhooks | 30 req | 1 min | ✅ Appropriate |

**✅ Configuration Quality:**
- Auth endpoints have stricter limits (100 vs 1000)
- Webhook limiter skips successful requests
- Standard headers included for rate limit info
- IP-based limiting (default behavior)

---

## Summary of Findings

### Critical Issues (Must Fix Before Launch)
None ✅

### High Priority Issues (Strongly Recommended)
None ✅

### Medium Priority Issues (Should Fix)

1. **⚠️ Missing RLS on `profiles` Table**
   - **Impact:** User profile data potentially accessible
   - **Fix Time:** 5 minutes (SQL query)
   - **Fix:** Add RLS policies as shown in Section 1

2. **⚠️ Verify Storage Bucket Policies**
   - **Impact:** Potential unauthorized file uploads
   - **Fix Time:** 10 minutes (verify + add policies)
   - **Fix:** Verify/add policies as shown in Section 2

3. **⚠️ CORS Allows Localhost in Production**
   - **Impact:** Unnecessary attack surface
   - **Fix Time:** 5 minutes (code change)
   - **Fix:** Conditional localhost as shown in Section 3

### Low Priority Issues (Nice to Have)
- Document all SECURITY DEFINER functions
- Update DATABASE_URL placeholder in .env.example
- Add CSP reporting endpoint for production monitoring

---

## Production Launch Checklist

### Pre-Launch (Must Complete)

- [ ] **RLS Verification**
  - [ ] Run `npx tsx scripts/rls-audit.ts` in production database
  - [ ] Add RLS policies to `profiles` table
  - [ ] Verify all user-data tables have RLS enabled
  
- [ ] **Storage Security**
  - [ ] Verify `avatars` bucket has path-based policies
  - [ ] Test avatar upload as non-admin user
  - [ ] Confirm `fn_set_avatar()` RPC function exists
  
- [ ] **CORS Configuration**
  - [ ] Make localhost conditional on NODE_ENV
  - [ ] Verify NODE_ENV=production in production
  - [ ] Test that localhost is blocked in production

- [ ] **Environment Variables**
  - [ ] Verify all production secrets are set
  - [ ] Confirm no secrets in .env.example
  - [ ] Document any additional required env vars

- [ ] **Security Headers**
  - [ ] Verify CSP works in production
  - [ ] Test that HSTS is enabled
  - [ ] Confirm frame-ancestors blocks embedding

### Post-Launch Monitoring

- [ ] Monitor rate limit violations
- [ ] Check for RLS policy violations
- [ ] Review Sentry error reports
- [ ] Monitor CSP violation reports (if endpoint added)
- [ ] Regular npm audit runs

---

## Recommendations for Production

### Immediate Actions (Before Launch)

1. **Fix CORS Configuration** (5 min)
   - Make localhost conditional on NODE_ENV
   - Deploy and test

2. **Enable RLS on Profiles** (5 min)
   - Run SQL policies from Section 1
   - Test with non-admin user

3. **Verify Storage Policies** (10 min)
   - Check Supabase Dashboard → Storage → avatars
   - Add missing policies if needed
   - Test upload restrictions

### Short-term Improvements (First Week)

1. **RLS Comprehensive Audit**
   - Run `scripts/rls-audit.ts` against production DB
   - Verify all tables mentioned in audit script
   - Document any intentionally unprotected tables

2. **Security Testing**
   - Test auth flows as non-admin user
   - Attempt to access other users' data
   - Test file upload restrictions
   - Verify rate limiting works

3. **Documentation**
   - Document all SECURITY DEFINER functions
   - Create security incident response plan
   - Document security monitoring procedures

### Long-term Security Posture

1. **Monitoring & Alerting**
   - Set up CSP violation reporting
   - Monitor rate limit violations
   - Track failed auth attempts
   - Set up Sentry alerts for security errors

2. **Regular Audits**
   - Monthly npm audit reviews
   - Quarterly security policy reviews
   - Annual penetration testing

3. **Security Best Practices**
   - Keep dependencies updated
   - Review new endpoints for security
   - Require security review for database changes
   - Maintain security documentation

---

## Previous Security Audit (October 27, 2025)

### Security Improvements Implemented

**1. Security Headers (Helmet) ✅**
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy
- Cross-Origin Resource Policy

**2. Strict CORS Configuration ✅**
- Allowlist-based with no wildcards
- Production and staging domains configured
- Credentials enabled for auth

**3. Rate Limiting ✅**
- authLimiter: 100 req/15min
- apiLimiter: 1000 req/15min
- strictLimiter: 30 req/min
- webhookLimiter: 30 req/min

**4. XSS Protection ✅**
- sanitizeHtml() for rich content
- sanitizePlainText() for plain fields
- All user input sanitized

**5. Compression ✅**
- gzip/brotli enabled

**6. NPM Audit ✅**
- 6 moderate vulnerabilities found
- All in dev dependencies only
- Low risk, plan Vite v7 upgrade

---

## Conclusion

**Security Status:** ✅ STRONG with minor improvements needed

The application has a robust security foundation with:
- ✅ Strong security headers
- ✅ Proper rate limiting
- ✅ XSS protection
- ✅ Most RLS policies in place
- ✅ Good CORS configuration (needs minor fix)

**Recommended Action Before Production Launch:**
1. Fix the 3 medium-priority issues (20 minutes total)
2. Run comprehensive RLS audit in production
3. Test all security measures with non-admin user

**Overall Assessment:** The application is **production-ready** once the identified medium-priority issues are resolved. The security infrastructure is well-designed and follows industry best practices.

---

**Audit Completed By:** Replit Agent Security Subagent  
**Next Review Date:** 30 days after production launch  
**Contact:** For security concerns, contact security team or create incident report
