import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabaseClient';
import { LoadingWheel } from '@/components/LoadingWheel';

export default function ConfirmEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check for hash-based confirmation (most common for email confirmations)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        // Check for query-based confirmation (PKCE flow, token-based, or code exchange)
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');
        const token = queryParams.get('token');
        const tokenHash = queryParams.get('token_hash');
        const confirmationType = queryParams.get('type');
        
        // Handle hash-based confirmation (signup confirmations with access_token)
        if (accessToken && type === 'signup') {
          const { data, error } = await supabase().auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
          
          if (error) {
            console.error('Email confirmation error:', error);
            setStatus('error');
            setMessage(error.message || 'Email confirmation failed');
            setTimeout(() => setLocation('/'), 3000);
            return;
          }

          if (data.session) {
            setStatus('success');
            setMessage('Email confirmed successfully! Welcome to Anointed.');
            window.history.replaceState(null, '', window.location.pathname);
            setTimeout(() => setLocation('/'), 2000);
            return;
          }
        }
        
        // Handle query-style token confirmations (token + type + email)
        if (token && confirmationType === 'signup') {
          const email = queryParams.get('email');
          
          if (!email) {
            console.error('Missing email for token verification');
            setStatus('error');
            setMessage('Invalid confirmation link');
            setTimeout(() => setLocation('/'), 3000);
            return;
          }
          
          const { data, error } = await supabase().auth.verifyOtp({
            token,
            type: 'signup',
            email
          });
          
          if (error) {
            console.error('Email confirmation error:', error);
            setStatus('error');
            setMessage(error.message || 'Email confirmation failed');
            setTimeout(() => setLocation('/'), 3000);
            return;
          }

          if (data.session) {
            setStatus('success');
            setMessage('Email confirmed successfully! Welcome to Anointed.');
            window.history.replaceState(null, '', window.location.pathname);
            setTimeout(() => setLocation('/'), 2000);
            return;
          }
        }
        
        // Handle PKCE code exchange
        if (code) {
          const { data, error } = await supabase().auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Email confirmation error:', error);
            setStatus('error');
            setMessage(error.message || 'Email confirmation failed');
            setTimeout(() => setLocation('/'), 3000);
            return;
          }

          if (data.session) {
            setStatus('success');
            setMessage('Email confirmed successfully! Welcome to Anointed.');
            window.history.replaceState(null, '', window.location.pathname);
            setTimeout(() => setLocation('/'), 2000);
            return;
          }
        }
        
        // Handle token_hash based verification (signup confirmations)
        if (tokenHash && confirmationType === 'signup') {
          const { data, error } = await supabase().auth.verifyOtp({
            token_hash: tokenHash,
            type: 'signup'
          });
          
          if (error) {
            console.error('Email confirmation error:', error);
            setStatus('error');
            setMessage(error.message || 'Email confirmation failed');
            setTimeout(() => setLocation('/'), 3000);
            return;
          }

          if (data.session) {
            setStatus('success');
            setMessage('Email confirmed successfully! Welcome to Anointed.');
            window.history.replaceState(null, '', window.location.pathname);
            setTimeout(() => setLocation('/'), 2000);
            return;
          }
        }

        // No valid confirmation token found
        console.log('No valid confirmation token found, redirecting to home');
        setLocation('/');
        
      } catch (error) {
        console.error('Unexpected confirmation error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');
        setTimeout(() => setLocation('/'), 3000);
      }
    };

    handleEmailConfirmation();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-950">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Anointed Bible Study
          </h2>
          
          {status === 'loading' && (
            <div className="space-y-4">
              <LoadingWheel size="large" />
              <p className="text-gray-600 dark:text-gray-400">
                Confirming your email...
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
              <p className="text-green-600 dark:text-green-400 font-medium text-lg">
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
