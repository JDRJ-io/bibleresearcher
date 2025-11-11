import React, { useEffect } from 'react';
import { useBibleStore } from '@/App';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface AdvancedSizeControllerProps {
  className?: string;
}

export function AdvancedSizeController({ className = '' }: AdvancedSizeControllerProps) {
  const { sizeState } = useBibleStore();
  const { 
    sizeMult, 
    textSizeMult, 
    externalSizeMult, 
    unifiedSizing,
    setSizeMult, 
    setTextSizeMult, 
    setExternalSizeMult, 
    toggleUnifiedSizing 
  } = sizeState;

  // Load saved preferences on mount
  useEffect(() => {
    const savedUnified = localStorage.getItem('bibleUnifiedSizing');
    const savedSizeMult = localStorage.getItem('bibleSizeMult');
    const savedTextMult = localStorage.getItem('bibleTextSizeMult');
    const savedExternalMult = localStorage.getItem('bibleExternalSizeMult');

    if (savedUnified !== null) {
      if (savedUnified === 'false' && unifiedSizing) {
        toggleUnifiedSizing();
      }
    }

    if (savedSizeMult && unifiedSizing) {
      const mult = parseFloat(savedSizeMult);
      if (!isNaN(mult) && mult !== sizeMult) {
        setSizeMult(mult);
      }
    }

    if (!unifiedSizing) {
      if (savedTextMult) {
        const mult = parseFloat(savedTextMult);
        if (!isNaN(mult) && mult !== textSizeMult) {
          setTextSizeMult(mult);
        }
      }
      
      if (savedExternalMult) {
        const mult = parseFloat(savedExternalMult);
        if (!isNaN(mult) && mult !== externalSizeMult) {
          setExternalSizeMult(mult);
        }
      }
    }
  }, []);

  const formatValue = (value: number) => `${Math.round(value * 100)}%`;

  return (
    <div className={`space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor="unified-sizing" className="text-sm font-medium">
          Unified Sizing
        </Label>
        <Switch
          id="unified-sizing"
          checked={unifiedSizing}
          onCheckedChange={toggleUnifiedSizing}
        />
      </div>

      {unifiedSizing ? (
        // Unified Control
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Size: {formatValue(sizeMult)}
          </Label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={sizeMult}
            onChange={(e) => setSizeMult(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider-thumb"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>50%</span>
            <span>100%</span>
            <span>150%</span>
            <span>200%</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Controls content text, columns, and row spacing (excludes navigation)
          </p>
        </div>
      ) : (
        // Split Controls
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Text Size: {formatValue(textSizeMult)}
            </Label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={textSizeMult}
              onChange={(e) => setTextSizeMult(parseFloat(e.target.value))}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer dark:bg-blue-700 slider-thumb-blue"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Font size in verses, cross-references, and prophecies
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-green-700 dark:text-green-300">
              Layout Size: {formatValue(externalSizeMult)}
            </Label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={externalSizeMult}
              onChange={(e) => setExternalSizeMult(parseFloat(e.target.value))}
              className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer dark:bg-green-700 slider-thumb-green"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Column widths, headers, and row spacing
            </p>
          </div>
        </div>
      )}
    </div>
  );
}