import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Book,
  Tags,
  Settings,
  Palette,
  Bookmark,
  MessageSquare,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Translation, Bookmark as BookmarkType } from "@/types/bible";
import { CrossReferenceSwitcher } from "./CrossReferenceSwitcher";
import { TranslationSelector } from "./TranslationSelector";
import { useBibleStore } from "@/App";
import { useTheme } from "./ThemeProvider";

export function HamburgerMenu({
  isOpen,
  onClose,
}: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { showCrossRefs, showProphecies, toggleCrossRefs, toggleProphecies } = useBibleStore();
  const { theme, setTheme, themes } = useTheme();

  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [bookmarkName, setBookmarkName] = useState("");
  const [bookmarkColor, setBookmarkColor] = useState("#3b82f6");
  const [showBookmarkForm, setShowBookmarkForm] = useState(false);
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('bible-font-size') || 'medium');

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

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    localStorage.setItem('bible-font-size', size);
    const multiplier = size === 'small' ? '0.85' : size === 'large' ? '1.15' : '1.0';
    document.documentElement.style.setProperty('--font-size-multiplier', multiplier);
  };

  // Apply font size on component mount
  React.useEffect(() => {
    const multiplier = fontSize === 'small' ? '0.85' : fontSize === 'large' ? '1.15' : '1.0';
    document.documentElement.style.setProperty('--font-size-multiplier', multiplier);
  }, [fontSize]);

  const labels = [
    { id: "who", name: "Who (Bold)" },
    { id: "what", name: "What (Outline)" },
    { id: "when", name: "When (Underline)" },
    { id: "where", name: "Where (Brackets)" },
    { id: "command", name: "Command (Shadow)" },
    { id: "action", name: "Action (Italic)" },
    { id: "why", name: "Why (Handwritten)" },
    { id: "seed", name: "Seed (Superscript *)" },
    { id: "harvest", name: "Harvest (Superscript =)" },
    { id: "prediction", name: "Prediction (Superscript ~)" },
  ];

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

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      {/* Overlay - darker on mobile for prominence */}
      <div className={`absolute inset-0 ${isMobile ? 'bg-black/70' : 'bg-black/40'}`} />
      
      {/* Menu Panel - Responsive design */}
      <div
        className={`fixed bg-white dark:bg-gray-900 shadow-2xl transform transition-all duration-300 overflow-y-auto border-l border-gray-200 dark:border-gray-700 ${
          isMobile 
            ? `top-0 right-0 h-full w-80 ${isOpen ? "translate-x-0" : "translate-x-full"}` 
            : `top-16 right-4 h-[calc(100vh-5rem)] w-96 rounded-lg ${isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-[-10px] opacity-0 scale-95"}`
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bible Settings</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ✕
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Multi-Translation System - Enhanced */}
          <div className="space-y-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-lg flex items-center text-blue-900 dark:text-blue-100">
              <Book className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Bible Translations
            </h3>
            <TranslationSelector onUpdate={() => {}} />
          </div>

          <Separator />

          {/* Labels & Effects - Enhanced */}
          <div className="space-y-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-lg flex items-center text-purple-900 dark:text-purple-100">
              <Tags className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
              Semantic Labels
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {labels.map((label) => (
                <div key={label.id} className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 flex items-center space-x-2">
                  <Checkbox 
                    id={label.id}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  <Label htmlFor={label.id} className="cursor-pointer text-xs font-medium">
                    {label.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Study Tools - Enhanced */}
          <div className="space-y-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-lg flex items-center text-green-900 dark:text-green-100">
              <Settings className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Study Tools
            </h3>
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Cross References</Label>
                  <Checkbox 
                    checked={showCrossRefs}
                    onCheckedChange={toggleCrossRefs}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                </div>
                <div className="ml-4">
                  <CrossReferenceSwitcher
                    currentSet="cf1"
                    onSetChange={() => {}}
                  />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Prophecy Tracking</Label>
                  <Checkbox 
                    checked={showProphecies}
                    onCheckedChange={toggleProphecies}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Shows P|F|V columns for prophecy analysis</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Bookmarks - Enhanced */}
          <div className="space-y-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-semibold text-lg flex items-center text-yellow-900 dark:text-yellow-100">
              <Bookmark className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
              Bookmarks
            </h3>
            {user ? (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBookmarkForm(!showBookmarkForm)}
                  className="w-full text-sm bg-white dark:bg-gray-800 hover:bg-yellow-50 dark:hover:bg-yellow-950/30"
                >
                  + Create Bookmark
                </Button>
                {showBookmarkForm && (
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700 space-y-3">
                    <Input
                      placeholder="Bookmark name..."
                      value={bookmarkName}
                      onChange={(e) => setBookmarkName(e.target.value)}
                      className="text-sm"
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
                        className="flex-1 text-sm bg-yellow-600 hover:bg-yellow-700"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 text-center">
                <LogIn className="w-4 h-4 mx-auto mb-1 opacity-50" />
                Sign in to create bookmarks
              </div>
            )}
          </div>

          <Separator />

          {/* Display Settings - Enhanced */}
          <div className="space-y-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <h3 className="font-semibold text-lg flex items-center text-orange-900 dark:text-orange-100">
              <Settings className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
              Display Settings
            </h3>
            
            {/* Text Size */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
              <Label className="text-sm font-medium mb-2 block">Text Size</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'small', label: 'S', desc: 'Small' },
                  { value: 'medium', label: 'M', desc: 'Medium' },
                  { value: 'large', label: 'L', desc: 'Large' }
                ].map((size) => (
                  <Button
                    key={size.value}
                    variant={fontSize === size.value ? "default" : "outline"}
                    size="sm"
                    className={`text-xs h-10 flex flex-col ${fontSize === size.value ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                    onClick={() => handleFontSizeChange(size.value)}
                  >
                    <span className="font-bold">{size.label}</span>
                    <span className="text-[10px]">{size.desc}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

            {/* Themes */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
              <Label className="text-sm font-medium mb-2 block flex items-center">
                <Palette className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                Color Theme
              </Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {themes.map((themeOption) => (
                  <Button
                    key={themeOption.id}
                    variant={theme === themeOption.id ? "default" : "outline"}
                    size="sm"
                    className={`text-xs h-8 ${theme === themeOption.id ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                    onClick={() => setTheme(themeOption.id)}
                  >
                    {themeOption.name}
                  </Button>
                ))}
              </div>
            </div>

          <Separator />

          {/* Authentication - Enhanced */}
          <div className="space-y-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-lg flex items-center text-gray-900 dark:text-gray-100">
              <LogIn className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
              Account
            </h3>
            {user ? (
              <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                <p className="font-medium text-sm mb-2">{user.email}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Sign out logic here
                  }}
                  className="w-full text-xs"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                onClick={() => setIsSignInOpen(true)}
                className="w-full text-sm bg-blue-600 hover:bg-blue-700"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In/Up
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}