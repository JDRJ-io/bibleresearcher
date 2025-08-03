import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function AuthHelp() {
  const [copied, setCopied] = useState(false);
  const currentUrl = window.location.origin;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">Complete Your Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800 dark:text-green-200">
                  Authentication System is Working!
                </h3>
              </div>
              <p className="text-green-700 dark:text-green-300 text-sm">
                You received a real Supabase authentication email. The system is fully functional.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">To Complete Sign-up:</h3>
              
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">1. Copy your current app URL:</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(currentUrl)}
                    className="flex items-center gap-2"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy URL'}
                  </Button>
                </div>
                <code className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded block">
                  {currentUrl}
                </code>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <span className="font-medium">2. Open your Yahoo email and find the Supabase confirmation link</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Look for the email from "Supabase Auth" with the subject "Confirm Your Signup"
                </p>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <span className="font-medium">3. Edit the link in your email:</span>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-red-600">Replace this:</span>
                    <code className="ml-2 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">localhost:3000</code>
                  </div>
                  <div>
                    <span className="text-green-600">With this:</span>
                    <code className="ml-2 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                      {currentUrl.replace('https://', '')}
                    </code>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <span className="font-medium">4. Visit the corrected link</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click the modified link to complete your authentication
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                What Happens Next:
              </h3>
              <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                <li>• You'll be redirected to complete your profile</li>
                <li>• Welcome modal will appear for new users</li>
                <li>• Access to Forum and Voting features</li>
                <li>• Premium features based on your tier</li>
              </ul>
            </div>

            <div className="text-center">
              <Button 
                onClick={() => window.location.href = '/'}
                className="mr-4"
              >
                Back to Bible Study
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/test-auth'}
              >
                Test Authentication
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}