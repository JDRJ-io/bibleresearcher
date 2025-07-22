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
      className="divine-header sticky top-0 z-50 border-b-2 flex items-center justify-between max-w-full shadow-lg sacred-glow"
      style={{ 
        background: 'linear-gradient(45deg, #FFD700, #FF6B35, #8A2BE2, #4169E1, #FF1493) !important',
        borderBottomColor: '#FFD700 !important',
        height: isMobile ? '48px !important' : '64px !important',
        minHeight: isMobile ? '48px !important' : '64px !important',
        maxHeight: isMobile ? '48px !important' : '64px !important',
        boxShadow: isMobile ? '0 2px 8px rgba(255, 215, 0, 0.3)' : '0 4px 15px rgba(255, 215, 0, 0.4)',
        borderWidth: '2px !important',
        borderStyle: 'solid !important',
        padding: isMobile ? '0 8px' : '0 16px'
      }}
    >
      {/* Mobile Layout */}
      {isMobile ? (
        <div className="flex items-center justify-between w-full h-full">
          {/* Left: Logo + Navigation */}
          <div className="flex items-center gap-1">
            <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 via-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg relative overflow-hidden">
              <Book className="w-4 h-4 text-white z-10" />
            </div>
            <div className="flex gap-1 ml-1">
              <Button
                variant="outline"
                size="sm"
                className={`w-7 h-7 p-0 rounded-lg bg-white/90 hover:bg-blue-50 border border-gray-300 hover:border-blue-400 shadow-sm transition-all ${!canGoBack ? 'opacity-50' : ''}`}
                onClick={onBack}
                disabled={!canGoBack}
                title="Previous"
              >
                <ChevronLeft className="w-3 h-3 text-gray-600" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`w-7 h-7 p-0 rounded-lg bg-white/90 hover:bg-blue-50 border border-gray-300 hover:border-blue-400 shadow-sm transition-all ${!canGoForward ? 'opacity-50' : ''}`}
                onClick={onForward}
                disabled={!canGoForward}
                title="Next"
              >
                <ChevronRight className="w-3 h-3 text-gray-600" />
              </Button>
            </div>
          </div>

          {/* Center: Search */}
          <div className="flex-1 mx-2 max-w-[180px]">
            {!searchOpen ? (
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0 bg-white/90 hover:bg-purple-50 border border-purple-300 hover:border-purple-400 shadow-sm rounded-lg"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4 text-purple-600" />
              </Button>
            ) : (
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8 pr-8 h-8 text-xs rounded-lg border border-purple-300 focus:border-purple-400 shadow-sm bg-white/95"
                  onBlur={() => setSearchOpen(false)}
                  autoFocus
                />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-purple-500" />
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

          {/* Right: Quick Passages + Auth + Menu */}
          <div className="flex items-center gap-1">
            {/* Quick Passage Buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("Genesis 1:1")}
              className="px-2 h-7 text-xs rounded-lg bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-medium shadow-sm"
              title="Genesis 1:1"
            >
              Gen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("Psalm 23")}
              className="px-2 h-7 text-xs rounded-lg bg-blue-50/90 hover:bg-blue-100 border border-blue-200 text-blue-700 font-medium shadow-sm"
              title="Psalm 23"
            >
              Ps23
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("John 3:16")}
              className="px-2 h-7 text-xs rounded-lg bg-rose-50/90 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium shadow-sm"
              title="John 3:16"
            >
              Jn3:16
            </Button>

            {/* Auth Button */}
            {!user && (
              <Button
                variant="default"
                size="sm"
                className="px-3 h-8 text-xs bg-gradient-to-r from-amber-400 to-purple-500 hover:from-amber-300 hover:to-purple-400 text-white font-bold shadow-sm rounded-lg"
                onClick={() => setIsAuthModalOpen(true)}
                title="Sign In"
              >
                <KeyRound className="w-3 h-3 mr-1" />
                Sign In
              </Button>
            )}

            {/* Menu Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0 bg-white/90 hover:bg-amber-50 border border-amber-300 hover:border-amber-400 shadow-sm rounded-lg"
              onClick={onMenuToggle}
              title="Menu"
            >
              <Menu className="w-4 h-4 text-amber-600" />
            </Button>
          </div>
        </div>
      ) : (
        /* Desktop Layout */
        <>
          {/* Left Section: Navigation Controls */}
          <div className="flex items-center space-x-4">
            {/* Divine Logo/Title */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                <Book className="w-7 h-7 text-white z-10 drop-shadow-lg" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-2xl text-white drop-shadow-xl" style={{ textShadow: '0 0 15px #FFD700, 0 0 30px #8A2BE2' }}>
                  ✨ SACRED SCRIPTURE ✨
                </span>
                <span className="text-sm text-yellow-200 font-bold italic drop-shadow-lg">
                  🙏 Study & Reflection in Divine Light 🙏
                </span>
              </div>
            </div>

            {/* Divine Navigation Buttons */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className={`w-10 h-10 p-0 rounded-xl bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-gray-900 hover:from-blue-50 hover:to-purple-100 border-2 border-gray-200 hover:border-blue-300 shadow-lg hover:shadow-xl transition-all duration-300 ${!canGoBack ? 'opacity-50' : ''}`}
                onClick={onBack}
                disabled={!canGoBack}
                title="Previous Verse"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 hover:text-blue-600 transition-colors" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`w-10 h-10 p-0 rounded-xl bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-gray-900 hover:from-blue-50 hover:to-purple-100 border-2 border-gray-200 hover:border-blue-300 shadow-lg hover:shadow-xl transition-all duration-300 ${!canGoForward ? 'opacity-50' : ''}`}
                onClick={onForward}
                disabled={!canGoForward}
                title="Next Verse"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 hover:text-blue-600 transition-colors" />
              </Button>
            </div>
          </div>

          {/* Divine Search Section */}
          <div className="flex-1 max-w-2xl mx-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-purple-400 to-blue-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-all duration-500"></div>
              <Input
                type="text"
                placeholder="🔍✨ SEARCH GOD'S HOLY WORD... ✨🔍"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="relative pl-16 pr-16 h-12 text-lg rounded-2xl border-2 focus:border-amber-400 focus:ring-2 focus:ring-purple-200/50 shadow-xl bg-gradient-to-r from-white/98 via-amber-50/98 to-purple-50/98 font-semibold"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-purple-600" />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right Section: Sacred Passages + Auth + Menu */}
          <div className="flex items-center gap-3">
            {/* Sacred Verse Shortcuts */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange("Genesis 1:1")}
                className="px-4 py-2 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="font-bold text-emerald-800">🌱 Genesis 1:1</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange("Psalm 23")}
                className="px-4 py-2 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="font-bold text-blue-800">🙏 Psalm 23</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange("John 3:16")}
                className="px-4 py-2 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 border-2 border-rose-200 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="font-bold text-rose-800">❤️ John 3:16</span>
              </Button>
            </div>

            {/* Divine Sign In Button */}
            {!user && (
              <Button
                variant="default"
                size="sm"
                className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-purple-500 hover:from-amber-300 hover:via-orange-400 hover:to-purple-400 text-white font-black shadow-xl px-6 h-12 text-base rounded-2xl"
                onClick={() => setIsAuthModalOpen(true)}
              >
                <KeyRound className="w-5 h-5 mr-2 z-10" />
                <span className="z-10">✨ Enter Sacred Space ✨</span>
              </Button>
            )}

            {/* Divine Menu Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-12 h-12 p-0 bg-gradient-to-br from-amber-50 via-purple-50 to-blue-50 border-2 border-purple-300 hover:border-amber-400 shadow-xl rounded-2xl transition-all duration-300"
              onClick={onMenuToggle}
              title="🔮 Sacred Settings & Divine Tools 🔮"
            >
              <Menu className="w-6 h-6 text-purple-700" />
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