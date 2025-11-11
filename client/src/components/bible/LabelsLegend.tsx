import React, { useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useBibleStore } from '@/App';
import { ensureLabelCacheLoaded, clearLabelCacheForTranslation } from '@/lib/labelsCache';
import type { LabelName } from '@/lib/labelBits';

interface LabelsLegendProps {
  className?: string;
}

const labelConfig = [
  { key: 'who' as LabelName, label: 'Who', description: 'People/beings in cursive font', effectClass: 'fx-hand' },
  { key: 'what' as LabelName, label: 'What', description: 'Objects with drop shadow', effectClass: 'fx-shadow' },
  { key: 'when' as LabelName, label: 'When', description: 'Time references underlined', effectClass: 'fx-under' },
  { key: 'where' as LabelName, label: 'Where', description: 'Locations in brackets', effectClass: 'fx-bracket' },
  { key: 'command' as LabelName, label: 'Command', description: 'Imperatives in bold', effectClass: 'fx-bold' },
  { key: 'action' as LabelName, label: 'Action', description: 'Verbs in italic', effectClass: 'fx-ital' },
  { key: 'why' as LabelName, label: 'Why', description: 'Reasons with outline', effectClass: 'fx-outline' }
];

export function LabelsLegend({ className = '' }: LabelsLegendProps) {
  const store = useBibleStore();
  const activeLabels = store.activeLabels || [];
  const setActiveLabels = store.setActiveLabels;
  const mainTranslation = store.translationState?.main;

  // Track previous translation to detect changes
  const [prevTranslation, setPrevTranslation] = React.useState<string | null>(null);

  // Handle translation changes by clearing old cache
  useEffect(() => {
    if (prevTranslation && prevTranslation !== mainTranslation) {
      clearLabelCacheForTranslation(prevTranslation);
    }
    setPrevTranslation(mainTranslation);
  }, [mainTranslation, prevTranslation]);

  // Preload labels when any label is selected
  useEffect(() => {
    if (activeLabels.length > 0 && mainTranslation) {
      ensureLabelCacheLoaded(mainTranslation, activeLabels as LabelName[]).catch(error => {
        console.error('Failed to load labels for main translation:', error);
      });
    }
  }, [activeLabels, mainTranslation]);

  const handleLabelToggle = async (labelKey: LabelName, checked: boolean) => {
    const currentLabels = activeLabels || [];

    if (checked) {
      // Add the label
      const newLabels = [...currentLabels, labelKey];
      setActiveLabels(newLabels);

      // Ensure cache is loaded when adding a label
      if (mainTranslation) {
        ensureLabelCacheLoaded(mainTranslation, newLabels as LabelName[]).catch(error => {
          console.error('Failed to load labels for main translation:', error);
        });
      }
    } else {
      // Remove the label
      const newLabels = currentLabels.filter(label => label !== labelKey);
      setActiveLabels(newLabels);
    }
  };

  const isLabelActive = (labelKey: LabelName) => {
    return activeLabels?.includes(labelKey) || false;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 px-1">
        Semantic Labels (beta) ({mainTranslation})
      </div>

      <div className="space-y-2">
        {labelConfig.map((label) => (
          <div key={label.key} className="flex items-center space-x-2 px-1">
            <Checkbox
              id={`label-${label.key}`}
              checked={isLabelActive(label.key)}
              onCheckedChange={(checked) => handleLabelToggle(label.key, checked as boolean)}
              className="h-3 w-3"
            />
            <Label 
              htmlFor={`label-${label.key}`}
              className="text-xs cursor-pointer flex items-center gap-1.5 leading-tight"
            >
              <span className={label.effectClass}>
                {label.label}
              </span>
              <span className="text-gray-400 dark:text-gray-500 text-[10px]">
                {label.description}
              </span>
            </Label>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <button
          onClick={() => setActiveLabels(labelConfig.map(l => l.key))}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors px-1"
        >
          Turn on all labels
        </button>
        {activeLabels.length > 0 && (
          <button
            onClick={() => setActiveLabels([])}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors px-1"
          >
            Clear all ({activeLabels.length})
          </button>
        )}
      </div>
    </div>
  );
}