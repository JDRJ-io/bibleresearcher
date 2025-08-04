import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Crown, User, Mail, Calendar, Save } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Profile() {
  const { user, profile, loading, saveProfile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // loading comes from AuthContext now
  
  const [formData, setFormData] = useState({
    name: '',
    bio: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Keep redirect disabled for debugging authentication flow
  useEffect(() => {
    if (!loading && !user) {
      console.log('🚫 No user authenticated, showing auth required message');
    }
    
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || ''
      });
    }
  }, [user, profile, loading, setLocation]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      await saveProfile(formData);
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed", 
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Debug render - show what's happening
  console.log('🔍 Profile page render state:', { 
    user: !!user, 
    loading, 
    profile: !!profile
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
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

  const isPremium = profile?.tier === 'premium';
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
                Update your personal information and bio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell others about yourself..."
                    rows={3}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
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
                Your account information and subscription status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="text-sm">{user.email}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  {joinedDate}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Subscription</Label>
                <div className="flex items-center gap-2 text-sm">
                  {isPremium ? (
                    <>
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                        Premium Member
                      </span>
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4" />
                      <span>Free Member</span>
                    </>
                  )}
                </div>
              </div>

              {!isPremium && (
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setLocation('/dev')}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Get Premium Access
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}