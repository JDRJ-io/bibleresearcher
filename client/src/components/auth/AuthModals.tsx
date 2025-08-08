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

      {/* Enhanced Sign In Modal - Mystical & Glorious */}
      <Dialog open={isSignInOpen} onOpenChange={onCloseSignIn}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-black/95 via-blue-900/90 to-black/95 
                                border-2 border-blue-400/40 shadow-2xl shadow-blue-400/20 backdrop-blur-xl"
          style={{ zIndex: 9999 }}
        >
          {/* Divine Background Effects - Enhanced */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/5 to-blue-400/10" />
          <div className="absolute top-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-500" />
          
          {/* Holy Light Rays */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-4 left-4 w-1 h-16 bg-gradient-to-b from-blue-400/60 to-transparent rotate-12 blur-sm" />
            <div className="absolute top-4 right-4 w-1 h-20 bg-gradient-to-b from-purple-400/60 to-transparent -rotate-12 blur-sm" />
            <div className="absolute bottom-4 left-1/3 w-1 h-12 bg-gradient-to-t from-blue-400/40 to-transparent rotate-45 blur-sm" />
          </div>
          
          <div className="relative z-10">
            <DialogHeader className="text-center space-y-4">
              {/* Divine Key Icon */}
              <div className="mx-auto p-4 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 border border-blue-400/30 w-fit">
                <div className="w-12 h-12 text-blue-400">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                    <path d="M7 14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0-4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm12.78-1.38C19.93 7.21 20 6.61 20 6s-.07-1.21-.22-1.62c-.51-1.44-2.75-2.01-4.03-.53L14 5.5l-1.75-1.65c-1.28-1.48-3.52-.91-4.03.53C8.07 4.79 8 5.39 8 6s.07 1.21.22 1.62c.51 1.44 2.75 2.01 4.03.53L14 6.5l1.75 1.65c1.28 1.48 3.52.91 4.03-.53z"/>
                  </svg>
                </div>
              </div>
              
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-white to-purple-400 bg-clip-text text-transparent">
                Return to the Sacred Library
              </DialogTitle>
              <DialogDescription className="text-white/80 text-lg leading-relaxed">
                Welcome back, faithful seeker. Let us unlock the gates to your divine studies once more
              </DialogDescription>
              
              {/* Call to Action Placeholder */}
              <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-blue-400/10 to-purple-400/10 border border-blue-400/20">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">
                  [DIVINE WELCOME BACK MESSAGE PLACEHOLDER]
                </h3>
                <p className="text-white/70 text-sm">
                  Special returning user message, progress update, or divine blessing will be placed here
                </p>
              </div>
            </DialogHeader>
            <form onSubmit={handleSignIn} className="space-y-6 mt-8">
              <div className="space-y-3">
                <Label htmlFor="signInEmail" className="text-white/90 font-semibold text-lg">
                  Sacred Correspondence Address
                </Label>
                <Input
                  id="signInEmail"
                  type="email"
                  placeholder="your.sacred@email.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="border-blue-400/40 focus:border-blue-400/80 bg-black/20 backdrop-blur-sm text-white placeholder:text-white/50 
                           h-12 text-lg rounded-lg shadow-lg focus:shadow-blue-400/20 transition-all duration-300"
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 
                         hover:from-blue-500 hover:via-purple-400 hover:to-purple-600 text-black 
                         shadow-2xl shadow-blue-400/30 hover:shadow-blue-400/50 
                         transform hover:scale-105 transition-all duration-300 rounded-lg
                         border border-blue-400/30 hover:border-blue-400/60"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent mr-3"></div>
                    Summoning Divine Access...
                  </>
                ) : (
                  <>
                    <Mail className="mr-3 h-5 w-5" />
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