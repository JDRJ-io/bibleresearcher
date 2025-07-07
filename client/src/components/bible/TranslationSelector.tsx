import React from 'react';
import { Button } from '@/components/ui/button';
import { useBibleStore } from '@/providers/BibleDataProvider';

interface TranslationSelectorProps {
  onUpdate?: () => void;
}

const AVAILABLE_TRANSLATIONS = ["KJV", "AMP", "ESV", "CSB", "BSB", "NLT", "NASB", "NKJV", "NIV", "NRSV", "WEB", "YLT"];

export function TranslationSelector({ onUpdate }: TranslationSelectorProps) {
  const { actives, setActives } = useBibleStore();

  function handleToggle(code: string) {
    const next = actives.includes(code)
      ? actives.filter(c => c !== code)
      : [...actives, code];
    setActives(next);
    onUpdate?.();
  }

  return (
    <div className="translation-selector p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Translation Settings</h3>
      
      <div className="grid grid-cols-3 gap-2">
        {AVAILABLE_TRANSLATIONS.map(code => (
          <Button
            key={code}
            variant={actives.includes(code) ? 'default' : 'outline'}
            onClick={() => handleToggle(code)}
            className="text-sm"
          >
            {code}
          </Button>
        ))}
      </div>
    </div>
  );
}