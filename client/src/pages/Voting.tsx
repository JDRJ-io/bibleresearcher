import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PremiumGate } from '@/components/bible/PremiumGate';
import { usePremiumCheck } from '@/hooks/usePremiumCheck';
import { Vote, TrendingUp, Users, Award } from 'lucide-react';

export default function Voting() {
  const { isPremium, canAccessForum } = usePremiumCheck();

  if (!canAccessForum()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <PremiumGate 
            feature="Community Voting"
            description="Participate in community polls about biblical interpretations, study preferences, and theological discussions. Help shape the direction of our Bible study community."
          />
        </div>
      </div>
    );
  }

  const votingData = {
    activePolls: 7,
    totalVotes: 2341,
    yourVotes: 14,
    recentPolls: [
      { 
        title: "Best study method for Pauline epistles?", 
        votes: 156, 
        timeLeft: "3 days",
        options: ["Historical context", "Verse-by-verse", "Thematic", "Comparative"]
      },
      { 
        title: "Which prophecy study tool is most helpful?", 
        votes: 89, 
        timeLeft: "1 week",
        options: ["Timeline charts", "Cross-references", "Commentary", "Original language"]
      },
      { 
        title: "Preferred translation for group study?", 
        votes: 234, 
        timeLeft: "2 days",
        options: ["BSB", "WEB", "YLT", "KJV"]
      },
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community Voting</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Have your voice heard in community decisions and biblical discussions
            </p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Vote className="w-4 h-4 mr-2" />
            Create Poll
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Vote className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{votingData.activePolls}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Polls</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{votingData.totalVotes.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Votes Cast</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{votingData.yourVotes}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your Votes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Polls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Active Community Polls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {votingData.recentPolls.map((poll, index) => (
                <div key={index} className="border rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {poll.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>{poll.votes} votes</span>
                        <span>•</span>
                        <span>{poll.timeLeft} remaining</span>
                      </div>
                    </div>
                    <Badge variant="outline">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {poll.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                        <span className="font-medium">{option}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded">
                            <div 
                              className="h-2 bg-purple-500 rounded" 
                              style={{ width: `${Math.random() * 80 + 10}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 w-8">
                            {Math.floor(Math.random() * 40 + 5)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      View Results
                    </Button>
                    <Button size="sm">
                      Vote Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Notice */}
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Vote className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Interactive Voting Coming Soon</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Full voting functionality is in development. Soon you'll be able to create polls, 
              vote on community topics, and see real-time results.
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