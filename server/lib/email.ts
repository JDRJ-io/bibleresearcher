import { ServerClient } from 'postmark';

if (!process.env.POSTMARK_SERVER_TOKEN) {
  console.warn('⚠️  POSTMARK_SERVER_TOKEN not set. Email functionality will be disabled.');
}

const client = process.env.POSTMARK_SERVER_TOKEN 
  ? new ServerClient(process.env.POSTMARK_SERVER_TOKEN)
  : null;

export interface SendEmailOptions {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  messageStream?: 'outbound' | 'broadcasts';
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!client) {
    console.error('Postmark client not initialized. Check POSTMARK_SERVER_TOKEN.');
    return false;
  }

  try {
    await client.sendEmail({
      From: process.env.POSTMARK_FROM_EMAIL || 'no-reply@mail.anointed.io',
      To: options.to,
      Subject: options.subject,
      TextBody: options.textBody,
      HtmlBody: options.htmlBody,
      MessageStream: options.messageStream || 'outbound',
      TrackOpens: false,
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendMagicLink(email: string, magicLink: string): Promise<boolean> {
  const textBody = `
Welcome to Anointed.io Biblical Research Platform!

Click the link below to sign in to your account:

${magicLink}

This link will expire in 1 hour for security reasons.

If you didn't request this link, you can safely ignore this email.

Blessings,
The Anointed.io Team
  `.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
    .link { color: #667eea; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✨ Anointed.io</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Biblical Research Platform</p>
    </div>
    <div class="content">
      <h2>Welcome!</h2>
      <p>Click the button below to sign in to your account:</p>
      <div style="text-align: center;">
        <a href="${magicLink}" class="button">Sign In to Anointed.io</a>
      </div>
      <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
      <p class="link" style="font-size: 12px;">${magicLink}</p>
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #666;">
        ⏱️ This link will expire in <strong>1 hour</strong> for security reasons.
      </p>
      <p style="font-size: 14px; color: #666;">
        If you didn't request this link, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>Blessings from the Anointed.io Team 🙏</p>
      <p style="font-size: 12px;">© ${new Date().getFullYear()} Anointed.io. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: email,
    subject: '✨ Sign in to Anointed.io',
    textBody,
    htmlBody,
    messageStream: 'outbound',
  });
}

export async function sendNotification(
  email: string, 
  subject: string, 
  message: string
): Promise<boolean> {
  const textBody = `
${message}

---
Anointed.io Biblical Research Platform
  `.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
    </div>
    <div class="footer">
      <p style="font-size: 12px;">© ${new Date().getFullYear()} Anointed.io. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: email,
    subject,
    textBody,
    htmlBody,
    messageStream: 'broadcasts',
  });
}
