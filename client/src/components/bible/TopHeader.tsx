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
      className="sticky top-0 z-30 border-b transition-all duration-300 flex items-center justify-between px-4 max-w-full shadow-sm"
      style={{ 
        backgroundColor: 'var(--header-bg)', 
        borderColor: 'var(--border-color)', 
        height: isMobile ? '48px' : '64px' 
      }}
    >
      {/* Left Section: Navigation Controls */}
      <div className="flex items-center space-x-3">
        {/* App Logo/Title */}
        <div className="flex items-center space-x-2">
          <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center`}>
            <Book className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
          </div>
          {!isMobile && (
            <span className="font-semibold text-lg text-gray-800 dark:text-gray-200">
              Bible Study
            </span>
          )}
        </div>

        {/* Back/Forward Buttons */}
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} p-0 hover:bg-gray-100 dark:hover:bg-gray-700`}
            onClick={onBack}
            disabled={!canGoBack}
            title="Previous Verse"
          >
            <ChevronLeft className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} p-0 hover:bg-gray-100 dark:hover:bg-gray-700`}
            onClick={onForward}
            disabled={!canGoForward}
            title="Next Verse"
          >
            <ChevronRight className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          </Button>
        </div>


      </div>

      {/* Center Section: Enhanced Search Bar */}
      <div className="flex-1 max-w-lg mx-4">
        {isMobile ? (
          <>
            {!searchOpen ? (
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4" />
              </Button>
            ) : (
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search verses..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-10 h-8 text-sm rounded-lg border-2 focus:border-blue-500"
                  style={{
                    backgroundColor: 'var(--column-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-color)',
                  }}
                  onBlur={() => setSearchOpen(false)}
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-60" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="relative">
            <Input
              type="text"
              placeholder="Search verses... (use '%' for random)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 pr-4 h-12 text-base rounded-xl border-2 focus:border-blue-500 shadow-sm"
              style={{
                backgroundColor: 'var(--column-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-color)',
              }}
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-60" />
          </div>
        )}
      </div>

      {/* Right Section: Enhanced Auth and Menu */}
      <div className="flex items-center gap-3">
        {/* Quick verse shortcuts - hidden on mobile */}
        {!isMobile && (
          <div className="flex items-center gap-2 mr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("Genesis 1:1")}
              className="text-sm px-3 py-2 h-9 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Gen 1:1
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("Psalm 23")}
              className="text-sm px-3 py-2 h-9 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Psalm 23
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("John 3:16")}
              className="text-sm px-3 py-2 h-9 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300"
            >
              John 3:16
            </Button>
          </div>
        )}

        {/* Enhanced Sign In/Up Button */}
        {!user && (
          <Button
            variant="default"
            size="sm"
            className={`bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium shadow-lg ${isMobile ? 'px-3 h-8 text-sm' : 'px-4 h-10 text-base'}`}
            onClick={() => setIsAuthModalOpen(true)}
          >
            <KeyRound className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'}`} />
            Sign In
          </Button>
        )}

        {/* Enhanced Hamburger Menu Button */}
        <Button
          variant="outline"
          size="sm"
          className={`${
            isMobile 
              ? 'w-10 h-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 shadow-lg' 
              : 'w-12 h-10 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm'
          } p-0 transition-all duration-200 rounded-lg`}
          onClick={onMenuToggle}
          title="Bible Settings"
        >
          <Menu className={`${isMobile ? 'w-4 h-4 text-blue-600 dark:text-blue-400' : 'w-5 h-5'}`} />
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