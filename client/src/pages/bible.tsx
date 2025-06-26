import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useBibleData } from '@/hooks/useBibleData';
import { useToast } from '@/hooks/use-toast';
import { TopHeader } from '@/components/bible/TopHeader';
import { HamburgerMenu } from '@/components/bible/HamburgerMenu';
import { BibleTable } from '@/components/bible/BibleTable';
import { ExpandedVerseOverlay } from '@/components/bible/ExpandedVerseOverlay';
import { AuthModal } from '@/components/bible/AuthModal';
import { Button } from '@/components/ui/button';
import type { AppPreferences, Translation } from '@/types/bible';

export default function BiblePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: verses = [], isLoading, loadingProgress, navigateToVerse } = useBibleData();
  const error = null; // No error state needed for now
  const translations = [
    { id: 'KJV', name: 'King James Version', abbreviation: 'KJV', selected: true },
    { id: 'ESV', name: 'English Standard Version', abbreviation: 'ESV', selected: false },
    { id: 'NIV', name: 'New International Version', abbreviation: 'NIV', selected: false }
  ];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedVerse, setExpandedVerse] = useState<any>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const expandVerse = (verse: any) => setExpandedVerse(verse);
  const closeExpandedVerse = () => setExpandedVerse(null);
  const goBack = () => console.log('Go back');
  const goForward = () => console.log('Go forward');



  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isForumOpen, setIsForumOpen] = useState(false);
  
  const [selectedTranslations, setSelectedTranslations] = useState<Translation[]>(translations);

  // Filter verses based on search query
  const filteredVerses = verses.filter(verse => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      verse.reference.toLowerCase().includes(searchLower) ||
      Object.values(verse.text).some(text => 
        text.toLowerCase().includes(searchLower)
      )
    );
  });

  const [preferences, setPreferences] = useState<AppPreferences>({
    theme: 'light-mode',
    selectedTranslations: ['KJV'],
    showNotes: false,
    showProphecy: false,
    showContext: false,
    fontSize: 'medium',
    layoutLocked: false,
  });

  const createBookmarkMutation = useMutation({
    mutationFn: async (bookmarkData: {
      userId: string;
      name: string;
      indexValue: number;
      color: string;
    }) => {
      return apiRequest('POST', '/api/bookmarks', bookmarkData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/bookmarks`] });
      toast({ title: "Bookmark saved successfully" });
    },
  });

  const handleTranslationToggle = (translationId: string) => {
    setSelectedTranslations(prev => 
      prev.map(t => 
        t.id === translationId ? { ...t, selected: !t.selected } : t
      )
    );
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetLayout = () => {
    setSelectedTranslations(prev => 
      prev.map(t => ({ ...t, selected: t.id === 'KJV' }))
    );
    setPreferences(prev => ({
      ...prev,
      showNotes: false,
      showProphecy: false,
      showContext: false,
      layoutLocked: false,
    }));
    toast({ title: "Layout reset to default" });
  };

  const handleSaveBookmark = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save bookmarks",
        variant: "destructive",
      });
      return;
    }

    const bookmarkName = prompt("Enter bookmark name:");
    if (bookmarkName) {
      createBookmarkMutation.mutate({
        userId: user.id,
        name: bookmarkName,
        indexValue: 0, // Current verse index
        color: '#ef4444',
      });
    }
  };

  const handleStrongsClick = (word: any) => {
    // Open Strong's definition modal or navigate to Strong's search
    toast({
      title: "Strong's Definition",
      description: `${word.strongs}: ${word.definition}`,
    });
  };

  const getLoadingMessage = () => {
    switch (loadingProgress?.stage) {
      case 'structure':
        return 'Loading 31,102 verse references from metadata';
      case 'text':
        return 'Fetching KJV text from Supabase storage';
      case 'cross-refs':
        return 'Parsing cross-reference data with Gen.1:1 format';
      case 'finalizing':
        return 'Finalizing Bible study platform';
      case 'complete':
        return 'Ready to explore Scripture';
      default:
        return 'Initializing Bible study platform...';
    }
  };

  console.log('BiblePage render state:', { 
    isLoading, 
    versesLength: verses.length,
    loadingStage: loadingProgress?.stage,
    loadingPercentage: loadingProgress?.percentage 
  });

  // TEMPORARILY BYPASS LOADING SCREEN TO TEST MAIN INTERFACE
  const shouldShowLoading = false; // Force bypass for testing
  
  console.log('🚫 LOADING BYPASSED FOR TESTING:', {
    originalIsLoading: isLoading,
    versesLength: verses.length,
    forcedShouldShowLoading: shouldShowLoading
  });

  if (shouldShowLoading) {
    return (
      <div key="loading-screen" className="flex items-center justify-center min-h-screen bg-background">
        <div className="max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4 mx-auto"></div>
            <h2 className="text-xl font-semibold mb-2">Loading Bible Study Platform</h2>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>{loadingProgress?.stage || 'Loading...'}</span>
              <span>{loadingProgress?.percentage || 0}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress?.percentage || 0}%` }}
              ></div>
            </div>
          </div>
          
          {/* Feature Details */}
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">{getLoadingMessage()}</p>
          </div>
          
          {/* Features Being Set Up */}
          <div className="mt-6 text-xs text-muted-foreground">
            <div className="space-y-1">
              <div className={`flex items-center ${(loadingProgress?.percentage || 0) >= 10 ? 'text-green-600 dark:text-green-400' : ''}`}>
                <span className="mr-2">{(loadingProgress?.percentage || 0) >= 10 ? '✓' : '○'}</span>
                Verse structure (31,102 references)
              </div>
              <div className={`flex items-center ${(loadingProgress?.percentage || 0) >= 30 ? 'text-green-600 dark:text-green-400' : ''}`}>
                <span className="mr-2">{(loadingProgress?.percentage || 0) >= 30 ? '✓' : '○'}</span>
                KJV Bible text from Supabase
              </div>
              <div className={`flex items-center ${(loadingProgress?.percentage || 0) >= 60 ? 'text-green-600 dark:text-green-400' : ''}`}>
                <span className="mr-2">{(loadingProgress?.percentage || 0) >= 60 ? '✓' : '○'}</span>
                Cross-references with navigation
              </div>
              <div className={`flex items-center ${(loadingProgress?.percentage || 0) >= 90 ? 'text-green-600 dark:text-green-400' : ''}`}>
                <span className="mr-2">{(loadingProgress?.percentage || 0) >= 90 ? '✓' : '○'}</span>
                Sticky headers and Excel layout
              </div>
              <div className={`flex items-center ${(loadingProgress?.percentage || 0) >= 100 ? 'text-green-600 dark:text-green-400' : ''}`}>
                <span className="mr-2">{(loadingProgress?.percentage || 0) >= 100 ? '✓' : '○'}</span>
                Prophecy data and user features
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show actual verses for debugging
  // Show main interface when we have verses and not loading
  if (verses.length > 0 && !shouldShowLoading) {
    console.log('BiblePage SHOWING INTERFACE:', { 
      versesCount: verses.length, 
      filteredCount: filteredVerses.length,
      firstVerse: verses[0],
      isLoading,
      shouldShowLoading
    });
  } else {
    console.log('BiblePage SHOWING LOADING:', { 
      isLoading, 
      versesLength: verses.length,
      shouldShowLoading
    });
  }

  return (
    <div 
      className="min-h-screen flex flex-col transition-all duration-300"
      style={{ 
        backgroundColor: 'var(--bg-color)', 
        color: 'var(--text-color)' 
      }}
    >
      <TopHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onBack={goBack}
        onForward={goForward}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
      />

      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onShowAuth={() => setIsAuthOpen(true)}
        onShowForum={() => setIsForumOpen(true)}
        translations={selectedTranslations}
        onTranslationToggle={handleTranslationToggle}
        preferences={preferences}
        onPreferenceChange={handlePreferenceChange}
        onResetLayout={handleResetLayout}
        onSaveBookmark={handleSaveBookmark}
      />

      <BibleTable
        verses={filteredVerses}
        translations={translations}
        selectedTranslations={selectedTranslations}
        preferences={preferences}
        onExpandVerse={expandVerse}
        onNavigateToVerse={navigateToVerse}
      />

      <ExpandedVerseOverlay
        verse={expandedVerse}
        onClose={closeExpandedVerse}
        onStrongsClick={handleStrongsClick}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Footer */}
      <footer 
        className="border-t py-4 px-4"
        style={{ 
          backgroundColor: 'var(--header-bg)', 
          borderColor: 'var(--border-color)' 
        }}
      >
        <div className="flex flex-wrap justify-center items-center space-x-6 text-sm">
          <a href="#" className="hover:underline transition-colors duration-200">FAQ</a>
          <a href="#" className="hover:underline transition-colors duration-200">Forum</a>
          <a href="#" className="hover:underline transition-colors duration-200">Contact</a>
          <a href="#" className="hover:underline transition-colors duration-200">Donate</a>
          <span className="text-xs opacity-60">© 2024 Anointed.io</span>
        </div>
      </footer>
    </div>
  );
}
