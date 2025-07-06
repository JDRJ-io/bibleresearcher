import React, { useState } from "react";
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

export function HamburgerMenu({
  isOpen,
  onClose,
}: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [bookmarkName, setBookmarkName] = useState("");
  const [bookmarkColor, setBookmarkColor] = useState("#3b82f6");
  const [showBookmarkForm, setShowBookmarkForm] = useState(false);

  const createBookmarkMutation = useMutation({
    mutationFn: async (bookmark: {
      userId: string;
      verseRef: string;
      name: string;
      color: string;
    }) => {
      return await apiRequest("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookmark),
      });
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

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          {/* Step 4 - Multi-Translation System */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center">
              <Book
                className="w-5 h-5 mr-2"
                style={{ color: "var(--accent-color)" }}
              />
              Multi-Translation Settings
            </h3>
            <TranslationSelector onUpdate={() => {}} />
          </div>

          <Separator />

          {/* Labels & Effects */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center">
              <Tags
                className="w-5 h-5 mr-2"
                style={{ color: "var(--accent-color)" }}
              />
              Labels & Effects
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {labels.map((label) => (
                <div key={label.id} className="flex items-center space-x-2">
                  <Checkbox id={label.id} />
                  <Label htmlFor={label.id} className="cursor-pointer text-xs">
                    {label.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Extra Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center">
              <Settings
                className="w-5 h-5 mr-2"
                style={{ color: "var(--accent-color)" }}
              />
              Extra Details
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Cross References</Label>
                <Checkbox defaultChecked />
              </div>
              <div className="ml-4">
                <CrossReferenceSwitcher
                  currentSet="cf1"
                  onSetChange={() => {}}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Prophecy Columns</Label>
                <Checkbox />
              </div>
            </div>
          </div>

          <Separator />

          {/* Bookmarks */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center">
              <Bookmark
                className="w-5 h-5 mr-2"
                style={{ color: "var(--accent-color)" }}
              />
              Bookmarks
            </h3>
            {user ? (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBookmarkForm(!showBookmarkForm)}
                  className="w-full text-sm"
                >
                  Create Bookmark
                </Button>
                {showBookmarkForm && (
                  <div className="space-y-2">
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
                        className="flex-1 text-sm"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Sign in to create bookmarks
              </div>
            )}
          </div>

          <Separator />

          {/* Themes */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center">
              <Palette
                className="w-5 h-5 mr-2"
                style={{ color: "var(--accent-color)" }}
              />
              Themes
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {["Light", "Dark", "Sepia", "Aurora", "Electric", "Fireworks"].map(
                (theme) => (
                  <Button
                    key={theme}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    {theme}
                  </Button>
                ),
              )}
            </div>
          </div>

          <Separator />

          {/* Authentication */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center">
              <LogIn
                className="w-5 h-5 mr-2"
                style={{ color: "var(--accent-color)" }}
              />
              Account
            </h3>
            {user ? (
              <div className="text-sm">
                <p className="font-medium">{user.email}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Sign out logic here
                  }}
                  className="mt-2 text-xs"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => setIsSignInOpen(true)}
                  className="w-full text-sm"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsSignUpOpen(true)}
                  className="w-full text-sm"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}