import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Book, Settings, Palette, Bookmark, Tags, Search, Eye, LogIn, UserPlus, Unlock, Lock, Move, GraduationCap, RotateCcw } from "lucide-react";
import { BookmarksList } from '@/components/user/BookmarksList';
import { LabelsLegend } from './LabelsLegend';
import { UnifiedTranslationSelector } from './UnifiedTranslationSelector';
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useBibleStore } from "@/App";
import { useTheme } from '@/components/bible/ThemeProvider';
import { CompactSizeController } from "@/components/ui/CompactSizeController";
import { useTutorials } from '@/tutorial/Manager';
import { useTranslationMaps } from '@/store/translationSlice';

interface HorizontalMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToVerse?: (reference: string) => void;
}

export function HamburgerMenu({ isOpen, onClose, onNavigateToVerse }: HorizontalMenuProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { start: startTutorial } = useTutorials();
  const { incrementTranslationsVersion } = useTranslationMaps();

  // Store connections - same as before but with safe access
  const bibleStore = useBibleStore();
  const showCrossRefs = bibleStore?.showCrossRefs ?? false;
  const showProphecies = bibleStore?.showProphecies ?? false;
  const showNotes = bibleStore?.showNotes ?? false;
  const showDates = bibleStore?.showDates ?? false;
  const showContext = bibleStore?.showContext ?? false;
  const showHybrid = bibleStore?.showHybrid ?? false;
  const isChronological = bibleStore?.isChronological ?? false;
  const unlockMode = bibleStore?.unlockMode ?? false;
  const alignmentLockMode = bibleStore?.alignmentLockMode ?? 'auto';
  const setAlignmentLockMode = bibleStore?.setAlignmentLockMode ?? (() => {});
  const toggleCrossRefs = bibleStore?.toggleCrossRefs ?? (() => {});
  const toggleProphecies = bibleStore?.toggleProphecies ?? (() => {});
  const toggleNotes = bibleStore?.toggleNotes ?? (() => {});
  const toggleDates = bibleStore?.toggleDates ?? (() => {});
  const toggleContext = bibleStore?.toggleContext ?? (() => {});
  const toggleHybrid = bibleStore?.toggleHybrid ?? (() => {});
  const toggleChronological = bibleStore?.toggleChronological ?? (() => {});
  const toggleUnlockMode = bibleStore?.toggleUnlockMode ?? (() => {});
  const isInitialized = bibleStore?.isInitialized ?? false;

  // DEBUG: Add activeLabels check
  const activeLabels = bibleStore?.activeLabels ?? [];
  // HamburgerMenu debug removed for performance

  const { theme, setTheme, themes } = useTheme();

  // Local state for UI
  const [activeTab, setActiveTab] = useState("translations");
  const [bookmarkName, setBookmarkName] = useState("");
  const [bookmarkColor, setBookmarkColor] = useState("#3b82f6");
  const [showBookmarkForm, setShowBookmarkForm] = useState(false);

  // Ref for click-outside detection
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle escape key and click outside to close menu
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('🍔 Closing menu via Escape key');
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      
      // Don't close if clicking on the menu button itself (to allow toggle)
      if (target.closest('[title="Menu"]') || target.closest('button[title="Menu"]')) {
        return;
      }
      
      // Don't close if clicking on a dialog or alert dialog (e.g., edit bookmark modal)
      if (target.closest('[role="dialog"]') || target.closest('[role="alertdialog"]')) {
        return;
      }
      
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        console.log('🍔 Closing menu via click outside');
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside, true); // Use capture phase

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside, true); // Match capture phase
    };
  }, [isOpen, onClose]);

  // Listen for hamburger menu reset event
  useEffect(() => {
    const handleMenuReset = () => {
      console.log('🍔 Resetting hamburger menu to default tab');
      setActiveTab("translations");
    };

    window.addEventListener('resetHamburgerMenu', handleMenuReset);
    return () => {
      window.removeEventListener('resetHamburgerMenu', handleMenuReset);
    };
  }, []);

  // Prevent render if store not initialized
  if (!isInitialized) {
    return null;
  }

  const createBookmarkMutation = useMutation({
    mutationFn: async (bookmark: {
      userId: string;
      verseRef: string;
      name: string;
      color: string;
    }) => {
      return await apiRequest("/api/bookmarks", "POST", bookmark);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "Bookmark created",
        description: "Your bookmark has been saved successfully.",
      });
      setShowBookmarkForm(false);
      setBookmarkName("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create bookmark. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateBookmark = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create bookmarks.",
        variant: "destructive",
      });
      return;
    }

    if (!bookmarkName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your bookmark.",
        variant: "destructive",
      });
      return;
    }

    createBookmarkMutation.mutate({
      userId: user.id,
      verseRef: "Gen.1:1", // This should be the current verse
      name: bookmarkName,
      color: bookmarkColor,
    });
  };



  if (!isOpen) return null;

  // Handle click outside to close menu
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const tabs = [
    { id: "translations", label: "Translations", icon: Book },
    { id: "toggle-labels", label: "Toggle Labels", icon: Tags },
    { id: "study-tools", label: "Study Tools", icon: Search },
    { id: "display-settings", label: "Display Settings", icon: Settings },
    { id: "color-theme", label: "Color Theme", icon: Palette },
    { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
    { id: "tutorials", label: "Tutorials", icon: GraduationCap },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "translations":
        return (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Bible Translations</h4>
            <UnifiedTranslationSelector onUpdate={incrementTranslationsVersion} />
          </div>
        );

      case "toggle-labels":
        return (
          <div className="space-y-2">
            <LabelsLegend />
          </div>
        );

      case "study-tools":
        return (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Study Features</h4>

            <div className="space-y-1">
              {/* Cross References */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="cross-references" 
                  className="w-3 h-3" 
                  checked={showCrossRefs}
                  onCheckedChange={(checked) => {
                    console.log('🔴 Cross References toggle clicked! New state:', checked);
                    toggleCrossRefs();
                  }}
                />
                <Label htmlFor="cross-references" className="text-xs font-medium">Cross References</Label>
              </div>

              {/* Prophecy Tracking */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="prophecy-tracking" 
                  className="w-3 h-3"
                  checked={showProphecies}
                  onCheckedChange={(checked) => {
                    console.log('🔴 Prophecy toggle clicked! New state:', checked);
                    toggleProphecies();
                  }}
                />
                <Label htmlFor="prophecy-tracking" className="text-xs font-medium">Prophecy</Label>
              </div>

              {/* Other Study Tools */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="notes-column" 
                  className="w-3 h-3"
                  checked={showNotes}
                  onCheckedChange={(checked) => {
                    console.log('🔴 Notes toggle clicked! New state:', checked);
                    toggleNotes();
                  }}
                />
                <Label htmlFor="notes-column" className="text-xs">Notes Column</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="dates-column" 
                  className="w-3 h-3"
                  checked={showDates}
                  onCheckedChange={(checked) => {
                    console.log('🔴 Dates toggle clicked! New state:', checked);
                    toggleDates();
                  }}
                />
                <Label htmlFor="dates-column" className="text-xs">Show Dates</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="context-boundaries" 
                  className="w-3 h-3"
                  checked={showContext}
                  onCheckedChange={(checked) => {
                    console.log('🔴 Context boundaries toggle clicked! New state:', checked);
                    toggleContext();
                  }}
                />
                <Label htmlFor="context-boundaries" className="text-xs">Context Boundaries (beta)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="master-column" 
                  className="w-3 h-3"
                  checked={showHybrid}
                  onCheckedChange={(checked) => {
                    console.log('🔴 Master Column toggle clicked! New state:', checked);
                    toggleHybrid();
                  }}
                />
                <Label htmlFor="master-column" className="text-xs">Master Column</Label>
              </div>
            </div>
          </div>
        );

      case "display-settings":
        return (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Display Options</h4>
            <div className="space-y-2">
              <CompactSizeController className="w-full" />

              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="unlock-mode" 
                    className="w-3 h-3"
                    checked={unlockMode}
                    onCheckedChange={(checked) => {
                      console.log('🔓 Unlock mode toggle clicked! New state:', checked);
                      toggleUnlockMode();
                    }}
                  />
                  <Label htmlFor="unlock-mode" className="text-xs font-medium flex items-center gap-1.5">
                    {unlockMode ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    Change to rearrange columns
                  </Label>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    console.log('🔄 Resetting column order to defaults');
                    
                    // Reset column order and widths
                    if (bibleStore.columnState?.resetColumnOrder) {
                      bibleStore.columnState.resetColumnOrder();
                    }
                    
                    // Disable unlock mode if enabled
                    if (unlockMode) {
                      toggleUnlockMode();
                    }
                    
                    toast({
                      title: "Column Order Reset",
                      description: "Column arrangement and widths restored to defaults",
                    });
                  }}
                  className="h-6 w-6 p-0"
                  title="Reset column order to defaults"
                  data-testid="button-reset-columns"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>

            </div>
          </div>
        );

      case "color-theme":
        return (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Choose Theme</h4>
            <div className="space-y-1">
              {themes.map((themeName) => {
                const themeDisplayNames = {
                  light: 'Light',
                  dark: 'Dark'
                } as const;

                return (
                  <button
                    key={themeName}
                    onClick={() => setTheme(themeName)}
                    className={`flex items-center space-x-2 w-full p-2 rounded-lg transition-all text-left ${
                      theme === themeName 
                        ? "ring-1" 
                        : ""
                    }`}
                    style={{
                      backgroundColor: theme === themeName ? 'var(--highlight-bg)' : 'transparent',
                      borderColor: theme === themeName ? 'var(--accent-color)' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (theme !== themeName) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (theme !== themeName) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div className="w-3 h-3 rounded-full border flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-500" style={{borderColor: 'var(--border-color)'}} />
                    <span className="text-xs">{themeDisplayNames[themeName] || themeName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case "bookmarks":
        return (
          <div className="space-y-2 h-full flex flex-col">
            <BookmarksList 
              onNavigateToVerse={(reference) => {
                console.log('🔖 HamburgerMenu: Navigate to verse:', reference);
                if (onNavigateToVerse) {
                  onNavigateToVerse(reference);
                  onClose();
                }
              }}
              className="flex-1"
            />
          </div>
        );

      case "tutorials":
        return (
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Interactive Tutorials</h4>
            
            <div className="space-y-2">
              <Button
                onClick={() => {
                  console.log('📚 Starting bookmarks tutorial');
                  startTutorial('bookmarks');
                  onClose();
                }}
                className="w-full justify-start text-xs h-8"
                variant="outline"
                data-testid="tutorial-bookmarks"
              >
                <GraduationCap className="w-3 h-3 mr-2" />
                Learn Bookmarks
              </Button>
              
              <Button
                onClick={() => {
                  console.log('📚 Starting translations tutorial');
                  startTutorial('translations');
                  onClose();
                }}
                className="w-full justify-start text-xs h-8"
                variant="outline"
                data-testid="tutorial-translations"
              >
                <GraduationCap className="w-3 h-3 mr-2" />
                Bible Translations Guide
              </Button>
              
              <Button
                onClick={() => {
                  console.log('📚 Starting hyperlinks tutorial');
                  startTutorial('hyperlinks');
                  onClose();
                }}
                className="w-full justify-start text-xs h-8"
                variant="outline"
                data-testid="tutorial-hyperlinks"
              >
                <GraduationCap className="w-3 h-3 mr-2" />
                Clickable Scripture Links
              </Button>

              <Button
                onClick={() => {
                  console.log('📚 Starting navigation tutorial');
                  startTutorial('navigation');
                  onClose();
                }}
                className="w-full justify-start text-xs h-8"
                variant="outline"
                data-testid="tutorial-navigation"
              >
                <GraduationCap className="w-3 h-3 mr-2" />
                Navigation Basics
              </Button>

              <Button
                onClick={() => {
                  console.log('📚 Starting highlights tutorial');
                  startTutorial('highlights');
                  onClose();
                }}
                className="w-full justify-start text-xs h-8"
                variant="outline"
                data-testid="tutorial-highlights"
              >
                <GraduationCap className="w-3 h-3 mr-2" />
                Text Highlights
              </Button>

              <Button
                onClick={() => {
                  console.log('📚 Starting notes tutorial');
                  startTutorial('notes');
                  onClose();
                }}
                className="w-full justify-start text-xs h-8"
                variant="outline"
                data-testid="tutorial-notes"
              >
                <GraduationCap className="w-3 h-3 mr-2" />
                Personal Notes
              </Button>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Interactive tutorials to help you get the most out of your Bible study experience.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div 
        ref={menuRef}
        className="hamburger-menu fixed right-1 sm:right-2 z-[60] max-w-[calc(100vw-8px)]"
        style={{
          top: 'calc(3.5rem + max(0px, env(safe-area-inset-top)))'
        }}
      >
        {/* Sleek Tab Bar */}
        <div className="flex flex-col items-end">
          <div className="inline-flex bg-white/80 dark:bg-black/80 backdrop-blur-xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-full p-1 relative">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <div key={tab.id} className="relative">
                  <button
                    onClick={() => {
                      if (activeTab === tab.id) {
                        setActiveTab("");
                      } else {
                        setActiveTab(tab.id);
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-full text-xs font-medium transition-all duration-200"
                    style={{
                      backgroundColor: activeTab === tab.id ? 'var(--highlight-bg)' : 'transparent',
                      color: activeTab === tab.id ? 'var(--accent-color)' : 'var(--text-secondary)'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                        e.currentTarget.style.color = 'var(--accent-color)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                    data-testid={`tab-${tab.id}`}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                </div>
              );
            })}

          </div>

          {/* Dropdown positioned directly under tab bar for mobile */}
          {activeTab && (
            <div className="mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] z-50">
              <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-lg animate-in slide-in-from-top-2 duration-200 flex flex-col max-h-[calc(90vh-5rem)]">
                <div className="p-3 sm:p-4 overflow-y-auto menu-scrollable flex-1">
                  {renderTabContent()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}