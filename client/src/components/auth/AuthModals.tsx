/**
 * MASSIVE Divine Authentication Modals
 * Full-screen mystical experience with adaptive design
 * Glorious and radiant unto God
 */

import { useState } from 'react'
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
}

export function AuthModals({ isSignUpOpen, isSignInOpen, onCloseSignUp, onCloseSignIn }: AuthModalsProps) {
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
        title: "Email Required",
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

  // Sign Up Modal - Divine Glory (Intro Overlay Style)
  if (isSignUpOpen) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center 
                      bg-gradient-to-br from-black/80 via-purple-900/50 to-black/80
                      backdrop-blur-sm overflow-hidden"
           onClick={onCloseSignUp}>
        
        {/* Divine Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-pulse delay-500" />
        </div>

        {/* Holy Light Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-4 left-4 w-1 h-16 bg-gradient-to-b from-yellow-400/60 to-transparent rotate-12 blur-sm" />
          <div className="absolute top-4 right-4 w-1 h-20 bg-gradient-to-b from-purple-400/60 to-transparent -rotate-12 blur-sm" />
          <div className="absolute bottom-4 left-1/3 w-1 h-12 bg-gradient-to-t from-yellow-400/40 to-transparent rotate-45 blur-sm" />
        </div>

        {/* Main Content Container - Moderately Sized */}
        <div className="relative z-10 w-full max-w-3xl mx-4 p-8 
                        rounded-2xl border border-yellow-400/30 
                        bg-gradient-to-br from-white/10 via-white/5 to-transparent
                        backdrop-blur-lg shadow-2xl shadow-yellow-400/20
                        max-h-[90vh] overflow-y-auto"
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
            <div className="inline-block p-4 rounded-full 
                            bg-gradient-to-br from-yellow-400/20 to-purple-400/20 
                            border border-yellow-400/30">
              <Crown className="w-16 h-16 text-yellow-400" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-white to-purple-400 bg-clip-text text-transparent">
              Welcome to the Sacred Library
            </h1>
            
            <p className="text-xl text-white/80 leading-relaxed">
              Join the divine fellowship of Scripture seekers and unlock the mysteries of the eternal Word
            </p>

            {/* Call to Action Placeholder */}
            <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-yellow-400/10 to-purple-400/10 border border-yellow-400/20">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                [DIVINE CALL TO ACTION PLACEHOLDER]
              </h3>
              <p className="text-white/70 text-sm">
                Sacred message, special offer, or divine invitation will be placed here
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="displayName" className="text-white/90 font-semibold text-lg">
                What sacred name shall we call you?
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your divine display name"
                value={signUpData.displayName}
                onChange={(e) => setSignUpData(prev => ({ ...prev, displayName: e.target.value }))}
                className="border-yellow-400/40 focus:border-yellow-400/80 bg-black/20 backdrop-blur-sm 
                           text-white placeholder:text-white/50 
                           h-12 text-lg rounded-lg shadow-lg focus:shadow-yellow-400/20 transition-all duration-300"
                disabled={isLoading}
              />
              <p className="text-sm text-yellow-400/80">
                This divine name will represent you in our sacred community
              </p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="email" className="text-white/90 font-semibold text-lg">
                Sacred Correspondence Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.sacred@email.com"
                value={signUpData.email}
                onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                className="border-yellow-400/40 focus:border-yellow-400/80 bg-black/20 backdrop-blur-sm 
                           text-white placeholder:text-white/50 
                           h-12 text-lg rounded-lg shadow-lg focus:shadow-yellow-400/20 transition-all duration-300"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-yellow-400/5 to-purple-400/5 border border-yellow-400/20">
              <Checkbox
                id="marketing-opt-in"
                checked={signUpData.marketingOptIn}
                onCheckedChange={(checked) => 
                  setSignUpData(prev => ({ ...prev, marketingOptIn: checked === true }))
                }
                className="border-yellow-400/50 data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400"
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
          </form>
        </div>
      </div>
    )
  }

  // Sign In Modal - Divine Glory (Intro Overlay Style)
  if (isSignInOpen) {
    console.log('Sign In modal should be visible now!');
    
    return (
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

        {/* Main Content Container - Moderately Sized */}
        <div className="relative z-10 w-full max-w-2xl mx-4 p-8 
                        rounded-2xl border border-blue-400/30 
                        bg-gradient-to-br from-white/10 via-white/5 to-transparent
                        backdrop-blur-lg shadow-2xl shadow-blue-400/20
                        max-h-[90vh] overflow-y-auto"
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
          <div className="text-center mb-6">
            <div className="inline-block p-4 rounded-full 
                            bg-gradient-to-br from-blue-400/20 to-purple-400/20 
                            border border-blue-400/30">
              <Shield className="w-16 h-16 text-blue-400" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-white to-purple-400 bg-clip-text text-transparent">
              Return to the Sacred Library
            </h1>
            
            <p className="text-xl text-white/80 leading-relaxed">
              Welcome back, faithful seeker. Let us unlock the gates to your divine studies once more
            </p>

            {/* Call to Action Placeholder */}
            <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-blue-400/10 to-purple-400/10 border border-blue-400/20">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">
                [DIVINE WELCOME BACK MESSAGE PLACEHOLDER]
              </h3>
              <p className="text-white/70 text-sm">
                Sacred welcome message, special return offer, or divine blessing will be placed here
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="signin-email" className="text-white/90 font-semibold text-lg">
                Sacred Correspondence Address
              </Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="your.sacred@email.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className="border-blue-400/40 focus:border-blue-400/80 bg-black/20 backdrop-blur-sm 
                           text-white placeholder:text-white/50 
                           h-12 text-lg rounded-lg shadow-lg focus:shadow-blue-400/20 transition-all duration-300"
                disabled={isLoading}
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
          </form>
        </div>
      </div>
    )
  }

  return null
}