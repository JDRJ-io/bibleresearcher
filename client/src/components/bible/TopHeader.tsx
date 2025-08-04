import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Search, Menu, Sparkles, KeyRound, X, Book, Bookmark } from 'lucide-react';
import { BookmarkButton } from '@/components/user/BookmarkButton';
import { useTheme } from './ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfileDropdown } from '@/components/auth/UserProfileDropdown';
import { CombinedAuthModal } from '@/components/auth/CombinedAuthModal';
import { useState } from 'react';
import { useWindowSize } from 'react-use';
import { useBibleStore } from '@/App';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';


interface TopHeaderProps {
  searchQuery: string;
  onSearchChange: () => void; // Changed to just trigger search modal
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bibleStore = useBibleStore();

  const { width } = useWindowSize();
  const isMobile = width < 640;

  // Get the current central verse from reading state
  const getCurrentCentralVerse = () => {
    try {
      // Get current anchor index from reading state (same logic as useBookmarks)
      const saved = JSON.parse(localStorage.getItem('readingState') ?? 'null');
      const anchorIndex = saved?.anchorIndex || 0;
      
      // Get current verse keys from store
      const currentKeys = bibleStore?.currentVerseKeys || [];
      const currentRef = currentKeys[anchorIndex] || currentKeys[0] || 'Gen.1:1';
      
      console.log('🔖 TopHeader getCurrentCentralVerse:', { anchorIndex, currentRef, totalVerses: currentKeys.length });
      
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
        .insert({
          user_id: user.id,        // snake_case as required by schema
          name: payload.name,
          index_value: centralVerse.index,
          color: payload.color,
          pending: false,          // Set to false since it's being saved directly
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

    const centralVerse = getCurrentCentralVerse();
    console.log('🔖 TopHeader: Central verse obtained:', centralVerse);
    
    const bookmarkPayload = {
      name: `Reading position - ${centralVerse.reference}`,
      color: '#3b82f6', // Default blue color
    };
    
    console.log('🔖 TopHeader: About to create bookmark with payload:', bookmarkPayload);
    createBookmarkMutation.mutate(bookmarkPayload);
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

          {/* Center: Bookmark + Search */}
          <div className="flex-1 mx-2 max-w-[180px] flex items-center justify-center gap-2">
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
              onClick={() => {
                console.log('🔍 TopHeader: Search button clicked (Mobile)');
                onSearchChange();
              }}
              title="Open Search Modal"
            >
              <Search className="w-4 h-4" />
            </Button>
            <BookmarkButton className="w-8 h-8 p-0" />
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