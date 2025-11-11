import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Crown, Users, MessageCircle, Vote, Star } from 'lucide-react';

interface CommunityMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function CommunityMembershipModal({ 
  isOpen, 
  onClose, 
  onUpgrade 
}: CommunityMembershipModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      await onUpgrade();
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    {
      icon: <Crown className="h-5 w-5 text-amber-500" />,
      title: "Voice in Our Vision",
      description: "Help shape how we connect the Bible together as a community"
    },
    {
      icon: <Users className="h-5 w-5 text-purple-500" />,
      title: "Exclusive Community Access",
      description: "Join our inner circle of biblical scholars and enthusiasts"
    },
    {
      icon: <MessageCircle className="h-5 w-5 text-blue-500" />,
      title: "Direct Forum Participation",
      description: "Engage in deeper discussions and theological debates"
    },
    {
      icon: <Vote className="h-5 w-5 text-green-500" />,
      title: "Voting Rights",
      description: "Vote on new features, translations, and community initiatives"
    },
    {
      icon: <Star className="h-5 w-5 text-orange-500" />,
      title: "Priority Support",
      description: "Get first-class assistance and early access to new features"
    },
    {
      icon: <Sparkles className="h-5 w-5 text-pink-500" />,
      title: "Mystical Features",
      description: "Unlock enhanced divine UI effects and prophecy animations"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-purple-950 via-gray-900 to-amber-950 border-2 border-purple-700 shadow-2xl">
        {/* Enhanced Mystical Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 via-transparent to-amber-100/40 dark:from-purple-800/20 dark:via-transparent dark:to-amber-800/20" />
        <div className="absolute top-0 left-0 w-48 h-48 bg-purple-300/30 dark:bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-300/30 dark:bg-amber-600/20 rounded-full blur-2xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-pink-300/20 dark:bg-pink-600/15 rounded-full blur-xl animate-pulse delay-500" />
        
        <div className="relative z-10">
          <DialogHeader className="text-center pb-6">
            <DialogTitle className="flex items-center justify-center gap-3 text-2xl font-bold bg-gradient-to-r from-purple-700 to-amber-700 dark:from-purple-400 dark:to-amber-400 bg-clip-text text-transparent">
              <Crown className="h-8 w-8 text-amber-500 animate-pulse" />
              Join Our Sacred Community
              <Sparkles className="h-8 w-8 text-purple-500 animate-pulse" />
            </DialogTitle>
            <p className="text-gray-700 dark:text-gray-300 mt-2 font-medium">
              Be part of connecting the Bible together as a divine community
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Membership Tier */}
            <div className="text-center">
              <Badge 
                variant="secondary" 
                className="text-lg px-6 py-2 bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white font-semibold shadow-lg transition-all duration-300"
              >
                Community Member
              </Badge>
              <div className="mt-3">
                <span className="text-4xl font-bold text-gray-800 dark:text-white">$12</span>
                <span className="text-gray-600 dark:text-gray-400 font-medium">/month</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 font-medium">
                Your voice in our biblical endeavors
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm border border-purple-300/60 dark:border-purple-600/50 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-white/80 dark:hover:bg-gray-800/70 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {benefit.icon}
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white text-sm">
                      {benefit.title}
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-purple-300 dark:border-purple-600 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                disabled={isLoading}
              >
                Maybe Later
              </Button>
              <Button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isLoading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Join the Community
                  </>
                )}
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="text-center text-xs text-gray-600 dark:text-gray-400 pt-4 border-t border-purple-200 dark:border-purple-700">
              <p className="font-medium">✨ Cancel anytime • 💳 Secure payment • 🛡️ 30-day guarantee</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}