import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useBibleStore } from '@/providers/BibleDataProvider';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';

interface TranslationSelectorProps {
  onUpdate?: () => void;
}

const AVAILABLE_TRANSLATIONS = ["KJV", "AMP", "ESV", "CSB", "BSB", "NLT", "NASB", "NKJV", "NIV", "NRSV", "WEB", "YLT"];

// Feature Block C - Translation Modal in Hamburger Menu
export function TranslationSelector({ onUpdate }: TranslationSelectorProps) {
  const { translationState } = useBibleStore();
  const { main, alternates, setMain, toggleAlternate } = translationState;
  const { toggleTranslation, isLoading } = useTranslationMaps();

  const handleMainChange = async (value: string) => {
    // 2-C: Radio group → setMain. Each checkbox → toggleAlternate
    // Close the modal after any change so the table repaint is noticeable
    setMain(value);
    
    // 2-B: When main changes, useEffect([main]) invalidates and refetches the remote cache
    // This guarantees the Cross/Prophecy verse texts swap instantly with the new main
    await toggleTranslation(value, true); // Load translation if not cached
    onUpdate?.();
  };

  const handleAlternateToggle = async (translationId: string, checked: boolean) => {
    // 2-C: Each checkbox → toggleAlternate
    toggleAlternate(translationId);
    
    // Load translation if being added and not cached
    if (checked) {
      await toggleTranslation(translationId, false);
    }
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
                disabled={isLoading}
              />
              <Label htmlFor={`alt-${code}`} className="text-sm cursor-pointer">
                {code}
                {isLoading && alternates.includes(code) && (
                  <span className="text-xs text-gray-500 ml-1">Loading...</span>
                )}
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