import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PremiumGate } from '@/components/bible/PremiumGate';
import { usePremiumCheck } from '@/hooks/usePremiumCheck';
import { MessageSquare, Users, TrendingUp, Clock } from 'lucide-react';

export default function Forum() {
  const { isPremium, canAccessForum } = usePremiumCheck();

  if (!canAccessForum()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <PremiumGate 
            feature="Community Forum"
            description="Join discussions with fellow Bible students, share insights, and participate in biblical discourse. Premium members get access to all forum features including posting, voting, and direct messaging."
          />
        </div>
      </div>
    );
  }

  const forumStats = {
    totalPosts: 1247,
    activeMembers: 89,
    todaysPosts: 23,
    topDiscussions: [
      { title: "Understanding Prophecy in Daniel", replies: 45, author: "John M.", time: "2 hours ago" },
      { title: "Cross-references in Romans 8", replies: 23, author: "Sarah K.", time: "4 hours ago" },
      { title: "Hebrew word studies in Psalms", replies: 67, author: "Michael R.", time: "6 hours ago" },
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community Forum</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Connect with fellow Bible students and share your insights
            </p>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700">
            <MessageSquare className="w-4 h-4 mr-2" />
            New Discussion
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{forumStats.totalPosts.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Discussions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{forumStats.activeMembers}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{forumStats.todaysPosts}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Posts Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Discussions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Trending Discussions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {forumStats.topDiscussions.map((discussion, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {discussion.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>by {discussion.author}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {discussion.time}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {discussion.replies} replies
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Notice */}
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Forum Features Coming Soon</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We're building an amazing community experience with real-time discussions, 
              verse-specific threads, and collaborative study tools.
            </p>
            <Button variant="outline">
              Get Notified When Available
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}