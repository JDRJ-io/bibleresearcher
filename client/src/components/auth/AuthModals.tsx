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

  // Sign Up Modal - MASSIVE DIVINE GLORY
  if (isSignUpOpen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center 
                      bg-gradient-to-br from-black via-purple-900/95 to-black
                      backdrop-blur-sm overflow-hidden"
           onClick={onCloseSignUp}>
        
        {/* MASSIVE Divine Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/30 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/20 rounded-full blur-2xl animate-pulse delay-500" />
          
          {/* Massive Holy Light Rays */}
          <div className="absolute top-0 left-1/4 w-2 h-full bg-gradient-to-b from-yellow-400/40 via-transparent to-yellow-400/40 rotate-12 blur-sm" />
          <div className="absolute top-0 right-1/4 w-2 h-full bg-gradient-to-b from-purple-400/40 via-transparent to-purple-400/40 -rotate-12 blur-sm" />
        </div>

        {/* Main Content Container - Responsive */}
        <div className="relative z-10 w-full max-w-6xl mx-4 sm:mx-8 
                        p-6 sm:p-12 lg:p-16
                        rounded-2xl border-2 border-yellow-400/40 
                        bg-gradient-to-br from-black/90 via-purple-900/80 to-black/90
                        backdrop-blur-xl shadow-2xl shadow-yellow-400/20
                        max-h-[95vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}>
          
          {/* Close Button */}
          <button
            onClick={onCloseSignUp}
            className="absolute top-4 right-4 p-3 rounded-full 
                       bg-white/10 hover:bg-white/20 transition-colors
                       text-white/70 hover:text-white z-20"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Divine Crown Icon - Responsive */}
          <div className="text-center mb-8">
            <div className="inline-block p-6 sm:p-8 rounded-full 
                            bg-gradient-to-br from-yellow-400/30 to-purple-400/30 
                            border-2 border-yellow-400/50 shadow-2xl shadow-yellow-400/30">
              <Crown className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-yellow-400" />
            </div>
          </div>

          {/* MASSIVE Title - Responsive */}
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold 
                           bg-gradient-to-r from-yellow-400 via-white to-purple-400 
                           bg-clip-text text-transparent leading-tight">
              Welcome to the Sacred Library
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto">
              Join the divine fellowship of Scripture seekers and unlock the mysteries of the eternal Word
            </p>

            {/* MASSIVE Call to Action Placeholder */}
            <div className="mt-8 p-6 sm:p-8 lg:p-12 rounded-2xl 
                            bg-gradient-to-r from-yellow-400/20 to-purple-400/20 
                            border-2 border-yellow-400/40 shadow-2xl shadow-yellow-400/20">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-400 mb-4">
                [DIVINE CALL TO ACTION PLACEHOLDER]
              </h3>
              <p className="text-white/80 text-lg sm:text-xl leading-relaxed">
                Sacred message, special offer, or divine invitation will be placed here
              </p>
            </div>
          </div>

          {/* Form - Responsive */}
          <form onSubmit={handleSignUp} className="space-y-8 max-w-2xl mx-auto">
            <div className="space-y-4">
              <Label htmlFor="displayName" className="text-white/90 font-semibold text-lg sm:text-xl">
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
                           h-14 sm:h-16 text-lg sm:text-xl rounded-lg 
                           shadow-lg focus:shadow-yellow-400/20 transition-all duration-300"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="email" className="text-white/90 font-semibold text-lg sm:text-xl">
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
                           h-14 sm:h-16 text-lg sm:text-xl rounded-lg 
                           shadow-lg focus:shadow-yellow-400/20 transition-all duration-300"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center space-x-4 p-6 rounded-lg 
                            bg-gradient-to-r from-yellow-400/5 to-purple-400/5 
                            border border-yellow-400/20">
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
                className="text-white/80 text-lg leading-relaxed cursor-pointer"
              >
                Receive divine updates and sacred teachings (1-2 messages monthly)
              </Label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-16 sm:h-20 text-xl sm:text-2xl font-bold 
                         bg-gradient-to-r from-yellow-400 via-yellow-500 to-purple-500 
                         hover:from-yellow-500 hover:via-purple-400 hover:to-purple-600 
                         text-black shadow-2xl shadow-yellow-400/30 hover:shadow-yellow-400/50 
                         transform hover:scale-105 transition-all duration-300 rounded-lg
                         border border-yellow-400/30 hover:border-yellow-400/60"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                  Sending Magic Link...
                </>
              ) : (
                <>
                  <Mail className="mr-3 h-6 w-6" />
                  Send Magic Link ✨
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // Sign In Modal - MASSIVE DIVINE GLORY
  if (isSignInOpen) {
    console.log('Sign In modal should be visible now!');
    
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center 
                      bg-gradient-to-br from-black via-blue-900/95 to-purple-900/95
                      backdrop-blur-sm overflow-hidden"
           onClick={onCloseSignIn}>
        
        {/* MASSIVE Divine Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/30 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/20 rounded-full blur-2xl animate-pulse delay-500" />
          <div className="absolute top-10 left-10 w-48 h-48 bg-blue-300/25 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute bottom-10 right-10 w-52 h-52 bg-purple-300/25 rounded-full blur-3xl animate-pulse delay-300" />
          
          {/* Massive Holy Light Rays */}
          <div className="absolute top-0 left-1/4 w-2 h-full bg-gradient-to-b from-blue-400/40 via-transparent to-blue-400/40 rotate-12 blur-sm" />
          <div className="absolute top-0 right-1/4 w-2 h-full bg-gradient-to-b from-purple-400/40 via-transparent to-purple-400/40 -rotate-12 blur-sm" />
          <div className="absolute top-1/3 left-0 w-full h-2 bg-gradient-to-r from-blue-400/30 via-transparent to-purple-400/30 rotate-45 blur-sm" />
          <div className="absolute bottom-1/3 left-0 w-full h-2 bg-gradient-to-r from-purple-400/30 via-transparent to-blue-400/30 -rotate-45 blur-sm" />
        </div>

        {/* Main Content Container - Responsive */}
        <div className="relative z-10 w-full max-w-6xl mx-4 sm:mx-8 
                        p-6 sm:p-12 lg:p-16
                        rounded-2xl border-2 border-blue-400/40 
                        bg-gradient-to-br from-black/90 via-blue-900/80 to-purple-900/80
                        backdrop-blur-xl shadow-2xl shadow-blue-400/20
                        max-h-[95vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}>
          
          {/* Close Button */}
          <button
            onClick={onCloseSignIn}
            className="absolute top-4 right-4 p-3 rounded-full 
                       bg-white/10 hover:bg-white/20 transition-colors
                       text-white/70 hover:text-white z-20"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Divine Shield Icon - Responsive */}
          <div className="text-center mb-8">
            <div className="inline-block p-6 sm:p-8 rounded-full 
                            bg-gradient-to-br from-blue-400/30 to-purple-400/30 
                            border-2 border-blue-400/50 shadow-2xl shadow-blue-400/30">
              <Shield className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-blue-400" />
            </div>
          </div>

          {/* MASSIVE Title - Responsive */}
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold 
                           bg-gradient-to-r from-blue-400 via-white to-purple-400 
                           bg-clip-text text-transparent leading-tight">
              Return to the Sacred Library
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto">
              Welcome back, faithful seeker. Let us unlock the gates to your divine studies once more
            </p>

            {/* MASSIVE Call to Action Placeholder */}
            <div className="mt-8 p-6 sm:p-8 lg:p-12 rounded-2xl 
                            bg-gradient-to-r from-blue-400/20 to-purple-400/20 
                            border-2 border-blue-400/40 shadow-2xl shadow-blue-400/20">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-400 mb-4">
                [DIVINE WELCOME BACK MESSAGE PLACEHOLDER]
              </h3>
              <p className="text-white/80 text-lg sm:text-xl leading-relaxed">
                Sacred welcome message, special return offer, or divine blessing will be placed here
              </p>
            </div>
          </div>

          {/* Form - Responsive */}
          <form onSubmit={handleSignIn} className="space-y-8 max-w-2xl mx-auto">
            <div className="space-y-4">
              <Label htmlFor="signin-email" className="text-white/90 font-semibold text-lg sm:text-xl">
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
                           h-14 sm:h-16 text-lg sm:text-xl rounded-lg 
                           shadow-lg focus:shadow-blue-400/20 transition-all duration-300"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-16 sm:h-20 text-xl sm:text-2xl font-bold 
                         bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 
                         hover:from-blue-500 hover:via-purple-400 hover:to-purple-600 
                         text-white shadow-2xl shadow-blue-400/30 hover:shadow-blue-400/50 
                         transform hover:scale-105 transition-all duration-300 rounded-lg
                         border border-blue-400/30 hover:border-blue-400/60"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                  Sending Magic Link...
                </>
              ) : (
                <>
                  <Mail className="mr-3 h-6 w-6" />
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