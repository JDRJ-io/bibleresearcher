import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search, Menu, Sparkles, KeyRound, X, Book, Bookmark, Scroll } from 'lucide-react';
import { BookmarkButton } from '@/components/user/BookmarkButton';
import { useTheme } from './ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfileDropdown } from '@/components/auth/UserProfileDropdown';
import { AuthModals } from '@/components/auth/AuthModals';
import { useState } from 'react';
import { useWindowSize } from 'react-use';
import { useBibleStore } from '@/App';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { BookmarkModal } from './BookmarkModal';
import { useAdaptiveScaling } from '@/hooks/useAdaptiveScaling';


interface TopHeaderProps {
  searchQuery: string;
  onSearchChange: () => void; // Changed to just trigger search modal
  onBack: () => void;
  onForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onMenuToggle: () => void;
  getCurrentVerse?: () => { reference: string; index: number };
}

export function TopHeader({
  searchQuery,
  onSearchChange,
  onBack,
  onForward,
  canGoBack,
  canGoForward,
  onMenuToggle,
  getCurrentVerse,
}: TopHeaderProps) {
  const { theme, setTheme, themes } = useTheme();
  const { user, loading } = useAuth();
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bibleStore = useBibleStore();

  const { width, height } = useWindowSize();
  const isMobile = width <= 640;
  const isPortrait = height > width;
  
  // Apply adaptive scaling for responsive header sizing
  useAdaptiveScaling();

  // Get the current central verse from table ref or fallback
  const getCurrentCentralVerse = () => {
    try {
      if (getCurrentVerse) {
        const verseInfo = getCurrentVerse();
        console.log('🔖 TopHeader getCurrentCentralVerse from table:', verseInfo);
        return verseInfo;
      }
      
      // Fallback to reading state
      const saved = JSON.parse(localStorage.getItem('readingState') ?? 'null');
      const anchorIndex = saved?.anchorIndex || 0;
      const currentKeys = bibleStore?.currentVerseKeys || [];
      const currentRef = currentKeys[anchorIndex] || currentKeys[0] || 'Gen.1:1';
      
      console.log('🔖 TopHeader getCurrentCentralVerse fallback:', { anchorIndex, currentRef, totalVerses: currentKeys.length });
      return { reference: currentRef, index: anchorIndex };
    } catch (error) {
      console.error('🔖 TopHeader Error getting central verse:', error);
      return { reference: 'Gen.1:1', index: 0 };
    }
  };

  // Bookmark creation mutation using direct Supabase
  const createBookmarkMutation = useMutation({
    mutationFn: async (payload: { name: string; color: string }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const centralVerse = getCurrentCentralVerse();
      console.log('🔖 TopHeader: Creating bookmark with Supabase:', {
        user_id: user.id,
        name: payload.name,
        index_value: centralVerse.index,
        color: payload.color
      });

      const { error } = await supabase
        .from('bookmarks')
        .upsert({
          user_id: user.id,        // Part of composite primary key
          name: payload.name,      // Part of composite primary key
          index_value: centralVerse.index,
          verse_ref: centralVerse.reference,
          color: payload.color,
        }, {
          onConflict: 'user_id,name'  // Handle conflicts on composite PK
        });

      if (error) {
        console.error('🔖 TopHeader: Supabase error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
      toast({
        title: "Bookmark saved",
        description: "Current position has been bookmarked successfully.",
      });
    },
    onError: (error) => {
      console.error('🔖 TopHeader: Bookmark creation failed:', error);
      toast({
        title: "Error", 
        description: "Failed to save bookmark. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveBookmark = () => {
    console.log('🔖 TopHeader: Save bookmark button clicked');
    
    if (!user) {
      console.log('🔖 TopHeader: No user found, showing sign-in message');
      toast({
        title: "Sign in required",
        description: "Please sign in to save bookmarks.",
        variant: "destructive",
      });
      return;
    }

    console.log('🔖 TopHeader: Opening bookmark modal');
    setIsBookmarkModalOpen(true);
  };

  const handleBookmarkSave = (name: string, color: string) => {
    createBookmarkMutation.mutate({ name, color });
  };



  return (
    <header 
      className={`top-header sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between max-w-full shadow-sm ${
        isMobile ? 'top-header-mobile' : ''
      }`}
      style={{ 
        // Apply dynamic height based on adaptive scaling
        height: isMobile 
          ? 'var(--top-header-height-mobile)' 
          : 'var(--top-header-height-desktop)',
        minHeight: isMobile 
          ? 'var(--top-header-height-mobile)' 
          : 'var(--top-header-height-desktop)',
        maxHeight: isMobile 
          ? 'var(--top-header-height-mobile)' 
          : 'var(--top-header-height-desktop)',
        padding: isPortrait && isMobile ? '0 6px' : isMobile ? '0 8px' : '0 16px',
        pointerEvents: 'auto' // Ensure events are contained
      }}
      // Remove onWheel interference - let VirtualBibleTable handle all scrolling
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
              onClick={() => {
                console.log('📱 Mobile Back button clicked, canGoBack:', canGoBack);
                onBack();
              }}
              disabled={!canGoBack}
              title={canGoBack ? "Go back (Mobile)" : "No previous verses"}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`w-8 h-8 p-0 ${!canGoForward ? 'opacity-50' : ''}`}
              onClick={() => {
                console.log('📱 Mobile Forward button clicked, canGoForward:', canGoForward);
                onForward();
              }}
              disabled={!canGoForward}
              title={canGoForward ? "Go forward (Mobile)" : "No forward verses"}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Center: Logo */}
          <div className="flex-1 mx-2 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 
                           border border-blue-500 dark:from-blue-400 dark:to-blue-600 dark:border-blue-400 
                           flex items-center justify-center relative overflow-hidden">
              <Scroll className="w-4 h-4 text-white dark:text-blue-50" />
            </div>
          </div>

          {/* Right: Search + Bookmark + Menu */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => {
                console.log('🔍 TopHeader: Search button clicked (Mobile)');
                onSearchChange();
              }}
              title="Open Search Modal"
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0"
              onClick={handleSaveBookmark}
              disabled={createBookmarkMutation.isPending}
              title="Save current reading position"
            >
              <Bookmark className="w-3 h-3" />
            </Button>
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 
                           border border-blue-500 dark:from-blue-400 dark:to-blue-600 dark:border-blue-400 
                           flex items-center justify-center relative overflow-hidden">
              <Scroll className="w-5 h-5 text-white dark:text-blue-50" />
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className={`w-9 h-9 p-0 ${!canGoBack ? 'opacity-50' : ''}`}
                onClick={() => {
                  console.log('🖥️ Desktop Back button clicked, canGoBack:', canGoBack);
                  onBack();
                }}
                disabled={!canGoBack}
                title={canGoBack ? "Go back (Desktop)" : "No previous verses"}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`w-9 h-9 p-0 ${!canGoForward ? 'opacity-50' : ''}`}
                onClick={() => {
                  console.log('🖥️ Desktop Forward button clicked, canGoForward:', canGoForward);
                  onForward();
                }}
                disabled={!canGoForward}
                title={canGoForward ? "Go forward (Desktop)" : "No forward verses"}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-2xl mx-6">
            <div 
              className="relative cursor-pointer" 
              onClick={onSearchChange}
              title="Open Advanced Search"
            >
              <Input
                type="text"
                placeholder="Search verses..."
                value=""
                readOnly
                className="pl-10 pr-4 h-10 cursor-pointer"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Right Section: Bookmark + Auth + Menu */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveBookmark}
              disabled={createBookmarkMutation.isPending}
              className="px-3 py-2 h-9 text-sm flex items-center gap-2"
              title="Save current reading position as bookmark"
            >
              <Bookmark className="w-4 h-4" />
              {createBookmarkMutation.isPending ? 'Saving...' : 'Save Position'}
            </Button>

            {user ? (
              <UserProfileDropdown />
            ) : (
              <Button
                variant="default"
                size="sm"
                className="px-4 h-9 font-semibold border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg relative overflow-hidden"
                style={{
                  backgroundColor: 'var(--accent-color)',
                  color: 'var(--bg-primary)',
                  borderColor: 'var(--accent-color)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onClick={() => setIsSignInOpen(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                <KeyRound className="w-4 h-4 mr-2 relative z-10" />
                <span className="relative z-10">Sign In</span>
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

      {/* Divine Auth Modals */}
      <AuthModals
        isSignUpOpen={isSignUpOpen}
        isSignInOpen={isSignInOpen}
        onCloseSignUp={() => setIsSignUpOpen(false)}
        onCloseSignIn={() => setIsSignInOpen(false)}
        onSignUpOpen={() => setIsSignUpOpen(true)}
        onSignInOpen={() => setIsSignInOpen(true)}
      />

      {/* Bookmark Modal */}
      <BookmarkModal
        isOpen={isBookmarkModalOpen}
        onClose={() => setIsBookmarkModalOpen(false)}
        onSave={handleBookmarkSave}
        verseReference={getCurrentCentralVerse().reference}
        isLoading={createBookmarkMutation.isPending}
      />
    </header>
  );
}