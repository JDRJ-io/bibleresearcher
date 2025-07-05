import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search, Menu, Sparkles, KeyRound } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/components/auth/UserProfile';
import { AuthModals } from '@/components/auth/AuthModals';
import { useState } from 'react';

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
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  console.log('TopHeader auth state:', { user: !!user, loading, userDetails: user ? 'logged in' : 'logged out' });
  
  // Force logged out state for testing
  const isLoggedOut = true;

  return (
    <header 
      className="sticky top-0 z-30 border-b transition-all duration-300 flex items-center justify-between px-4 max-w-full"
      style={{ 
        backgroundColor: 'var(--header-bg)', 
        borderColor: 'var(--border-color)', 
        height: 'var(--header-height)' 
      }}
    >
      {/* Left Section: Navigation Controls */}
      <div className="flex items-center space-x-3">
        {/* Back/Forward Buttons */}
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0"
            onClick={onBack}
            disabled={!canGoBack}
            title="Previous Verse"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0"
            onClick={onForward}
            disabled={!canGoForward}
            title="Next Verse"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Living Entrance Section - Auth State */}
        <div className="flex items-center space-x-2 ml-4 bg-red-500 p-2 rounded">
          <div className="text-white text-xs">DEBUG: loading={loading ? 'true' : 'false'}, user={user ? 'exists' : 'null'}</div>
          {loading ? (
            <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
              <div className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading...</span>
            </div>
          ) : isLoggedOut ? (
            // Logged Out State: Show Opal-styled Auth Buttons
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setIsSignUpOpen(true)}
                className="bg-gradient-to-r from-slate-400 via-purple-300 to-blue-300 hover:from-slate-500 hover:via-purple-400 hover:to-blue-400 text-white shadow-lg transition-all duration-300 hover:shadow-purple-300/50 hover:scale-105 text-sm px-3 py-1 h-8 font-medium"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Sign Up
              </Button>
              <Button
                onClick={() => setIsSignInOpen(true)}
                variant="outline"
                className="border-slate-300 bg-gradient-to-r from-slate-50 via-purple-50 to-blue-50 dark:from-slate-800 dark:via-purple-900/20 dark:to-blue-900/20 text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-slate-100 hover:via-purple-100 hover:to-blue-100 dark:hover:from-slate-700 dark:hover:via-purple-800/30 dark:hover:to-blue-800/30 transition-all duration-300 hover:scale-105 text-sm px-3 py-1 h-8 font-medium"
              >
                <KeyRound className="w-3 h-3 mr-1" />
                Sign In
              </Button>
            </div>
          ) : (
            // Logged In State: Show User Profile
            <UserProfile />
          )}
        </div>
      </div>

      {/* Center Section: Search Bar */}
      <div className="flex-1 max-w-md mx-4">
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
      </div>

      {/* Right Section: Controls */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <div className="hidden sm:flex">
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {themes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hamburger Menu Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-10 h-10 p-0"
          onClick={onMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Auth Modals */}
      <AuthModals
        isSignUpOpen={isSignUpOpen}
        isSignInOpen={isSignInOpen}
        onCloseSignUp={() => setIsSignUpOpen(false)}
        onCloseSignIn={() => setIsSignInOpen(false)}
      />
    </header>
  );
}