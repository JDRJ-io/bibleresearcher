import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabaseClient';
import { LoadingWheel } from '@/components/LoadingWheel';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the 'code' parameter from URL (modern PKCE flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
          console.log('🔑 Found auth code, exchanging for session...');
          
          // Exchange the code for a session (PKCE flow)
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('❌ Code exchange error:', error);
            setStatus('error');
            setMessage(error.message || 'Authentication failed');
            setTimeout(() => setLocation('/'), 3000);
            return;
          }

          if (data.session) {
            console.log('✅ Authentication successful:', data.session.user?.email);
            setStatus('success');
            setMessage(`Welcome, ${data.session.user?.email}!`);
            
            // Clear the URL parameters
            window.history.replaceState(null, '', window.location.pathname);
            
            // Check if this is a new user who needs to complete their profile
            const isNewUser = data.session.user?.user_metadata?.isNewUser;
            
            // TODO: Check if profile exists/is complete
            // For now, redirect new users to welcome page
            const redirectPath = isNewUser ? '/welcome' : '/';
            
            // Redirect after a brief success message
            setTimeout(() => setLocation(redirectPath), 2000);
            return;
          }
        }

        // Fallback: Check for old hash-based tokens (legacy flow)
        const hashFragment = window.location.hash;
        if (hashFragment) {
          const params = new URLSearchParams(hashFragment.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('❌ Legacy auth error:', error);
              setStatus('error');
              setMessage(error.message || 'Authentication failed');
              setTimeout(() => setLocation('/'), 3000);
              return;
            }

            if (data.session) {
              console.log('✅ Legacy authentication successful:', data.session.user?.email);
              setStatus('success');
              setMessage(`Welcome, ${data.session.user?.email}!`);
              
              window.history.replaceState(null, '', window.location.pathname);
              const isNewUser = data.session.user?.user_metadata?.isNewUser;
              const redirectPath = isNewUser ? '/welcome' : '/';
              setTimeout(() => setLocation(redirectPath), 2000);
              return;
            }
          }
        }

        // Final fallback: try to get existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session retrieval error:', error);
          setStatus('error');
          setMessage('Failed to retrieve session');
        } else if (session) {
          console.log('✅ Session found:', session.user?.email);
          setStatus('success');
          setMessage(`Welcome back, ${session.user?.email}!`);
        } else {
          setStatus('error');
          setMessage('No active session found');
        }
        
        setTimeout(() => setLocation('/'), 3000);
        
      } catch (error) {
        console.error('❌ Unexpected callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');
        setTimeout(() => setLocation('/'), 3000);
      }
    };

    handleAuthCallback();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Anointed Bible Study
          </h2>
          
          {status === 'loading' && (
            <div className="space-y-4">
              <LoadingWheel size="large" />
              <p className="text-gray-600 dark:text-gray-400">
                Completing authentication...
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 dark:text-green-400 font-medium">
                {message}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Redirecting to your Bible study...
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-600 dark:text-red-400 font-medium">
                {message}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Redirecting to homepage...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}