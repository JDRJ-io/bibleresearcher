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
import { VerseSelector } from '@/components/bible/VerseSelector';
import { Button } from '@/components/ui/button';
import type { AppPreferences, Translation } from '@/types/bible';

export default function BiblePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { 
    verses = [], 
    isLoading, 
    loadingProgress, 
    navigateToVerse, 
    totalBibleHeight, 
    scrollOffset,
    searchQuery,
    setSearchQuery,
    goBack: hookGoBack,
    goForward: hookGoForward,
    canGoBack: hookCanGoBack,
    canGoForward: hookCanGoForward,
    isLoadingNewWindow
  } = useBibleData();
  const error = null; // No error state needed for now
  const allTranslations = [
    { id: 'KJV', name: 'King James Version', abbreviation: 'KJV', selected: true },
    { id: 'ESV', name: 'English Standard Version', abbreviation: 'ESV', selected: false },
    { id: 'NIV', name: 'New International Version', abbreviation: 'NIV', selected: false },
    { id: 'NKJV', name: 'New King James Version', abbreviation: 'NKJV', selected: false },
    { id: 'NLT', name: 'New Living Translation', abbreviation: 'NLT', selected: false },
    { id: 'AMP', name: 'Amplified Bible', abbreviation: 'AMP', selected: false },
    { id: 'CSB', name: 'Christian Standard Bible', abbreviation: 'CSB', selected: false },
    { id: 'NASB', name: 'New American Standard Bible', abbreviation: 'NASB', selected: false }
  ];

  // Translation state management
  const [mainTranslation, setMainTranslation] = useState('KJV');
  const [multiTranslationMode, setMultiTranslationMode] = useState(false);
  const [selectedTranslations, setSelectedTranslations] = useState<string[]>(['KJV']);
  

  const [localExpandedVerse, setLocalExpandedVerse] = useState<any>(null);

  const localExpandVerse = (verse: any) => setLocalExpandedVerse(verse);
  const closeLocalExpandedVerse = () => setLocalExpandedVerse(null);



  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isForumOpen, setIsForumOpen] = useState(false);
  
  // Translation helper functions
  const toggleTranslation = (translationId: string) => {
    if (multiTranslationMode) {
      setSelectedTranslations(prev => 
        prev.includes(translationId) 
          ? prev.filter(id => id !== translationId)
          : [...prev, translationId]
      );
    } else {
      setMainTranslation(translationId);
      setSelectedTranslations([translationId]);
    }
  };

  const toggleMultiTranslationMode = () => {
    setMultiTranslationMode(!multiTranslationMode);
    if (!multiTranslationMode) {
      // Entering multi-translation mode - keep current main as selected
      setSelectedTranslations([mainTranslation]);
    } else {
      // Exiting multi-translation mode - keep only main
      setSelectedTranslations([mainTranslation]);
    }
  };

  // Get translations for display
  const displayTranslations = multiTranslationMode 
    ? allTranslations.filter(t => selectedTranslations.includes(t.id))
    : allTranslations.filter(t => t.id === mainTranslation);

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
      prev.includes(translationId) 
        ? prev.filter(id => id !== translationId)
        : [...prev, translationId]
    );
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetLayout = () => {
    setSelectedTranslations(['KJV']);
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

  // Show loading only when we don't have verses yet
  const shouldShowLoading = isLoading && verses.length === 0;
  
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
      className="min-h-screen relative transition-all duration-300"
      style={{ 
        backgroundColor: 'var(--bg-color)', 
        color: 'var(--text-color)',
        paddingBottom: '70px' // Reserve space for sticky footer
      }}
    >
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between p-4 border-b" style={{ 
        backgroundColor: 'var(--header-bg)', 
        borderBottomColor: 'var(--border-color)' 
      }}>
        {/* Left side - Back/Forward buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={hookGoBack}
            disabled={!hookCanGoBack}
            className="p-2 hover:bg-muted rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go back"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={hookGoForward}
            disabled={!hookCanGoForward}
            className="p-2 hover:bg-muted rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go forward"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Center - Navigation and Search */}
        <div className="flex-1 flex items-center gap-4 mx-4">
          <VerseSelector onNavigate={navigateToVerse} />
          
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search verses, references, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-muted border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Right side - Menu */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="p-2 hover:bg-muted rounded-md transition-colors"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onShowAuth={() => setIsAuthOpen(true)}
        onShowForum={() => setIsForumOpen(true)}
        translations={displayTranslations}
        onTranslationToggle={handleTranslationToggle}
        preferences={preferences}
        onPreferenceChange={handlePreferenceChange}
        onResetLayout={handleResetLayout}
        onSaveBookmark={handleSaveBookmark}
        mainTranslation={mainTranslation}
        multiTranslationMode={multiTranslationMode}
        selectedTranslations={selectedTranslations}
        allTranslations={allTranslations}
        onToggleMultiTranslationMode={toggleMultiTranslationMode}
        onToggleTranslation={toggleTranslation}
      />

      <div className="relative">
        <BibleTable
          verses={filteredVerses}
          translations={displayTranslations}
          selectedTranslations={displayTranslations}
          preferences={preferences}
          mainTranslation={mainTranslation}
          onExpandVerse={localExpandVerse}
          onNavigateToVerse={navigateToVerse}
          totalBibleHeight={totalBibleHeight}
          startOffset={scrollOffset}
        />
        
        {/* Loading indicator for new window content */}
        {isLoadingNewWindow && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-background border rounded-lg p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <div>
                  <div className="font-medium">Loading verses...</div>
                  <div className="text-sm text-muted-foreground">Fetching content for your location</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ExpandedVerseOverlay
        verse={localExpandedVerse}
        onClose={closeLocalExpandedVerse}
        onStrongsClick={handleStrongsClick}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Sticky Footer - Fixed to bottom of viewport */}
      <footer 
        className="fixed bottom-0 left-0 right-0 z-30 border-t py-4 px-4"
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
