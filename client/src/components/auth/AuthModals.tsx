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
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 z-[9999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <Sparkles className="h-5 w-5" />
              Welcome to the Sacred Library
            </DialogTitle>
            <DialogDescription className="text-amber-700 dark:text-amber-200">
              Enter your details to begin your journey of biblical discovery
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-amber-900 dark:text-amber-100">
                What's your name?
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your display name"
                value={signUpData.displayName}
                onChange={(e) => setSignUpData(prev => ({ ...prev, displayName: e.target.value }))}
                className="border-amber-300 focus:border-amber-500 dark:border-amber-700"
                disabled={isLoading}
              />
              <p className="text-xs text-amber-600 dark:text-amber-300">
                This will be your display name in the forum
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-amber-900 dark:text-amber-100">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={signUpData.email}
                onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                className="border-amber-300 focus:border-amber-500 dark:border-amber-700"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
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
                  Send Magic Link
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sign In Modal */}
      <Dialog open={isSignInOpen} onOpenChange={onCloseSignIn}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 z-[9999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Sparkles className="h-5 w-5" />
              Return to the Library
            </DialogTitle>
            <DialogDescription className="text-blue-700 dark:text-blue-200">
              Welcome back! Enter your email to receive your magic link
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signInEmail" className="text-blue-900 dark:text-blue-100">
                Email Address
              </Label>
              <Input
                id="signInEmail"
                type="email"
                placeholder="your@email.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className="border-blue-300 focus:border-blue-500 dark:border-blue-700"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
                  Send Magic Link
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}