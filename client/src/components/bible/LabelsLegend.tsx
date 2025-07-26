
import React, { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { useBibleStore } from '@/App';
import { ensureLabelCacheLoaded, clearLabelCacheForTranslation } from '@/lib/labelsCache';
import type { LabelName } from '@/lib/labelBits';

interface LabelsLegendProps {
  className?: string;
}

const labelConfig = [
  { key: 'who' as LabelName, label: 'Who', description: 'Cursive font for people/beings', effectClass: 'fx-hand', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { key: 'what' as LabelName, label: 'What', description: 'Drop shadow for objects/things', effectClass: 'fx-shadow', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { key: 'when' as LabelName, label: 'When', description: 'Underlined time references', effectClass: 'fx-under', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { key: 'where' as LabelName, label: 'Where', description: 'Square brackets around locations', effectClass: 'fx-bracket', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  { key: 'command' as LabelName, label: 'Command', description: 'Bold text for imperatives', effectClass: 'fx-bold', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { key: 'action' as LabelName, label: 'Action', description: 'Italic text for verbs/activities', effectClass: 'fx-ital', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { key: 'why' as LabelName, label: 'Why', description: 'Outlined text for reasons/purposes', effectClass: 'fx-outline', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  { key: 'seed' as LabelName, label: 'Seed', description: 'Asterisk (*) for beginning/source', effectClass: 'sup-seed', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
  { key: 'harvest' as LabelName, label: 'Harvest', description: 'Equals (=) for results/outcomes', effectClass: 'sup-harvest', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  { key: 'prediction' as LabelName, label: 'Prediction', description: 'Plus (+) for prophecies/foretelling', effectClass: 'sup-predict', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' }
];

export function LabelsLegend({ className = '' }: LabelsLegendProps) {
  const { activeLabels, setActiveLabels, translationState } = useBibleStore();
  const mainTranslation = translationState.main;
  
  // Track previous translation to detect changes
  const [prevTranslation, setPrevTranslation] = React.useState<string | null>(null);
  
  // Handle translation changes by clearing old cache
  useEffect(() => {
    if (prevTranslation && prevTranslation !== mainTranslation) {
      clearLabelCacheForTranslation(prevTranslation);
      console.log(`🔄 Translation changed from ${prevTranslation} to ${mainTranslation}, clearing old label cache`);
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
  
  const toggleLabel = (labelKey: LabelName) => {
    const currentLabels = activeLabels || [];
    if (currentLabels.includes(labelKey)) {
      // Remove the label
      console.log(`🏷️ WORKER: Removing label: ${labelKey}, remaining:`, currentLabels.filter(label => label !== labelKey));
      setActiveLabels(currentLabels.filter(label => label !== labelKey));
    } else {
      // Add the label
      console.log(`🏷️ WORKER: Adding label: ${labelKey}, will be:`, [...currentLabels, labelKey]);
      setActiveLabels([...currentLabels, labelKey]);
      
      // Ensure cache is loaded when adding a label
      if (mainTranslation) {
        ensureLabelCacheLoaded(mainTranslation, [...currentLabels, labelKey] as LabelName[]).catch(error => {
          console.error('Failed to load labels for main translation:', error);
        });
      }
    }
  };

  const isLabelActive = (labelKey: LabelName) => {
    return activeLabels?.includes(labelKey) || false;
  };

  const clearAllLabels = () => {
    setActiveLabels([]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Semantic Labels
      </div>
      
      {/* Compact Toggle Grid - 2 columns for easy clicking */}
      <div className="grid grid-cols-2 gap-2">
        {labelConfig.map((label) => (
          <Toggle
            key={label.key}
            pressed={isLabelActive(label.key)}
            onPressedChange={() => toggleLabel(label.key)}
            variant="outline"
            size="sm"
            className="h-auto p-2 flex flex-col items-start justify-start text-left"
          >
            <div className="flex items-center gap-1 w-full">
              <Badge variant="outline" className={`text-xs ${label.color}`}>
                <span className={label.effectClass}>
                  {label.label}
                </span>
              </Badge>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">
              {label.description}
            </div>
          </Toggle>
        ))}
      </div>
      
      {/* Quick Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={clearAllLabels}
          disabled={activeLabels.length === 0}
          className="flex-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear All
        </button>
        <button
          onClick={() => setActiveLabels(labelConfig.map(l => l.key))}
          className="flex-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 py-1 px-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          Select All
        </button>
      </div>

      {/* Status Display */}
      <div className="text-xs text-gray-500 dark:text-gray-400 italic p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        {activeLabels.length > 0 ? (
          <div>
            <div className="font-medium text-blue-600 dark:text-blue-400">
              Active: {activeLabels.map(label => 
                labelConfig.find(l => l.key === label)?.label
              ).join(', ')} ({mainTranslation})
            </div>
            <div className="mt-1">
              {activeLabels.length} of {labelConfig.length} labels selected
            </div>
          </div>
        ) : (
          <div>
            <div>No labels selected</div>
            <div className="mt-1">
              Using translation: {mainTranslation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
