import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { signInWithMagicLink } from '@/lib/supabaseClient'
import { Loader2, Mail, Sparkles } from 'lucide-react'

interface AuthModalsProps {
  isSignUpOpen: boolean
  isSignInOpen: boolean
  onCloseSignUp: () => void
  onCloseSignIn: () => void
}

export function AuthModals({ isSignUpOpen, isSignInOpen, onCloseSignUp, onCloseSignIn }: AuthModalsProps) {
  const [signUpData, setSignUpData] = useState({ displayName: '', email: '' })
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
      const { error } = await signInWithMagicLink(signUpData.email, signUpData.displayName)
      
      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Magic Link Sent! ✨",
          description: `Check your email (${signUpData.email}) for your sign-in link.`,
        })
        onCloseSignUp()
        setSignUpData({ displayName: '', email: '' })
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
      const { error } = await signInWithMagicLink(signInEmail)
      
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
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

  return (
    <>
      {/* Sign Up Modal */}
      <Dialog open={isSignUpOpen} onOpenChange={onCloseSignUp}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-amber-50/95 via-orange-50/95 to-yellow-50/95 dark:from-amber-950/90 dark:via-orange-950/90 dark:to-yellow-950/90 border-2 border-amber-200/50 dark:border-amber-600/50 backdrop-blur-lg shadow-2xl shadow-amber-200/20 dark:shadow-amber-900/40 z-[9999] relative overflow-hidden">
          {/* Mystical Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 via-transparent to-orange-100/20 dark:from-amber-800/10 dark:via-transparent dark:to-orange-800/10" />
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-200/10 dark:bg-amber-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-orange-200/10 dark:bg-orange-600/10 rounded-full blur-2xl animate-pulse delay-1000" />
          
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100 text-lg font-semibold">
                <Sparkles className="h-5 w-5 text-amber-600 animate-pulse" />
                Welcome to the Sacred Library
              </DialogTitle>
              <DialogDescription className="text-amber-700 dark:text-amber-200 text-sm">
                Enter your details to begin your journey of biblical discovery
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSignUp} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-amber-900 dark:text-amber-100 font-medium">
                  What's your name?
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your display name"
                  value={signUpData.displayName}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="border-amber-300/60 focus:border-amber-500 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/50 backdrop-blur-sm"
                  disabled={isLoading}
                />
                <p className="text-xs text-amber-600 dark:text-amber-300">
                  This will be your display name in the forum
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-amber-900 dark:text-amber-100 font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                  className="border-amber-300/60 focus:border-amber-500 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/50 backdrop-blur-sm"
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg transition-all duration-300 hover:shadow-amber-300/50 hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

      {/* Sign In Modal */}
      <Dialog open={isSignInOpen} onOpenChange={onCloseSignIn}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-50/95 via-indigo-50/95 to-purple-50/95 dark:from-blue-950/90 dark:via-indigo-950/90 dark:to-purple-950/90 border-2 border-blue-200/50 dark:border-blue-600/50 backdrop-blur-lg shadow-2xl shadow-blue-200/20 dark:shadow-blue-900/40 z-[9999] relative overflow-hidden">
          {/* Mystical Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20 dark:from-blue-800/10 dark:via-transparent dark:to-indigo-800/10" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/10 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200/10 dark:bg-indigo-600/10 rounded-full blur-2xl animate-pulse delay-1000" />
          
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100 text-lg font-semibold">
                <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                Return to the Library
              </DialogTitle>
              <DialogDescription className="text-blue-700 dark:text-blue-200 text-sm">
                Welcome back! Enter your email to receive your magic link
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSignIn} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="signInEmail" className="text-blue-900 dark:text-blue-100 font-medium">
                  Email Address
                </Label>
                <Input
                  id="signInEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="border-blue-300/60 focus:border-blue-500 dark:border-blue-700/60 bg-blue-50/50 dark:bg-blue-950/50 backdrop-blur-sm"
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-300 hover:shadow-blue-300/50 hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
    </>
  )
}