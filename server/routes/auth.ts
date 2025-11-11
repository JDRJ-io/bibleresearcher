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

// Sign in body schema
const signinSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

// Check username availability
router.get('/username-available', async (req, res) => {
  try {
    const u = String(req.query.u || '').trim();
    const parsed = usernameSchema.safeParse(u);
    
    if (!parsed.success) {
      return res.json({ ok: true, available: false, reason: 'invalid' });
    }

    // Check if username exists in profiles table
    const { data: existingProfile, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', u.toLowerCase())
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Username availability check error:', error);
      return res.status(500).json({ ok: false, error: 'Database error' });
    }
    
    // Username is available if no profile was found
    const available = !existingProfile;
    
    return res.json({ ok: true, available });
  } catch (e: any) {
    console.error('Username availability check exception:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// Sign up with username
router.post('/signup', async (req, res) => {
  try {
    const { email, password, username, displayName } = signupSchema.parse(req.body);

    // Check if username is already taken
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username.trim().toLowerCase())
      .single();
      
    if (existingProfile) {
      return res.status(400).json({ ok: false, error: 'Username already taken' });
    }

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

    // Create profile record if user was created
    if (data.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email!,
          username: username.trim().toLowerCase(),
          display_name: displayName ?? username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
        
      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail the signup if profile creation fails
      }
    }

    // Check if email confirmation is needed
    const needsConfirmation = !data.session;
    
    return res.json({ 
      ok: true, 
      userId: data.user?.id ?? null, 
      needsConfirmation,
      message: needsConfirmation ? 'Please check your email to confirm your account' : 'Account created successfully'
    });
  } catch (e: any) {
    return res.status(400).json({ ok: false, error: e.message });
  }
});

// Sign in with username/email
router.post('/signin', async (req, res) => {
  try {
    const { username, password } = signinSchema.parse(req.body);
    
    // First, check if username looks like an email
    const isEmail = username.includes('@');
    let email = username;
    
    if (!isEmail) {
      // If it's a username, we need to look up the email from the profile
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();
      
      if (profileError || !profileData) {
        return res.status(400).json({ ok: false, error: 'User not found' });
      }
      
      // Get the email from the user record
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profileData.id);
      
      if (userError || !userData.user?.email) {
        return res.status(400).json({ ok: false, error: 'User not found' });
      }
      
      email = userData.user.email;
    }
    
    // Sign in with email and password
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return res.status(400).json({ ok: false, error: 'Invalid credentials' });
    }
    
    if (!data.session || !data.user) {
      return res.status(400).json({ ok: false, error: 'Sign in failed' });
    }
    
    return res.json({ 
      ok: true, 
      user: data.user,
      session: data.session
    });
  } catch (e: any) {
    return res.status(400).json({ ok: false, error: e.message });
  }
});

export default router;