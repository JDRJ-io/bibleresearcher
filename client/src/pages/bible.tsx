import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useBibleData } from "@/hooks/useBibleData";
import { useToast } from "@/hooks/use-toast";
import { loadTranslation, getVerseText } from "@/lib/translationLoader";
import { TopHeader } from "@/components/bible/TopHeader";
import { HamburgerMenu } from "@/components/bible/HamburgerMenu";
import { VirtualBibleTable } from "@/components/bible/VirtualBibleTable";
import { ExpandedVerseOverlay } from "@/components/bible/ExpandedVerseOverlay";
import { AuthModals } from "@/components/auth/AuthModals";
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

  // Translation state management
  const [mainTranslation, setMainTranslation] = useState("KJV");
  const [multiTranslationMode, setMultiTranslationMode] = useState(false);
  const [selectedTranslations, setSelectedTranslations] = useState<string[]>([
    "KJV",
  ]);

  const [localExpandedVerse, setLocalExpandedVerse] = useState<any>(null);
  const [preserveAnchor, setPreserveAnchor] = useState<((callback: () => void) => void) | null>(null);
  const [lastLoadedCenter, setLastLoadedCenter] = useState<number>(-1);

  const localExpandVerse = (verse: any) => setLocalExpandedVerse(verse);
  const closeLocalExpandedVerse = () => setLocalExpandedVerse(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isForumOpen, setIsForumOpen] = useState(false);

  // Translation helper functions
  const toggleTranslation = (translationId: string) => {
    if (multiTranslationMode) {
      setSelectedTranslations((prev) =>
        prev.includes(translationId)
          ? prev.filter((id) => id !== translationId)
          : [...prev, translationId],
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
              const text = getVerseText(translationData, verse.reference);
              if (text && !text.includes("Loading...")) {
                verse.text[translationId] = text;
              }
            });
          }

          // Add to selected translations
          setSelectedTranslations((prev) => [...prev, translationId]);
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
      // Remove translation
      setSelectedTranslations((prev) =>
        prev.filter((id) => id !== translationId),
      );
    }
  };

  const handlePreferenceChange = async (key: string, value: boolean) => {
    // Use preserveAnchor if available to prevent scroll jumping on UI toggles
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

    // Load prophecy data when prophecy columns are enabled
    if (key === 'showProphecy' && value) {
      try {
        console.log("User enabled prophecy columns - loading prophecy data...");
        const result = await loadProphecyDataOnDemand();
        if (result.index.size > 0 && Object.keys(result.rows).length > 0) {
          toast({ 
            title: "Prophecy data loaded", 
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
  const shouldShowLoading = isLoading && verses.length === 0;

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
      {/* Sticky Top Header */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between p-4 border-b"
        style={{
          backgroundColor: "var(--header-bg)",
          borderBottomColor: "var(--border-color)",
        }}
      >
        {/* Left side - Back/Forward buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={hookGoBack}
            disabled={!hookCanGoBack}
            className="p-2 hover:bg-muted rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go back"
          >
            <svg
              className="h-4 w-4"
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
            className="p-2 hover:bg-muted rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go forward"
          >
            <svg
              className="h-4 w-4"
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

        {/* Center - Navigation and Search */}
        <div className="flex-1 flex items-center gap-4 mx-4">
          <VerseSelector onNavigate={navigateToVerse} />

          <div className="flex-1 max-w-md flex gap-2">
            <input
              type="text"
              placeholder="Search verses, references, or topics... (% for random)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleGlobalSearch(searchQuery);
                }
              }}
              className="flex-1 px-3 py-2 text-sm bg-muted border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => handleGlobalSearch(searchQuery)}
              className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/80 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Right side - Auth + Menu */}
        <div className="flex items-center gap-2">
          {/* Authentication Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSignUpOpen(true)}
              className="bg-gradient-to-r from-slate-400 via-purple-300 to-blue-300 hover:from-slate-500 hover:via-purple-400 hover:to-blue-400 text-white shadow-lg transition-all duration-300 hover:shadow-purple-300/50 hover:scale-105 text-sm px-3 py-1 h-8 font-medium rounded-md flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Sign Up
            </button>
            <button
              onClick={() => setIsSignInOpen(true)}
              className="border border-slate-300 bg-gradient-to-r from-slate-50 via-purple-50 to-blue-50 dark:from-slate-800 dark:via-purple-900/20 dark:to-blue-900/20 text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-slate-100 hover:via-purple-100 hover:to-blue-100 dark:hover:from-slate-700 dark:hover:via-purple-800/30 dark:hover:to-blue-800/30 transition-all duration-300 hover:scale-105 text-sm px-3 py-1 h-8 font-medium rounded-md flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Sign In
            </button>
          </div>
          
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Open menu"
          >
            <svg
              className="h-5 w-5"
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
        </div>
      </div>

      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onShowAuth={() => setIsSignUpOpen(true)}
        onShowForum={() => setIsForumOpen(true)}
        allTranslations={allTranslations}

        preferences={preferences}
        onPreferenceChange={handlePreferenceChange}
        onResetLayout={handleResetLayout}
        onSaveBookmark={handleSaveBookmark}
        mainTranslation={mainTranslation}
        multiTranslationMode={multiTranslationMode}
        selectedTranslations={selectedTranslations}
        onToggleMultiTranslationMode={toggleMultiTranslationMode}
        onToggleTranslation={async (translationId: string) => {
          if (!selectedTranslations.includes(translationId)) {
            // Load translation before adding
            toast({ title: `Loading ${translationId} translation...` });
            const success = await loadTranslationData(translationId);
            if (success) {
              toggleTranslation(translationId);
              toast({ title: `${translationId} loaded successfully` });
            } else {
              toast({
                title: `Failed to load ${translationId}`,
                variant: "destructive",
              });
            }
          } else {
            toggleTranslation(translationId);
          }
        }}
        crossRefSet={crossRefSet}
        onCrossRefSetChange={setCrossRefSet}
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
