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
    console.log(`🔄 MainTranslationSelector: Switching main translation from ${main} to ${value}`);
    try {
      // 1. Load the new translation data from Supabase
      await ensureTranslationLoaded(value);
      
      // 2. Update the translation store
      setMain(value);
      
      // 3. Trigger re-render and label cache updates
      onUpdate?.();
      
      console.log(`✅ MainTranslationSelector: Successfully switched to ${value}`);
    } catch (error) {
      console.error(`❌ MainTranslationSelector: Failed to switch to ${value}:`, error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs" style={{color: 'var(--text-secondary)'}}>
        Current main translation: <span className="font-medium" style={{color: 'var(--accent-color)'}}>{main}</span>
      </div>
      
      <RadioGroup value={main} onValueChange={handleMainChange}>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {AVAILABLE_TRANSLATIONS.map(code => (
            <div key={code} className="flex items-center space-x-2">
              <RadioGroupItem value={code} id={`main-${code}`} className="w-3 h-3" />
              <Label htmlFor={`main-${code}`} className="text-xs cursor-pointer" style={{color: 'var(--text-primary)'}}>
                {code}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
      
      <div className="text-xs mt-2" style={{color: 'var(--text-secondary)'}}>
        The main translation appears in slot 2 and cannot be removed
      </div>
    </div>
  );
}