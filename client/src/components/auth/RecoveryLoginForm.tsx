import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Key, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RecoveryLoginFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export function RecoveryLoginForm({ onSuccess, onBack }: RecoveryLoginFormProps) {
  const [email, setEmail] = useState('');
  const [passkey, setPasskey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !passkey.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and recovery passkey",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/functions/v1/recover-with-passkey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, passkey })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "✅ Recovery Link Generated",
          description: "Check your email for the recovery link",
        });
        
        // In development, show the recovery link
        if (result.recoveryLink && import.meta.env.DEV) {
          console.log('Recovery link:', result.recoveryLink);
          toast({
            title: "Development Mode",
            description: "Recovery link logged to console",
          });
        }
        
        onSuccess?.();
      } else {
        toast({
          title: "Recovery Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Recovery error:', error);
      toast({
        title: "Recovery Failed",
        description: "Unable to process recovery request",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Account Recovery
        </CardTitle>
        <CardDescription>
          Enter your email and recovery passkey to regain access to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRecovery} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recovery-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="recovery-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="recovery-passkey">Recovery Passkey</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="recovery-passkey"
                type="password"
                placeholder="Enter your recovery passkey"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                disabled={isLoading}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Recovery Process</p>
              <p className="text-xs mt-1">
                After verification, we'll send a magic link to your email. Click it to regain access and update your email if needed.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {onBack && (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Recover Account
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}