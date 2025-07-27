import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useTranslationMaps } from '@/store/translationSlice';
import { useEnsureTranslationLoaded } from '@/hooks/useEnsureTranslationLoaded';

interface AlternateTranslationSelectorProps {
  onUpdate?: () => void;
}

const AVAILABLE_TRANSLATIONS = ["KJV", "AMP", "ESV", "CSB", "BSB", "NLT", "NASB", "NKJV", "NIV", "NRSV", "WEB", "YLT"];

export function AlternateTranslationSelector({ onUpdate }: AlternateTranslationSelectorProps) {
  const { main, alternates, toggleAlternate } = useTranslationMaps();
  const ensureTranslationLoaded = useEnsureTranslationLoaded();

  const handleAlternateToggle = async (translationId: string, checked: boolean) => {
    console.log(`🔄 Toggling alternate translation ${translationId}: ${checked}`);
    try {
      if (checked) {
        await ensureTranslationLoaded(translationId);
      }
      toggleAlternate(translationId);
      onUpdate?.();
      console.log(`✅ Successfully toggled alternate ${translationId}: ${checked}`);
    } catch (error) {
      console.error(`❌ Failed to toggle alternate ${translationId}:`, error);
    }
  };

  // Filter out the main translation from available options
  const availableAlternates = AVAILABLE_TRANSLATIONS.filter(code => code !== main);

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-600 dark:text-gray-400">
        Current active: {alternates.length} translation{alternates.length !== 1 ? 's' : ''}
        {alternates.length > 0 && (
          <span className="ml-2 text-blue-600 dark:text-blue-400">
            ({alternates.join(', ')})
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {availableAlternates.map(code => (
          <div key={code} className="flex items-center space-x-2">
            <Checkbox
              id={`alt-${code}`}
              checked={alternates.includes(code)}
              onCheckedChange={(checked) => handleAlternateToggle(code, checked as boolean)}
              className="w-3 h-3"
            />
            <Label htmlFor={`alt-${code}`} className="text-xs cursor-pointer">
              {code}
            </Label>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Each translation will appear as a separate column in slots 5-16
      </div>
    </div>
  );
}