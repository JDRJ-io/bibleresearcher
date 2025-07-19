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
          <div className="bg-blue-500/5 rounded-lg p-3">
            <div className="grid grid-cols-4 gap-1">
              {["KJV", "ESV", "NIV", "NKJV", "NLT", "AMP", "CSB", "NASB"].map((version) => (
                <Button
                  key={version}
                  variant={version === "KJV" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8"
                >
                  {version}
                </Button>
              ))}
            </div>
          </div>
        );

      case "alt-translations":
        return (
          <div className="bg-green-500/5 rounded-lg p-3">
            <div className="grid grid-cols-5 gap-1">
              {["AMP", "BSB", "CSB", "ESV", "NASB", "NIV", "NKJV", "NLT", "WEB", "YLT"].map((version) => (
                <div key={version} className="flex items-center space-x-1">
                  <Checkbox id={version} className="w-3 h-3" />
                  <Label htmlFor={version} className="text-xs">{version}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case "toggle-labels":
        return (
          <div className="bg-purple-500/5 rounded-lg p-3">
            <div className="grid grid-cols-5 gap-1">
              {labels.map((label) => (
                <div key={label.id} className="flex items-center space-x-1">
                  <Checkbox id={label.id} className="w-3 h-3" />
                  <Label htmlFor={label.id} className="text-xs">{label.name}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case "study-tools":
        return (
          <div className="bg-orange-500/5 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1">
                <Checkbox id="cross-references" className="w-3 h-3" />
                <Label htmlFor="cross-references" className="text-xs">Cross References</Label>
              </div>
              <div className="flex items-center space-x-1">
                <Checkbox id="prophecy-tracking" className="w-3 h-3" />
                <Label htmlFor="prophecy-tracking" className="text-xs">Prophecy Tracking</Label>
              </div>
              <div className="flex items-center space-x-1">
                <Checkbox id="context-boundaries" className="w-3 h-3" />
                <Label htmlFor="context-boundaries" className="text-xs">Context Boundaries</Label>
              </div>
              <div className="flex items-center space-x-1">
                <Checkbox id="chronological" className="w-3 h-3" />
                <Label htmlFor="chronological" className="text-xs">Chronological Order</Label>
              </div>
            </div>
          </div>
        );

      case "display-settings":
        return (
          <div className="bg-yellow-500/5 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label className="text-xs font-medium">Text Size:</Label>
                <RadioGroup value={textSize} onValueChange={setTextSize} className="flex space-x-2">
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="small" id="small" className="w-3 h-3" />
                    <Label htmlFor="small" className="text-xs">S</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="medium" id="medium" className="w-3 h-3" />
                    <Label htmlFor="medium" className="text-xs">M</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="large" id="large" className="w-3 h-3" />
                    <Label htmlFor="large" className="text-xs">L</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex items-center space-x-1">
                <Checkbox id="verse-numbers" defaultChecked className="w-3 h-3" />
                <Label htmlFor="verse-numbers" className="text-xs">Verse #</Label>
              </div>
            </div>
          </div>
        );

      case "color-theme":
        return (
          <div className="bg-pink-500/5 rounded-lg p-3">
            <div className="flex justify-center space-x-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                    selectedTheme === theme.id 
                      ? "bg-white dark:bg-gray-800 shadow-md" 
                      : "hover:bg-white/50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="text-[10px] mt-1">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "bookmarks":
        return (
          <div className="bg-red-500/5 rounded-lg p-3">
            <div className="text-center text-xs text-gray-600 dark:text-gray-400">
              <p className="mb-2">Sign in to access bookmarks</p>
              <Button size="sm" className="text-xs h-6 px-3">Sign In</Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-x-0 top-20 z-40 mx-2">
      {/* Sleek Tab Bar */}
      <div className="flex justify-center mb-2">
        <div className="flex bg-white/20 dark:bg-gray-900/30 backdrop-blur-xl rounded-full border border-white/30 dark:border-gray-700/30 p-1 shadow-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/30 dark:hover:bg-gray-800/30"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
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

      {/* Minimal Content Slot */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-out ${
          activeTab ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-gray-700/30 mx-4">
          <div className="p-3">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}