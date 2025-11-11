# Postmark DNS Configuration Guide

This guide explains how to configure DNS records for Postmark email delivery on **anointed.io** and the dedicated email subdomain **mail.anointed.io**.

## Why a Dedicated Email Subdomain?

Using `mail.anointed.io` for sending emails:
- Protects your main domain's email reputation
- Isolates email-specific DNS records
- Makes troubleshooting easier
- Follows email deliverability best practices

## Required DNS Records

### 1. DKIM (DomainKeys Identified Mail)

DKIM cryptographically signs your emails to prove they're genuinely from you.

**Record Type:** TXT  
**Host/Name:** `[provided-by-postmark].mail.anointed.io`  
**Value:** `[DKIM-key-provided-by-postmark]`

> **Note:** Postmark will provide the exact hostname and value when you add your sending domain in their dashboard.

### 2. Return-Path (Bounce Handling)

Handles bounced emails properly.

**Record Type:** CNAME  
**Host/Name:** `pm-bounces.mail.anointed.io`  
**Value:** `pm.mtasv.net`

### 3. SPF (Sender Policy Framework)

Declares that Postmark's servers are authorized to send emails for your domain.

**Record Type:** TXT  
**Host/Name:** `mail.anointed.io`  
**Value:** `v=spf1 include:spf.mtasv.net ~all`

If you already have an SPF record on `mail.anointed.io`, add `include:spf.mtasv.net` to it instead of creating a duplicate.

### 4. DMARC (Domain-based Message Authentication, Reporting & Conformance)

Tells receiving servers how to handle emails that fail SPF/DKIM checks.

**Record Type:** TXT  
**Host/Name:** `_dmarc.mail.anointed.io`  
**Value (Start with monitoring):** `v=DMARC1; p=none; rua=mailto:dmarc@anointed.io`

**After 2-4 weeks of monitoring, upgrade to quarantine:**  
`v=DMARC1; p=quarantine; rua=mailto:dmarc@anointed.io`

**When fully confident, set to reject:**  
`v=DMARC1; p=reject; rua=mailto:dmarc@anointed.io`

### 5. MX Record (Optional, if receiving emails)

Only needed if you want to **receive** emails at `mail.anointed.io`. For sending-only, you can skip this.

**Record Type:** MX  
**Host/Name:** `mail.anointed.io`  
**Value:** `mx.postmarkapp.com`  
**Priority:** 10

---

## Step-by-Step Setup in Postmark

### 1. Add Your Sending Domain

1. Log in to [Postmark](https://postmarkapp.com/)
2. Go to **Servers** → Select your server
3. Click **Sender Signatures** → **Add Sender Signature**
4. Choose **Domain** (not "Single Email Address")
5. Enter: `mail.anointed.io`
6. Postmark will show you the exact DNS records to add

### 2. Add DNS Records to Your Domain Registrar

Depending on where you manage DNS for `anointed.io` (Vercel, Cloudflare, Namecheap, etc.):

1. Navigate to your DNS management dashboard
2. Add each DNS record from Postmark's verification page
3. **Important:** DNS propagation can take 5 minutes to 48 hours (usually under 1 hour)

### 3. Verify Domain in Postmark

1. Return to Postmark → **Sender Signatures**
2. Click **Verify** next to `mail.anointed.io`
3. Postmark will check your DNS records
4. Once verified, you'll see a green checkmark ✅

### 4. Configure Message Streams

Postmark uses **Message Streams** to separate email types:

- **Transactional Stream** (`outbound`): Magic links, password resets, account notifications
- **Broadcast Stream** (`broadcasts`): Newsletters, announcements, updates

1. Go to **Message Streams** in Postmark
2. Use the default `Outbound` stream for transactional emails
3. Optionally create a `Broadcasts` stream for newsletters

### 5. Get Your API Key

1. Go to **Servers** → Select your server → **API Tokens**
2. Copy the **Server API Token**
3. Add it to your environment variables:

```bash
POSTMARK_SERVER_TOKEN=your-server-api-token-here
POSTMARK_FROM_EMAIL=no-reply@mail.anointed.io
```

---

## Environment Variables Needed

Add these to your **Vercel** environment variables (or `.env` file):

```bash
# Postmark Configuration
POSTMARK_SERVER_TOKEN=your-postmark-server-token
POSTMARK_FROM_EMAIL=no-reply@mail.anointed.io
```

---

## Testing Email Delivery

### Test via API Route

```bash
curl -X POST https://anointed.io/api/email/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "magicLink": "https://anointed.io/auth/callback?token=test123"
  }'
```

### Check Inbox Placement

Send test emails to:
- Gmail account
- Outlook/Hotmail account
- Apple Mail (iCloud)

Verify they arrive in the **Inbox** (not spam).

### Monitor in Postmark

1. Go to **Activity** in Postmark dashboard
2. View delivery status, bounces, and spam complaints
3. Check email content rendering

---

## Warm-Up Schedule (Important!)

Don't send high volumes immediately. Gradually increase sending to build sender reputation:

| Day | Max Emails |
|-----|------------|
| 1-3 | 50/day     |
| 4-7 | 100/day    |
| 8-14| 250/day    |
| 15+ | Full volume|

---

## DNS Record Summary (Quick Reference)

| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| TXT  | `[postmark-selector].mail.anointed.io` | `[DKIM-from-postmark]` | 3600 |
| CNAME| `pm-bounces.mail.anointed.io` | `pm.mtasv.net` | 3600 |
| TXT  | `mail.anointed.io` | `v=spf1 include:spf.mtasv.net ~all` | 3600 |
| TXT  | `_dmarc.mail.anointed.io` | `v=DMARC1; p=none; rua=mailto:dmarc@anointed.io` | 3600 |

---

## Troubleshooting

### Domain Not Verifying

- **Check DNS propagation:** Use [DNS Checker](https://dnschecker.org/)
- **Wait longer:** DNS can take up to 24 hours to propagate globally
- **Check for typos:** Ensure exact values match Postmark's requirements

### Emails Going to Spam

- **Verify DKIM/SPF/DMARC:** All three must be passing
- **Avoid spam trigger words:** "Free", "Click here", excessive exclamation marks
- **Test with [Mail Tester](https://www.mail-tester.com/):** Get a spam score rating
- **Add unsubscribe link:** Required for broadcast emails

### Bounced Emails

- **Check email address validity:** Verify recipient emails are correct
- **Review bounce reasons:** Postmark shows why emails bounced (invalid, full mailbox, etc.)
- **Maintain clean list:** Remove invalid addresses to protect sender reputation

---

## Post-Launch Monitoring

### Daily Checks (First 2 Weeks)

- Bounce rate (should be < 5%)
- Spam complaint rate (should be < 0.1%)
- Open rates (if tracking is enabled)

### Monthly Review

- DMARC reports (check `dmarc@anointed.io` inbox)
- Postmark activity dashboard
- Sender reputation score

---

## Additional Resources

- [Postmark Documentation](https://postmarkapp.com/support)
- [DMARC Analyzer](https://dmarc.org/)
- [SPF Record Checker](https://mxtoolbox.com/spf.aspx)
- [DKIM Record Checker](https://mxtoolbox.com/dkim.aspx)

---

**Questions or Issues?**

Contact Postmark support at [support@postmarkapp.com](mailto:support@postmarkapp.com) - they have excellent customer service and can help with DNS verification issues.
