import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { billing } from '@/lib/billing';

export default function Subscribe() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      await billing.startCheckout();
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 dark:from-purple-950 dark:via-gray-900 dark:to-amber-950">
      {/* Mystical Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-transparent to-amber-100/30 dark:from-purple-800/20 dark:via-transparent dark:to-amber-800/20" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200/20 dark:bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-200/20 dark:bg-amber-600/20 rounded-full blur-2xl animate-pulse delay-1000" />
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Crown className="h-12 w-12 text-amber-500 animate-pulse" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-amber-600 bg-clip-text text-transparent">
                Join Our Sacred Community
              </h1>
              <Sparkles className="h-12 w-12 text-purple-500 animate-pulse" />
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Have your voice heard as we connect the Bible together as a divine community
            </p>
            
            {/* Back Button */}
            <Button
              onClick={() => setLocation('/')}
              variant="ghost"
              className="mb-8 holy-button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bible Study
            </Button>
          </div>

          {/* Subscription Card */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg border-2 border-purple-200 dark:border-purple-800 p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Premium Community Membership
              </h2>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-amber-600 bg-clip-text text-transparent mb-4">
                $10/month
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Join our sacred community and unlock divine features
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-amber-500" />
                <span>Voice in our vision and direction</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span>Enhanced divine UI effects</span>
              </div>
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-blue-500" />
                <span>Direct forum participation</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-green-500" />
                <span>Priority support access</span>
              </div>
            </div>

            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white holy-button py-6 text-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Redirecting to Checkout...
                </div>
              ) : (
                <>
                  <Crown className="h-5 w-5 mr-2" />
                  Start Your Sacred Journey
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Secure payment powered by Stripe. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}