import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Book, Settings, Palette, Bookmark, Tags, Search, Eye } from "lucide-react";
import { TranslationSelector } from "./TranslationSelector";

interface HorizontalMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const themes = [
  { id: "light", name: "Light", color: "#ffffff" },
  { id: "dark", name: "Dark", color: "#1a1a1a" },
  { id: "sepia", name: "Sepia", color: "#f4f1e8" },
  { id: "aurora", name: "Aurora", color: "#4c1d95" },
  { id: "fireworks", name: "Fireworks", color: "#7c2d12" },
];

const labels = [
  { id: "who", name: "Who", style: "font-bold" },
  { id: "what", name: "What", style: "outline" },
  { id: "when", name: "When", style: "underline" },
  { id: "where", name: "Where", style: "italic" },
  { id: "command", name: "Command", style: "shadow" },
  { id: "action", name: "Action", style: "italic" },
  { id: "why", name: "Why", style: "cursive" },
  { id: "seed", name: "Seed", style: "superscript-*" },
  { id: "harvest", name: "Harvest", style: "superscript-=" },
  { id: "prediction", name: "Prediction", style: "superscript-~" },
];

export function HorizontalMenu({ isOpen, onClose }: HorizontalMenuProps) {
  const [activeTab, setActiveTab] = useState("main-translation");
  const [textSize, setTextSize] = useState("medium");
  const [selectedTheme, setSelectedTheme] = useState("light");

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
          <div className="bg-blue-500/10 backdrop-blur-sm p-4 rounded-xl border border-blue-300/30 dark:border-blue-700/30">
            <div className="grid grid-cols-2 gap-2">
              {["KJV", "ESV", "NIV", "NKJV", "NLT", "AMP", "CSB", "NASB"].map((version) => (
                <Button
                  key={version}
                  variant={version === "KJV" ? "default" : "outline"}
                  size="sm"
                  className="text-sm"
                >
                  {version}
                </Button>
              ))}
            </div>
          </div>
        );

      case "alt-translations":
        return (
          <div className="bg-green-500/10 backdrop-blur-sm p-4 rounded-xl border border-green-300/30 dark:border-green-700/30">
            <div className="grid grid-cols-2 gap-2">
              {["AMP", "BSB", "CSB", "ESV", "NASB", "NIV", "NKJV", "NLT", "WEB", "YLT"].map((version) => (
                <div key={version} className="flex items-center space-x-2">
                  <Checkbox id={version} />
                  <Label htmlFor={version} className="text-sm">{version}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case "toggle-labels":
        return (
          <div className="bg-purple-500/10 backdrop-blur-sm p-4 rounded-xl border border-purple-300/30 dark:border-purple-700/30">
            <div className="grid grid-cols-2 gap-2">
              {labels.map((label) => (
                <div key={label.id} className="flex items-center space-x-2">
                  <Checkbox id={label.id} />
                  <Label htmlFor={label.id} className="text-sm">{label.name}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case "study-tools":
        return (
          <div className="bg-orange-500/10 backdrop-blur-sm p-4 rounded-xl border border-orange-300/30 dark:border-orange-700/30">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="cross-references" />
                <Label htmlFor="cross-references">Cross References</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="prophecy-tracking" />
                <Label htmlFor="prophecy-tracking">Prophecy Tracking</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="context-boundaries" />
                <Label htmlFor="context-boundaries">Context Boundaries</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="chronological" />
                <Label htmlFor="chronological">Chronological Order</Label>
              </div>
            </div>
          </div>
        );

      case "display-settings":
        return (
          <div className="bg-yellow-500/10 backdrop-blur-sm p-4 rounded-xl border border-yellow-300/30 dark:border-yellow-700/30">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Text Size</Label>
                <RadioGroup value={textSize} onValueChange={setTextSize} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="small" id="small" />
                    <Label htmlFor="small" className="text-sm">Small</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="text-sm">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="large" id="large" />
                    <Label htmlFor="large" className="text-sm">Large</Label>
                  </div>
                </RadioGroup>
              </div>
              <Separator />
              <div className="flex items-center space-x-2">
                <Checkbox id="verse-numbers" defaultChecked />
                <Label htmlFor="verse-numbers">Show Verse Numbers</Label>
              </div>
            </div>
          </div>
        );

      case "color-theme":
        return (
          <div className="bg-pink-500/10 backdrop-blur-sm p-4 rounded-xl border border-pink-300/30 dark:border-pink-700/30">
            <div className="grid grid-cols-5 gap-2">
              {themes.map((theme) => (
                <Button
                  key={theme.id}
                  variant={selectedTheme === theme.id ? "default" : "outline"}
                  size="sm"
                  className="flex flex-col items-center p-2 h-auto"
                  onClick={() => setSelectedTheme(theme.id)}
                >
                  <div
                    className="w-6 h-6 rounded-full mb-1 border"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="text-xs">{theme.name}</span>
                </Button>
              ))}
            </div>
          </div>
        );

      case "bookmarks":
        return (
          <div className="bg-red-500/10 backdrop-blur-sm p-4 rounded-xl border border-red-300/30 dark:border-red-700/30">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>Sign in to access bookmarks</p>
              <Button size="sm" className="mt-2">Sign In</Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-x-0 top-20 z-40 mx-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                  : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-[10px] leading-tight text-center">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {renderTabContent()}
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}