import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useBibleData } from "@/hooks/useBibleData";
import { useTranslationMaps } from "@/hooks/useTranslationMaps";
import { useToast } from "@/hooks/use-toast";
import { loadTranslation, getVerseText } from "@/lib/translationLoader";
import { TopHeader } from "@/components/bible/TopHeader";
import { HamburgerMenu } from "@/components/bible/HamburgerMenu";
import VirtualBibleTable from "@/components/bible/VirtualBibleTable";
import { ExpandedVerseOverlay } from "@/components/bible/ExpandedVerseOverlay";
import { AuthModals } from "@/components/auth/AuthModals";
import { ConnectivityStatus } from "@/components/ui/connectivity-status";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { VerseSelector } from "@/components/bible/VerseSelector";
import { TranslationSelector } from "@/components/bible/TranslationSelector";
import { Button } from "@/components/ui/button";
import type { AppPreferences, Translation } from "@/types/bible";

export default function BiblePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    verses = [],
    allVerses = [],
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
    loadTranslationData,
    setSelectedTranslations: setHookSelectedTranslations,
    setMainTranslation: setHookMainTranslation,
    crossRefSet,
    setCrossRefSet,
    // loadBothCrossReferenceSets, // REMOVED - replaced with anchor-centered loading
    getProphecyDataForVerse,
    loadProphecyDataOnDemand,
    getGlobalVerseText,
    centerVerseIndex,
    loadVerseRange,
  } = useBibleData();
  
  // TRANSLATION MAP SYSTEM INTEGRATION
  const translationMaps = useTranslationMaps();
  const {
    activeTranslations,
    mainTranslation,
    alternates,
    toggleTranslation,
    removeTranslation,
    getVerseText,
    getMainVerseText,
    setMain,
    setAlternates,
    isLoading: translationsLoading
  } = translationMaps;
  
  const error = null; // No error state needed for now
  const totalRows = allVerses.length;
  const allTranslations = [
    {
      id: "KJV",
      name: "King James Version",
      abbreviation: "KJV",
      selected: true,
    },
    {
      id: "ESV",
      name: "English Standard Version",
      abbreviation: "ESV",
      selected: false,
    },
    {
      id: "NIV",
      name: "New International Version",
      abbreviation: "NIV",
      selected: false,
    },
    {
      id: "NKJV",
      name: "New King James Version",
      abbreviation: "NKJV",
      selected: false,
    },
    {
      id: "NLT",
      name: "New Living Translation",
      abbreviation: "NLT",
      selected: false,
    },
    {
      id: "AMP",
      name: "Amplified Bible",
      abbreviation: "AMP",
      selected: false,
    },
    {
      id: "CSB",
      name: "Christian Standard Bible",
      abbreviation: "CSB",
      selected: false,
    },
    {
      id: "NASB",
      name: "New American Standard Bible",
      abbreviation: "NASB",
      selected: false,
    },
  ];

  // Translation state management now handled by useTranslationMaps
  const [multiTranslationMode, setMultiTranslationMode] = useState(false);

  const [localExpandedVerse, setLocalExpandedVerse] = useState<any>(null);
  const [preserveAnchor, setPreserveAnchor] = useState<((callback: () => void) => void) | null>(null);
  const [lastLoadedCenter, setLastLoadedCenter] = useState<number>(-1);

  const localExpandVerse = (verse: any) => setLocalExpandedVerse(verse);
  const closeLocalExpandedVerse = () => setLocalExpandedVerse(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isForumOpen, setIsForumOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Translation helper functions (integrated with translation maps system)
  const handleToggleTranslation = async (translationId: string) => {
    try {
      if (multiTranslationMode) {
        // Multi-translation mode: toggle on/off as alternate
        await toggleTranslation(translationId, false);
      } else {
        // Single translation mode: set as main
        await toggleTranslation(translationId, true);
      }
      // Update local state for UI consistency
      setSelectedTranslations(activeTranslations);
    } catch (error) {
      console.error('Error toggling translation:', error);
    }
  };

  const toggleMultiTranslationMode = () => {
    setMultiTranslationMode(!multiTranslationMode);
    // Translation maps system manages the active translations automatically
  };

  // Get translations for display - ensure KJV is always selected by default
  const displayTranslations = multiTranslationMode
    ? allTranslations.filter((t) => selectedTranslations.includes(t.id))
    : allTranslations.filter((t) => t.id === mainTranslation);

  // REMOVED: Edge-based cross-reference loading replaced with anchor-centered approach
  // Cross-references will be loaded on-demand for center-anchored verse slices only

  // No real-time filtering - search only triggers on Enter/button click
  const filteredVerses = verses;

  const [preferences, setPreferences] = useState<AppPreferences>({
    theme: "light-mode",
    selectedTranslations: ["KJV"],
    showNotes: false,
    showProphecy: false,
    showContext: false,
    fontSize: "medium",
    layoutLocked: false,
  });

  const createBookmarkMutation = useMutation({
    mutationFn: async (bookmarkData: {
      userId: string;
      name: string;
      indexValue: number;
      color: string;
    }) => {
      return apiRequest("POST", "/api/bookmarks", bookmarkData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${user?.id}/bookmarks`],
      });
      toast({ title: "Bookmark saved successfully" });
    },
  });

  const handleTranslationToggle = async (translationId: string) => {
    // Check if translation is being added
    if (!selectedTranslations.includes(translationId)) {
      // Load the translation data before adding it to selected
      console.log(`Loading ${translationId} translation...`);

      // Show loading state for this translation
      toast({ title: `Loading ${translationId} translation...` });

      try {
        // Load the translation data
        const translationData = await loadTranslation(translationId);

        if (translationData.size > 0) {
          // Update verses with the new translation data
          if (verses.length > 0) {
            verses.forEach((verse) => {
              const text = translationData.get(verse.reference) || translationData.get(verse.reference.replace('.', ' ')) || `[${verse.reference} - Loading...]`;
              if (text && !text.includes("Loading...")) {
                verse.text[translationId] = text;
              }
            });
          }

          // Add to selected translations using translation maps
          await toggleTranslation(translationId);
          toast({ title: `${translationId} translation loaded successfully` });
        } else {
          toast({
            title: `Failed to load ${translationId} translation`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error(`Error loading ${translationId}:`, error);
        toast({
          title: `Error loading ${translationId} translation`,
          variant: "destructive",
        });
      }
    } else {
      // Remove translation using translation maps
      removeTranslation(translationId);
    }
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    // INSTANT UI UPDATE - No waiting for data loading
    const updatePreferences = () => {
      setPreferences((prev) => ({
        ...prev,
        [key]: value,
      }));
    };
    
    if (preserveAnchor) {
      preserveAnchor(updatePreferences);
    } else {
      updatePreferences();
    }

    // DATA LOADING - Happens asynchronously in the background
    // Do NOT await this - let the UI update immediately
    if (key === 'showProphecy' && value) {
      // Start loading prophecy data in the background
      loadProphecyDataInBackground();
    }
  };

  // Separate function for background data loading
  const loadProphecyDataInBackground = async () => {
    try {
      console.log("📊 Loading prophecy data in background...");
      const result = await loadProphecyDataOnDemand();
      if (result.index.size > 0 && Object.keys(result.rows).length > 0) {
        toast({ 
          title: "Prophecy data ready", 
          description: `${result.index.size} verses indexed, ${Object.keys(result.rows).length} prophecies ready` 
        });
      } else {
        toast({ 
          title: "Prophecy data not found",
          description: "Please check your Supabase storage for prophecy files",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to load prophecy data:", error);
      toast({ 
        title: "Prophecy loading failed",
        description: "Could not load prophecy data from Supabase",
        variant: "destructive"
      });
    }
  };

  const handleResetLayout = () => {
    setSelectedTranslations(["KJV"]);
    setPreferences((prev) => ({
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
        color: "#ef4444",
      });
    }
  };

  const handleStrongsClick = (word: any) => {
    // Open Strong's definition modal or navigate to Strong's search
    toast({
      title: "Strong's Definition",
      description: `${word.strongs}: ${word.definition}`,
    });
  }

  // Enhanced global search function that handles multiple translations and % random
  const handleGlobalSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    
    // Handle % random verse functionality
    if (trimmedQuery === '%') {
      const randomIndex = Math.floor(Math.random() * allVerses.length);
      const randomVerse = allVerses[randomIndex];
      if (randomVerse) {
        console.log(`Random verse: jumping to ${randomVerse.reference} (index ${randomIndex})`);
        // Clear the search box after random verse
        setSearchQuery('');
        navigateToVerse(randomVerse.reference);
        toast({
          title: "Random Verse",
          description: `Jumped to ${randomVerse.reference}`,
        });
      }
      return;
    }

    // Skip empty searches
    if (!trimmedQuery) return;

    // Check if it's a verse reference (like "John 3:16", "Gen 1:1", etc.)
    const verseReferencePattern = /^(\d?\w+)\s*(\d+):(\d+)$/i;
    const match = trimmedQuery.match(verseReferencePattern);
    
    if (match) {
      // It's a verse reference - navigate directly
      console.log(`Verse reference detected: ${trimmedQuery}`);
      // Clear the search box after navigation
      setSearchQuery('');
      navigateToVerse(trimmedQuery);
      toast({
        title: "Navigate to Verse",
        description: `Jumping to ${trimmedQuery}`,
      });
      return;
    }

    // It's a word/phrase search - search across all translations
    const activeTranslationIds = multiTranslationMode 
      ? selectedTranslations 
      : [mainTranslation];

    console.log(`Performing text search for "${trimmedQuery}" across translations:`, activeTranslationIds);
    
    // Perform comprehensive search across all verses
    try {
      console.log(`Searching "${trimmedQuery}" across ${allVerses.length} verses`);
      const results = [];
      const lowercaseQuery = trimmedQuery.toLowerCase();
      
      // Search through all verses in the canonical database
      for (let i = 0; i < allVerses.length; i++) {
        const verse = allVerses[i];
        let found = false;
        
        // Search in each active translation
        for (const translationId of activeTranslationIds) {
          const text = verse.text?.[translationId];
          if (text && text.toLowerCase().includes(lowercaseQuery)) {
            found = true;
            break;
          }
        }
        
        if (found) {
          results.push({
            index: i,
            reference: verse.reference,
            verse: verse
          });
        }
      }
      
      if (results.length > 0) {
        console.log(`Found ${results.length} search results for "${trimmedQuery}"`);
        // For now, navigate to first result - later we'll show a modal
        // Clear the search box after navigation
        setSearchQuery('');
        navigateToVerse(results[0].reference);
        toast({
          title: "Search Results",
          description: `Found ${results.length} results for "${trimmedQuery}". Jumped to first result.`,
        });
      } else {
        toast({
          title: "No Results",
          description: `No verses found containing "${trimmedQuery}"`,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: `Failed to search for "${trimmedQuery}"`,
      });
    }
  };

  const getLoadingMessage = () => {
    switch (loadingProgress?.stage) {
      case "structure":
        return "Loading 31,102 verse references from metadata";
      case "text":
        return "Fetching KJV text from Supabase storage";
      case "cross-refs":
        return "Parsing cross-reference data with Gen.1:1 format";
      case "finalizing":
        return "Finalizing Bible study platform";
      case "complete":
        return "Ready to explore Scripture";
      default:
        return "Initializing Bible study platform...";
    }
  };

  console.log("BiblePage render state:", {
    isLoading,
    versesLength: verses.length,
    loadingStage: loadingProgress?.stage,
    loadingPercentage: loadingProgress?.percentage,
  });

  // Show loading only when we don't have verses yet
  // MEMORY FIX: Remove heavy loading screen that no longer matches actual loading
  const shouldShowLoading = false; // Disabled to reduce iPhone lag

  console.log("🚫 LOADING BYPASSED FOR TESTING:", {
    originalIsLoading: isLoading,
    versesLength: verses.length,
    forcedShouldShowLoading: shouldShowLoading,
  });

  if (shouldShowLoading) {
    return (
      <div
        key="loading-screen"
        className="flex items-center justify-center min-h-screen bg-background"
      >
        <div className="max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4 mx-auto"></div>
            <h2 className="text-xl font-semibold mb-2">
              Loading Bible Study Platform
            </h2>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>{loadingProgress?.stage || "Loading..."}</span>
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
              <div
                className={`flex items-center ${(loadingProgress?.percentage || 0) >= 10 ? "text-green-600 dark:text-green-400" : ""}`}
              >
                <span className="mr-2">
                  {(loadingProgress?.percentage || 0) >= 10 ? "✓" : "○"}
                </span>
                Verse structure (31,102 references)
              </div>
              <div
                className={`flex items-center ${(loadingProgress?.percentage || 0) >= 30 ? "text-green-600 dark:text-green-400" : ""}`}
              >
                <span className="mr-2">
                  {(loadingProgress?.percentage || 0) >= 30 ? "✓" : "○"}
                </span>
                KJV Bible text from Supabase
              </div>
              <div
                className={`flex items-center ${(loadingProgress?.percentage || 0) >= 60 ? "text-green-600 dark:text-green-400" : ""}`}
              >
                <span className="mr-2">
                  {(loadingProgress?.percentage || 0) >= 60 ? "✓" : "○"}
                </span>
                Cross-references with navigation
              </div>
              <div
                className={`flex items-center ${(loadingProgress?.percentage || 0) >= 90 ? "text-green-600 dark:text-green-400" : ""}`}
              >
                <span className="mr-2">
                  {(loadingProgress?.percentage || 0) >= 90 ? "✓" : "○"}
                </span>
                Sticky headers and Excel layout
              </div>
              <div
                className={`flex items-center ${(loadingProgress?.percentage || 0) >= 100 ? "text-green-600 dark:text-green-400" : ""}`}
              >
                <span className="mr-2">
                  {(loadingProgress?.percentage || 0) >= 100 ? "✓" : "○"}
                </span>
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
    console.log("BiblePage SHOWING INTERFACE:", {
      versesCount: verses.length,
      filteredCount: filteredVerses.length,
      firstVerse: verses[0],
      isLoading,
      shouldShowLoading,
    });
  } else {
    console.log("BiblePage SHOWING LOADING:", {
      isLoading,
      versesLength: verses.length,
      shouldShowLoading,
    });
  }

  return (
    <div
      className="min-h-screen relative transition-all duration-300"
      style={{
        backgroundColor: "var(--bg-color)",
        color: "var(--text-color)",
        paddingBottom: "70px", // Reserve space for sticky footer
      }}
    >
      {/* Sticky Top Header - Professional Divine */}
      <div
        className="divine-header sacred-glow sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b-4"
        style={{
          background: 'linear-gradient(45deg, #FFD700, #FF6B35, #8A2BE2, #4169E1, #FF1493)',
          borderBottomColor: '#FFD700',
          height: "80px",
          minHeight: "80px",
          boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3), 0 8px 25px rgba(138, 43, 226, 0.2)',
          borderWidth: '4px',
          borderStyle: 'solid'
        }}
      >
        {/* Left: Logo and Brand */}
        <div className="flex items-center gap-4">
          <div className="divine-logo-container heavenly-float w-12 h-12 bg-gradient-to-br from-yellow-400 via-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden" style={{ animation: 'spin 6s linear infinite' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent divine-pulse"></div>
            <svg className="w-6 h-6 text-white z-10 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          
          <div className="flex flex-col">
            <span className="sacred-title font-bold text-xl text-white drop-shadow-lg" style={{ textShadow: '0 0 10px #FFD700, 0 0 20px #8A2BE2' }}>
              Anointed.io
            </span>
            <span className="text-sm text-yellow-200 font-medium drop-shadow-md">
              Biblical Study Platform
            </span>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex items-center gap-1 ml-6">
            <button
              onClick={hookGoBack}
              disabled={!hookCanGoBack}
              className="p-3 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white/10 backdrop-blur-sm"
              aria-label="Go back"
            >
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={hookGoForward}
              disabled={!hookCanGoForward}
              className="p-3 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white/10 backdrop-blur-sm"
              aria-label="Go forward"
            >
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Center - Navigation and Search */}
        <div className="flex-1 flex items-center gap-3 mx-6">
          <VerseSelector onNavigate={navigateToVerse} />

          {/* Extended Search Bar */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <input
                type="text"
                placeholder="Search verses, words, or references..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleGlobalSearch(searchQuery);
                  }
                }}
                className="w-full px-4 py-2 pl-10 text-sm bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/70"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right side - Menu and Auth */}
        <div className="flex items-center gap-2">
          <button
                  onClick={() => handleGlobalSearch(searchQuery)}
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/80 transition-colors"
                >
                  Go
                </button>
                <button
                  onClick={() => setMobileSearchOpen(false)}
                  className="p-1 hover:bg-muted rounded-md transition-colors"
                  aria-label="Close search"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Menu and Auth */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-3 hover:bg-white/20 rounded-lg transition-colors bg-white/10 backdrop-blur-sm"
            aria-label="Open menu"
          >
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <button
            onClick={() => setIsSignInModalOpen(true)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium text-white backdrop-blur-sm border border-white/30"
          >
            Sign In
          </button>
        </div>
      </div>

      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <VirtualBibleTable
        verses={filteredVerses}
        selectedTranslations={displayTranslations}
        preferences={preferences}
        mainTranslation={mainTranslation}
        onExpandVerse={localExpandVerse}
        onNavigateToVerse={navigateToVerse}
        getProphecyDataForVerse={getProphecyDataForVerse}
        getGlobalVerseText={getGlobalVerseText}
        totalRows={verses.length}
        onCenterVerseChange={(globalCenterIndex) => {
          // CENTER-ANCHORED LOADING: Only trigger when center changes significantly
          if (Math.abs(globalCenterIndex - lastLoadedCenter) > 50) {
            console.log(`🎯 VirtualBibleTable center-anchored load: ${globalCenterIndex} (${verses[globalCenterIndex]?.reference || 'unknown'})`);
            if (verses.length > 0 && loadVerseRange) {
              loadVerseRange(verses, globalCenterIndex, false);
              setLastLoadedCenter(globalCenterIndex);
            }
          }
        }}
        centerVerseIndex={centerVerseIndex}
        onPreserveAnchor={(callback) => setPreserveAnchor(() => callback)}
      />

      <ExpandedVerseOverlay
        verse={localExpandedVerse}
        onClose={closeLocalExpandedVerse}
        onStrongsClick={handleStrongsClick}
        mainTranslation={mainTranslation}
      />

      <AuthModals
        isSignUpOpen={isSignUpOpen}
        isSignInOpen={isSignInOpen}
        onCloseSignUp={() => setIsSignUpOpen(false)}
        onCloseSignIn={() => setIsSignInOpen(false)}
      />
      
      {/* Connectivity Status */}
      <div className="fixed bottom-4 right-4 z-50">
        <ConnectivityStatus />
      </div>
      
      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Sticky Footer - Fixed to bottom of viewport */}
      <footer
        className="fixed bottom-0 left-0 right-0 z-30 border-t py-4 px-4"
        style={{
          backgroundColor: "var(--header-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex flex-wrap justify-center items-center space-x-6 text-sm">
          <a
            href="#"
            className="hover:underline transition-colors duration-200"
          >
            FAQ
          </a>
          <a
            href="#"
            className="hover:underline transition-colors duration-200"
          >
            Forum
          </a>
          <a
            href="#"
            className="hover:underline transition-colors duration-200"
          >
            Contact
          </a>
          <a
            href="#"
            className="hover:underline transition-colors duration-200"
          >
            Donate
          </a>
          <span className="text-xs opacity-60">© 2024 Anointed.io</span>
        </div>
      </footer>
    </div>
  );
}
