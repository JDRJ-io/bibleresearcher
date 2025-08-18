import express from 'express';
import { supabaseClient, supabaseAdmin } from '../lib/supabase';
import { z } from 'zod';

const router = express.Router();

// Username validation schema
const usernameSchema = z.string().min(3).max(24).regex(/^[A-Za-z0-9_]+$/);

// Sign up body schema
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(24).regex(/^[A-Za-z0-9_]+$/),
  displayName: z.string().max(80).optional()
});

// Check username availability
router.get('/api/auth/username-available', async (req, res) => {
  try {
    const u = String(req.query.u || '').trim();
    const parsed = usernameSchema.safeParse(u);
    
    if (!parsed.success) {
      return res.json({ ok: true, available: false, reason: 'invalid' });
    }

    const { data, error } = await supabaseAdmin
      .rpc('username_available', { u });
    
    if (error) throw error;
    
    return res.json({ ok: true, available: !!data });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// Sign up with username
router.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, username, displayName } = signupSchema.parse(req.body);

    // Sign up user with username in metadata
    const { data, error } = await supabaseClient.auth.signUp({
      email, 
      password,
      options: { 
        data: { 
          username, 
          display_name: displayName ?? username 
        } 
      }
    });
    
    if (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }

    // Check if email confirmation is needed
    const needsConfirmation = !data.session;
    
    return res.json({ 
      ok: true, 
      userId: data.user?.id ?? null, 
      needsConfirmation 
    });
  } catch (e: any) {
    return res.status(400).json({ ok: false, error: e.message });
  }
});

export default router;