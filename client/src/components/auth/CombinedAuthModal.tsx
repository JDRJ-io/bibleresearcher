import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { KeyRound, Mail, Sparkles } from "lucide-react";

interface CombinedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CombinedAuthModal({ isOpen, onClose }: CombinedAuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Implement Supabase sign in
      console.log("Sign in attempt:", { email });
      
      // Mock delay for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onClose();
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Implement Supabase sign up
      console.log("Sign up attempt:", { email });
      
      // Mock delay for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onClose();
    } catch (error) {
      console.error("Sign up error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Welcome to Bible Study</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin" className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Sign Up
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Welcome back! Sign in to sync your notes and bookmarks.
            </div>
            
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-purple-500 hover:bg-purple-600"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Send Magic Link"}
              </Button>
            </form>
            
            <div className="text-xs text-center text-muted-foreground">
              We'll send you a secure link to sign in without a password.
            </div>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Create your account to save notes, highlights, and bookmarks.
            </div>
            
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
            
            <div className="text-xs text-center text-muted-foreground">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}