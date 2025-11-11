import express from 'express';
import { sendMagicLink, sendNotification } from '../lib/email';
import { z } from 'zod';

const router = express.Router();

const magicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
  magicLink: z.string().url('Invalid magic link URL'),
});

const notificationSchema = z.object({
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  message: z.string().min(1, 'Message is required').max(10000, 'Message too long'),
});

router.post('/send-magic-link', async (req, res) => {
  try {
    const { email, magicLink } = magicLinkSchema.parse(req.body);
    
    const success = await sendMagicLink(email, magicLink);
    
    if (success) {
      res.json({ success: true, message: 'Magic link sent successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send email' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    console.error('Error sending magic link:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/send-notification', async (req, res) => {
  try {
    const { email, subject, message } = notificationSchema.parse(req.body);
    
    const success = await sendNotification(email, subject, message);
    
    if (success) {
      res.json({ success: true, message: 'Notification sent successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send email' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    console.error('Error sending notification:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
