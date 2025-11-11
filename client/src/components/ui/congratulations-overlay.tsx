import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Star } from 'lucide-react';

interface CongratulationsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function CongratulationsOverlay({ 
  isOpen, 
  onClose, 
  title = "Congratulations!",
  message = "You've successfully upgraded to Premium!" 
}: CongratulationsOverlayProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Auto-hide confetti after animation
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti opacity-90"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  ['bg-yellow-400', 'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-pink-500'][Math.floor(Math.random() * 6)]
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Main Card */}
      <Card className="relative z-10 w-full max-w-md mx-4 bg-gradient-to-br from-purple-950 via-gray-900 to-amber-950 border-2 border-purple-800 shadow-2xl">
        {/* Mystical Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-800/20 via-transparent to-amber-800/20 rounded-lg" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-amber-600/20 rounded-full blur-xl animate-pulse delay-1000" />
        
        <CardContent className="relative z-10 p-8 text-center space-y-6">
          {/* Icon and Title */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <img src="/crown-icon.png" alt="" className="h-16 w-16 animate-pulse" />
                <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-purple-400 animate-spin" />
                <Star className="absolute -bottom-1 -left-2 h-4 w-4 text-yellow-400 animate-pulse delay-500" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
                {title}
              </h2>
              <p className="text-gray-300 text-lg">
                {message}
              </p>
            </div>
          </div>

          {/* Premium Features Highlight */}
          <div className="bg-gradient-to-r from-purple-900/50 to-amber-900/50 rounded-lg p-4 border border-purple-700/50">
            <p className="text-sm font-medium text-purple-300 mb-2">You now have access to:</p>
            <div className="space-y-1 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 text-yellow-400" />
                <span>Advanced Search & Concordance</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 text-yellow-400" />
                <span>Unlimited Notes & Bookmarks</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 text-yellow-400" />
                <span>Community Forum Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 text-yellow-400" />
                <span>Prophecy Tracking Tools</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            size="lg"
          >
            <img src="/crown-icon.png" alt="" className="h-5 w-5 mr-2 inline-block" />
            Start Your Sacred Journey
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}