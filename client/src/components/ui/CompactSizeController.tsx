import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useBibleStore } from '@/App';

interface CompactSizeControllerProps {
  className?: string;
}

const TEXT_PRESETS = [
  { label: '1x', value: 1.0 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '1.75x', value: 1.75 },
  { label: '2x', value: 2.0 }
];

const ROW_HEIGHT_PRESETS = [
  { label: '1x', value: 1.0 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '1.75x', value: 1.75 },
  { label: '2x', value: 2.0 }
];

const COLUMN_WIDTH_PRESETS = [
  { label: '1x', value: 1.0 },
  { label: '2x', value: 2.0 }
];

export function CompactSizeController({ className = '' }: CompactSizeControllerProps) {
  const [textSize, setTextSize] = useState(1.0);
  const [rowHeight, setRowHeight] = useState(1.0);
  const [columnWidth, setColumnWidth] = useState(1.0);

  // Load saved preferences on mount
  useEffect(() => {
    const savedTextSize = localStorage.getItem('bibleTextSize');
    const savedRowHeight = localStorage.getItem('bibleRowHeight');
    const savedColumnWidth = localStorage.getItem('bibleColumnWidth');

    if (savedTextSize) {
      const size = parseFloat(savedTextSize);
      if (!isNaN(size)) {
        // Map any existing values to closest preset
        const closestTextPreset = TEXT_PRESETS.reduce((prev, curr) => 
          Math.abs(curr.value - size) < Math.abs(prev.value - size) ? curr : prev
        );
        setTextSize(closestTextPreset.value);
      }
    }

    if (savedRowHeight) {
      const height = parseFloat(savedRowHeight);
      if (!isNaN(height)) {
        // Map any existing values to closest preset
        const closestRowPreset = ROW_HEIGHT_PRESETS.reduce((prev, curr) => 
          Math.abs(curr.value - height) < Math.abs(prev.value - height) ? curr : prev
        );
        setRowHeight(closestRowPreset.value);
      }
    }

    if (savedColumnWidth) {
      const width = parseFloat(savedColumnWidth);
      if (!isNaN(width)) {
        // Map any existing values to closest preset (1x or 2x)
        const closestColumnPreset = COLUMN_WIDTH_PRESETS.reduce((prev, curr) => 
          Math.abs(curr.value - width) < Math.abs(prev.value - width) ? curr : prev
        );
        setColumnWidth(closestColumnPreset.value);
      }
    }
  }, []);

  // Apply changes to CSS variables only (do NOT touch store to preserve column width independence)
  useEffect(() => {
    document.documentElement.style.setProperty('--text-size-mult', textSize.toString());
    document.documentElement.style.setProperty('--row-height-mult', rowHeight.toString());
    document.documentElement.style.setProperty('--column-width-mult', columnWidth.toString());

    // Emit manual size change event to notify column headers
    window.dispatchEvent(new CustomEvent('manualSizeChange', {
      detail: { textSize, rowHeight, columnWidth, isUnified: false }
    }));
  }, [textSize, rowHeight, columnWidth]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('bibleTextSize', textSize.toString());
    localStorage.setItem('bibleRowHeight', rowHeight.toString());
    localStorage.setItem('bibleColumnWidth', columnWidth.toString());
  }, [textSize, rowHeight, columnWidth]);

  const PresetButtonGroup = ({ 
    presets, 
    currentValue, 
    onChange, 
    colorStyle,
    testIdPrefix
  }: {
    presets: typeof TEXT_PRESETS;
    currentValue: number;
    onChange: (value: number) => void;
    colorStyle: 'blue' | 'green' | 'orange';
    testIdPrefix: string;
  }) => {
    // Static class mappings to avoid Tailwind purging dynamic classes
    const colorClasses = {
      blue: {
        active: 'bg-blue-600 hover:bg-blue-700 text-white',
        inactive: 'border-blue-800 hover:bg-blue-900 hover:border-blue-800 text-blue-300 dark:border-blue-200 dark:hover:bg-blue-50 dark:text-blue-700'
      },
      green: {
        active: 'bg-green-600 hover:bg-green-700 text-white',
        inactive: 'border-green-800 hover:bg-green-900 hover:border-green-800 text-green-300 dark:border-green-200 dark:hover:bg-green-50 dark:text-green-700'
      },
      orange: {
        active: 'bg-orange-600 hover:bg-orange-700 text-white',
        inactive: 'border-orange-800 hover:bg-orange-900 hover:border-orange-800 text-orange-300 dark:border-orange-200 dark:hover:bg-orange-50 dark:text-orange-700'
      }
    };

    return (
      <div className="flex gap-1">
        {presets.map((preset) => (
          <Button
            key={preset.value}
            variant={currentValue === preset.value ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(preset.value)}
            className={`h-7 px-2 text-xs font-medium ${
              currentValue === preset.value 
                ? colorClasses[colorStyle].active 
                : colorClasses[colorStyle].inactive
            }`}
            data-testid={`${testIdPrefix}-${preset.label}`}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Text Size */}
      <div className="space-y-1">
        <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">
          Text Size
        </Label>
        <PresetButtonGroup
          presets={TEXT_PRESETS}
          currentValue={textSize}
          onChange={setTextSize}
          colorStyle="blue"
          testIdPrefix="text-size"
        />
      </div>

      {/* Row Height */}
      <div className="space-y-1">
        <Label className="text-sm font-medium text-green-700 dark:text-green-300">
          Row Height
        </Label>
        <PresetButtonGroup
          presets={ROW_HEIGHT_PRESETS}
          currentValue={rowHeight}
          onChange={setRowHeight}
          colorStyle="green"
          testIdPrefix="row-height"
        />
      </div>

      {/* Column Width */}
      <div className="space-y-1">
        <Label className="text-sm font-medium text-orange-700 dark:text-orange-300">
          Column Width
        </Label>
        <PresetButtonGroup
          presets={COLUMN_WIDTH_PRESETS}
          currentValue={columnWidth}
          onChange={setColumnWidth}
          colorStyle="orange"
          testIdPrefix="column-width"
        />
      </div>
    </div>
  );
}