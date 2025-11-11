# Postmark Email Setup Guide

Complete guide for setting up Postmark email service for Anointed.io.

## What Postmark is Used For

On Anointed.io, Postmark handles:
- ✅ **Support emails** - User feedback sent to support@anointed.io
- ✅ **Custom notifications** - Announcements, updates, donation receipts
- ❌ **NOT** authentication emails - Supabase handles signup confirmation emails automatically

---

## Step 1: Environment Variables

Add these to your Replit Secrets or `.env` file:

```bash
# Postmark Configuration
POSTMARK_SERVER_TOKEN=your-server-token-from-postmark
POSTMARK_FROM_EMAIL=no-reply@notify.anointed.io
POSTMARK_MESSAGE_STREAM=outbound
SUPPORT_INBOX=support@anointed.io

# Site Configuration
SITE_URL=https://anointed.io

# Disable pre-launch mode when ready to send real emails
SUPPORT_PRELAUNCH_MODE=false
VITE_SUPPORT_PRELAUNCH_MODE=false
```

### Where to Get POSTMARK_SERVER_TOKEN:

1. Sign up at [Postmark](https://postmarkapp.com/)
2. Create a new server (name it "Anointed Production")
3. Go to **Servers** → **API Tokens**
4. Copy the **Server API Token**

---

## Step 2: DNS Configuration

Add these DNS records at your domain registrar (where you manage anointed.io):

### Required Records:

| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| **SPF** | `notify.anointed.io` | `v=spf1 include:spf.mtasv.net ~all` | 3600 |
| **DKIM** | `[selector].notify.anointed.io` | `[value-from-postmark]` | 3600 |
| **Return-Path** | `pm-bounces.notify.anointed.io` | `pm.mtasv.net` | 3600 |
| **DMARC** | `_dmarc.notify.anointed.io` | `v=DMARC1; p=none; rua=mailto:dmarc@anointed.io; fo=1` | 3600 |

### Getting DKIM Values:

1. In Postmark, go to **Sender Signatures** → **Add Domain**
2. Enter: `notify.anointed.io`
3. Postmark will show you the exact DKIM records to add
4. Copy the **Host** and **Value** for each DKIM record

### DNS Propagation:

- DNS changes take **15 minutes to 48 hours** to propagate globally
- Check status: [DNS Checker](https://dnschecker.org/)
- Postmark will show "Verified" when DNS is correct

---

## Step 3: Verify Domain in Postmark

1. After adding DNS records, go to Postmark → **Sender Signatures**
2. Click **Verify** next to `notify.anointed.io`
3. Wait for green checkmark ✅

If verification fails:
- Wait 1 hour and try again (DNS propagation)
- Use [MXToolbox](https://mxtoolbox.com/spf.aspx) to verify SPF
- Use [MXToolbox DKIM](https://mxtoolbox.com/dkim.aspx) to verify DKIM

---

## Step 4: Test Email Sending

### Test 1: Support Email

```bash
curl -X POST https://anointed.io/api/support-email \
  -H "Content-Type: application/json" \
  -d '{
    "fromEmail": "test@example.com",
    "subject": "Test Email",
    "message": "This is a test of the support email system."
  }'
```

**Expected Result:** Email arrives at `support@anointed.io`

### Test 2: Generic Notification

```bash
curl -X POST https://anointed.io/api/email/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Hello from Anointed.io",
    "text": "This is a test notification email."
  }'
```

**Expected Result:** Email arrives in your inbox

### Test 3: Verify Email Authentication

1. Open the received email in Gmail
2. Click **⋮** (three dots) → **Show original**
3. Look for these headers:

```
SPF: PASS
DKIM: PASS  
DMARC: PASS
```

If any show FAIL, check your DNS records.

---

## Step 5: DMARC Progression (Post-Launch)

Start with monitoring mode, then gradually tighten:

### Week 1-2: Monitor Mode
```
v=DMARC1; p=none; rua=mailto:dmarc@anointed.io; fo=1
```

### Week 3-4: Quarantine Mode
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@anointed.io; fo=1
```

### Month 2+: Reject Mode (Strictest)
```
v=DMARC1; p=reject; rua=mailto:dmarc@anointed.io; fo=1
```

Monitor DMARC reports sent to `dmarc@anointed.io` before progressing.

---

## Troubleshooting

### Emails Going to Spam

**Causes:**
- DNS records not verified
- DKIM/SPF failing
- Low sender reputation (new domain)

**Solutions:**
1. Verify all DNS records show PASS
2. Test with [Mail Tester](https://www.mail-tester.com/)
3. Send to Gmail, Outlook, iCloud to test different providers
4. Warm up your domain (start with low volume)

### Emails Not Sending

**Check:**
1. `POSTMARK_SERVER_TOKEN` is set correctly
2. `SUPPORT_PRELAUNCH_MODE=false` (not true)
3. Postmark domain is verified (green checkmark)
4. Check Postmark Activity dashboard for errors

### DNS Not Verifying

**Solutions:**
1. Wait 1-2 hours for propagation
2. Check DNS with [DNS Checker](https://dnschecker.org/)
3. Verify you added records to the correct zone (anointed.io)
4. Check for typos in TXT record values

---

## Email Warm-Up Schedule

Don't send high volumes immediately. Gradually increase to build sender reputation:

| Days | Max Emails/Day |
|------|----------------|
| 1-3  | 50             |
| 4-7  | 100            |
| 8-14 | 250            |
| 15+  | Unlimited      |

---

## Monitoring (First 2 Weeks)

Check daily in Postmark Activity dashboard:
- ✅ **Delivery Rate** > 95%
- ✅ **Bounce Rate** < 5%
- ✅ **Spam Complaints** < 0.1%

If metrics are poor:
- Review email content (avoid spam trigger words)
- Check authentication (SPF/DKIM/DMARC)
- Reduce sending volume

---

## Quick Reference

**Postmark Dashboard:**
- Activity: https://account.postmarkapp.com/servers/[server-id]/streams/outbound/activity
- Sender Signatures: https://account.postmarkapp.com/signatures

**DNS Verification Tools:**
- SPF: https://mxtoolbox.com/spf.aspx
- DKIM: https://mxtoolbox.com/dkim.aspx
- DNS Propagation: https://dnschecker.org/

**Email Testing:**
- Mail Tester: https://www.mail-tester.com/
- Gmail Show Original: ⋮ → Show original (in received email)

---

## Support

If you need help:
- **Postmark Support:** support@postmarkapp.com (excellent response time)
- **DNS Issues:** Check with your domain registrar
- **Application Issues:** Check server logs for Postmark API errors

---

**You're ready to send production emails! 🎉**
