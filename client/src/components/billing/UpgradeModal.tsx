import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Gift, Sparkles } from 'lucide-react';
import { billing } from '@/lib/billing';
import { useToast } from '@/hooks/use-toast';
import { redeemCode } from '@/lib/redemption';
import { CongratulationsOverlay } from '@/components/ui/congratulations-overlay';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      await billing.startCheckout();
    } catch (error: any) {
      toast({
        title: "Upgrade failed",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!code.trim()) {
      toast({
        title: "Enter a code",
        description: "Please enter a redeem code to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsCodeLoading(true);
    try {
      const { profile } = await redeemCode(code);
      
      setCode('');
      onClose();
      
      // Show congratulations overlay instead of toast
      setShowCongratulations(true);
    } catch (error: any) {
      toast({
        title: "Redemption failed",
        description: error.message || "Invalid or expired code",
        variant: "destructive",
      });
    } finally {
      setIsCodeLoading(false);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-950 via-gray-900 to-amber-950 border-2 border-purple-800">
        {/* Mystical Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-800/20 via-transparent to-amber-800/20" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-amber-600/20 rounded-full blur-xl animate-pulse delay-1000" />
        
        <div className="relative z-10">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="flex items-center justify-center gap-3 text-2xl font-bold bg-gradient-to-r from-purple-600 to-amber-600 dark:from-purple-400 dark:to-amber-400 bg-clip-text text-transparent">
            <img src="/crown-icon.png" alt="" className="h-8 w-8 animate-pulse" />
            Upgrade to Premium
            <Sparkles className="h-8 w-8 text-purple-500 animate-pulse" />
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
            Unlock advanced Bible study features and join our sacred community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Premium Features */}
          <Card className="bg-gray-800/60 backdrop-blur-sm border border-purple-700/50">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Premium Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  'Advanced Search & Concordance',
                  'Unlimited Notes & Bookmarks', 
                  'Community Forum Access',
                  'Cross-Reference Analytics',
                  'Prophecy Tracking Tools',
                  'Priority Support'
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-purple-50/50 to-amber-50/50 dark:from-purple-900/20 dark:to-amber-900/20">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Button */}
          <Button 
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Starting Your Sacred Journey...
              </>
            ) : (
              <>
                <img src="/crown-icon.png" alt="" className="h-5 w-5 mr-2 inline-block" />
                Start Your Sacred Journey
              </>
            )}
          </Button>

          {/* Code Redemption */}
          <div className="text-center">
            <Button 
              variant="link" 
              size="sm"
              onClick={() => setShowCodeInput(!showCodeInput)}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
            >
              <Gift className="h-4 w-4 mr-1" />
              Have a divine code?
            </Button>
          </div>

          {showCodeInput && (
            <div className="space-y-4 p-4 bg-gradient-to-r from-purple-100/50 to-amber-100/50 dark:from-purple-900/30 dark:to-amber-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="space-y-2">
                <Label htmlFor="redeem-code" className="text-gray-800 dark:text-gray-200 font-medium">Divine Redemption Code</Label>
                <Input
                  id="redeem-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter your sacred code"
                  className="bg-white/70 dark:bg-gray-800/70 border-purple-300 dark:border-purple-600 focus:border-purple-500 dark:focus:border-purple-400"
                />
              </div>
              <Button 
                onClick={handleRedeemCode}
                disabled={isCodeLoading}
                variant="outline"
                className="w-full border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
              >
                {isCodeLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                    Redeeming sacred gift...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Redeem Divine Code
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Congratulations Overlay */}
    <CongratulationsOverlay
      isOpen={showCongratulations}
      onClose={() => {
        setShowCongratulations(false);
        // Reload to update the UI with premium features
        setTimeout(() => window.location.reload(), 500);
      }}
    />
  </>);
}