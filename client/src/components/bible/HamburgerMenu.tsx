import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Book, Settings, Palette, Bookmark, Tags, Search, Eye, LogIn, UserPlus, Unlock, Lock, Move } from "lucide-react";
import { BookmarksList } from '@/components/user/BookmarksList';
import { LabelsLegend } from './LabelsLegend';
import { MainTranslationSelector } from './MainTranslationSelector';
import { AlternateTranslationSelector } from './AlternateTranslationSelector';
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CrossReferenceSwitcher } from "./CrossReferenceSwitcher";
import { useBibleStore } from "@/App";
import { useTheme } from '@/components/bible/ThemeProvider';
import { ManualSizeController } from "@/components/ui/ManualSizeController";

interface HorizontalMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToVerse?: (reference: string) => void;
}

export function HamburgerMenu({ isOpen, onClose, onNavigateToVerse }: HorizontalMenuProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Store connections - same as before but with safe access
  const bibleStore = useBibleStore();
  const showCrossRefs = bibleStore?.showCrossRefs ?? false;
  const showProphecies = bibleStore?.showProphecies ?? false;
  const showPrediction = bibleStore?.showPrediction ?? false;
  const showFulfillment = bibleStore?.showFulfillment ?? false;
  const showVerification = bibleStore?.showVerification ?? false;
  const showNotes = bibleStore?.showNotes ?? false;
  const showDates = bibleStore?.showDates ?? false;
  const showContext = bibleStore?.showContext ?? false;
  const isChronological = bibleStore?.isChronological ?? false;
  const unlockMode = bibleStore?.unlockMode ?? false;
  const toggleCrossRefs = bibleStore?.toggleCrossRefs ?? (() => {});
  const toggleProphecies = bibleStore?.toggleProphecies ?? (() => {});
  const togglePrediction = bibleStore?.togglePrediction ?? (() => {});
  const toggleFulfillment = bibleStore?.toggleFulfillment ?? (() => {});
  const toggleVerification = bibleStore?.toggleVerification ?? (() => {});
  const toggleNotes = bibleStore?.toggleNotes ?? (() => {});
  const toggleDates = bibleStore?.toggleDates ?? (() => {});
  const toggleContext = bibleStore?.toggleContext ?? (() => {});
  const toggleChronological = bibleStore?.toggleChronological ?? (() => {});
  const toggleUnlockMode = bibleStore?.toggleUnlockMode ?? (() => {});
  const isInitialized = bibleStore?.isInitialized ?? false;

  // DEBUG: Add activeLabels check
  const activeLabels = bibleStore?.activeLabels ?? [];
  console.log('🍔 HamburgerMenu activeLabels:', activeLabels);

  const { theme, setTheme, themes } = useTheme();

  // Local state for UI
  const [activeTab, setActiveTab] = useState("main-translation");
  const [bookmarkName, setBookmarkName] = useState("");
  const [bookmarkColor, setBookmarkColor] = useState("#3b82f6");
  const [showBookmarkForm, setShowBookmarkForm] = useState(false);

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
    { id: "main-translation", label: "Main Translation", icon: Book },
    { id: "alt-translations", label: "Alt Translations", icon: Book },
    { id: "toggle-labels", label: "Toggle Labels", icon: Tags },
    { id: "study-tools", label: "Study Tools", icon: Search },
    { id: "display-settings", label: "Display Settings", icon: Settings },
    { id: "color-theme", label: "Color Theme", icon: Palette },
    { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "main-translation":
        return (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Select Main Translation</h4>
            <MainTranslationSelector onUpdate={() => {}} />
          </div>
        );

      case "alt-translations":
        return (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Additional Translations</h4>
            <AlternateTranslationSelector onUpdate={() => console.log('🔄 Translation updated from alt-translations tab')} />
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
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Study Features</h4>

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
            <div className="space-y-1">
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
                <Label htmlFor="prophecy-tracking" className="text-xs font-medium">Prophecy Tracking</Label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Shows P|F|V columns for prophecy analysis</p>
              
              {/* Individual Prophecy Column Toggles - only show when main prophecy is on */}
              {showProphecies && (
                <div className="ml-5 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="prediction-column" 
                      className="w-3 h-3"
                      checked={showPrediction}
                      onCheckedChange={() => togglePrediction()}
                    />
                    <Label htmlFor="prediction-column" className="text-xs">Prediction (P)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="fulfillment-column" 
                      className="w-3 h-3"
                      checked={showFulfillment}
                      onCheckedChange={() => toggleFulfillment()}
                    />
                    <Label htmlFor="fulfillment-column" className="text-xs">Fulfillment (F)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="verification-column" 
                      className="w-3 h-3"
                      checked={showVerification}
                      onCheckedChange={() => toggleVerification()}
                    />
                    <Label htmlFor="verification-column" className="text-xs">Verification (V)</Label>
                  </div>
                </div>
              )}
            </div>

            {/* Other Study Tools */}
            <div className="space-y-1">
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
                <Label htmlFor="dates-column" className="text-xs">Dates Column</Label>
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
                <Label htmlFor="context-boundaries" className="text-xs">Context Boundaries</Label>
              </div>
            </div>

            {/* Verse Organization */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Verse Organization:</Label>
              <RadioGroup 
                value={isChronological ? "chronological" : "canonical"} 
                onValueChange={(value) => {
                  console.log('📅 RADIO CLICK: Chronological radio button clicked, selected value:', value, 'current state:', isChronological);
                  console.log('📅 RADIO CLICK: toggleChronological function exists:', typeof toggleChronological);
                  const shouldBeChronological = value === "chronological";
                  // Only toggle if the value actually changed
                  if (shouldBeChronological !== isChronological) {
                    console.log('📅 RADIO CLICK: State needs to change, calling toggleChronological()');
                    toggleChronological();
                    console.log('📅 RADIO CLICK: toggleChronological() completed');
                  } else {
                    console.log('📅 RADIO CLICK: State is already correct, no action needed');
                  }
                }}
                className="space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="canonical" id="canonical" className="w-3 h-3" />
                  <Label 
                    htmlFor="canonical" 
                    className="text-xs cursor-pointer"
                    onClick={() => console.log('📅 CANONICAL LABEL CLICKED')}
                  >
                    Canonical Order
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="chronological" id="chronological" className="w-3 h-3" />
                  <Label 
                    htmlFor="chronological" 
                    className="text-xs cursor-pointer"
                    onClick={() => console.log('📅 CHRONOLOGICAL LABEL CLICKED')}
                  >
                    Chronological Order
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case "display-settings":
        return (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Display Options</h4>
            <div className="space-y-2">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                <Label className="text-sm font-medium mb-2 block">Content Size</Label>
                <ManualSizeController className="w-full" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Manual controls: text, row height, column width (auto: header/menu)
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox 
                    id="unlock-mode" 
                    className="w-4 h-4"
                    checked={unlockMode}
                    onCheckedChange={(checked) => {
                      console.log('🔓 Unlock mode toggle clicked! New state:', checked);
                      toggleUnlockMode();
                    }}
                  />
                  <Label htmlFor="unlock-mode" className="text-sm font-medium flex items-center gap-2">
                    {unlockMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    Column Layout Mode
                  </Label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {unlockMode 
                    ? "Drag column headers to reorder them. Click to disable." 
                    : "Enable to drag and reorder column headers."
                  }
                </p>
              </div>
            </div>
          </div>
        );

      case "color-theme":
        return (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Choose Theme</h4>
            <div className="space-y-1">
              {themes.map((themeOption) => {
                // Theme-specific indicator styles
                const getThemeIndicator = (themeId: string) => {
                  switch (themeId) {
                    case 'light':
                      return "bg-gradient-to-r from-gray-100 to-white border-gray-300";
                    case 'dark':
                      return "bg-gradient-to-r from-gray-700 to-gray-900 border-gray-600";
                    case 'rainbow':
                      return "bg-gradient-to-r from-purple-500 via-cyan-500 to-pink-500 border-purple-400 animate-pulse";
                    default:
                      return "bg-gradient-to-r from-blue-500 to-purple-500 border-gray-300";
                  }
                };

                return (
                  <button
                    key={themeOption.id}
                    onClick={() => setTheme(themeOption.id as any)}
                    className={`flex items-center space-x-2 w-full p-2 rounded-lg transition-all text-left ${
                      theme === themeOption.id 
                        ? "bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-500" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full border flex-shrink-0 ${getThemeIndicator(themeOption.id)}`} />
                    <span className="text-xs">{themeOption.name}</span>
                    {themeOption.id === 'rainbow' && (
                      <span className="text-xs text-purple-500 ml-auto">✨</span>
                    )}
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

      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop overlay for click-outside functionality */}
      <div 
        className="fixed inset-0 z-30 bg-transparent"
        onClick={handleOverlayClick}
      />

      <div className="hamburger-menu fixed top-16 right-2 sm:top-20 sm:right-4 z-40 max-w-[calc(100vw-16px)]">
        {/* Sleek Tab Bar */}
        <div className="flex flex-col">
          <div className="flex bg-white/20 dark:bg-gray-900/30 backdrop-blur-xl rounded-full border border-white/30 dark:border-gray-700/30 p-1 shadow-lg relative">
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
                    className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-md"
                        : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/30 dark:hover:bg-gray-800/30"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                </div>
              );
            })}

            {/* Close Button integrated in tab bar */}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-2"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Dropdown positioned directly under tab bar for mobile */}
          {activeTab && (
            <div className="mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] z-50">
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-xl border border-white/20 dark:border-gray-700/30 animate-in slide-in-from-top-2 duration-200">
                <div className="p-3 sm:p-4 max-h-72 sm:max-h-80 overflow-y-auto">
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