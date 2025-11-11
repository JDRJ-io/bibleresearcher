import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RotateCcw,
  RotateCw,
  Search,
  Menu,
  Sparkles,
  KeyRound,
  Book,
  Bookmark,
} from "lucide-react";
import { BookmarkButton } from "@/components/user/BookmarkButton";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { UserProfileDropdown } from "@/components/auth/UserProfileDropdown";
import { AuthModals } from "@/components/auth/AuthModals";
import { useState, useCallback, useRef } from "react";
import { usePreventScrollPropagation } from "@/hooks/usePreventScrollPropagation";
import { useWindowSize } from "react-use";
import { useBibleStore } from "@/App";
import { useTranslationMaps } from "@/store/translationSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { BookmarkModal } from "./BookmarkModal";
import { upsertBookmark } from "@/lib/userDataApi";
import { useAdaptiveScaling } from "@/hooks/useAdaptiveScaling";
import { ColumnPivotControls } from "./ColumnPivotControls";
import { NewColumnHeaders } from "./NewColumnHeaders";
import { UnifiedTranslationSelector } from "./UnifiedTranslationSelector";

interface TopHeaderProps {
  searchQuery: string;
  onSearchChange: () => void; // Changed to just trigger search modal
  onBack: () => void;
  onForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onMenuToggle: () => void;
  getCurrentVerse?: () => { reference: string; index: number };
  goTo: (ref: string) => void;
  // Column headers props
  selectedTranslations?: any[];
  preferences?: any;
  scrollLeft?: number;
  isGuest?: boolean;
  bodyRef?: React.RefObject<HTMLElement>;
  isCentered?: boolean;
  actualTotalWidth?: number;
  viewportWidth?: number;
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
  goTo,
  selectedTranslations = [],
  preferences = {},
  scrollLeft = 0,
  isGuest = true,
  bodyRef,
  isCentered = false,
  actualTotalWidth = 0,
  viewportWidth = 0,
}: TopHeaderProps) {
  const { theme, setTheme, themes } = useTheme();
  const { user, loading } = useAuth();
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bibleStore = useBibleStore();
  const { main, setMain, toggleAlternate, alternates } = useTranslationMaps();

  const { width, height } = useWindowSize();
  const isMobile = width <= 640;
  const isPortrait = height > width;

  // Apply adaptive scaling for responsive header sizing
  useAdaptiveScaling();

  // Prevent scroll propagation to underlying table (fixes mobile portrait scroll issues)
  const headerRef = useRef<HTMLElement>(null);
  usePreventScrollPropagation(headerRef, {
    allowInternalScroll: true,
    preventWheel: true,
    preventTouch: true
  });

  // Memoize auth modal callbacks to prevent AuthModals re-renders on scroll
  const handleCloseSignUp = useCallback(() => setIsSignUpOpen(false), []);
  const handleCloseSignIn = useCallback(() => setIsSignInOpen(false), []);
  const handleOpenSignUp = useCallback(() => setIsSignUpOpen(true), []);
  const handleOpenSignIn = useCallback(() => setIsSignInOpen(true), []);

  // Reset to default state function
  const handleResetToDefault = () => {
    console.log(
      "🔄 Resetting to default state: KJV + Cross-references only + Navigate to Genesis 1:1",
    );

    // Navigate to Genesis 1:1 first
    goTo("Gen.1:1");

    // Reset translation store to defaults
    setMain("KJV");
    // Clear all alternate translations
    alternates.forEach((altId: string) => {
      toggleAlternate(altId);
    });

    // Reset Bible store toggles to default
    const defaultState = {
      showCrossRefs: true,
      showProphecies: false,
      showPrediction: false,
      showFulfillment: false,
      showVerification: false,
      showNotes: false,
      showDates: false,
      showContext: false,
      isChronological: false,
    };

    // Apply all the default settings
    Object.entries(defaultState).forEach(([key, value]) => {
      if (key in bibleStore && (bibleStore as any)[key] !== value) {
        const toggleFunction = `toggle${key.replace("show", "").replace("is", "")}`;
        if (typeof (bibleStore as any)[toggleFunction] === "function") {
          (bibleStore as any)[toggleFunction]();
        } else if (key === "isChronological") {
          bibleStore.setChronological(value);
        }
      }
    });

    // Clear all active labels
    if (typeof (bibleStore as any).setActiveLabels === "function") {
      (bibleStore as any).setActiveLabels([]);
    }

    // Reset column order and widths to defaults
    if (bibleStore.columnState?.resetColumnOrder) {
      bibleStore.columnState.resetColumnOrder();
    }

    // Disable unlock mode if enabled (for consistency with menu button)
    if (bibleStore.unlockMode && bibleStore.toggleUnlockMode) {
      bibleStore.toggleUnlockMode();
    }

    // Dispatch custom event to reset hamburger menu state
    const resetMenuEvent = new CustomEvent("resetHamburgerMenu", {});
    window.dispatchEvent(resetMenuEvent);

    toast({
      title: "Reset to Default",
      description:
        "Navigated to Genesis 1:1 with KJV + Cross-references view and cleared labels",
    });
  };

  // Get the current central verse from table ref or fallback
  const getCurrentCentralVerse = () => {
    try {
      if (getCurrentVerse) {
        const verseInfo = getCurrentVerse();
        // console.log( // Disabled for performance
        //   "🔖 TopHeader getCurrentCentralVerse from table:",
        //   verseInfo,
        // );
        return verseInfo;
      }

      // Fallback to reading state
      const saved = JSON.parse(localStorage.getItem("readingState") ?? "null");
      const anchorIndex = saved?.anchorIndex || 0;
      const currentKeys = bibleStore?.currentVerseKeys || [];
      const currentRef =
        currentKeys[anchorIndex] || currentKeys[0] || "Gen.1:1";

      // console.log("🔖 TopHeader getCurrentCentralVerse fallback:", { // Disabled for performance
      //   anchorIndex,
      //   currentRef,
      //   totalVerses: currentKeys.length,
      // });
      return { reference: currentRef, index: anchorIndex };
    } catch (error) {
      console.error("🔖 TopHeader Error getting central verse:", error);
      return { reference: "Gen.1:1", index: 0 };
    }
  };

  // Bookmark creation mutation using contract-based API
  const createBookmarkMutation = useMutation({
    mutationFn: async (payload: { name: string; color: string }) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const centralVerse = getCurrentCentralVerse();
      console.log("🔖 TopHeader: Creating bookmark with contract API:", {
        user_id: user.id,
        name: payload.name,
        verse_ref: centralVerse.reference,
        color: payload.color,
      });

      // Use contract-based API function (name parameter is ignored for user_bookmarks table)
      await upsertBookmark(user.id, centralVerse.reference, payload.name, main);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-bookmarks"] });
      toast({
        title: "Bookmark saved",
        description: "Current position has been bookmarked successfully.",
      });
    },
    onError: (error) => {
      console.error("🔖 TopHeader: Bookmark creation failed:", error);
      toast({
        title: "Error",
        description: "Failed to save bookmark. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveBookmark = () => {
    console.log("🔖 TopHeader: Save bookmark button clicked");

    if (!user) {
      console.log("🔖 TopHeader: No user found, showing sign-in message");
      toast({
        title: "Sign in required",
        description: "Please sign in to save bookmarks.",
        variant: "destructive",
      });
      return;
    }

    console.log("🔖 TopHeader: Opening bookmark modal");
    setIsBookmarkModalOpen(true);
  };

  const handleBookmarkSave = (name: string, color: string) => {
    createBookmarkMutation.mutate({ name, color });
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`site-header top-header glass-morphism sticky top-0 z-50 border-b flex items-center justify-between w-full max-w-full shadow-sm ${
          isMobile ? "top-header-mobile" : ""
        } ${
          isMobile && isPortrait 
            ? "bg-background" 
            : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        }`}
        style={{
          // Return to original single header height
          height: isMobile
            ? "var(--top-header-height-mobile)"
            : "var(--top-header-height-desktop)",
          minHeight: isMobile
            ? "var(--top-header-height-mobile)"
            : "var(--top-header-height-desktop)",
          maxHeight: isMobile
            ? "var(--top-header-height-mobile)"
            : "var(--top-header-height-desktop)",
          padding:
            isPortrait && isMobile ? "5px 5px" : isMobile ? "5px 2px" : "5px 2px",
          pointerEvents: "auto", // Ensure events are contained
          touchAction: "none", // Prevent document scroll on touch
          overscrollBehavior: "contain", // Contain scroll within element
        }}
        // Remove onWheel interference - let VirtualBibleTable handle all scrolling
      >
      {/* Mobile Layout */}
      {isMobile ? (
        <div className="flex items-center justify-between w-full h-full gap-2">
          {/* Left: Navigation */}
          <div className="flex items-center gap-1.5 flex-shrink-0 pl-2">
            <Button
              variant="outline"
              size="sm"
              className={`w-8 h-8 p-0 ${!canGoBack ? "opacity-50" : ""}`}
              onClick={() => {
                console.log(
                  "📱 Mobile Back button clicked, canGoBack:",
                  canGoBack,
                );
                onBack();
              }}
              disabled={!canGoBack}
              title={canGoBack ? "Go back (Mobile)" : "No previous verses"}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`w-8 h-8 p-0 ${!canGoForward ? "opacity-50" : ""}`}
              onClick={() => {
                console.log(
                  "📱 Mobile Forward button clicked, canGoForward:",
                  canGoForward,
                );
                onForward();
              }}
              disabled={!canGoForward}
              title={canGoForward ? "Go forward (Mobile)" : "No forward verses"}
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Center: Anointed Logo */}
          <div className="flex-1 mx-3 flex items-center justify-center">
            <div
              className="flex items-center justify-center gap-2"
            >
              <button
                className="hover:scale-110 transition-transform duration-300 cursor-pointer"
                onClick={handleResetToDefault}
                title="Reset to default view (KJV + Cross-references only)"
              >
                <img src="/crown-icon.png" alt="Anointed.io" className="w-7 h-7 drop-shadow-lg" />
              </button>
              <span
                className="anointed-logo-text font-bold bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 
                           dark:from-amber-400 dark:via-yellow-400 dark:to-amber-500 
                           bg-clip-text text-transparent drop-shadow-lg text-sm sm:text-base"
                style={{
                  fontWeight: "700",
                  letterSpacing: "-0.01em",
                  filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.15))",
                }}
              >
                Anointed.io
              </span>
            </div>
          </div>

          {/* Right: Search + Bookmark + Sign In + Menu */}
          <div className="flex items-center gap-1.5 flex-shrink-0 pr-2">
            <Button
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => {
                console.log("🔍 TopHeader: Search button clicked (Mobile)");
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
            {user ? (
              <UserProfileDropdown />
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setIsSignInOpen(true)}
                title="Sign In"
              >
                <KeyRound className="w-4 h-4" />
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
          {/* Left Section: Navigation + Logo */}
          <div className="flex items-center space-x-4 pl-4">
            {/* Navigation buttons first */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className={`w-8 h-8 p-0 ${!canGoBack ? "opacity-50" : ""}`}
                onClick={() => {
                  console.log(
                    "🖥️ Desktop Back button clicked, canGoBack:",
                    canGoBack,
                  );
                  onBack();
                }}
                disabled={!canGoBack}
                title={canGoBack ? "Go back (Desktop)" : "No previous verses"}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`w-8 h-8 p-0 ${!canGoForward ? "opacity-50" : ""}`}
                onClick={() => {
                  console.log(
                    "🖥️ Desktop Forward button clicked, canGoForward:",
                    canGoForward,
                  );
                  onForward();
                }}
                disabled={!canGoForward}
                title={
                  canGoForward ? "Go forward (Desktop)" : "No forward verses"
                }
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Brand group: Logo + Text */}
            <div
              className="flex items-center gap-2.5"
            >
              <button
                className="hover:scale-110 transition-transform duration-300 cursor-pointer"
                onClick={handleResetToDefault}
                title="Reset to default view (KJV + Cross-references only)"
              >
                <img src="/crown-icon.png" alt="Anointed.io" className="w-8 h-8 drop-shadow-lg" />
              </button>
              <span
                className="anointed-logo-text font-bold bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 
                           dark:from-amber-400 dark:via-yellow-400 dark:to-amber-500 
                           bg-clip-text text-transparent drop-shadow-lg"
                style={{
                  fontSize: "var(--anointed-text-size)",
                  fontWeight: "700",
                  letterSpacing: "-0.01em",
                  filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.15))",
                }}
              >
                Anointed.io
              </span>
            </div>
          </div>

          {/* Center: Spacer */}
          <div className="flex-1 max-w-2xl mx-8">
            {/* Spacer for centered logo */}
          </div>

          {/* Right Section: Search + Bookmark + Auth + Menu */}
          <div className="flex items-center gap-3 justify-end flex-shrink-0 pr-4">
            <Button
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => {
                console.log("🔍 TopHeader: Search button clicked (Desktop)");
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
              title="Save current reading position as bookmark"
            >
              <Bookmark className="w-4 h-4" />
            </Button>

            {user ? (
              <UserProfileDropdown />
            ) : (
              <Button
                variant="default"
                size="sm"
                className="px-4 h-9 font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 
                           hover:from-indigo-500 hover:via-purple-500 hover:to-blue-500 text-white
                           border-2 border-purple-400/50 transition-all duration-300 hover:scale-105 
                           shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 
                           relative overflow-hidden"
                onClick={() => setIsSignInOpen(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                <KeyRound className="w-4 h-4 mr-2 relative z-10 text-white drop-shadow-sm" />
                <span className="relative z-10 text-white drop-shadow-sm">
                  Sign In
                </span>
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
        onCloseSignUp={handleCloseSignUp}
        onCloseSignIn={handleCloseSignIn}
        onSignUpOpen={handleOpenSignUp}
        onSignInOpen={handleOpenSignIn}
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
    </>
  );
}
