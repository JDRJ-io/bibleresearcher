/**
 * MASSIVE Divine Authentication Modals
 * Full-screen mystical experience with adaptive design
 * Glorious and radiant unto God
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { sendMagicLink } from '@/lib/auth'
import { X, Mail, Shield, Crown, Sparkles, Check, AlertCircle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabaseClient'

interface AuthModalsProps {
  isSignUpOpen: boolean
  isSignInOpen: boolean
  onCloseSignUp: () => void
  onCloseSignIn: () => void
  onSignUpOpen?: () => void
  onSignInOpen?: () => void
}

export function AuthModals({ isSignUpOpen, isSignInOpen, onCloseSignUp, onCloseSignIn, onSignUpOpen, onSignInOpen }: AuthModalsProps) {
  // Only render if we have a DOM to portal to
  if (typeof document === 'undefined') return null;
  
  const [signUpData, setSignUpData] = useState({ 
    displayName: '', 
    username: '', 
    email: '', 
    password: '', 
    marketingOptIn: false 
  })
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle')
  const [signInData, setSignInData] = useState({ username: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim() || username.length < 3) {
      setUsernameStatus('idle')
      return
    }

    setUsernameStatus('checking')
    try {
      const response = await fetch(`/api/auth/username-available?u=${encodeURIComponent(username)}`)
      const result = await response.json()
      
      if (result.ok) {
        setUsernameStatus(result.available ? 'available' : 'unavailable')
      } else {
        setUsernameStatus('unavailable')
      }
    } catch (error) {
      console.error('Username check failed:', error)
      setUsernameStatus('unavailable')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUpData.displayName.trim() || !signUpData.username.trim() || !signUpData.email.trim() || !signUpData.password.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    if (signUpData.password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      })
      return
    }

    if (usernameStatus !== 'available') {
      toast({
        title: "Username Not Available",
        description: "Please choose a different username.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signUpData.email,
          password: signUpData.password,
          username: signUpData.username,
          displayName: signUpData.displayName
        }),
      })

      const result = await response.json()
      
      if (!result.ok) {
        toast({
          title: "Sign Up Failed",
          description: result.error || "Something went wrong",
          variant: "destructive"
        })
      } else {
        if (result.needsConfirmation) {
          toast({
            title: "Check Your Email! 📧",
            description: `We sent a confirmation link to ${signUpData.email}`,
          })
        } else {
          toast({
            title: "Account Created! ✨",
            description: "Welcome! You've been signed in automatically.",
          })
        }
        
        onCloseSignUp()
        setSignUpData({ displayName: '', username: '', email: '', password: '', marketingOptIn: false })
        setUsernameStatus('idle')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signInData.username.trim() || !signInData.password.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: signInData.username,
          password: signInData.password
        }),
      })

      const result = await response.json()
      
      if (!result.ok) {
        toast({
          title: "Sign In Failed",
          description: result.error || "Invalid username or password",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Welcome Back! ✨",
          description: "You've been signed in successfully.",
        })
        onCloseSignIn()
        setSignInData({ username: '', password: '' })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  console.log('AuthModals render:', { isSignUpOpen, isSignInOpen });

  // Render modals using portals to escape container constraints
  const signUpModal = isSignUpOpen ? createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center 
                    bg-gradient-to-br from-black/85 via-purple-900/60 to-black/85
                    backdrop-blur-sm overflow-hidden"
         onClick={onCloseSignUp}>
      
      {/* Divine Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/50 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/40 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-pink-400/30 rounded-full blur-2xl animate-pulse delay-500" />
        <div className="absolute top-3/4 left-1/6 w-32 h-32 bg-cyan-400/35 rounded-full blur-2xl animate-pulse delay-700" />
      </div>

      {/* Holy Light Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-4 left-4 w-1 h-16 bg-gradient-to-b from-yellow-400 to-transparent rotate-12 blur-sm" />
        <div className="absolute top-4 right-4 w-1 h-20 bg-gradient-to-b from-purple-500 to-transparent -rotate-12 blur-sm" />
        <div className="absolute bottom-4 left-1/3 w-1 h-12 bg-gradient-to-t from-yellow-400/80 to-transparent rotate-45 blur-sm" />
        <div className="absolute top-1/3 right-1/3 w-1 h-14 bg-gradient-to-b from-pink-400/90 to-transparent rotate-45 blur-sm" />
        <div className="absolute bottom-1/3 left-1/4 w-1 h-10 bg-gradient-to-t from-cyan-400/70 to-transparent -rotate-12 blur-sm" />
      </div>

      {/* Main Content Container - Mobile Optimized */}
      <div className="relative z-10 w-full max-w-[calc(100vw-1rem)] sm:max-w-lg mx-2 sm:mx-4 p-6 
                      rounded-2xl border-2 border-yellow-300 shadow-[0_0_0_1px_rgba(168,85,247,0.6),0_0_15px_rgba(251,191,36,0.4),0_0_25px_rgba(251,191,36,0.2)]
                      bg-gradient-to-br from-yellow-400/10 via-purple-500/8 to-pink-400/5
                      backdrop-blur-lg
                      max-h-[85vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button
          onClick={onCloseSignUp}
          className="absolute top-4 right-4 p-2 rounded-full 
                     bg-white/10 hover:bg-white/20 transition-all duration-300
                     border-2 border-red-400/80 hover:border-red-300 shadow-[0_0_8px_rgba(248,113,113,0.6)]
                     text-white/70 hover:text-white z-20 hover:shadow-[0_0_15px_rgba(248,113,113,0.8)]"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Divine Crown Icon */}
        <div className="text-center mb-6">
          <Crown className="w-16 h-16 mx-auto text-yellow-300 mb-4 drop-shadow-lg filter drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          <h1 className="text-4xl font-bold text-white mb-2">Join the Anointed</h1>
          <p className="text-white/70 text-lg">Enter the sacred realm of biblical wisdom</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="signup-name" className="text-white/90 text-lg">Your Name</Label>
            <Input
              id="signup-name"
              type="text"
              placeholder="Your sacred name"
              value={signUpData.displayName}
              onChange={(e) => setSignUpData({ ...signUpData, displayName: e.target.value })}
              className="h-12 text-lg bg-white/70 border-2 border-yellow-400 focus:border-yellow-200 
                         text-black placeholder-gray-600 backdrop-blur-sm focus:shadow-[0_0_0_2px_rgba(251,191,36,0.6),0_0_12px_rgba(251,191,36,0.3)] transition-all duration-300" 
              style={{}}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-username" className="text-white/90 text-lg">Username</Label>
            <div className="relative">
              <Input
                id="signup-username"
                type="text"
                placeholder="chosen_username"
                value={signUpData.username}
                onChange={(e) => {
                  const username = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setSignUpData({ ...signUpData, username });
                  checkUsernameAvailability(username);
                }}
                className="h-12 text-lg bg-white/70 border-2 border-yellow-400 focus:border-yellow-200 
                           text-black placeholder-gray-600 backdrop-blur-sm focus:shadow-[0_0_0_2px_rgba(251,191,36,0.6),0_0_12px_rgba(251,191,36,0.3)] transition-all duration-300 pr-10" 
                style={{}}
                required
                minLength={3}
                maxLength={24}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {usernameStatus === 'checking' && (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-400 border-t-transparent"></div>
                )}
                {usernameStatus === 'available' && (
                  <Check className="h-5 w-5 text-green-400" />
                )}
                {usernameStatus === 'unavailable' && (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
            </div>
            {usernameStatus === 'available' && (
              <p className="text-green-400 text-sm">✓ Username available</p>
            )}
            {usernameStatus === 'unavailable' && (
              <p className="text-red-400 text-sm">✗ Username not available</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-white/90 text-lg">Email Address</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="your.divine@email.com"
              value={signUpData.email}
              onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
              className="h-12 text-lg bg-white/70 border-2 border-yellow-400 focus:border-yellow-200 
                         text-black placeholder-gray-600 backdrop-blur-sm focus:shadow-[0_0_0_2px_rgba(251,191,36,0.6),0_0_12px_rgba(251,191,36,0.3)] transition-all duration-300" 
              style={{}}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password" className="text-white/90 text-lg">Password</Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="Sacred password (8+ characters)"
              value={signUpData.password}
              onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
              className="h-12 text-lg bg-white/70 border-2 border-yellow-400 focus:border-yellow-200 
                         text-black placeholder-gray-600 backdrop-blur-sm focus:shadow-[0_0_0_2px_rgba(251,191,36,0.6),0_0_12px_rgba(251,191,36,0.3)] transition-all duration-300" 
              style={{}}
              required
              minLength={8}
            />
          </div>

          {/* Marketing Opt-in */}
          <div className="flex items-start space-x-3 p-4 rounded-lg bg-purple-900/40 border-2 border-purple-400 shadow-[0_0_0_1px_rgba(196,181,253,0.6),0_0_15px_rgba(147,51,234,0.4)]">
            <Checkbox
              id="marketing-opt-in"
              checked={signUpData.marketingOptIn}
              onCheckedChange={(checked) => setSignUpData({ ...signUpData, marketingOptIn: !!checked })}
              className="border-2 border-yellow-400 data-[state=checked]:bg-yellow-300 data-[state=checked]:border-yellow-200 data-[state=checked]:shadow-[0_0_0_2px_rgba(251,191,36,0.8),0_0_12px_rgba(251,191,36,0.6)]"
            />
            <Label 
              htmlFor="marketing-opt-in" 
              className="text-white/80 leading-relaxed cursor-pointer"
            >
              Receive divine updates and sacred teachings (1-2 messages monthly)
            </Label>
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-purple-500 
                       hover:from-yellow-500 hover:via-purple-400 hover:to-purple-600 text-black 
                       shadow-[0_0_0_2px_rgba(251,191,36,1),0_0_0_4px_rgba(147,51,234,0.8),0_0_25px_rgba(251,191,36,0.5)] 
                       hover:shadow-[0_0_0_2px_rgba(251,191,36,1),0_0_0_4px_rgba(147,51,234,1),0_0_35px_rgba(251,191,36,0.7),0_0_50px_rgba(147,51,234,0.4)] 
                       transform hover:scale-105 transition-all duration-300 rounded-lg
                       border-2 border-yellow-300 hover:border-yellow-200"
            disabled={isLoading || usernameStatus !== 'available'}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Creating Account...
              </>
            ) : (
              <>
                <Crown className="mr-2 h-4 w-4" />
                Create Sacred Account ✨
              </>
            )}
          </Button>
          
          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-white/70 text-sm">
              Already blessed?{' '}
              <button
                type="button"
                onClick={() => {
                  onCloseSignUp();
                  onSignInOpen?.();
                }}
                className="text-blue-300 hover:text-blue-200 underline font-medium hover:text-shadow-[0_0_8px_rgba(147,197,253,0.8)] transition-all duration-300"
              >
                Return to your sacred studies
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>,
    document.body
  ) : null;

  const signInModal = isSignInOpen ? createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center 
                    bg-gradient-to-br from-black/85 via-blue-900/60 to-purple-900/60
                    backdrop-blur-sm overflow-hidden"
         onClick={onCloseSignIn}>
      
      {/* Divine Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/60 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/50 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-400/40 rounded-full blur-2xl animate-pulse delay-500" />
        <div className="absolute top-3/4 right-1/6 w-32 h-32 bg-indigo-400/45 rounded-full blur-2xl animate-pulse delay-700" />
      </div>

      {/* Holy Light Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-4 left-4 w-1 h-16 bg-gradient-to-b from-blue-400 to-transparent rotate-12 blur-sm" />
        <div className="absolute top-4 right-4 w-1 h-20 bg-gradient-to-b from-purple-500 to-transparent -rotate-12 blur-sm" />
        <div className="absolute bottom-4 left-1/3 w-1 h-12 bg-gradient-to-t from-blue-400/90 to-transparent rotate-45 blur-sm" />
        <div className="absolute top-1/3 left-1/3 w-1 h-14 bg-gradient-to-b from-cyan-400/95 to-transparent -rotate-45 blur-sm" />
        <div className="absolute bottom-1/3 right-1/4 w-1 h-10 bg-gradient-to-t from-indigo-400/80 to-transparent rotate-12 blur-sm" />
      </div>

      {/* Main Content Container - Mobile Optimized */}
      <div className="relative z-10 w-full max-w-[calc(100vw-1rem)] sm:max-w-lg mx-2 sm:mx-4 p-6 
                      rounded-2xl border-2 border-blue-300 shadow-[0_0_0_1px_rgba(147,197,253,0.6),0_0_15px_rgba(59,130,246,0.4),0_0_25px_rgba(59,130,246,0.2)] 
                      bg-gradient-to-br from-blue-400/10 via-purple-500/8 to-cyan-400/5
                      backdrop-blur-lg
                      max-h-[85vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button
          onClick={onCloseSignIn}
          className="absolute top-4 right-4 p-2 rounded-full 
                     bg-white/10 hover:bg-white/20 transition-all duration-300
                     border-2 border-red-400/80 hover:border-red-300 shadow-[0_0_8px_rgba(248,113,113,0.6)]
                     text-white/70 hover:text-white z-20 hover:shadow-[0_0_15px_rgba(248,113,113,0.8)]"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Divine Shield Icon */}
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 mx-auto text-blue-300 mb-4 drop-shadow-lg filter drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/70 text-lg">Return to your sacred studies</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signin-username" className="text-white text-base font-medium">Username</Label>
            <Input
              id="signin-username"
              type="text"
              placeholder="your_username"
              value={signInData.username}
              onChange={(e) => setSignInData({ ...signInData, username: e.target.value })}
              className="h-11 text-base bg-white/80 border border-blue-300 focus:border-blue-400 
                         text-black placeholder-gray-500 backdrop-blur-sm focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 rounded-md" 
              style={{}}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signin-password" className="text-white text-base font-medium">Password</Label>
            <Input
              id="signin-password"
              type="password"
              placeholder="Your sacred password"
              value={signInData.password}
              onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
              className="h-11 text-base bg-white/80 border border-blue-300 focus:border-blue-400 
                         text-black placeholder-gray-500 backdrop-blur-sm focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 rounded-md" 
              style={{}}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 
                       hover:from-blue-600 hover:to-blue-700 text-white 
                       shadow-lg hover:shadow-xl 
                       transform hover:scale-[1.02] transition-all duration-200 rounded-md
                       border border-blue-400"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Signing In...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Sign In ✨
              </>
            )}
          </Button>

          {/* Forgot Password Link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                toast({
                  title: "Password Reset",
                  description: "Password reset feature coming soon! Please contact support if needed.",
                })
              }}
              className="text-blue-200 hover:text-blue-100 underline text-sm transition-colors duration-200"
            >
              Forgot your password?
            </button>
          </div>
          
          {/* Sign Up Link */}
          <div className="text-center pt-4 border-t border-white/20">
            <p className="text-white/80 text-sm">
              New to the faith?{' '}
              <button
                type="button"
                onClick={() => {
                  onCloseSignIn();
                  onSignUpOpen?.();
                }}
                className="text-yellow-200 hover:text-yellow-100 underline font-medium transition-colors duration-200"
              >
                Join the Anointed
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>,
    document.body
  ) : null;

  // Return both modals (only one will be rendered at a time)
  return (
    <>
      {signUpModal}
      {signInModal}
    </>
  );
}