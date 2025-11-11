/**
 * Database Initializer Component
 * Sets up database tables and ensures user data saving works
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { setupDatabase, ensureUserExists } from '@/lib/databaseSetup';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface DatabaseInitializerProps {
  onComplete?: () => void;
}

export function DatabaseInitializer({ onComplete }: DatabaseInitializerProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initStatus, setInitStatus] = useState<{
    database: 'pending' | 'success' | 'error';
    user: 'pending' | 'success' | 'error';
    message?: string;
  }>({
    database: 'pending',
    user: 'pending'
  });
  
  const { toast } = useToast();
  const { user } = useAuth();

  const initializeDatabase = async () => {
    setIsInitializing(true);
    setInitStatus({ database: 'pending', user: 'pending' });

    try {
      // Step 1: Setup database tables
      toast({ title: "Setting up database...", description: "Creating tables and policies" });
      
      const dbSuccess = await setupDatabase();
      if (!dbSuccess) {
        setInitStatus(prev => ({ ...prev, database: 'error', message: 'Failed to create database tables' }));
        setIsInitializing(false);
        return;
      }
      
      setInitStatus(prev => ({ ...prev, database: 'success' }));
      toast({ title: "Database tables created", description: "All tables and RLS policies configured" });

      // Step 2: Ensure user exists
      if (user) {
        const userSuccess = await ensureUserExists(user.id, user.email || '', user.user_metadata);
        if (userSuccess) {
          setInitStatus(prev => ({ ...prev, user: 'success' }));
          toast({ 
            title: "Database initialization complete", 
            description: "User data saving is now ready",
            variant: "default"
          });
          
          // Call completion callback
          onComplete?.();
        } else {
          setInitStatus(prev => ({ ...prev, user: 'error', message: 'Failed to create user record' }));
        }
      } else {
        setInitStatus(prev => ({ ...prev, user: 'error', message: 'User not authenticated' }));
      }

    } catch (error: any) {
      console.error('Database initialization failed:', error);
      setInitStatus(prev => ({ 
        ...prev, 
        database: 'error', 
        user: 'error',
        message: error.message || 'Unknown error occurred'
      }));
      
      toast({ 
        title: "Initialization failed", 
        description: error.message || 'Please check console for details',
        variant: "destructive"
      });
    }

    setIsInitializing(false);
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Ready</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Setup
        </CardTitle>
        <CardDescription>
          Initialize database tables and user authentication for data saving
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Authentication Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <div>
              <p className="font-medium">User Authentication</p>
              <p className="text-sm text-muted-foreground">
                {user ? `Signed in as ${user.email}` : 'Not authenticated'}
              </p>
            </div>
          </div>
          <Badge variant={user ? "default" : "secondary"} className={user ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" : ""}>
            {user ? 'Authenticated' : 'Sign In Required'}
          </Badge>
        </div>

        {/* Database Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon(initStatus.database)}
            <div>
              <p className="font-medium">Database Tables</p>
              <p className="text-sm text-muted-foreground">
                User bookmarks, highlights, notes, navigation history
              </p>
            </div>
          </div>
          {getStatusBadge(initStatus.database)}
        </div>

        {/* User Record Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon(initStatus.user)}
            <div>
              <p className="font-medium">User Record</p>
              <p className="text-sm text-muted-foreground">
                User account in database for RLS policies
              </p>
            </div>
          </div>
          {getStatusBadge(initStatus.user)}
        </div>

        {/* Error Message */}
        {initStatus.message && (initStatus.database === 'error' || initStatus.user === 'error') && (
          <div className="p-3 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{initStatus.message}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4">
          {!user ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Please sign in to initialize user data saving
              </p>
              <Button variant="outline" disabled>
                Sign In Required
              </Button>
            </div>
          ) : (
            <Button 
              onClick={initializeDatabase}
              disabled={isInitializing}
              className="w-full"
            >
              {isInitializing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Initializing Database...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Initialize Database & Fix User Data
                </>
              )}
            </Button>
          )}
        </div>

        {/* Success Message */}
        {initStatus.database === 'success' && initStatus.user === 'success' && (
          <div className="p-4 border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 rounded-lg text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-green-600 dark:text-green-400">
              Database Initialization Complete!
            </p>
            <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
              User data saving (bookmarks, highlights, notes) is now functional.
              Navigation history and autosave are also enabled.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}