/**
 * Database Setup Page
 * Complete setup and testing interface for user data functionality
 */

import React, { useState } from 'react';
import { DatabaseInitializer } from '@/components/setup/DatabaseInitializer';
import { UserDataTesting } from '@/components/user/UserDataTesting';
import { NavigationControls } from '@/components/navigation/NavigationControls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Database, TestTube, Navigation, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { runUserDataTests } from '@/tests/userDataTests';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function SetupPage() {
  const [setupComplete, setSetupComplete] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const runQuickTest = async () => {
    try {
      toast({ title: "Running comprehensive tests...", description: "Testing all user data functionality" });
      
      const results = await runUserDataTests();
      const totalTests = Object.values(results).reduce((sum, cat) => sum + cat.passed + cat.failed, 0);
      const totalPassed = Object.values(results).reduce((sum, cat) => sum + cat.passed, 0);
      const successRate = Math.round((totalPassed / totalTests) * 100);
      
      toast({ 
        title: `Test Results: ${totalPassed}/${totalTests} passed`, 
        description: `Success rate: ${successRate}%. Check console for detailed results.`,
        variant: successRate > 80 ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({ 
        title: "Test suite failed", 
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
              <Settings className="h-8 w-8" />
              Bible App Setup & Testing
            </h1>
            <p className="text-muted-foreground mb-4">
              Complete database setup, navigation history, autosave, and user data functionality
            </p>
            
            {/* Status Badges */}
            <div className="flex justify-center gap-2 flex-wrap">
              <Badge variant={user ? "default" : "secondary"} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                {user ? `✅ Authenticated: ${user.email}` : '❌ Not Authenticated'}
              </Badge>
              <Badge variant={setupComplete ? "default" : "secondary"} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                {setupComplete ? '✅ Database Ready' : '⏳ Setup Required'}
              </Badge>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="setup" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database Setup
              </TabsTrigger>
              <TabsTrigger value="testing" className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Testing Suite
              </TabsTrigger>
              <TabsTrigger value="navigation" className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Navigation
              </TabsTrigger>
              <TabsTrigger value="autosave" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Autosave
              </TabsTrigger>
            </TabsList>

            {/* Database Setup Tab */}
            <TabsContent value="setup" className="space-y-6">
              <DatabaseInitializer 
                onComplete={() => {
                  setSetupComplete(true);
                  toast({
                    title: "Setup Complete!",
                    description: "User data saving is now ready. Try the testing tab.",
                  });
                }}
              />
              
              {setupComplete && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600 dark:text-green-400">
                      ✅ Database Initialization Complete
                    </CardTitle>
                    <CardDescription>
                      All tables created, RLS policies configured, and user data saving is ready
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={runQuickTest} className="w-full">
                      <TestTube className="h-4 w-4 mr-2" />
                      Run Quick Test Suite
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Testing Suite Tab */}
            <TabsContent value="testing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Data Testing Suite</CardTitle>
                  <CardDescription>
                    Test bookmarks, highlights, notes, and data manipulation functions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user ? (
                    <UserDataTesting />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        Please sign in to test user data functionality
                      </p>
                      <Button variant="outline" disabled>
                        Sign In Required
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Navigation Tab */}
            <TabsContent value="navigation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Navigation History System</CardTitle>
                  <CardDescription>
                    Last 10 verse locations with back/forward navigation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Navigation Controls Demo */}
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-3">Navigation Controls</h3>
                    <NavigationControls className="justify-center" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Use back/forward buttons and history dropdown to navigate between verses
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">🔙 Back/Forward Navigation</h4>
                      <p className="text-sm text-muted-foreground">
                        Navigate through your last 10 visited verse locations with browser-style back/forward buttons
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">📚 History Dropdown</h4>
                      <p className="text-sm text-muted-foreground">
                        View recent locations with timestamps and jump directly to any verse
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">🗄️ Persistent Storage</h4>
                      <p className="text-sm text-muted-foreground">
                        Navigation history is saved to database and restored across sessions
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">🧹 Auto Cleanup</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatically maintains only the last 10 locations to keep history manageable
                      </p>
                    </div>
                  </div>

                  {user && (
                    <div className="text-center">
                      <p className="text-sm text-green-600 dark:text-green-400">
                        ✅ Navigation history is active for {user.email}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Autosave Tab */}
            <TabsContent value="autosave" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Autosave System</CardTitle>
                  <CardDescription>
                    Automatic saving of user position, layout preferences, and session state
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">💾 Position Saving</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatically saves your current verse location and scroll position
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">🎨 Layout Preferences</h4>
                      <p className="text-sm text-muted-foreground">
                        Remembers column widths, visible columns, theme, and font size
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">🚪 Session Restoration</h4>
                      <p className="text-sm text-muted-foreground">
                        Restores your exact reading position when you return to the app
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">⚡ Smart Timing</h4>
                      <p className="text-sm text-muted-foreground">
                        Saves after 3 seconds of inactivity, on tab switching, and page exit
                      </p>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Current Session Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>User:</span>
                        <span className="text-muted-foreground">
                          {user ? user.email : 'Not signed in'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Autosave:</span>
                        <span className="text-muted-foreground">
                          {user ? '✅ Active' : '❌ Requires authentication'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Position:</span>
                        <span className="text-muted-foreground">
                          {typeof window !== 'undefined' ? window.location.pathname : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {user && (
                    <div className="text-center">
                      <p className="text-sm text-green-600 dark:text-green-400">
                        ✅ Autosave is monitoring your session and will restore your position on next visit
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}