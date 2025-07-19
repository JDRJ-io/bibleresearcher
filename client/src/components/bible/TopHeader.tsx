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
      className="divine-header sticky top-0 z-30 border-b transition-all duration-500 flex items-center justify-between px-6 max-w-full shadow-2xl backdrop-blur-md sacred-glow"
      style={{ 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 25%, rgba(59, 130, 246, 0.15) 50%, rgba(236, 72, 153, 0.15) 75%, rgba(251, 191, 36, 0.15) 100%), var(--header-bg)',
        borderColor: 'var(--border-color)', 
        borderImage: 'linear-gradient(90deg, rgba(251, 191, 36, 0.5), rgba(139, 92, 246, 0.5), rgba(59, 130, 246, 0.5), rgba(236, 72, 153, 0.5)) 1',
        height: isMobile ? '64px' : '96px' 
      }}
    >
      {/* Left Section: Navigation Controls */}
      <div className="flex items-center space-x-3">
        {/* Divine Logo/Title */}
        <div className="flex items-center space-x-3">
          <div className={`${isMobile ? 'w-10 h-10' : 'w-16 h-16'} bg-gradient-to-br from-amber-400 via-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden heavenly-float`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent divine-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-spin"></div>
            <Book className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} text-white z-10 drop-shadow-lg`} />
          </div>
          {!isMobile && (
            <div className="flex flex-col">
              <span className="font-bold text-2xl bg-gradient-to-r from-amber-600 via-purple-600 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">
                Sacred Scripture
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300 -mt-1 font-medium italic">
                Study & Reflection in Divine Light
              </span>
            </div>
          )}
        </div>

        {/* Divine Navigation Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} p-0 rounded-2xl bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-gray-900 hover:from-blue-50 hover:to-purple-100 dark:hover:from-blue-950/50 dark:hover:to-purple-950/50 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 group ${!canGoBack ? 'opacity-50' : ''}`}
            onClick={onBack}
            disabled={!canGoBack}
            title="Journey to Previous Verse"
          >
            <ChevronLeft className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-purple-400 transition-colors duration-300`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} p-0 rounded-2xl bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-gray-900 hover:from-blue-50 hover:to-purple-100 dark:hover:from-blue-950/50 dark:hover:to-purple-950/50 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 group ${!canGoForward ? 'opacity-50' : ''}`}
            onClick={onForward}
            disabled={!canGoForward}
            title="Journey to Next Verse"
          >
            <ChevronRight className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-purple-400 transition-colors duration-300`} />
          </Button>
        </div>


      </div>

      {/* Divine Search Section */}
      <div className="flex-1 max-w-2xl mx-6">
        {isMobile ? (
          <>
            {!searchOpen ? (
              <Button
                variant="outline"
                size="sm"
                className="w-10 h-8 p-0 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 hover:from-purple-100 hover:to-blue-100 border-purple-200 dark:border-purple-800 shadow-md"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </Button>
            ) : (
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search God's Word..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-12 pr-10 h-10 text-sm rounded-2xl border-2 focus:border-purple-400 shadow-lg bg-gradient-to-r from-white/90 to-purple-50/90 dark:from-gray-900/90 dark:to-purple-950/90"
                  onBlur={() => setSearchOpen(false)}
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-500" />
                <Sparkles className="absolute right-12 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-400 animate-pulse" />
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
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-purple-400 via-blue-400 to-pink-400 rounded-3xl blur opacity-40 group-hover:opacity-70 transition-all duration-700"></div>
            <Input
              type="text"
              placeholder="✨ Search the Sacred Scriptures... (use '%' for divine inspiration) ✨"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="relative pl-20 pr-20 h-20 text-xl rounded-3xl border-3 focus:border-amber-400 focus:ring-4 focus:ring-purple-200/50 shadow-2xl bg-gradient-to-r from-white/98 via-amber-50/98 via-purple-50/98 to-blue-50/98 dark:from-gray-900/98 dark:via-amber-950/98 dark:via-purple-950/98 dark:to-blue-950/98 font-semibold placeholder:text-gray-600 dark:placeholder:text-gray-300 placeholder:italic"
            />
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-8 h-8 text-purple-600 dark:text-purple-400 heavenly-float" />
            <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-amber-500 divine-pulse" />
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-ping"></div>
              <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}
      </div>

      {/* Right Section: Enhanced Auth and Menu */}
      <div className="flex items-center gap-3">
        {/* Sacred Verse Shortcuts - hidden on mobile */}
        {!isMobile && (
          <div className="flex items-center gap-3 mr-6">
            <span className="text-sm text-gray-600 dark:text-gray-300 font-bold">Sacred Passages:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("Genesis 1:1")}
              className="text-sm px-5 py-3 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-cyan-950/40 hover:from-emerald-100 hover:via-teal-100 hover:to-cyan-100 dark:hover:from-emerald-950/60 dark:hover:via-teal-950/60 dark:hover:to-cyan-950/60 border-2 border-emerald-200 dark:border-emerald-700 shadow-lg hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="font-bold text-emerald-800 dark:text-emerald-200 relative z-10">🌱 Genesis 1:1</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("Psalm 23")}
              className="text-sm px-5 py-3 h-14 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 dark:hover:from-blue-950/60 dark:hover:via-indigo-950/60 dark:hover:to-purple-950/60 border-2 border-blue-200 dark:border-blue-700 shadow-lg hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="font-bold text-blue-800 dark:text-blue-200 relative z-10">🙏 Psalm 23</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("John 3:16")}
              className="text-sm px-5 py-3 h-14 rounded-2xl bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 dark:from-rose-950/40 dark:via-pink-950/40 dark:to-red-950/40 hover:from-rose-100 hover:via-pink-100 hover:to-red-100 dark:hover:from-rose-950/60 dark:hover:via-pink-950/60 dark:hover:to-red-950/60 border-2 border-rose-200 dark:border-rose-700 shadow-lg hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="font-bold text-rose-800 dark:text-rose-200 relative z-10">❤️ John 3:16</span>
            </Button>
          </div>
        )}

        {/* Divine Sign In Button */}
        {!user && (
          <Button
            variant="default"
            size="sm"
            className={`relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 via-purple-500 via-blue-500 to-indigo-600 hover:from-amber-300 hover:via-orange-400 hover:via-purple-400 hover:via-blue-400 hover:to-indigo-500 text-white font-black shadow-2xl ${isMobile ? 'px-5 h-12 text-base' : 'px-8 h-16 text-xl'} rounded-3xl group heavenly-float`}
            onClick={() => setIsAuthModalOpen(true)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-yellow/20 to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent animate-pulse"></div>
            <KeyRound className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-6 h-6 mr-3'} z-10 drop-shadow-lg`} />
            <span className="z-10 drop-shadow-lg">✨ Enter Sacred Space ✨</span>
          </Button>
        )}

        {/* Divine Menu Button */}
        <Button
          variant="outline"
          size="sm"
          className={`${
            isMobile 
              ? 'w-14 h-12 bg-gradient-to-br from-amber-50 via-purple-50 via-blue-50 to-pink-50 dark:from-amber-950/40 dark:via-purple-950/40 dark:via-blue-950/40 dark:to-pink-950/40 border-3 border-gradient-to-r border-purple-300 dark:border-purple-700 hover:border-amber-400 shadow-2xl' 
              : 'w-18 h-16 bg-gradient-to-br from-amber-50 via-purple-50 via-blue-50 to-pink-50 dark:from-amber-950/40 dark:via-purple-950/40 dark:via-blue-950/40 dark:to-pink-950/40 border-3 border-purple-300 dark:border-purple-700 hover:border-amber-400 shadow-2xl'
          } p-0 transition-all duration-500 rounded-3xl group relative overflow-hidden heavenly-float`}
          onClick={onMenuToggle}
          title="🔮 Sacred Settings & Divine Tools 🔮"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-200/30 via-purple-200/30 via-blue-200/30 to-pink-200/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <Menu className={`${isMobile ? 'w-6 h-6 text-purple-700 dark:text-purple-300' : 'w-8 h-8 text-purple-700 dark:text-purple-300'} z-10 group-hover:scale-125 group-hover:rotate-180 transition-all duration-500 drop-shadow-sm`} />
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