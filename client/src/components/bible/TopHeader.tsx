import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search, Menu, Sparkles, KeyRound, X } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/components/auth/UserProfile';
import { CombinedAuthModal } from '@/components/auth/CombinedAuthModal';
import { useState } from 'react';
import { useWindowSize } from 'react-use';

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

  return (
    <header 
      className="sticky top-0 z-30 border-b transition-all duration-300 flex items-center justify-between px-2 max-w-full"
      style={{ 
        backgroundColor: 'var(--header-bg)', 
        borderColor: 'var(--border-color)', 
        height: isMobile ? '38px' : 'var(--header-height)' 
      }}
    >
      {/* Left Section: Navigation Controls */}
      <div className="flex items-center space-x-2">
        {/* Back/Forward Buttons */}
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} p-0`}
            onClick={onBack}
            disabled={!canGoBack}
            title="Previous Verse"
          >
            <ChevronLeft className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} p-0`}
            onClick={onForward}
            disabled={!canGoForward}
            title="Next Verse"
          >
            <ChevronRight className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
          </Button>
        </div>


      </div>

      {/* Center Section: Search Bar */}
      <div className="flex-1 max-w-md mx-2">
        {isMobile ? (
          <>
            {!searchOpen ? (
              <Button
                variant="outline"
                size="sm"
                className="w-6 h-6 p-0"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-3 h-3" />
              </Button>
            ) : (
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search verses..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8 pr-8 h-6 text-xs"
                  style={{
                    backgroundColor: 'var(--column-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-color)',
                  }}
                  onBlur={() => setSearchOpen(false)}
                  autoFocus
                />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 opacity-60" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 w-4 h-4 p-0"
                >
                  <X className="w-2 h-2" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="relative">
            <Input
              type="text"
              placeholder="search random w/ '%'"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4"
              style={{
                backgroundColor: 'var(--column-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-color)',
              }}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-60" />
          </div>
        )}
      </div>

      {/* Right Section: Auth and Menu */}
      <div className="flex items-center gap-1">
        {/* Quick verse shortcuts - hidden on mobile */}
        {!isMobile && (
          <div className="flex items-center gap-2 mr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("Genesis 1:1")}
              className="text-xs"
            >
              Gen 1:1
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("Psalm 23")}
              className="text-xs"
            >
              Psalm 23
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("John 3:16")}
              className="text-xs"
            >
              John 3:16
            </Button>
          </div>
        )}

        {/* Combined Sign In/Up Button */}
        {!user && (
          <Button
            variant="default"
            size="sm"
            className={`bg-purple-500 hover:bg-purple-600 text-white text-xs ${isMobile ? 'px-2 h-6' : 'px-3 h-7'}`}
            onClick={() => setIsAuthModalOpen(true)}
          >
            Sign In/Up
          </Button>
        )}

        {/* Hamburger Menu Button */}
        <Button
          variant="outline"
          size="sm"
          className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} p-0`}
          onClick={onMenuToggle}
        >
          <Menu className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
        </Button>
      </div>

      {/* Combined Auth Modal */}
      <CombinedAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
}