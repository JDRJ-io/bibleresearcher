import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const router = express.Router();

// Profile update schema
const profileSchema = z.object({
  username: z.string().min(3).max(24).regex(/^[A-Za-z0-9_]+$/).optional(),
  displayName: z.string().max(80).optional(),
  avatarUrl: z.string().url().optional()
});

// Update profile
router.post('/update', async (req, res) => {
  try {
    // Require user session (Bearer token from client)
    const authHeader = req.headers.authorization || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!accessToken) {
      return res.status(401).json({ ok: false, error: 'missing token' });
    }

    // Create supabase client with user token
    const supa = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    const { username, displayName, avatarUrl } = profileSchema.parse(req.body);

    // Build updates object
    const updates: any = {};
    if (typeof username === 'string') updates.username = username;
    if (typeof displayName === 'string') updates.display_name = displayName;
    if (typeof avatarUrl === 'string') updates.avatar_url = avatarUrl;

    if (!Object.keys(updates).length) {
      return res.json({ ok: true });
    }

    // Get current user
    const { data: { user }, error: userError } = await supa.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ ok: false, error: 'invalid token' });
    }

    // Update profile
    const { data, error } = await supa
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('id')
      .single();

    if (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }
    
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(400).json({ ok: false, error: e.message });
  }
});

export default router;