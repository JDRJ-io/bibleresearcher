import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search, Menu, Sparkles, KeyRound, X, Book, Bookmark } from 'lucide-react';
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

  const { width } = useWindowSize();
  const isMobile = width < 640;

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
      className="top-header sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between max-w-full shadow-sm"
      style={{ 
        height: isMobile ? '48px' : '64px',
        minHeight: isMobile ? '48px' : '64px',
        maxHeight: isMobile ? '48px' : '64px',
        padding: isMobile ? '0 8px' : '0 16px',
        pointerEvents: 'auto' // Ensure events are contained
      }}
      onWheel={(e) => {
        // Prevent wheel events from bubbling and affecting column headers
        e.stopPropagation();
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

          {/* Center: Search + Bookmark */}
          <div className="flex-1 mx-2 max-w-[180px] flex items-center justify-center gap-2">
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
            {/* Debug: Check if user is available for bookmark */}
            {!user && (
              <span className="text-xs text-muted-foreground ml-1" title="Sign in to save bookmarks">
                (Sign in)
              </span>
            )}
          </div>

          {/* Right: Auth + Menu */}
          <div className="flex items-center gap-2">
            {user ? (
              <UserProfileDropdown />
            ) : (
              <Button
                variant="default"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setIsSignInOpen(true)}
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
                <span className="font-bold text-lg">Anointed.io</span>
              </div>
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
                className="px-4 h-9"
                onClick={() => setIsSignInOpen(true)}
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

      {/* Divine Auth Modals */}
      <AuthModals
        isSignUpOpen={isSignUpOpen}
        isSignInOpen={isSignInOpen}
        onCloseSignUp={() => setIsSignUpOpen(false)}
        onCloseSignIn={() => setIsSignInOpen(false)}
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