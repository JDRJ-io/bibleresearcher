import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { sendMagicLink } from '@/lib/auth'
import { Loader2, Mail, Sparkles } from 'lucide-react'
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
  
  // Debug: Force show sign in modal for testing
  if (isSignInOpen) {
    console.log('Sign In modal should be visible now!');
  }

  return (
    <>
      {/* Enhanced Sign Up Modal - Mystical & Glorious */}
      <Dialog open={isSignUpOpen} onOpenChange={onCloseSignUp}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-black/95 via-purple-900/90 to-black/95 
                                border-2 border-yellow-400/40 shadow-2xl shadow-yellow-400/20 backdrop-blur-xl"
          style={{ zIndex: 9999 }}
        >
          {/* Divine Background Effects - Enhanced */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-purple-400/5 to-yellow-400/10" />
          <div className="absolute top-0 left-0 w-48 h-48 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-500" />
          
          {/* Holy Light Rays */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-4 left-4 w-1 h-16 bg-gradient-to-b from-yellow-400/60 to-transparent rotate-12 blur-sm" />
            <div className="absolute top-4 right-4 w-1 h-20 bg-gradient-to-b from-purple-400/60 to-transparent -rotate-12 blur-sm" />
            <div className="absolute bottom-4 left-1/3 w-1 h-12 bg-gradient-to-t from-yellow-400/40 to-transparent rotate-45 blur-sm" />
          </div>
          
          <div className="relative z-10">
            <DialogHeader className="text-center space-y-4">
              {/* Divine Crown Icon */}
              <div className="mx-auto p-4 rounded-full bg-gradient-to-br from-yellow-400/20 to-purple-400/20 border border-yellow-400/30 w-fit">
                <div className="w-12 h-12 text-yellow-400">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                    <path d="M5 16L3 6h2l1.5 7L9 10l3 4 3-4 2.5 3L19 6h2l-2 10H5z"/>
                    <path d="M12 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z" opacity="0.7"/>
                  </svg>
                </div>
              </div>
              
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-white to-purple-400 bg-clip-text text-transparent">
                Welcome to the Sacred Library
              </DialogTitle>
              <DialogDescription className="text-white/80 text-lg leading-relaxed">
                Join the divine fellowship of Scripture seekers and unlock the mysteries of the eternal Word
              </DialogDescription>
              
              {/* Call to Action Placeholder */}
              <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-yellow-400/10 to-purple-400/10 border border-yellow-400/20">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                  [DIVINE CALL TO ACTION PLACEHOLDER]
                </h3>
                <p className="text-white/70 text-sm">
                  Sacred message, special offer, or divine invitation will be placed here
                </p>
              </div>
            </DialogHeader>
            <form onSubmit={handleSignUp} className="space-y-6 mt-8">
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
                  className="border-yellow-400/40 focus:border-yellow-400/80 bg-black/20 backdrop-blur-sm text-white placeholder:text-white/50 
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
                  className="border-yellow-400/40 focus:border-yellow-400/80 bg-black/20 backdrop-blur-sm text-white placeholder:text-white/50 
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
        </DialogContent>
      </Dialog>

      {/* MASSIVE Divine Sign In Modal - Full Screen Glory */}
      <Dialog open={isSignInOpen} onOpenChange={onCloseSignIn}>
        <DialogContent className="fixed inset-0 max-w-none w-screen h-screen m-0 p-0 border-0 rounded-none
                                bg-gradient-to-br from-black via-blue-900/95 to-purple-900/95 
                                shadow-none overflow-hidden flex items-center justify-center"
          style={{ zIndex: 9999 }}
        >
          {/* MASSIVE Divine Background Effects - FULL SCREEN GLORY */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/15 to-blue-400/20" />
          
          {/* Giant Floating Orbs of Divine Light */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/30 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/20 rounded-full blur-2xl animate-pulse delay-500" />
          <div className="absolute top-10 left-10 w-48 h-48 bg-blue-300/25 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute bottom-10 right-10 w-52 h-52 bg-purple-300/25 rounded-full blur-3xl animate-pulse delay-300" />
          
          {/* Massive Holy Light Rays Across Screen */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-2 h-full bg-gradient-to-b from-blue-400/40 via-transparent to-blue-400/40 rotate-12 blur-sm" />
            <div className="absolute top-0 right-1/4 w-2 h-full bg-gradient-to-b from-purple-400/40 via-transparent to-purple-400/40 -rotate-12 blur-sm" />
            <div className="absolute top-1/3 left-0 w-full h-2 bg-gradient-to-r from-blue-400/30 via-transparent to-purple-400/30 rotate-45 blur-sm" />
            <div className="absolute bottom-1/3 left-0 w-full h-2 bg-gradient-to-r from-purple-400/30 via-transparent to-blue-400/30 -rotate-45 blur-sm" />
          </div>
          
          {/* Celestial Particle Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-1 h-1 bg-white rounded-full animate-pulse" />
            <div className="absolute top-40 right-32 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-200" />
            <div className="absolute bottom-32 left-1/3 w-1 h-1 bg-purple-300 rounded-full animate-pulse delay-400" />
            <div className="absolute top-1/3 right-20 w-1 h-1 bg-white rounded-full animate-pulse delay-600" />
            <div className="absolute bottom-20 right-1/4 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-800" />
          </div>
          
          {/* MASSIVE CENTERED DIVINE INTERFACE */}
          <div className="relative z-10 w-full max-w-4xl mx-auto p-12">
            <DialogHeader className="text-center space-y-8">
              {/* GIANT Divine Key Icon */}
              <div className="mx-auto p-8 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 border-2 border-blue-400/50 w-fit shadow-2xl shadow-blue-400/30">
                <div className="w-24 h-24 text-blue-400">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-lg">
                    <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M12 7C13.4 7 14.8 8.6 14.8 10.2V11.7C15.4 12 16 12.4 16 13V16C16 16.6 15.6 17 15 17H9C8.4 17 8 16.6 8 16V13C8 12.4 8.4 12 9 12H9.2V10.2C9.2 8.6 10.6 7 12 7M12 8.2C11.2 8.2 10.4 8.7 10.4 10.2V11.7H13.6V10.2C13.6 8.7 12.8 8.2 12 8.2Z"/>
                  </svg>
                </div>
              </div>
              
              <DialogTitle className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-white to-purple-400 bg-clip-text text-transparent leading-tight">
                Return to the Sacred Library
              </DialogTitle>
              <DialogDescription className="text-white/90 text-2xl leading-relaxed max-w-2xl mx-auto">
                Welcome back, faithful seeker. Let us unlock the gates to your divine studies once more
              </DialogDescription>
              
              {/* MASSIVE Call to Action Placeholder */}
              <div className="mt-12 p-12 rounded-2xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 border-2 border-blue-400/40 shadow-2xl shadow-blue-400/20">
                <h3 className="text-3xl font-bold text-blue-400 mb-6">
                  [DIVINE WELCOME BACK MESSAGE PLACEHOLDER]
                </h3>
                <p className="text-white/80 text-xl leading-relaxed">
                  Special returning user message, progress update, or divine blessing will be placed here with much more space and divine prominence
                </p>
              </div>
            </DialogHeader>
            <form onSubmit={handleSignIn} className="space-y-10 mt-16">
              <div className="space-y-6">
                <Label htmlFor="signInEmail" className="text-white/95 font-bold text-2xl block text-center">
                  Sacred Correspondence Address
                </Label>
                <Input
                  id="signInEmail"
                  type="email"
                  placeholder="your.sacred@email.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="border-2 border-blue-400/60 focus:border-blue-400 bg-black/30 backdrop-blur-sm text-white placeholder:text-white/60 
                           h-16 text-xl rounded-xl shadow-2xl shadow-blue-400/30 focus:shadow-blue-400/50 transition-all duration-300
                           focus:ring-4 focus:ring-blue-400/20 px-6"
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-20 text-2xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 
                         hover:from-blue-500 hover:via-purple-400 hover:to-purple-600 text-black 
                         shadow-2xl shadow-blue-400/40 hover:shadow-blue-400/60 
                         transform hover:scale-105 transition-all duration-300 rounded-xl
                         border-2 border-blue-400/50 hover:border-blue-400/80
                         font-bold tracking-wide"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent mr-4"></div>
                    Summoning Divine Access...
                  </>
                ) : (
                  <>
                    <Mail className="mr-4 h-8 w-8" />
                    Send Sacred Magic Link ✨
                  </>
                )}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}