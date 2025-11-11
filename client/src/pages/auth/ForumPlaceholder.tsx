import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ThumbsUp, Users, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function ForumPlaceholder() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-3xl">Community Forum</CardTitle>
            <CardDescription className="text-lg">
              Share insights, ask questions, and engage with fellow Bible researchers
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Premium Gate */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Crown className="w-8 h-8 text-amber-600" />
                <h3 className="text-xl font-semibold">Premium Feature</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The community forum is exclusive to premium members. Upgrade to unlock:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-green-600" />
                  <span>Post questions and insights</span>
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Engage with Bible scholars and researchers</span>
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <span>Vote on community suggestions</span>
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                <Lock className="w-4 h-4 mr-2" />
                Upgrade to Premium - $5/month
              </Button>
            </div>

            {/* Coming Soon Notice */}
            <Card className="border-2 border-dashed">
              <CardContent className="py-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Forum Integration Coming Soon</h4>
                <p className="text-muted-foreground max-w-md mx-auto">
                  The community forum will be integrated through our companion app. 
                  Premium members will have seamless access to discussions, voting, and collaborative Bible study features.
                </p>
              </CardContent>
            </Card>

            {/* Feature Preview */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <h5 className="font-semibold mb-2">Discussion Threads</h5>
                  <p className="text-sm text-muted-foreground">
                    Start conversations about passages, interpretations, and biblical insights
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                    <ThumbsUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <h5 className="font-semibold mb-2">Community Voting</h5>
                  <p className="text-sm text-muted-foreground">
                    Vote on the best interpretations and suggestions from fellow researchers
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <h5 className="font-semibold mb-2">Expert Insights</h5>
                  <p className="text-sm text-muted-foreground">
                    Learn from verified Bible scholars and experienced researchers
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}