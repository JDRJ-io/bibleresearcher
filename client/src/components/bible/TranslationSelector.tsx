import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Languages } from 'lucide-react';

interface TranslationSelectorProps {
  allTranslations: Array<{
    id: string;
    name: string;
    abbreviation: string;
    selected: boolean;
  }>;
  selectedTranslations: string[];
  mainTranslation: string;
  multiTranslationMode: boolean;
  onToggleTranslation: (translationId: string) => void;
  onToggleMultiMode: () => void;
  onSetMainTranslation: (translationId: string) => void;
  maxTranslations?: number;
}

export function TranslationSelector({
  allTranslations,
  selectedTranslations,
  mainTranslation,
  multiTranslationMode,
  onToggleTranslation,
  onToggleMultiMode,
  onSetMainTranslation,
  maxTranslations = 12
}: TranslationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTranslationToggle = (translationId: string) => {
    if (!multiTranslationMode) {
      // In single mode, set as main translation
      onSetMainTranslation(translationId);
    } else {
      // In multi mode, check if we're at max
      if (!selectedTranslations.includes(translationId) && 
          selectedTranslations.length >= maxTranslations) {
        return; // Don't add more than max
      }
      onToggleTranslation(translationId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Languages className="w-4 h-4 mr-2" />
          {multiTranslationMode 
            ? `${selectedTranslations.length} Translations`
            : mainTranslation
          }
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Bible Translations</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-secondary rounded-md">
            <Label htmlFor="multi-mode">Multi-Translation Mode</Label>
            <Button
              id="multi-mode"
              variant={multiTranslationMode ? "default" : "outline"}
              size="sm"
              onClick={onToggleMultiMode}
            >
              {multiTranslationMode ? "ON" : "OFF"}
            </Button>
          </div>

          {multiTranslationMode && (
            <p className="text-sm text-muted-foreground">
              Select up to {maxTranslations} translations to display side by side.
              Main translation ({mainTranslation}) controls cross-references.
            </p>
          )}

          {/* Translation List */}
          <ScrollArea className="h-[300px] border rounded-md p-4">
            <div className="space-y-3">
              {allTranslations.map((translation) => {
                const isSelected = selectedTranslations.includes(translation.id);
                const isMain = translation.id === mainTranslation;
                const isDisabled = !isSelected && 
                  multiTranslationMode && 
                  selectedTranslations.length >= maxTranslations;

                return (
                  <div
                    key={translation.id}
                    className={`flex items-center space-x-3 p-2 rounded ${
                      isMain ? 'bg-primary/10' : ''
                    }`}
                  >
                    {multiTranslationMode ? (
                      <Checkbox
                        id={translation.id}
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={() => handleTranslationToggle(translation.id)}
                      />
                    ) : (
                      <input
                        type="radio"
                        id={translation.id}
                        name="translation"
                        checked={isMain}
                        onChange={() => handleTranslationToggle(translation.id)}
                        className="w-4 h-4"
                      />
                    )}
                    <Label
                      htmlFor={translation.id}
                      className={`flex-1 cursor-pointer ${
                        isDisabled ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="font-medium">{translation.abbreviation}</div>
                      <div className="text-sm text-muted-foreground">
                        {translation.name}
                        {isMain && " (Main)"}
                      </div>
                    </Label>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Main Translation Selector (Multi-mode only) */}
          {multiTranslationMode && selectedTranslations.length > 1 && (
            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-2 block">
                Main Translation (for cross-references)
              </Label>
              <Select value={mainTranslation} onValueChange={onSetMainTranslation}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedTranslations.map(id => {
                    const trans = allTranslations.find(t => t.id === id);
                    return trans ? (
                      <SelectItem key={id} value={id}>
                        {trans.abbreviation}
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}