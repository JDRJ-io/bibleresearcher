import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabaseClient';
import { LoadingWheel } from '@/components/LoadingWheel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // First, try to exchange recovery hash parameters for a session
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        // Handle password recovery hash
        if (accessToken && type === 'recovery') {
          const { data, error } = await supabase().auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
          
          if (error) {
            console.error('Recovery session error:', error);
            setStatus('error');
            setMessage('Invalid or expired reset link');
            setTimeout(() => setLocation('/'), 3000);
            return;
          }
          
          if (data.session) {
            window.history.replaceState(null, '', window.location.pathname);
            setStatus('ready');
            return;
          }
        }
        
        // Also check for PKCE code exchange
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');
        
        if (code) {
          const { data, error } = await supabase().auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Code exchange error:', error);
            setStatus('error');
            setMessage('Invalid or expired reset link');
            setTimeout(() => setLocation('/'), 3000);
            return;
          }
          
          if (data.session) {
            window.history.replaceState(null, '', window.location.pathname);
            setStatus('ready');
            return;
          }
        }
        
        // Finally, check if we already have a session
        const { data: { session } } = await supabase().auth.getSession();
        
        if (!session) {
          setStatus('error');
          setMessage('Invalid or expired reset link');
          setTimeout(() => setLocation('/'), 3000);
          return;
        }

        setStatus('ready');
      } catch (error) {
        console.error('Reset password error:', error);
        setStatus('error');
        setMessage('An error occurred');
        setTimeout(() => setLocation('/'), 3000);
      }
    };

    checkAuthState();
  }, [setLocation]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase().auth.updateUser({ password });

      if (error) {
        setStatus('error');
        setMessage(error.message || 'Failed to update password');
        setIsSubmitting(false);
      } else {
        setStatus('success');
        setMessage('Password updated successfully!');
        setTimeout(() => setLocation('/'), 2000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reset Your Password
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>

        {status === 'loading' && (
          <div className="space-y-4 text-center">
            <LoadingWheel size="large" />
            <p className="text-gray-600 dark:text-gray-400">
              Verifying reset link...
            </p>
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-gray-900 dark:text-white">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                  minLength={8}
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-gray-900 dark:text-white">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                  required
                  minLength={8}
                  data-testid="input-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-sm">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-green-500 text-sm">Passwords match</p>
              )}
            </div>

            {message && status === 'ready' && (
              <p className="text-red-500 text-sm text-center">{message}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || password !== confirmPassword || password.length < 8}
              data-testid="button-reset-password"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        )}

        {status === 'success' && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 dark:text-green-400 font-medium text-lg">
              {message}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to homepage...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 text-center">
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
  );
}
