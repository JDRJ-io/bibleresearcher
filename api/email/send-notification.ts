import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { sendNotification } from "../../server/lib/email";

const Body = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1)
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
    const success = await sendNotification(parsed.to, parsed.subject, parsed.message);
    
    if (!success) {
      console.error('[send-notification] Failed to send email', { to: parsed.to, subject: parsed.subject });
      return res.status(500).json({ error: "Failed to send notification email" });
    }
    
    console.log('[send-notification] Email sent successfully', { to: parsed.to, subject: parsed.subject });
    res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('[send-notification] Error:', err);
    res.status(400).json({ error: err?.message || "Bad request" });
  }
}
