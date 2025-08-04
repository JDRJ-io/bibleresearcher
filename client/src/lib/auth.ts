import { supabase } from './supabaseClient';

export interface AuthResponse {
  success: boolean;
  message: string;
  error?: any;
}

// Magic Link Authentication System
export async function sendMagicLink(email: string): Promise<AuthResponse> {
  try {
    console.log('🔗 Sending magic link to:', email);
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: true,
      }
    });

    if (error) {
      console.error('❌ Magic link error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send magic link',
        error
      };
    }

    console.log('✅ Magic link sent successfully');
    return {
      success: true,
      message: 'Check your email for a magic link to sign in'
    };
  } catch (error) {
    console.error('❌ Unexpected auth error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error
    };
  }
}

// Sign out user
export async function signOut(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return {
        success: false,
        message: error.message,
        error
      };
    }

    return {
      success: true,
      message: 'Signed out successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'An unexpected error occurred',
      error
    };
  }
}

// Get current user session
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Unexpected session error:', error);
    return null;
  }
}

// Refresh the current session
export async function refreshSession() {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Refresh error:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Unexpected refresh error:', error);
    return null;
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return Boolean(supabase.auth.getUser());
}