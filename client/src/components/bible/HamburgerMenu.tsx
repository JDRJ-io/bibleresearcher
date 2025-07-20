
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Book, Settings, Palette, Bookmark, Tags, Search, Eye, LogIn, UserPlus } from "lucide-react";
import { TranslationSelector } from "./TranslationSelector";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CrossReferenceSwitcher } from "./CrossReferenceSwitcher";
import { useBibleStore } from "@/App";
import { useTheme } from "./ThemeProvider";
import { SizeSelector } from "@/components/ui/SizeSelector";

interface HorizontalMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HamburgerMenu({ isOpen, onClose }: HorizontalMenuProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Store connections - same as before but with safe access
  const bibleStore = useBibleStore();
  const showCrossRefs = bibleStore?.showCrossRefs ?? false;
  const showProphecies = bibleStore?.showProphecies ?? false;
  const showNotes = bibleStore?.showNotes ?? false;
  const showDates = bibleStore?.showDates ?? false;
  const showLabels = bibleStore?.showLabels ?? {};
  const toggleCrossRefs = bibleStore?.toggleCrossRefs ?? (() => {});
  const toggleProphecies = bibleStore?.toggleProphecies ?? (() => {});
  const toggleNotes = bibleStore?.toggleNotes ?? (() => {});
  const toggleDates = bibleStore?.toggleDates ?? (() => {});
  const toggleLabel = bibleStore?.toggleLabel ?? (() => {});
  const isInitialized = bibleStore?.isInitialized ?? false;

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

  const labels = [
    { id: "who", name: "Who", description: "Bold text for people/beings" },
    { id: "what", name: "What", description: "Outlined text for objects/things" },
    { id: "when", name: "When", description: "Underlined text for time references" },
    { id: "where", name: "Where", description: "Curly braces around locations" },
    { id: "command", name: "Command", description: "Drop shadow for divine commands" },
    { id: "action", name: "Action", description: "Italic text for actions/verbs" },
    { id: "why", name: "Why", description: "Cursive font for reasons/purposes" },
    { id: "seed", name: "Seed", description: "Superscript * for spiritual seeds" },
    { id: "harvest", name: "Harvest", description: "Superscript = for results/fruits" },
    { id: "prediction", name: "Prediction", description: "Superscript ~ for prophecies" },
  ];

  if (!isOpen) return null;

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
            <TranslationSelector onUpdate={() => {}} />
          </div>
        );

      case "alt-translations":
        return (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Additional Translations</h4>
            <TranslationSelector onUpdate={() => console.log('🔄 Translation updated from alt-translations tab')} />
          </div>
        );

      case "toggle-labels":
        return (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Semantic Highlighting</h4>
            <div className="space-y-1">
              {labels.map((label) => (
                <div key={label.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={label.id} 
                    className="w-3 h-3"
                    checked={showLabels[label.id] || false}
                    onCheckedChange={() => toggleLabel(label.id)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={label.id} className="text-xs font-medium">{label.name}</Label>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{label.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "study-tools":
        return (
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Study Features</h4>
            
            {/* Cross References */}
            <div className="space-y-1">
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
              {showCrossRefs && (
                <div className="ml-5">
                  <CrossReferenceSwitcher
                    currentSet="cf1"
                    onSetChange={() => {}}
                  />
                </div>
              )}
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
            </div>

            {/* Verse Organization */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Verse Organization:</Label>
              <RadioGroup defaultValue="canonical" className="space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="canonical" id="canonical" className="w-3 h-3" />
                  <Label htmlFor="canonical" className="text-xs">Canonical Order</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="chronological" id="chronological" className="w-3 h-3" />
                  <Label htmlFor="chronological" className="text-xs">Chronological Order</Label>
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
                <SizeSelector className="w-full" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Adjusts font size, column width, and row height globally
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
              {themes.map((themeOption) => (
                <button
                  key={themeOption.id}
                  onClick={() => setTheme(themeOption.id)}
                  className={`flex items-center space-x-2 w-full p-2 rounded-lg transition-all text-left ${
                    theme === themeOption.id 
                      ? "bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-500" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0"
                    style={{ backgroundColor: themeOption.color }}
                  />
                  <span className="text-xs">{themeOption.name}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "bookmarks":
        return (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Saved Bookmarks</h4>
            {user ? (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBookmarkForm(!showBookmarkForm)}
                  className="w-full text-sm"
                >
                  + Create Bookmark
                </Button>
                {showBookmarkForm && (
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700 space-y-3">
                    <input
                      placeholder="Bookmark name..."
                      value={bookmarkName}
                      onChange={(e) => setBookmarkName(e.target.value)}
                      className="w-full text-sm p-2 border rounded"
                    />
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={bookmarkColor}
                        onChange={(e) => setBookmarkColor(e.target.value)}
                        className="w-8 h-8 rounded border"
                      />
                      <Button
                        onClick={handleCreateBookmark}
                        disabled={createBookmarkMutation.isPending}
                        className="flex-1 text-sm"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                <p className="mb-2">Sign in to access your bookmarks</p>
                <Button size="sm" className="text-xs h-6 px-3">Sign In</Button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed top-20 right-2 sm:right-4 z-40">
      {/* Sleek Tab Bar */}
      <div className="flex">
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
                
                {/* Individual Dropdown Slot - positioned under each tab */}
                {activeTab === tab.id && (
                  <div className={`absolute top-full mt-2 w-72 sm:w-80 z-50 ${
                    // Mobile positioning to avoid off-screen
                    index >= tabs.length - 1 
                      ? 'right-0' 
                      : index === 0 
                        ? 'left-0' 
                        : index === 1
                          ? 'left-0 sm:left-1/2 sm:transform sm:-translate-x-1/2'
                          : 'right-0 sm:left-1/2 sm:transform sm:-translate-x-1/2'
                  }`}>
                    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-xl border border-white/20 dark:border-gray-700/30 animate-in slide-in-from-top-2 duration-200">
                      <div className="p-3 sm:p-4 max-h-72 sm:max-h-80 overflow-y-auto">
                        {renderTabContent()}
                      </div>
                    </div>
                  </div>
                )}
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
      </div>
    </div>
  );
}
