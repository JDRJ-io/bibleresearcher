import { supabase } from './supabaseClient';

export interface AuthResponse {
  success: boolean;
  message: string;
  error?: any;
  data?: any;
}

// Password Authentication System
export async function signInWithPassword(email: string, password: string): Promise<AuthResponse> {
  try {
    console.log('🔑 Signing in with password for:', email);
    
    const { data, error } = await supabase().auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Sign in error:', error);
      return {
        success: false,
        message: error.message || 'Failed to sign in',
        error
      };
    }

    console.log('✅ Sign in successful:', data.user?.email);
    return {
      success: true,
      message: 'Signed in successfully'
    };
  } catch (error) {
    console.error('❌ Unexpected sign in error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error
    };
  }
}

export async function signUpWithPassword(email: string, password: string, username?: string, displayName?: string, marketingOptIn?: boolean): Promise<AuthResponse> {
  try {
    console.log('📝 Signing up with password for:', email, 'with metadata:', { username, displayName, marketingOptIn });
    
    const { data, error } = await supabase().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: {
          username: username || '',
          display_name: displayName || username || '',
          marketing_opt_in: marketingOptIn || false
        }
      }
    });

    if (error) {
      console.error('❌ Sign up error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create account',
        error
      };
    }

    console.log('✅ Sign up successful:', data.user?.email, 'Session created:', !!data.session);
    console.log('📋 User metadata sent to Supabase:', data.user?.user_metadata);
    
    return {
      success: true,
      message: data.session ? 'Account created successfully!' : 'Please check your email to confirm your account',
      data
    };
  } catch (error) {
    console.error('❌ Unexpected sign up error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error
    };
  }
}

// Legacy magic link function (kept for backward compatibility)
export async function sendMagicLink(email: string): Promise<AuthResponse> {
  try {
    console.log('🔗 Sending magic link to:', email);
    
    const { data, error } = await supabase().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.search ? '&' : '?'}fromEmail=yes`,
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
    const { error } = await supabase().auth.signOut();
    
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
    const { data: { session }, error } = await supabase().auth.getSession();
    
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
    const { data: { session }, error } = await supabase().auth.refreshSession();
    
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

// Check if user is authenticated - Note: This function is deprecated in 2J pattern
// Use the useAuth() hook from AuthContext instead to check if user?.id exists
export function isAuthenticated(): boolean {
  console.warn('isAuthenticated() is deprecated. Use useAuth() hook instead.');
  return false;
}