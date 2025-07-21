import React from 'react';
// import { Checkbox } from '@/components/ui/checkbox'; // Will create this component
import { Badge } from '@/components/ui/badge';
import { useBibleStore } from '@/App';

interface LabelsLegendProps {
  className?: string;
}

const labelConfig = [
  { key: 'who', label: 'Who', description: 'Persons/entities', style: 'font-bold', color: 'bg-blue-100 text-blue-800' },
  { key: 'what', label: 'What', description: 'Objects/things', style: 'outline outline-1', color: 'bg-green-100 text-green-800' },
  { key: 'when', label: 'When', description: 'Time references', style: 'underline', color: 'bg-purple-100 text-purple-800' },
  { key: 'where', label: 'Where', description: 'Places/locations', style: 'before:content-["{"] after:content-["}"]', color: 'bg-orange-100 text-orange-800' },
  { key: 'command', label: 'Command', description: 'Imperatives', style: 'drop-shadow-sm', color: 'bg-red-100 text-red-800' },
  { key: 'action', label: 'Action', description: 'Verbs/activities', style: 'italic', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'why', label: 'Why', description: 'Reasons/purposes', style: 'font-serif', color: 'bg-indigo-100 text-indigo-800' },
  { key: 'seed', label: 'Seed', description: 'Beginning/source', style: 'before:content-["*"]', color: 'bg-teal-100 text-teal-800' },
  { key: 'harvest', label: 'Harvest', description: 'Results/outcomes', style: 'before:content-["="]', color: 'bg-cyan-100 text-cyan-800' },
  { key: 'prediction', label: 'Prediction', description: 'Prophecies/foretelling', style: 'before:content-["~"]', color: 'bg-pink-100 text-pink-800' }
];

export function LabelsLegend({ className = '' }: LabelsLegendProps) {
  const bibleStore = useBibleStore();
  
  const toggleLabel = (labelKey: string) => {
    const currentLabels = bibleStore.activeLabels || [];
    const isActive = currentLabels.includes(labelKey);
    
    if (isActive) {
      bibleStore.setActiveLabels(currentLabels.filter(l => l !== labelKey));
    } else {
      bibleStore.setActiveLabels([...currentLabels, labelKey]);
    }
  };

  const isLabelActive = (labelKey: string) => {
    return (bibleStore.activeLabels || []).includes(labelKey);
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
              type="checkbox"
              id={`label-${label.key}`}
              checked={isLabelActive(label.key)}
              onChange={() => toggleLabel(label.key)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
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

      <div className="text-xs text-gray-500 dark:text-gray-400 italic mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        Note: Labels highlight semantic elements within verse text. Toggle to see different aspects emphasized.
      </div>
    </div>
  );
}