import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { CheckCircle, Crown, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BillingSuccess() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Get session ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('session_id');
    if (id) {
      setSessionId(id);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 dark:from-purple-950 dark:via-gray-900 dark:to-amber-950 flex items-center justify-center p-4">
      {/* Mystical Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-transparent to-amber-100/30 dark:from-purple-800/20 dark:via-transparent dark:to-amber-800/20" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-200/20 dark:bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-amber-200/20 dark:bg-amber-600/20 rounded-full blur-2xl animate-pulse delay-1000" />
      
      <Card className="relative z-10 w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-800">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle className="h-16 w-16 text-green-500 animate-pulse" />
              <Crown className="h-8 w-8 text-amber-500 absolute -top-2 -right-2 animate-bounce" />
              <Sparkles className="h-6 w-6 text-purple-500 absolute -bottom-1 -left-1 animate-pulse delay-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-amber-600 bg-clip-text text-transparent">
            Welcome to the Sacred Community!
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Your membership is now active. You have been blessed with premium access.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-purple-100 to-amber-100 dark:from-purple-900/50 dark:to-amber-900/50 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
            <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
              🎉 Premium Features Unlocked:
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>• Enhanced divine UI effects</li>
              <li>• Forum participation rights</li>
              <li>• Voice in community decisions</li>
              <li>• Priority support access</li>
              <li>• Mystical prophecy animations</li>
            </ul>
          </div>
          
          {sessionId && (
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded p-2">
              Session ID: {sessionId.substring(0, 20)}...
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setLocation('/')}
              className="flex-1 bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white holy-button"
            >
              <Crown className="h-4 w-4 mr-2" />
              Enter the Bible
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}