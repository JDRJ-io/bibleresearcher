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
import { X, Mail, Shield, Crown, Sparkles } from 'lucide-react'
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
  
  const [signUpData, setSignUpData] = useState({ displayName: '', email: '', marketingOptIn: false })
  const [signInEmail, setSignInEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUpData.displayName.trim() || !signUpData.email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both your name and email address.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await sendMagicLink(signUpData.email)
      
      if (!result.success) {
        toast({
          title: "Sign Up Failed",
          description: result.message,
          variant: "destructive"
        })
      } else {
        // Set up marketing opt-in listener for when user signs in
        if (signUpData.marketingOptIn) {
          const unsubscribe = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              try {
                await supabase
                  .from('profiles')
                  .update({ marketing_opt_in: true })
                  .eq('id', session.user.id);
                console.log('✅ Marketing opt-in saved for user');
              } catch (error) {
                console.warn('Failed to save marketing opt-in:', error);
              }
              // Clean up listener after first sign-in
              unsubscribe.data.subscription.unsubscribe();
            }
          });
        }
        
        toast({
          title: "Magic Link Sent! ✨",
          description: `Check your email (${signUpData.email}) for your sign-in link.`,
        })
        onCloseSignUp()
        setSignUpData({ displayName: '', email: '', marketingOptIn: false })
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
    if (!signInEmail.trim()) {
      toast({
        title: "Missing Email",
        description: "Please enter your email address.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await sendMagicLink(signInEmail)
      
      if (!result.success) {
        toast({
          title: "Sign In Failed",
          description: result.message,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Magic Link Sent! ✨",
          description: `Check your email (${signInEmail}) for your sign-in link.`,
        })
        onCloseSignIn()
        setSignInEmail('')
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
                    bg-gradient-to-br from-red-900/60 via-black/80 to-red-800/50
                    backdrop-blur-sm overflow-hidden"
         onClick={onCloseSignUp}>
      
      {/* Divine Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/80 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/70 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-red-500/80 rounded-full blur-2xl animate-pulse delay-500" />
        <div className="absolute top-3/4 left-1/6 w-32 h-32 bg-red-400/70 rounded-full blur-2xl animate-pulse delay-700" />
        <div className="absolute bottom-1/6 right-1/6 w-40 h-40 bg-red-600/50 rounded-full blur-3xl animate-pulse delay-300" />
      </div>

      {/* Holy Light Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-4 left-4 w-2 h-20 bg-gradient-to-b from-yellow-300 to-transparent rotate-12 blur-sm" />
        <div className="absolute top-4 right-4 w-2 h-24 bg-gradient-to-b from-blue-400 to-transparent -rotate-12 blur-sm" />
        <div className="absolute bottom-4 left-1/3 w-2 h-16 bg-gradient-to-t from-yellow-300 to-transparent rotate-45 blur-sm" />
        <div className="absolute top-1/3 right-1/3 w-2 h-18 bg-gradient-to-b from-red-500 to-transparent rotate-45 blur-sm" />
        <div className="absolute bottom-1/3 left-1/4 w-2 h-14 bg-gradient-to-t from-blue-400 to-transparent -rotate-12 blur-sm" />
      </div>

      {/* Main Content Container - Mobile Optimized */}
      <div className="relative z-10 w-full max-w-[calc(100vw-2rem)] max-w-lg mx-4 p-6 
                      rounded-2xl border border-yellow-400/60 
                      bg-gradient-to-br from-red-400/25 via-red-500/20 to-yellow-400/15
                      backdrop-blur-lg shadow-2xl shadow-yellow-400/40
                      max-h-[85vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button
          onClick={onCloseSignUp}
          className="absolute top-4 right-4 p-2 rounded-full 
                     bg-white/10 hover:bg-white/20 transition-colors
                     text-white/70 hover:text-white z-20"
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
              className="h-12 text-lg bg-white/15 border-yellow-400/50 focus:border-yellow-300 
                         text-white placeholder-white/50 backdrop-blur-sm focus:shadow-lg focus:shadow-yellow-400/30"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-white/90 text-lg">Email Address</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="your.divine@email.com"
              value={signUpData.email}
              onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
              className="h-12 text-lg bg-white/15 border-yellow-400/50 focus:border-yellow-300 
                         text-white placeholder-white/50 backdrop-blur-sm focus:shadow-lg focus:shadow-yellow-400/30"
              required
            />
          </div>

          {/* Marketing Opt-in */}
          <div className="flex items-start space-x-3 p-4 rounded-lg bg-blue-900/40 border border-blue-400/60">
            <Checkbox
              id="marketing-opt-in"
              checked={signUpData.marketingOptIn}
              onCheckedChange={(checked) => setSignUpData({ ...signUpData, marketingOptIn: !!checked })}
              className="border-yellow-400/70 data-[state=checked]:bg-yellow-300 data-[state=checked]:border-yellow-300 data-[state=checked]:shadow-lg data-[state=checked]:shadow-yellow-400/50"
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
                       shadow-2xl shadow-yellow-400/30 hover:shadow-yellow-400/50 
                       transform hover:scale-105 transition-all duration-300 rounded-lg
                       border border-yellow-400/30 hover:border-yellow-400/60"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Sending Magic Link...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Magic Link ✨
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
                className="text-blue-400 hover:text-blue-300 underline font-medium"
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
                    bg-gradient-to-br from-black/80 via-blue-900/50 to-purple-900/50
                    backdrop-blur-sm overflow-hidden"
         onClick={onCloseSignIn}>
      
      {/* Divine Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      {/* Holy Light Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-4 left-4 w-1 h-16 bg-gradient-to-b from-blue-400/60 to-transparent rotate-12 blur-sm" />
        <div className="absolute top-4 right-4 w-1 h-20 bg-gradient-to-b from-purple-400/60 to-transparent -rotate-12 blur-sm" />
        <div className="absolute bottom-4 left-1/3 w-1 h-12 bg-gradient-to-t from-blue-400/40 to-transparent rotate-45 blur-sm" />
      </div>

      {/* Main Content Container - Mobile Optimized */}
      <div className="relative z-10 w-full max-w-[calc(100vw-2rem)] max-w-lg mx-4 p-6 
                      rounded-2xl border border-blue-400/30 
                      bg-gradient-to-br from-white/10 via-white/5 to-transparent
                      backdrop-blur-lg shadow-2xl shadow-blue-400/20
                      max-h-[85vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button
          onClick={onCloseSignIn}
          className="absolute top-4 right-4 p-2 rounded-full 
                     bg-white/10 hover:bg-white/20 transition-colors
                     text-white/70 hover:text-white z-20"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Divine Shield Icon */}
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 mx-auto text-blue-400 mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/70 text-lg">Return to your sacred studies</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="signin-email" className="text-white/90 text-lg">Email Address</Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="your.divine@email.com"
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              className="h-12 text-lg bg-white/10 border-blue-400/30 focus:border-blue-400 
                         text-white placeholder-white/50 backdrop-blur-sm"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 
                       hover:from-blue-500 hover:via-purple-400 hover:to-purple-600 text-white 
                       shadow-2xl shadow-blue-400/30 hover:shadow-blue-400/50 
                       transform hover:scale-105 transition-all duration-300 rounded-lg
                       border border-blue-400/30 hover:border-blue-400/60"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Sending Magic Link...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Magic Link ✨
              </>
            )}
          </Button>
          
          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-white/70 text-sm">
              New to the faith?{' '}
              <button
                type="button"
                onClick={() => {
                  onCloseSignIn();
                  onSignUpOpen?.();
                }}
                className="text-yellow-400 hover:text-yellow-300 underline font-medium"
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