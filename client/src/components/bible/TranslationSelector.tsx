import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useBibleStore } from '@/providers/BibleDataProvider';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface TranslationSelectorProps {
  onUpdate?: () => void;
}

const AVAILABLE_TRANSLATIONS = ["KJV", "AMP", "ESV", "CSB", "BSB", "NLT", "NASB", "NKJV", "NIV", "NRSV", "WEB", "YLT"];

export function TranslationSelector({ onUpdate }: TranslationSelectorProps) {
  const { mainTranslation, alternates, setMain, toggleAlternate } = useTranslationMaps();
  const [isOpen, setIsOpen] = React.useState(false);

  async function handleMainChange(code: string) {
    await setMain(code);
    onUpdate?.();
  }

  async function handleAlternateToggle(code: string) {
    await toggleAlternate(code);
    onUpdate?.();
  }

  function handleClose() {
    setIsOpen(false);
    // Use React Query's queryClient.invalidateQueries to refresh table
    onUpdate?.();
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-sm">
          {mainTranslation} + {alternates.length} alts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Translation Settings</DialogTitle>
          <DialogDescription>
            Configure your main translation and additional columns
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Main Translation Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Main Translation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Controls cross-references and prophecy interpretations
            </p>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_TRANSLATIONS.map(code => (
                <Button
                  key={code}
                  variant={mainTranslation === code ? 'default' : 'outline'}
                  onClick={() => handleMainChange(code)}
                  className="text-sm font-semibold"
                >
                  {code}
                  {mainTranslation === code && (
                    <Badge variant="secondary" className="ml-1 text-xs">MAIN</Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Alternate Translations Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Alternate Translations</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select additional translations to display as columns
            </p>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_TRANSLATIONS.filter(code => code !== mainTranslation).map(code => (
                <div key={code} className="flex items-center space-x-2">
                  <Checkbox
                    id={code}
                    checked={alternates.includes(code)}
                    onCheckedChange={() => handleAlternateToggle(code)}
                  />
                  <label htmlFor={code} className="text-sm font-medium">
                    {code}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Prevent "0 alternates + 0 main" state */}
          {alternates.length === 0 && (
            <div className="text-sm text-muted-foreground italic">
              At least one translation must be selected
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}