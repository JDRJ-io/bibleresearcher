import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useTranslationMaps } from '@/store/translationSlice';
import { useEnsureTranslationLoaded } from '@/hooks/useEnsureTranslationLoaded';

interface MainTranslationSelectorProps {
  onUpdate?: () => void;
}

const AVAILABLE_TRANSLATIONS = ["KJV", "AMP", "ESV", "CSB", "BSB", "NLT", "NASB", "NKJV", "NIV", "NRSV", "WEB", "YLT"];

export function MainTranslationSelector({ onUpdate }: MainTranslationSelectorProps) {
  const { main, setMain } = useTranslationMaps();
  const ensureTranslationLoaded = useEnsureTranslationLoaded();

  const handleMainChange = async (value: string) => {
    await ensureTranslationLoaded(value);
    setMain(value);
    onUpdate?.();
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-600 dark:text-gray-400">
        Current main translation: <span className="font-medium text-blue-600 dark:text-blue-400">{main}</span>
      </div>
      
      <RadioGroup value={main} onValueChange={handleMainChange}>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {AVAILABLE_TRANSLATIONS.map(code => (
            <div key={code} className="flex items-center space-x-2">
              <RadioGroupItem value={code} id={`main-${code}`} className="w-3 h-3" />
              <Label htmlFor={`main-${code}`} className="text-xs cursor-pointer">
                {code}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        The main translation appears in slot 2 and cannot be removed
      </div>
    </div>
  );
}