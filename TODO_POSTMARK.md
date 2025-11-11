# Postmark Email Configuration - TODO

## Status: Waiting for Credentials

To complete email setup, you need to:

### 1. Get Postmark Account & API Token

1. Sign up at https://postmarkapp.com/ (free trial available)
2. Create a new server named "Anointed Production"
3. Go to **Servers** → **API Tokens**
4. Copy the **Server API Token**
5. Add it to Replit Secrets as `POSTMARK_SERVER_TOKEN`

### 2. Add Other Environment Variables

Add these to Replit Secrets:
```
POSTMARK_FROM_EMAIL=no-reply@notify.anointed.io
SUPPORT_INBOX=support@anointed.io
SITE_URL=https://anointed.io
SUPPORT_PRELAUNCH_MODE=false
```

### 3. Configure DNS Records

In your domain registrar (where you manage anointed.io), add:

| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| TXT | `notify.anointed.io` | `v=spf1 include:spf.mtasv.net ~all` | 3600 |
| CNAME | `pm-bounces.notify.anointed.io` | `pm.mtasv.net` | 3600 |
| TXT | `_dmarc.notify.anointed.io` | `v=DMARC1; p=none; rua=mailto:dmarc@anointed.io; fo=1` | 3600 |

**DKIM Records:** Postmark will provide 2 DKIM CNAME records when you add your domain. Get these from Postmark dashboard.

### 4. Verify Domain in Postmark

1. In Postmark → **Sender Signatures** → Add Domain
2. Enter: `notify.anointed.io`
3. Add all DNS records shown
4. Wait 15-60 minutes for DNS propagation
5. Click **Verify** in Postmark

### 5. Test Email Sending

```bash
# Test support email
curl -X POST https://anointed.io/api/support-email \
  -H "Content-Type: application/json" \
  -d '{"fromEmail":"test@example.com","subject":"Test","message":"Testing"}'

# Verify in Gmail: Show original → Check SPF/DKIM/DMARC = PASS
```

---

See `docs/POSTMARK_SETUP_GUIDE.md` for detailed instructions.
