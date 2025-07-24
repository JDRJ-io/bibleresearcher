import React, { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useBibleStore } from '@/App';
import { LabelName, ensureLabelCacheLoaded } from '@/lib/labelsCache';

interface LabelsLegendProps {
  className?: string;
}

const labelConfig = [
  { key: 'who' as LabelName, label: 'Who', description: 'Persons/entities', style: 'font-bold', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { key: 'what' as LabelName, label: 'What', description: 'Objects/things', style: 'outline outline-1', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { key: 'when' as LabelName, label: 'When', description: 'Time references', style: 'underline', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { key: 'where' as LabelName, label: 'Where', description: 'Places/locations', style: 'before:content-["{"] after:content-["}"]', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  { key: 'command' as LabelName, label: 'Command', description: 'Imperatives', style: 'drop-shadow-sm', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { key: 'action' as LabelName, label: 'Action', description: 'Verbs/activities', style: 'italic', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { key: 'why' as LabelName, label: 'Why', description: 'Reasons/purposes', style: 'font-serif', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  { key: 'seed' as LabelName, label: 'Seed', description: 'Beginning/source', style: 'before:content-["*"]', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
  { key: 'harvest' as LabelName, label: 'Harvest', description: 'Results/outcomes', style: 'before:content-["="]', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  { key: 'prediction' as LabelName, label: 'Prediction', description: 'Prophecies/foretelling', style: 'before:content-["~"]', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' }
];

export function LabelsLegend({ className = '' }: LabelsLegendProps) {
  const { activeLabel, setActiveLabel, translationState } = useBibleStore();
  const mainTranslation = translationState.main; // Use main translation from store
  
  // Preload labels when a label is selected
  useEffect(() => {
    if (activeLabel && mainTranslation) {
      ensureLabelCacheLoaded(mainTranslation).catch(error => {
        console.error('Failed to load labels:', error);
      });
    }
  }, [activeLabel, mainTranslation]);
  
  const toggleLabel = (labelKey: LabelName) => {
    // Single-select: clicking same label turns it off, clicking different label switches
    if (activeLabel === labelKey) {
      setActiveLabel(null);
    } else {
      setActiveLabel(labelKey);
    }
  };

  const isLabelActive = (labelKey: LabelName) => {
    return activeLabel === labelKey;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Semantic Labels
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {labelConfig.map((label) => (
          <div
            key={label.key}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <input
              type="radio"
              name="semantic-label"
              id={`label-${label.key}`}
              checked={isLabelActive(label.key)}
              onChange={() => toggleLabel(label.key)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs ${label.color}`}>
                  {label.label}
                </Badge>
                <span 
                  className={`text-sm font-mono ${label.style}`}
                  style={{ fontSize: '0.8rem' }}
                >
                  sample
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {label.description}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Clear Selection Button */}
      {activeLabel && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveLabel(null)}
            className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Clear Labels
          </button>
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 italic mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        Note: Select one label type to highlight semantic elements across all verses. Only one label can be active at a time.
        {activeLabel && (
          <div className="mt-2 font-medium text-blue-600 dark:text-blue-400">
            Currently showing: {labelConfig.find(l => l.key === activeLabel)?.label} ({mainTranslation})
          </div>
        )}
        {!activeLabel && (
          <div className="mt-2 text-gray-500">
            Using translation: {mainTranslation}
          </div>
        )}
      </div>
    </div>
  );
}