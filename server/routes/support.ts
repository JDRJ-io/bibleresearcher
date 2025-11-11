import express from 'express';
import { z } from 'zod';

const router = express.Router();

const SUPPORT_TO = 'support@anointed.io';
const FROM = 'support@anointed.io';

const isPrelaunch = () => 
  process.env.SUPPORT_PRELAUNCH_MODE === 'true' || !process.env.POSTMARK_SERVER_TOKEN;

const supportEmailSchema = z.object({
  message: z.string().min(5, 'Message too short').max(10000, 'Message too long'),
  sender: z.string().email('Invalid email').optional(),
  page: z.string().optional(),
  userAgent: z.string().optional(),
  userId: z.string().optional(),
});

function stripHtml(s: string) { 
  return s.replace(/<[^>]*>/g, ''); 
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

router.post('/support-email', async (req, res) => {
  try {
    const { message, sender, page, userAgent, userId } = supportEmailSchema.parse(req.body);

    const safeSender = sender && /.+@.+\..+/.test(sender) ? sender : undefined;

    console.log('[support-email] incoming', {
      prelaunch: isPrelaunch(),
      from: safeSender,
      page,
      userAgent,
      userId,
      preview: message.slice(0, 200)
    });

    if (isPrelaunch()) {
      return res.json({ ok: true, mode: 'prelaunch' });
    }

    let postmarkClient: any = null;
    if (!postmarkClient) {
      const Postmark = (await import('postmark')).default;
      postmarkClient = new Postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');
    }

    const subject = 'Anointed.io Beta Feedback';
    const html = `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial">
        <h3>New Beta Feedback</h3>
        <p><b>From:</b> ${safeSender || '(no email provided)'}${userId ? ` &middot; <b>UserID:</b> ${userId}` : ''}</p>
        <p><b>Page:</b> ${page || '(unknown)'}<br/>
           <b>Agent:</b> ${userAgent || '(unknown)'}
        </p>
        <pre style="white-space:pre-wrap;background:#f6f7f9;padding:12px;border-radius:10px">${escapeHtml(message)}</pre>
      </div>
    `;

    await postmarkClient.sendEmail({
      From: FROM,
      To: SUPPORT_TO,
      ReplyTo: safeSender,
      Subject: subject,
      HtmlBody: html,
      TextBody: stripHtml(message),
      MessageStream: process.env.POSTMARK_MESSAGE_STREAM || 'outbound'
    });

    return res.json({ ok: true, mode: 'live' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    console.error('support-email error', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
