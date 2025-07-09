import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslationMaps } from '@/store/translationSlice';

interface TranslationSelectorProps {
  onUpdate?: () => void;
}

const AVAILABLE_TRANSLATIONS = ["KJV", "AMP", "ESV", "CSB", "BSB", "NLT", "NASB", "NKJV", "NIV", "NRSV", "WEB", "YLT"];

// Feature Block C - Translation Modal in Hamburger Menu
export function TranslationSelector({ onUpdate }: TranslationSelectorProps) {
  const { main, alternates, setMain, toggleAlternate } = useTranslationMaps();

  const handleMainChange = (value: string) => {
    setMain(value);
    onUpdate?.();
  };

  const handleAlternateToggle = (translationId: string, checked: boolean) => {
    toggleAlternate(translationId);
    onUpdate?.();
  };

  return (
    <div className="translation-selector p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md space-y-6">
      <h3 className="text-lg font-semibold mb-4">Translation Settings</h3>
      
      {/* C1 - Main translation radio-buttons (exactly one) */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Main Translation</h4>
        <RadioGroup value={main} onValueChange={handleMainChange}>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_TRANSLATIONS.map(code => (
              <div key={code} className="flex items-center space-x-2">
                <RadioGroupItem value={code} id={`main-${code}`} />
                <Label htmlFor={`main-${code}`} className="text-sm cursor-pointer">
                  {code}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* C1 - Alternate translation check-boxes (≥ 0) */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
          Alternate Translations ({alternates.length})
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {AVAILABLE_TRANSLATIONS.filter(code => code !== main).map(code => (
            <div key={code} className="flex items-center space-x-2">
              <Checkbox
                id={`alt-${code}`}
                checked={alternates.includes(code)}
                onCheckedChange={(checked) => handleAlternateToggle(code, checked as boolean)}
              />
              <Label htmlFor={`alt-${code}`} className="text-sm cursor-pointer">
                {code}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* A1 - Show current active translations */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Active: {main} {alternates.length > 0 && `+ ${alternates.length} alternates`}
        </div>
      </div>
    </div>
  );
}