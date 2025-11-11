import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Calendar, CreditCard, Shield } from 'lucide-react';
import { useLocation } from 'wouter';
import { billing } from '@/lib/billing';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import SupportQuickContact from '@/components/SupportQuickContact';


export default function Profile() {
  const { user, profile, loading, profileLoading, manageBilling } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // All useState hooks must be at the top before any conditional logic
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Keep redirect disabled for debugging authentication flow
  useEffect(() => {
    if (!loading && !user) {
      console.log('🚫 No user authenticated, showing auth required message');
    }
  }, [user, loading]);

  // Debug render - show what's happening
  console.log('🔍 Profile page render state:', { 
    user: !!user, 
    loading, 
    profileLoading,
    profile: !!profile
  });

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
          </div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>You need to sign in to access your profile</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">Please return to the main page and sign in with your email to continue.</p>
            <Button onClick={() => setLocation('/')} className="w-full">
              Go to Main Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isStaff = profile?.role === 'staff' || profile?.role === 'admin';
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  
  const handleManageBilling = async () => {
    setIsBillingLoading(true);
    try {
      const result = await manageBilling();
      if (!result.ok) {
        toast({
          title: "Portal failed",
          description: result.msg,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Portal failed",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    } finally {
      setIsBillingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
          <Button variant="outline" onClick={() => setLocation('/')}>
            Back to Bible Study
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Display Name</Label>
                <p className="text-sm">{profile?.name || 'Not set'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img src="/crown-icon.png" alt="" className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Membership Status</Label>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <img src="/crown-icon.png" alt="" className="h-4 w-4" />
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                    Founding Member
                  </span>
                </div>
              </div>
              
              {profile?.subscription_status && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <p className="text-sm mt-1">
                    {profile.subscription_status === 'active' ? 'Active' : 
                     profile.subscription_status === 'past_due' ? 'Past Due' :
                     profile.subscription_status === 'canceled' ? 'Canceled' :
                     profile.subscription_status}
                  </p>
                </div>
              )}

              {/* Only show billing management if user has a stripe subscription (legacy support) */}
              {profile?.stripe_customer_id && (
                <div className="pt-4 border-t space-y-2">
                  <Button 
                    variant="outline"
                    className="w-full"
                    disabled={isBillingLoading}
                    onClick={handleManageBilling}
                  >
                    {isBillingLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Manage Billing
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Account Details
              </CardTitle>
              <CardDescription>
                Your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="text-sm">{user.email}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                <p className="text-sm">{profile?.name || 'Not set'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  {joinedDate}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <p className="text-muted-foreground mb-2">Password Management</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowChangePasswordModal(true)}
                  data-testid="button-change-password"
                >
                  Change Password
                </Button>
              </div>
              
              <div className="text-sm">
                <p className="text-muted-foreground">Two-factor authentication coming soon</p>
              </div>
            </CardContent>
          </Card>

        </div>
        
        {/* Upgrade Modal */}
        <UpgradeModal 
          isOpen={showUpgradeModal} 
          onClose={() => setShowUpgradeModal(false)} 
        />
        
        {/* Change Password Modal */}
        <ChangePasswordModal 
          open={showChangePasswordModal}
          onOpenChange={setShowChangePasswordModal}
        />
        
        {/* Support Quick Contact */}
        <SupportQuickContact 
          userEmail={user?.email}
          userId={user?.id}
        />
      </div>
    </div>
  );
}