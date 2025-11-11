import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { sendEmail } from "../server/lib/email";

const Body = z.object({
  from: z.string().email(),
  message: z.string().min(5).max(8000)
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  try {
    const parsed = Body.parse(req.body);
    const supportInbox = process.env.SUPPORT_INBOX || process.env.POSTMARK_FROM_EMAIL || 'support@anointed.io';
    const safeMessage = parsed.message.slice(0, 8000);
    
    const textBody = `Support message from: ${parsed.from}\n\n${safeMessage}`;
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f5f5f5; padding: 15px; border-radius: 8px 8px 0 0; border-bottom: 2px solid #667eea; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
    .from { color: #667eea; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p style="margin: 0;"><strong>Support Request</strong></p>
      <p style="margin: 5px 0 0 0; font-size: 14px;">From: <span class="from">${parsed.from}</span></p>
    </div>
    <div class="content">
      ${safeMessage.split('\n').map(line => `<p>${line}</p>`).join('')}
    </div>
  </div>
</body>
</html>
    `.trim();
    
    const success = await sendEmail({
      to: supportInbox,
      subject: `Support message from ${parsed.from}`,
      textBody,
      htmlBody,
      messageStream: 'outbound'
    });
    
    if (!success) {
      console.error('[support-email] Failed to send support email', { from: parsed.from });
      return res.status(500).json({ error: "Failed to send support email" });
    }
    
    console.log('[support-email] Support email sent successfully', { from: parsed.from, to: supportInbox });
    res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('[support-email] Error:', err);
    res.status(400).json({ error: err?.message || "Bad request" });
  }
}
