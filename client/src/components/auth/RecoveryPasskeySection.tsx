import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Key, Trash2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveRecoveryPasskey, removeRecoveryPasskey, hasRecoveryPasskey } from '@/lib/passkey';

export function RecoveryPasskeySection() {
  const [passkey, setPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { toast } = useToast();

  // Check if user already has a recovery passkey
  useEffect(() => {
    const checkPasskey = async () => {
      setIsChecking(true);
      try {
        const exists = await hasRecoveryPasskey();
        setHasPasskey(exists);
      } catch (error) {
        console.error('Error checking recovery passkey:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkPasskey();
  }, []);

  const handleSavePasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passkey.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a recovery passkey",
        variant: "destructive"
      });
      return;
    }

    if (passkey !== confirmPasskey) {
      toast({
        title: "Validation Error", 
        description: "Passkeys do not match",
        variant: "destructive"
      });
      return;
    }

    if (passkey.length < 8) {
      toast({
        title: "Validation Error",
        description: "Recovery passkey must be at least 8 characters",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await saveRecoveryPasskey(passkey);
      
      if (result.success) {
        toast({
          title: "✅ Recovery Passkey Saved",
          description: result.message,
        });
        setHasPasskey(true);
        setPasskey('');
        setConfirmPasskey('');
      } else {
        toast({
          title: "Failed to Save Passkey",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Unexpected Error",
        description: "Something went wrong while saving your passkey",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePasskey = async () => {
    setIsLoading(true);
    try {
      const result = await removeRecoveryPasskey();
      
      if (result.success) {
        toast({
          title: "Recovery Passkey Removed",
          description: result.message,
        });
        setHasPasskey(false);
      } else {
        toast({
          title: "Failed to Remove Passkey", 
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Unexpected Error",
        description: "Something went wrong while removing your passkey",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Recovery Passkey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Recovery Passkey
        </CardTitle>
        <CardDescription>
          Set a backup passkey to recover account access if you lose access to your email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPasskey ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Recovery passkey is set</span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRemovePasskey}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Remove Passkey
              </Button>
              <Button
                onClick={() => setHasPasskey(false)}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                Update Passkey
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSavePasskey} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passkey">Recovery Passkey</Label>
              <Input
                id="passkey"
                type="password"
                placeholder="Enter your recovery passkey"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                disabled={isLoading}
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-passkey">Confirm Passkey</Label>
              <Input
                id="confirm-passkey"
                type="password"
                placeholder="Confirm your recovery passkey"
                value={confirmPasskey}
                onChange={(e) => setConfirmPasskey(e.target.value)}
                disabled={isLoading}
                minLength={8}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Key className="h-4 w-4" />
              )}
              Save Recovery Passkey
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}