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

export function HorizontalMenu({ isOpen, onClose }: HorizontalMenuProps) {
  const [activeTab, setActiveTab] = useState("main-translation");
  const [textSize, setTextSize] = useState("medium");
  const [selectedTheme, setSelectedTheme] = useState("light");
  const [textAlignment, setTextAlignment] = useState("left");
  const [crossReferencesEnabled, setCrossReferencesEnabled] = useState(false);
  const [prophecyEnabled, setProphecyEnabled] = useState(false);
  const [prophecyPrediction, setProphecyPrediction] = useState(false);
  const [prophecyFulfillment, setProphecyFulfillment] = useState(false);
  const [prophecyVerification, setProphecyVerification] = useState(false);

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
            <div className="space-y-1">
              {["KJV", "ESV", "NIV", "NKJV", "NLT", "AMP", "CSB", "NASB", "BSB", "WEB", "YLT", "NRSV"].map((version) => (
                <Button
                  key={version}
                  variant={version === "KJV" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7 w-full justify-start"
                >
                  {version}
                </Button>
              ))}
            </div>
          </div>
        );

      case "alt-translations":
        return (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Additional Translations</h4>
            <div className="space-y-1">
              {["AMP", "BSB", "CSB", "ESV", "NASB", "NIV", "NKJV", "NLT", "WEB", "YLT"].map((version) => (
                <div key={version} className="flex items-center space-x-2">
                  <Checkbox id={version} className="w-3 h-3" />
                  <Label htmlFor={version} className="text-xs">{version}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case "toggle-labels":
        return (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Semantic Highlighting</h4>
            <div className="space-y-1">
              {labels.map((label) => (
                <div key={label.id} className="flex items-center space-x-2">
                  <Checkbox id={label.id} className="w-3 h-3" />
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
                  checked={crossReferencesEnabled}
                  onCheckedChange={setCrossReferencesEnabled}
                />
                <Label htmlFor="cross-references" className="text-xs font-medium">Cross References</Label>
              </div>
            </div>

            {/* Prophecy Tracking */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="prophecy-tracking" 
                  className="w-3 h-3"
                  checked={prophecyEnabled}
                  onCheckedChange={setProphecyEnabled}
                />
                <Label htmlFor="prophecy-tracking" className="text-xs font-medium">Prophecy Tracking</Label>
              </div>
              {prophecyEnabled && (
                <div className="ml-5 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="prophecy-prediction" 
                      className="w-3 h-3"
                      checked={prophecyPrediction}
                      onCheckedChange={setProphecyPrediction}
                    />
                    <Label htmlFor="prophecy-prediction" className="text-xs">Prediction</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="prophecy-fulfillment" 
                      className="w-3 h-3"
                      checked={prophecyFulfillment}
                      onCheckedChange={setProphecyFulfillment}
                    />
                    <Label htmlFor="prophecy-fulfillment" className="text-xs">Fulfillment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="prophecy-verification" 
                      className="w-3 h-3"
                      checked={prophecyVerification}
                      onCheckedChange={setProphecyVerification}
                    />
                    <Label htmlFor="prophecy-verification" className="text-xs">Verification</Label>
                  </div>
                </div>
              )}
            </div>

            {/* Other Features */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox id="dates-column" className="w-3 h-3" />
                <Label htmlFor="dates-column" className="text-xs">Dates Column</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="context-boundaries" className="w-3 h-3" />
                <Label htmlFor="context-boundaries" className="text-xs">Context Boundaries</Label>
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
              <div>
                <Label className="text-xs mb-1 block">Text Size:</Label>
                <RadioGroup value={textSize} onValueChange={setTextSize} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="small" id="small" className="w-3 h-3" />
                    <Label htmlFor="small" className="text-xs">Small</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" className="w-3 h-3" />
                    <Label htmlFor="medium" className="text-xs">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="large" id="large" className="w-3 h-3" />
                    <Label htmlFor="large" className="text-xs">Large</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="extra-large" id="extra-large" className="w-3 h-3" />
                    <Label htmlFor="extra-large" className="text-xs">Extra Large</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Text Alignment:</Label>
                <RadioGroup value={textAlignment} onValueChange={setTextAlignment} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="left" id="align-left" className="w-3 h-3" />
                    <Label htmlFor="align-left" className="text-xs">Left</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="center" id="align-center" className="w-3 h-3" />
                    <Label htmlFor="align-center" className="text-xs">Center</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="right" id="align-right" className="w-3 h-3" />
                    <Label htmlFor="align-right" className="text-xs">Right</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        );

      case "color-theme":
        return (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Choose Theme</h4>
            <div className="space-y-1">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`flex items-center space-x-2 w-full p-2 rounded-lg transition-all text-left ${
                    selectedTheme === theme.id 
                      ? "bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-500" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="text-xs">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "bookmarks":
        return (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Saved Bookmarks</h4>
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              <p className="mb-2">Sign in to access your bookmarks</p>
              <Button size="sm" className="text-xs h-6 px-3">Sign In</Button>
            </div>
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