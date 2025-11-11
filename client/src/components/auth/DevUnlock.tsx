import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Crown, Code, Sparkles } from 'lucide-react';
import { redeemCode } from '@/lib/redemption';
import { CongratulationsOverlay } from '@/components/ui/congratulations-overlay';


export function DevUnlock() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast({
        title: "Enter a code",
        description: "Please enter a redeem code to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { profile } = await redeemCode(code);
      
      setCode('');
      
      // Show congratulations overlay instead of toast
      setShowCongratulations(true);
    } catch (error: any) {
      console.error('Redeem error:', error);
      toast({
        title: "Redemption failed",
        description: error.message || "Invalid or expired code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Developer Access
          </CardTitle>
          <CardDescription>
            Sign in to redeem developer codes
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Premium Code Redemption
        </CardTitle>
        <CardDescription>
          Enter your developer or team member code to unlock premium features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="redeem-code">Redeem Code</Label>
          <Input
            id="redeem-code"
            type="text"
            placeholder="Enter your access code (e.g. DEV-ALPHA-2025)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleRedeem()}
          />
        </div>
        
        <Button 
          onClick={handleRedeem}
          disabled={isLoading || !code.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Redeeming...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Redeem Code
            </>
          )}
        </Button>
        
        <div className="text-xs text-muted-foreground text-center">
          For developers and team members only
        </div>
      </CardContent>
    </Card>
    
    {/* Congratulations Overlay */}
    <CongratulationsOverlay
      isOpen={showCongratulations}
      onClose={() => {
        setShowCongratulations(false);
        // Reload to update the UI with premium features
        setTimeout(() => window.location.reload(), 500);
      }}
      title="Developer Access Granted!"
      message="Your premium developer access has been activated!"
    />
    </>
  );
}