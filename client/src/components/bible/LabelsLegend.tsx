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
  { key: 'why' as LabelName, label: 'Why', description: 'Reasons with outline', effectClass: 'fx-outline' },
  { key: 'seed' as LabelName, label: 'Seed', description: 'Beginning with asterisk', effectClass: 'sup-seed' },
  { key: 'harvest' as LabelName, label: 'Harvest', description: 'Results with equals sign', effectClass: 'sup-harvest' },
  { key: 'prediction' as LabelName, label: 'Prediction', description: 'Prophecies with tilde', effectClass: 'sup-predict' }
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
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Semantic Labels ({mainTranslation})
      </div>

      <div className="space-y-3">
        {labelConfig.map((label) => (
          <div key={label.key} className="flex items-start space-x-3">
            <Checkbox
              id={`label-${label.key}`}
              checked={isLabelActive(label.key)}
              onCheckedChange={(checked) => handleLabelToggle(label.key, checked as boolean)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <Label 
                htmlFor={`label-${label.key}`}
                className="text-sm font-medium cursor-pointer flex items-center gap-2"
              >
                <span className={label.effectClass}>
                  {label.label}
                </span>
              </Label>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {label.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {activeLabels.length > 0 && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveLabels([])}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Clear all labels
          </button>
        </div>
      )}

      {/* Status Display */}
      {activeLabels.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-800 rounded">
          {activeLabels.length} of {labelConfig.length} labels active
        </div>
      )}
    </div>
  );
}