import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Crown, Code, Sparkles } from 'lucide-react';

export function DevUnlock() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redeem-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Code redeemed successfully!",
          description: "Your premium access has been activated.",
        });
        
        // Refresh the user's profile to get updated tier
        await refreshProfile();
        setCode('');
        
        // Optional: Reload page to apply premium features
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast({
          title: "Redemption failed",
          description: result.message || "Invalid or expired code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Redeem error:', error);
      toast({
        title: "Connection error",
        description: "Failed to connect to redemption service",
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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
  );
}