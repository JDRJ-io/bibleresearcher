/**
 * MASSIVE Divine Authentication Modals
 * Full-screen mystical experience with adaptive design
 * Glorious and radiant unto God
 */

import { useState, memo, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { X, Mail, Shield, Sparkles, Check, AlertCircle, Star, Eye, EyeOff } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabaseClient'
import { signUpWithPassword } from '@/lib/auth'
import { useUsernameAvailability } from '@/hooks/useUsernameAvailability'
import { billing } from '@/lib/billing'
import { useKeyboardViewport } from '@/hooks/useKeyboardViewport'
import { useLandscapeSidecar } from '@/hooks/useLandscapeSidecar'
import { useFocusScroller } from '@/hooks/useFocusScroller'

interface AuthModalsProps {
  isSignUpOpen: boolean
  isSignInOpen: boolean
  onCloseSignUp: () => void
  onCloseSignIn: () => void
  onSignUpOpen?: () => void
  onSignInOpen?: () => void
}

const AuthModalsComponent = ({ isSignUpOpen, isSignInOpen, onCloseSignUp, onCloseSignIn, onSignUpOpen, onSignInOpen }: AuthModalsProps) => {
  // Only render if we have a DOM to portal to
  if (typeof document === 'undefined') return null;
  
  const [signUpData, setSignUpData] = useState({ 
    displayName: '', 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    marketingOptIn: false 
  })
  const [signInData, setSignInData] = useState({ email: '', password: '' })
  const [resetEmail, setResetEmail] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false)
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(true)
  const [isCompactHeight, setIsCompactHeight] = useState(false)
  
  const keyboardAware = isSignUpOpen || isSignInOpen
  const { vvh } = useKeyboardViewport(keyboardAware)
  const isLandscape = useLandscapeSidecar()
  
  // Auto-center focused inputs (callback refs)
  const signUpScrollRef = useFocusScroller()
  const signInScrollRef = useFocusScroller()

  // Detect mobile landscape (small height) - hide password requirements by default
  useEffect(() => {
    const checkHeight = () => {
      const compact = window.innerHeight < 500;
      setIsCompactHeight(compact);
      // Collapse password requirements on compact height
      if (compact) {
        setShowPasswordRequirements(false);
      }
    };
    checkHeight();
    window.addEventListener('resize', checkHeight);
    return () => window.removeEventListener('resize', checkHeight);
  }, [])

  // Use the proper debounced username availability hook
  const { available: usernameAvailable, loading: usernameLoading, error: usernameError } = useUsernameAvailability(signUpData.username)
  
  // Map the hook state to the old status format for UI compatibility
  const usernameStatus = usernameLoading 
    ? 'checking' 
    : usernameError 
    ? 'error'
    : usernameAvailable === true 
    ? 'available'
    : usernameAvailable === false 
    ? 'unavailable'
    : 'idle'

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUpData.username.trim() || !signUpData.email.trim() || !signUpData.password.trim() || !signUpData.confirmPassword.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are the same.",
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

    if (usernameStatus === 'error') {
      toast({
        title: "Unable to Check Username",
        description: "There was an error checking username availability. Please try again.",
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
      console.log('📝 AuthModals: Creating account for:', signUpData.email);

      // 1) Create user account using existing function
      const result = await signUpWithPassword(
        signUpData.email,
        signUpData.password,
        signUpData.username,
        '' // No display name collected
      );

      if (!result.success) {
        toast({
          title: "Sign Up Failed",
          description: result.message,
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }

      // 2) Handle success - show different message based on whether email confirmation is required
      const needsConfirmation = result.message.includes('check your email');
      
      toast({
        title: needsConfirmation ? "Check Your Email 📧" : "Welcome to Anointed! ✨",
        description: needsConfirmation 
          ? "Please check your email to confirm your account before signing in."
          : "Your account is ready. Begin your journey through Scripture.",
      })
      onCloseSignUp()
      setSignUpData({ displayName: '', username: '', email: '', password: '', confirmPassword: '', marketingOptIn: false })
    } catch (error: any) {
      console.error('Sign up error:', error)
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signInData.email.trim() || !signInData.password.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase().auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      })

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message || "Invalid email or password",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Welcome Back! ✨",
          description: "You've been signed in successfully.",
        })
        onCloseSignIn()
        setSignInData({ email: '', password: '' })
        
        // No page reload needed - AuthContext will handle session updates via onAuthStateChange
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail.trim()) {
      toast({
        title: "Missing Email",
        description: "Please enter your email address.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase().auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset`
      })

      if (error) {
        toast({
          title: "Reset Failed",
          description: error.message || "Unable to send reset email. Please try again.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Check Your Email! 📧",
          description: "We've sent you a password reset link. Check your inbox.",
        })
        setShowForgotPassword(false)
        setResetEmail('')
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

  // Prefer CSS small viewport height (keyboard-aware on modern browsers)
  // Fallback to JS-measured viewport height for older browsers
  const supportsSmallVh = useMemo(() => 
    typeof window !== "undefined" && "CSS" in window && CSS.supports("height: 100svh"),
    []
  );

  const maxHeightStyle = useMemo(() => {
    if (supportsSmallVh) {
      return { maxHeight: "calc(85svh - 16px)" };
    }
    // Fallback: use JS-measured viewport height
    const px = vvh || (typeof window !== "undefined" ? window.innerHeight : 800);
    return { maxHeight: `calc(${px * 0.85}px - 16px)` };
  }, [supportsSmallVh, vvh]);

  // Render modals using portals to escape container constraints
  const signUpModal = isSignUpOpen ? createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center 
                    bg-gradient-to-br from-black/85 via-purple-900/60 to-black/85
                    backdrop-blur-sm overflow-hidden pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
         onClick={onCloseSignUp}>
      
      {/* Divine Background Effects - Adaptive for Light/Dark Mode */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/50 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/40 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-pink-400/30 rounded-full blur-2xl animate-pulse delay-500" />
        <div className="absolute top-3/4 left-1/6 w-32 h-32 bg-cyan-400/35 rounded-full blur-2xl animate-pulse delay-700" />
      </div>

      {/* Holy Light Effects - Adaptive for Light/Dark Mode */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-4 left-4 w-1 h-16 bg-gradient-to-b from-yellow-400 to-transparent rotate-12 blur-sm" />
        <div className="absolute top-4 right-4 w-1 h-20 bg-gradient-to-b from-purple-500 to-transparent -rotate-12 blur-sm" />
        <div className="absolute bottom-4 left-1/3 w-1 h-12 bg-gradient-to-t from-yellow-400/80 to-transparent rotate-45 blur-sm" />
        <div className="absolute top-1/3 right-1/3 w-1 h-14 bg-gradient-to-b from-pink-400/90 to-transparent rotate-45 blur-sm" />
        <div className="absolute bottom-1/3 left-1/4 w-1 h-10 bg-gradient-to-t from-cyan-400/70 to-transparent -rotate-12 blur-sm" />
      </div>

      {/* Main Content Container - Two-Pane Layout for Landscape */}
      <div className={`relative z-10 w-full ${isLandscape ? "max-w-4xl" : "max-w-[calc(100vw-1rem)] sm:max-w-lg"} mx-2 sm:mx-4
                      rounded-2xl border border-white/20
                      shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
                      bg-white/10 dark:bg-black/10
                      backdrop-blur-xl backdrop-saturate-150
                      ${isLandscape ? "flex flex-col" : "overflow-y-auto"} ${isCompactHeight && !isLandscape ? "px-4 py-3" : "px-4 sm:px-8 lg:px-12 py-6"}`}
           style={maxHeightStyle}
           onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button - Adaptive for Light/Dark Mode */}
        <button
          onClick={onCloseSignUp}
          className={`absolute ${isCompactHeight ? "top-2 right-2 p-1.5" : "top-4 right-4 p-2"} rounded-full 
                     bg-white/10 hover:bg-white/20 transition-all duration-300
                     border-2 border-red-400/80 hover:border-red-300 shadow-[0_0_8px_rgba(248,113,113,0.6)]
                     text-white/70 hover:text-white z-20 hover:shadow-[0_0_15px_rgba(248,113,113,0.8)]`}
        >
          <X className={isCompactHeight ? "h-4 w-4" : "h-5 w-5"} />
        </button>

        {/* Single Scroll Container */}
        <div
          ref={signUpScrollRef}
          className={isLandscape ? "flex-1" : ""}
          style={isLandscape ? {
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            maxHeight: 'calc(var(--vvh, 85vh) - 16px)',
            paddingBottom: 'var(--kb)'
          } : undefined}
        >
          {/* Two-Pane Grid Layout for Landscape - 3 Row Grid */}
          <div 
            data-auth="signup-grid"
            className={isLandscape ? "gap-x-10 gap-y-4.5 relative" : ""}
            style={isLandscape ? {
              display: 'grid',
              gridTemplateColumns: 'minmax(320px, 42%) 1fr',
              gridTemplateRows: 'auto minmax(0, 1fr) auto',
              columnGap: '40px',
              rowGap: '18px',
              alignItems: 'start'
            } : undefined}
          >
          
          {/* ROW 1 - LEFT: Logo + Title (Landscape) / All content (Portrait) */}
          <div 
            data-auth="left-top"
            className={isLandscape ? "col-[1] row-[1] min-w-0 pt-12" : ""}
            style={isLandscape ? { gridColumn: '1', gridRow: '1', minWidth: 0, paddingTop: 'calc(3rem - 10px)' } : undefined}
          >
            <div className={`text-center ${isCompactHeight && !isLandscape ? "mb-2" : "mb-6"} ${isLandscape ? "w-full" : ""}`}>
              {/* Divine Crown Icon - Fire Crown Halo */}
              <img 
                src="/crown-icon.png" 
                alt=""
                className={`${isCompactHeight ? "w-12 h-12" : "w-16 h-16 sm:w-[84px] sm:h-[84px]"} mx-auto 
                           ${isCompactHeight ? "mb-1.5" : "mb-3 sm:mb-4"} drop-shadow-lg 
                           filter drop-shadow-[0_0_12px_rgba(255,210,80,0.45)]`}
                style={{
                  animation: 'haloPulse 4s ease-in-out infinite'
                }}
              />
              <h1 className={`${isCompactHeight && !isLandscape ? "text-2xl mb-1" : "text-4xl mb-2"} font-bold text-white`}>Join the Anointed</h1>
            </div>
            
            {/* Tagline inline in portrait */}
            {!isLandscape && (
              <p className={`text-white/70 ${isCompactHeight && !isLandscape ? "text-sm mb-4" : "text-lg mb-6"} font-medium text-center`}>
                Begin your journey here
              </p>
            )}
          </div>

          {/* ROW 2 - LEFT: Password Requirements (Landscape Only - centered vertically) */}
          {isLandscape && (
            <div 
              data-auth="left-middle"
              className="col-[1] row-[2] min-w-0 flex items-center justify-center"
              style={{ gridColumn: '1', gridRow: '2', minWidth: 0, marginTop: '-10px' }}
            >
              <div className="text-center">
                <div className="text-sm space-y-3">
                  <h3 className="text-white font-semibold">Password Requirements:</h3>
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2.5 transition-all duration-200 ${signUpData.password.length >= 10 ? "text-[#e9ffe3] opacity-100" : "text-white/50 opacity-80"}`}>
                      <span className={signUpData.password.length >= 10 ? "text-[#6dde6f]" : "text-[#cfc9e9]"}>{signUpData.password.length >= 10 ? "✓" : "•"}</span>
                      <span>10+ characters</span>
                    </div>
                    <div className={`flex items-center gap-2.5 transition-all duration-200 ${/[A-Z]/.test(signUpData.password) ? "text-[#e9ffe3] opacity-100" : "text-white/50 opacity-80"}`}>
                      <span className={/[A-Z]/.test(signUpData.password) ? "text-[#6dde6f]" : "text-[#cfc9e9]"}>{/[A-Z]/.test(signUpData.password) ? "✓" : "•"}</span>
                      <span>Uppercase letter</span>
                    </div>
                    <div className={`flex items-center gap-2.5 transition-all duration-200 ${/[a-z]/.test(signUpData.password) ? "text-[#e9ffe3] opacity-100" : "text-white/50 opacity-80"}`}>
                      <span className={/[a-z]/.test(signUpData.password) ? "text-[#6dde6f]" : "text-[#cfc9e9]"}>{/[a-z]/.test(signUpData.password) ? "✓" : "•"}</span>
                      <span>Lowercase letter</span>
                    </div>
                    <div className={`flex items-center gap-2.5 transition-all duration-200 ${/\d/.test(signUpData.password) && /[^A-Za-z0-9]/.test(signUpData.password) ? "text-[#e9ffe3] opacity-100" : "text-white/50 opacity-80"}`}>
                      <span className={/\d/.test(signUpData.password) && /[^A-Za-z0-9]/.test(signUpData.password) ? "text-[#6dde6f]" : "text-[#cfc9e9]"}>{/\d/.test(signUpData.password) && /[^A-Za-z0-9]/.test(signUpData.password) ? "✓" : "•"}</span>
                      <span>Number & symbol</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ROW 3 - LEFT: Tagline at bottom (Landscape Only) */}
          {isLandscape && (
            <p 
              data-auth="left-tagline"
              className="col-[1] row-[3] min-w-0 text-white/70 text-base font-medium text-center self-start"
              style={{ gridColumn: '1', gridRow: '3', minWidth: 0 }}
            >
              Join us in mapping the living threads of prophecy and fulfillment across the Bible...
            </p>
          )}

          {/* Grid-anchored Divider (Landscape Only) */}
          {isLandscape && (
            <div 
              data-auth="auth-divider"
              className="w-px bg-white/15 pointer-events-none"
              style={{
                gridColumn: '1',
                gridRow: '1 / -1',
                justifySelf: 'end',
                alignSelf: 'stretch',
                marginBlock: '24px'
              }}
              aria-hidden="true"
            />
          )}

          {/* ROW 1-2 RIGHT: Form fields (spans rows 1 and 2) */}
          <div 
            data-auth="signup-form-wrap"
            className={isLandscape ? "col-[2] row-[1/3] min-w-0" : ""}
            style={isLandscape ? { 
              gridColumn: '2', 
              gridRow: '1 / 3',
              minWidth: 0
            } : undefined}
          >
            <form id="signup-form" onSubmit={handleSignUp} className={isCompactHeight && !isLandscape ? "space-y-2" : isLandscape ? "space-y-4" : "space-y-4"}>
          
          {/* Top Section: Username & Email */}
          <div className={isLandscape ? "space-y-4" : isCompactHeight ? "space-y-2" : "space-y-4"}>
          <div className={isCompactHeight ? "space-y-1" : "space-y-2"}>
            <Label htmlFor="signup-username" className={`text-white ${isCompactHeight ? "text-sm" : "text-base"} font-medium`}>Username</Label>
            <div className="relative">
              <Input
                id="signup-username"
                name="username"
                type="text"
                placeholder="chosen_username"
                value={signUpData.username}
                onChange={(e) => {
                  const username = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setSignUpData({ ...signUpData, username });
                }}
                autoComplete="username"
                className={`${isCompactHeight ? "h-10 text-base" : "h-12 text-lg"} bg-background/90 border-2 border-yellow-400 focus:border-yellow-200 
                           text-foreground placeholder-muted-foreground backdrop-blur-sm focus:shadow-[0_0_0_2px_rgba(251,191,36,0.6),0_0_12px_rgba(251,191,36,0.3)] transition-all duration-300 pr-10`}
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
            {usernameStatus === 'checking' && (
              <p className="text-yellow-400 text-sm">⏳ Checking availability...</p>
            )}
            {usernameStatus === 'available' && (
              <p className="text-green-400 text-sm">✓ Username available</p>
            )}
            {usernameStatus === 'unavailable' && (
              <p className="text-red-400 text-sm">✗ Username not available</p>
            )}
            {usernameStatus === 'error' && (
              <p className="text-orange-400 text-sm">⚠ Error checking availability - please try again</p>
            )}
          </div>
          
          <div className={isCompactHeight ? "space-y-1" : "space-y-2"}>
            <Label htmlFor="signup-email" className={`text-white ${isCompactHeight ? "text-sm" : "text-base"} font-medium`}>Email Address</Label>
            <Input
              id="signup-email"
              name="email"
              type="email"
              placeholder="your.divine@email.com"
              value={signUpData.email}
              onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
              autoComplete="email"
              className={`${isCompactHeight ? "h-10 text-sm" : "h-11 text-base"} bg-background/90 border border-yellow-300 focus:border-yellow-400 
                         text-foreground placeholder-muted-foreground backdrop-blur-sm focus:ring-2 focus:ring-yellow-400/50 transition-all duration-200 rounded-md`}
              required
            />
          </div>
          </div>
          {/* End Top Section */}

          {/* Password Section */}
          <div className={isLandscape ? "space-y-4" : isCompactHeight ? "space-y-2" : "space-y-4"}>
          <div className={isCompactHeight ? "space-y-1" : "space-y-2"}>
            <Label htmlFor="signup-password" className={`text-white ${isCompactHeight ? "text-sm" : "text-base"} font-medium`}>Password</Label>
            <div className="relative">
              <Input
                id="signup-password"
                name="password"
                type={showSignUpPassword ? "text" : "password"}
                placeholder="Sacred password (10+ characters)"
                value={signUpData.password}
                onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                autoComplete="new-password"
                className={`${isCompactHeight ? "h-10 text-sm" : "h-11 text-base"} bg-background/90 border border-yellow-300 focus:border-yellow-400 
                           text-foreground placeholder-muted-foreground backdrop-blur-sm focus:ring-2 focus:ring-yellow-400/50 transition-all duration-200 rounded-md pr-10`}
                required
                minLength={10}
              />
              <button
                type="button"
                onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showSignUpPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {/* Show password requirements toggle in compact portrait mode only (in landscape they're in left pane) */}
            {isCompactHeight && !isLandscape && (
              <button
                type="button"
                onClick={() => setShowPasswordRequirements(!showPasswordRequirements)}
                className="text-xs text-yellow-400 hover:text-yellow-300 underline"
              >
                {showPasswordRequirements ? "Hide" : "Show"} requirements
              </button>
            )}
            {/* Show password requirements inline only in portrait mode (in landscape they're in left pane) */}
            {!isLandscape && showPasswordRequirements && (
              <div className="text-sm space-y-2 mt-2">
                <h3 className="text-white font-semibold text-sm">Password Requirements:</h3>
                <div className="space-y-1.5">
                  <div className={`flex items-center gap-2.5 transition-all duration-200 ${signUpData.password.length >= 10 ? "text-[#e9ffe3] opacity-100" : "text-white/50 opacity-80"}`}>
                    <span className={signUpData.password.length >= 10 ? "text-[#6dde6f]" : "text-[#cfc9e9]"}>{signUpData.password.length >= 10 ? "✓" : "•"}</span>
                    <span>10+ characters</span>
                  </div>
                  <div className={`flex items-center gap-2.5 transition-all duration-200 ${/[A-Z]/.test(signUpData.password) ? "text-[#e9ffe3] opacity-100" : "text-white/50 opacity-80"}`}>
                    <span className={/[A-Z]/.test(signUpData.password) ? "text-[#6dde6f]" : "text-[#cfc9e9]"}>{/[A-Z]/.test(signUpData.password) ? "✓" : "•"}</span>
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2.5 transition-all duration-200 ${/[a-z]/.test(signUpData.password) ? "text-[#e9ffe3] opacity-100" : "text-white/50 opacity-80"}`}>
                    <span className={/[a-z]/.test(signUpData.password) ? "text-[#6dde6f]" : "text-[#cfc9e9]"}>{/[a-z]/.test(signUpData.password) ? "✓" : "•"}</span>
                    <span>Lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2.5 transition-all duration-200 ${/\d/.test(signUpData.password) && /[^A-Za-z0-9]/.test(signUpData.password) ? "text-[#e9ffe3] opacity-100" : "text-white/50 opacity-80"}`}>
                    <span className={/\d/.test(signUpData.password) && /[^A-Za-z0-9]/.test(signUpData.password) ? "text-[#6dde6f]" : "text-[#cfc9e9]"}>{/\d/.test(signUpData.password) && /[^A-Za-z0-9]/.test(signUpData.password) ? "✓" : "•"}</span>
                    <span>Number & symbol</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={isCompactHeight ? "space-y-1" : "space-y-2"}>
            <Label htmlFor="signup-confirm-password" className={`text-white ${isCompactHeight ? "text-sm" : "text-base"} font-medium`}>Confirm Password</Label>
            <div className="relative">
              <Input
                id="signup-confirm-password"
                name="confirm-password"
                type={showSignUpConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={signUpData.confirmPassword}
                onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                autoComplete="new-password"
                className={`${isCompactHeight ? "h-10 text-sm" : "h-11 text-base"} bg-background/90 border border-yellow-300 focus:border-yellow-400 
                           text-foreground placeholder-muted-foreground backdrop-blur-sm focus:ring-2 focus:ring-yellow-400/50 transition-all duration-200 rounded-md pr-10`} 
                required
                minLength={10}
              />
              <button
                type="button"
                onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showSignUpConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {signUpData.confirmPassword && signUpData.password !== signUpData.confirmPassword && (
              <p className="text-red-400 text-sm">✗ Passwords don't match</p>
            )}
            {signUpData.confirmPassword && signUpData.password === signUpData.confirmPassword && (
              <p className="text-green-400 text-sm">✓ Passwords match</p>
            )}
          </div>
          </div>
          {/* End Password Section */}

            </form>
          </div>
          {/* End ROW 1-2 RIGHT */}

          {/* ROW 3 RIGHT: CTA Section (checkbox + button + link) */}
          <div 
            data-auth="signup-cta"
            className={isLandscape ? "col-[2] row-[3] min-w-0 space-y-3" : "space-y-4 mt-4"}
            style={isLandscape ? { gridColumn: '2', gridRow: '3', minWidth: 0 } : undefined}
          >
            {/* Marketing Opt-in */}
            <div className="flex items-start space-x-3 p-3 rounded-md bg-purple-900/30 border border-purple-400/60">
              <Checkbox
                id="marketing-opt-in"
                checked={signUpData.marketingOptIn}
                onCheckedChange={(checked) => setSignUpData({ ...signUpData, marketingOptIn: !!checked })}
                className="border-2 border-yellow-400 data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-300 mt-0.5 flex-shrink-0"
                style={{ 
                  backgroundColor: signUpData.marketingOptIn ? 'rgb(250, 204, 21)' : 'white',
                  borderColor: 'rgb(250, 204, 21)',
                  width: '20px',
                  height: '20px'
                }}
              />
              <Label 
                htmlFor="marketing-opt-in" 
                className="text-white/90 text-sm leading-relaxed cursor-pointer"
              >
                Receive news on our divine updates
              </Label>
            </div>
            
            <Button 
              type="submit" 
              form="signup-form"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 
                         hover:from-yellow-600 hover:to-yellow-700 text-black 
                         shadow-lg hover:shadow-xl 
                         transform hover:scale-[1.02] transition-all duration-200 rounded-md
                         border border-yellow-400"
              disabled={isLoading || usernameStatus !== 'available'}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <img src="/crown-icon.png" alt="" className="mr-2 h-4 w-4 inline-block" />
                  Create Sacred Account ✨
                </>
              )}
            </Button>
            
            {/* Sign In Link */}
            <div className="text-center pt-2 border-t border-white/20">
              <p className="text-white/80 text-sm">
                Already blessed?{' '}
                <button
                  type="button"
                  onClick={() => {
                    onCloseSignUp();
                    onSignInOpen?.();
                  }}
                  className="text-blue-200 hover:text-blue-100 underline font-medium transition-colors duration-200"
                >
                  Return to your sacred studies
                </button>
              </p>
            </div>
          </div>
          {/* End ROW 3 RIGHT */}
          
          </div>
          {/* End Two-Pane Grid */}
        </div>
        {/* End Scroll Container */}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes haloPulse {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>,
    document.body
  ) : null;

  const signInModal = isSignInOpen ? createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center 
                    bg-gradient-to-br from-black/85 via-blue-900/60 to-purple-900/60
                    backdrop-blur-sm overflow-hidden pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
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

      {/* Main Content Container - Two-Pane Layout for Landscape */}
      <div className={`relative z-10 w-full ${isLandscape ? "max-w-4xl" : "max-w-[calc(100vw-1rem)] sm:max-w-lg"} mx-2 sm:mx-4
                      rounded-2xl border border-white/20
                      shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
                      bg-white/10 dark:bg-black/10
                      backdrop-blur-xl backdrop-saturate-150
                      ${isLandscape ? "flex flex-col" : "overflow-y-auto"} px-4 sm:px-8 lg:px-12 py-6`}
           style={maxHeightStyle}
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

        {/* Two-Pane Grid Layout for Landscape - Single-Scroll Parent */}
        <div 
          ref={signInScrollRef}
          className={isLandscape ? "grid grid-cols-12 gap-6 flex-1 overflow-y-auto" : ""}
          style={isLandscape ? { paddingBottom: 'var(--kb)' } : undefined}
        >
          
          {/* Left Pane: Branding & Welcome (in landscape) */}
          <div className={isLandscape ? "col-span-5 pr-4 border-r border-white/20 flex flex-col justify-center" : ""}>
            {/* Divine Shield Icon */}
            <div className={`text-center ${isLandscape ? "mb-6" : "mb-8"}`}>
              <Shield className={`${isLandscape ? "w-20 h-20" : "w-16 h-16"} mx-auto text-blue-300 mb-4 drop-shadow-lg filter drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]`} />
              <h1 className={`${isLandscape ? "text-3xl" : "text-4xl"} font-bold text-white mb-2`}>
                {showForgotPassword ? 'Reset Password' : 'Welcome Back'}
              </h1>
              <p className={`text-white/70 ${isLandscape ? "text-base" : "text-lg"}`}>
                {showForgotPassword ? 'Enter your email to receive a reset link' : 'Return to your sacred studies'}
              </p>
            </div>

            {/* Additional branding in landscape */}
            {isLandscape && !showForgotPassword && (
              <div className="mt-6 text-sm text-white/60 text-center">
                <p>Continue your journey through Scripture with access to all your notes, highlights, and bookmarks.</p>
              </div>
            )}
          </div>

          {/* Right Pane: Form (in landscape) */}
          <div className={isLandscape ? "col-span-7 pl-4" : ""}>

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-white text-base font-medium">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="your.divine@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="h-11 text-base bg-background/90 border border-blue-300 focus:border-blue-400 
                           text-foreground placeholder-muted-foreground backdrop-blur-sm focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 rounded-md" 
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 
                         hover:from-indigo-500 hover:via-purple-500 hover:to-blue-500 text-white 
                         shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40
                         transform hover:scale-[1.02] transition-all duration-300 rounded-md
                         border border-purple-400/50 relative overflow-hidden"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4 text-white" />
                  <span className="text-white">Send Reset Link 📧</span>
                </>
              )}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-blue-200 hover:text-blue-100 underline text-sm transition-colors duration-200"
              >
                Back to sign in
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signin-email" className="text-white text-base font-medium">Email Address</Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="your.divine@email.com"
              value={signInData.email}
              onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
              className="h-11 text-base bg-background/90 border border-blue-300 focus:border-blue-400 
                         text-foreground placeholder-muted-foreground backdrop-blur-sm focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 rounded-md" 
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signin-password" className="text-white text-base font-medium">Password</Label>
            <div className="relative">
              <Input
                id="signin-password"
                type={showSignInPassword ? "text" : "password"}
                placeholder="Your sacred password"
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                className="h-11 text-base bg-background/90 border border-blue-300 focus:border-blue-400 
                           text-foreground placeholder-muted-foreground backdrop-blur-sm focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 rounded-md pr-10" 
                required
              />
              <button
                type="button"
                onClick={() => setShowSignInPassword(!showSignInPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showSignInPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 
                       hover:from-indigo-500 hover:via-purple-500 hover:to-blue-500 text-white 
                       shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40
                       transform hover:scale-[1.02] transition-all duration-300 rounded-md
                       border border-purple-400/50 relative overflow-hidden"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Signing In...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4 text-white" />
                <span className="text-white">Sign In ✨</span>
              </>
            )}
          </Button>

            {/* Forgot Password Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
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
        )}
          </div>
          {/* End Right Pane */}
          
        </div>
        {/* End Two-Pane Grid */}
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

// Memoize to prevent re-renders when parent (TopHeader) re-renders from useWindowSize
export const AuthModals = memo(AuthModalsComponent);