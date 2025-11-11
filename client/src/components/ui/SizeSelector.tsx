import React from 'react';
import { useBibleStore } from '@/App';

interface SizeSelectorProps {
  className?: string;
}

const SIZE_PRESETS = [
  { label: 'S', value: 1.0, description: 'Small' },
  { label: 'M', value: 1.2, description: 'Medium' },
  { label: 'L', value: 1.5, description: 'Large' },
  { label: 'XL', value: 1.8, description: 'Extra Large' }
];

export function SizeSelector({ className = '' }: SizeSelectorProps) {
  const { sizeState } = useBibleStore();
  const { sizeMult, setSizeMult } = sizeState;

  React.useEffect(() => {
    // Load saved size preference on mount
    const saved = localStorage.getItem('bibleSizeMult');
    if (saved) {
      const mult = parseFloat(saved);
      if (!isNaN(mult)) {
        setSizeMult(mult);
      }
    }
  }, [setSizeMult]);

  return (
    <div className={`flex gap-1 ${className}`}>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mr-2">
        Size:
      </span>
      {SIZE_PRESETS.map((preset) => (
        <button
          key={preset.label}
          onClick={() => setSizeMult(preset.value)}
          className={`
            px-3 py-1 text-sm font-medium rounded transition-colors
            ${sizeMult === preset.value 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }
          `}
          title={preset.description}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}