import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ManualSizeControllerProps {
  className?: string;
}

export function ManualSizeController({ className = '' }: ManualSizeControllerProps) {
  const [isUnified, setIsUnified] = useState(true);
  const [textSize, setTextSize] = useState(1.0);
  const [rowHeight, setRowHeight] = useState(1.0);
  const [columnWidth, setColumnWidth] = useState(1.0);

  // Load saved preferences on mount
  useEffect(() => {
    const savedUnified = localStorage.getItem('bibleUnifiedSizing');
    const savedTextSize = localStorage.getItem('bibleTextSize');
    const savedRowHeight = localStorage.getItem('bibleRowHeight');
    const savedColumnWidth = localStorage.getItem('bibleColumnWidth');

    if (savedUnified !== null) {
      setIsUnified(savedUnified === 'true');
    }

    if (savedTextSize) {
      const size = parseFloat(savedTextSize);
      if (!isNaN(size)) setTextSize(size);
    }

    if (savedRowHeight) {
      const height = parseFloat(savedRowHeight);
      if (!isNaN(height)) setRowHeight(height);
    }

    if (savedColumnWidth) {
      const width = parseFloat(savedColumnWidth);
      if (!isNaN(width)) setColumnWidth(width);
    }
  }, []);

  // Apply changes to CSS variables
  useEffect(() => {
    if (isUnified) {
      // Use textSize for all three variables in unified mode
      document.documentElement.style.setProperty('--text-size-mult', textSize.toString());
      document.documentElement.style.setProperty('--row-height-mult', textSize.toString());
      document.documentElement.style.setProperty('--column-width-mult', textSize.toString());
    } else {
      // Use separate controls in split mode
      document.documentElement.style.setProperty('--text-size-mult', textSize.toString());
      document.documentElement.style.setProperty('--row-height-mult', rowHeight.toString());
      document.documentElement.style.setProperty('--column-width-mult', columnWidth.toString());
    }
  }, [isUnified, textSize, rowHeight, columnWidth]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('bibleUnifiedSizing', isUnified.toString());
    localStorage.setItem('bibleTextSize', textSize.toString());
    localStorage.setItem('bibleRowHeight', rowHeight.toString());
    localStorage.setItem('bibleColumnWidth', columnWidth.toString());
  }, [isUnified, textSize, rowHeight, columnWidth]);

  const formatValue = (value: number) => `${Math.round(value * 100)}%`;

  const handleUnifiedChange = (checked: boolean) => {
    setIsUnified(checked);
    if (checked) {
      // When switching to unified, sync all values to textSize
      setRowHeight(textSize);
      setColumnWidth(textSize);
    }
  };

  const handleUnifiedSizeChange = (value: number) => {
    setTextSize(value);
    setRowHeight(value);
    setColumnWidth(value);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Switch
            id="unified-sizing"
            checked={isUnified}
            onCheckedChange={handleUnifiedChange}
          />
          <Label htmlFor="unified-sizing" className="text-sm font-medium">
            Unified Sizing
          </Label>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Manual controls for Bible content (excludes header/menu auto-sizing)
        </p>
      </div>

      {isUnified ? (
        // Unified Control
        <div className="space-y-2">
          <Label className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Content Size: {formatValue(textSize)}
          </Label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={textSize}
            onChange={(e) => handleUnifiedSizeChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider-thumb"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>50%</span>
            <span>100%</span>
            <span>150%</span>
            <span>200%</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Controls text, row height, and column width together
          </p>
        </div>
      ) : (
        // Split Controls
        <div className="space-y-4">
          {/* Text Size */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Text Size: {formatValue(textSize)}
            </Label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={textSize}
              onChange={(e) => setTextSize(parseFloat(e.target.value))}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer dark:bg-blue-700 slider-thumb-blue"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Font size in verses and references
            </p>
          </div>

          {/* Row Height */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-green-700 dark:text-green-300">
              Row Height: {formatValue(rowHeight)}
            </Label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={rowHeight}
              onChange={(e) => setRowHeight(parseFloat(e.target.value))}
              className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer dark:bg-green-700 slider-thumb-green"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Vertical spacing between verses
            </p>
          </div>

          {/* Column Width */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Column Width: {formatValue(columnWidth)}
            </Label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={columnWidth}
              onChange={(e) => setColumnWidth(parseFloat(e.target.value))}
              className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer dark:bg-orange-700 slider-thumb-orange"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Universal expansion of all column widths
            </p>
          </div>
        </div>
      )}
    </div>
  );
}