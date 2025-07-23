import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search, Menu, Sparkles, KeyRound, X, Book } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/components/auth/UserProfile';
import { CombinedAuthModal } from '@/components/auth/CombinedAuthModal';
import { useState } from 'react';
import { useWindowSize } from 'react-use';
import './ForceHeaderStyles.css';

interface TopHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onBack: () => void;
  onForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onMenuToggle: () => void;
}

export function TopHeader({
  searchQuery,
  onSearchChange,
  onBack,
  onForward,
  canGoBack,
  canGoForward,
  onMenuToggle,
}: TopHeaderProps) {
  const { theme, setTheme, themes } = useTheme();
  const { user, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width < 640;

  console.log('TopHeader auth state:', { user: !!user, loading, userDetails: user ? 'logged in' : 'logged out' });
  console.log('🎨 HEADER HEIGHT DEBUG:', { isMobile, width, expectedHeight: isMobile ? '120px' : '200px' });
  console.log('🎨 CSS CLASSES CHECK:', { 
    headerClasses: 'divine-header sacred-glow', 
    logoClasses: 'divine-logo-container heavenly-float',
    cssImported: true 
  });

  return (
    <header 
      className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between max-w-full shadow-sm"
      style={{ 
        height: isMobile ? '48px' : '64px',
        minHeight: isMobile ? '48px' : '64px',
        maxHeight: isMobile ? '48px' : '64px',
        padding: isMobile ? '0 8px' : '0 16px'
      }}
    >
      {/* Mobile Layout */}
      {isMobile ? (
        <div className="flex items-center justify-between w-full h-full">
          {/* Left: Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className={`w-8 h-8 p-0 ${!canGoBack ? 'opacity-50' : ''}`}
              onClick={onBack}
              disabled={!canGoBack}
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`w-8 h-8 p-0 ${!canGoForward ? 'opacity-50' : ''}`}
              onClick={onForward}
              disabled={!canGoForward}
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Center: Search */}
          <div className="flex-1 mx-2 max-w-[180px]">
            {!searchOpen ? (
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4" />
              </Button>
            ) : (
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8 pr-8 h-8 text-xs"
                  onBlur={() => setSearchOpen(false)}
                  autoFocus
                />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 w-5 h-5 p-0"
                >
                  <X className="w-2 h-2" />
                </Button>
              </div>
            )}
          </div>

          {/* Right: Auth + Menu */}
          <div className="flex items-center gap-2">
            {!user && (
              <Button
                variant="default"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setIsAuthModalOpen(true)}
              >
                <KeyRound className="w-3 h-3 mr-1" />
                Sign In
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0"
              onClick={onMenuToggle}
              title="Menu"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        /* Desktop Layout */
        <>
          {/* Left Section: Logo + Navigation */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Book className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg">Scripture Study</span>
                <span className="text-xs text-muted-foreground">Bible Research Tool</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className={`w-9 h-9 p-0 ${!canGoBack ? 'opacity-50' : ''}`}
                onClick={onBack}
                disabled={!canGoBack}
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`w-9 h-9 p-0 ${!canGoForward ? 'opacity-50' : ''}`}
                onClick={onForward}
                disabled={!canGoForward}
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-2xl mx-6">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search verses..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 h-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Right Section: Quick Links + Auth + Menu */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange("Genesis 1:1")}
                className="px-3 py-2 h-9 text-sm"
              >
                Genesis 1:1
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange("Psalm 23")}
                className="px-3 py-2 h-9 text-sm"
              >
                Psalm 23
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange("John 3:16")}
                className="px-3 py-2 h-9 text-sm"
              >
                John 3:16
              </Button>
            </div>

            {!user && (
              <Button
                variant="default"
                size="sm"
                className="px-4 h-9"
                onClick={() => setIsAuthModalOpen(true)}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-9 h-9 p-0"
              onClick={onMenuToggle}
              title="Menu"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}

      {/* Combined Auth Modal */}
      <CombinedAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
}