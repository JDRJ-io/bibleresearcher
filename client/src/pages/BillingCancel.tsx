import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { XCircle, Heart, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BillingCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 flex items-center justify-center p-4">
      {/* Subdued Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100/30 via-transparent to-purple-100/30 dark:from-gray-800/20 dark:via-transparent dark:to-purple-800/20" />
      <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-gray-200/20 dark:bg-gray-600/20 rounded-full blur-3xl animate-pulse" />
      
      <Card className="relative z-10 w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <XCircle className="h-16 w-16 text-gray-400 animate-pulse" />
              <Heart className="h-6 w-6 text-red-400 absolute -bottom-1 -right-1 animate-pulse delay-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-700 dark:text-gray-200">
            Payment Cancelled
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            No worries! Your journey with us continues.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              💙 Still Available to You:
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>• Full access to Bible study tools</li>
              <li>• Multiple translation support</li>
              <li>• Cross-reference exploration</li>
              <li>• Personal notes and bookmarks</li>
              <li>• Reading progress tracking</li>
            </ul>
          </div>
          
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            You can always upgrade later when you're ready to join our sacred community.
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setLocation('/')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Studying
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}