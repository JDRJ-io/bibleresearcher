import React from 'react';
import { Button } from '@/components/ui/button';
import { setMainTranslation, toggleAltTranslation, getBibleDataStore } from '@/lib/bibleDataStore';

interface TranslationSelectorProps {
  onUpdate: () => void;
}

const AVAILABLE_TRANSLATIONS = ["KJV", "AMP", "ESV", "CSB", "BSB", "NLT", "NASB", "NKJV", "NIV", "NRSV", "WEB", "YLT"];

// Helper function to get translation name from code
const getTranslationName = (code: string): string => {
  const TRANSLATIONS_META: Record<string, string> = {
    KJV: "King James Version",
    AMP: "Amplified Bible",
    ESV: "English Standard Version",
    CSB: "Christian Standard Bible",
    BSB: "Berean Standard Bible",
    NLT: "New Living Translation",
    NASB: "New American Standard Bible",
    NKJV: "New King James Version",
    NIV: "New International Version",
    NRSV: "New Revised Standard Version",
    WEB: "World English Bible",
    YLT: "Young's Literal Translation"
  };
  return TRANSLATIONS_META[code] ?? code;
};

export function TranslationSelector({ onUpdate }: TranslationSelectorProps) {
  const store = getBibleDataStore();
  
  // Radio button group - calls setMainTranslation(code)
  const handleMainTranslationChange = (code: string) => {
    setMainTranslation(code);
    onUpdate();
  };

  // Checkbox list - calls toggleAltTranslation(code)
  const handleAltTranslationToggle = (code: string) => {
    toggleAltTranslation(code);
    onUpdate();
  };

  // Disable the radio button for whichever code is currently mainTranslation
  const isMainTranslation = (code: string) => code === store.mainTranslation;

  return (
    <div className="translation-selector p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Translation Settings</h3>
      
      <div className="mb-6">
        <h4 className="text-md font-medium mb-2">Main Translation</h4>
        <div className="grid grid-cols-3 gap-2">
          {AVAILABLE_TRANSLATIONS.map(code => (
            <label key={code} className="flex items-center space-x-2">
              <input
                type="radio"
                name="mainTranslation"
                value={code}
                checked={isMainTranslation(code)}
                onChange={() => handleMainTranslationChange(code)}
                className="radio radio-primary"
              />
              <span className="text-sm">{code}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium mb-2">Alternative Translations</h4>
        <div className="grid grid-cols-3 gap-2">
          {AVAILABLE_TRANSLATIONS.map(code => (
            <label key={code} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={store.altTranslations.includes(code)}
                disabled={isMainTranslation(code)}
                onChange={() => handleAltTranslationToggle(code)}
                className="checkbox checkbox-primary"
              />
              <span className={`text-sm ${isMainTranslation(code) ? 'opacity-50' : ''}`}>
                {code}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}