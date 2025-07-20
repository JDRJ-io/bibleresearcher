import React from 'react';
import { useBibleStore } from '@/App';

interface ProphecyRowData {
  P: number[];  // Prediction IDs
  F: number[];  // Fulfillment IDs 
  V: number[];  // Verification IDs
}

interface ProphecyCellProps {
  verseReference: string;
  type: 'P' | 'F' | 'V';
  onNavigateToVerse?: (ref: string) => void;
}

/**
 * Individual Prophecy Cell for P, F, or V columns (slots 17-19)
 * Shows count of prophecy references and allows navigation to prophecy details
 */
export const ProphecyCell: React.FC<ProphecyCellProps> = ({ 
  verseReference, 
  type,
  onNavigateToVerse 
}) => {
  const { prophecyData } = useBibleStore();
  
  // Convert verse reference to the format used in prophecy data (Gen.1:1)
  const dotFormat = verseReference.replace(/\s+/g, '.');
  const verseData = prophecyData[dotFormat];
  
  if (!verseData || !verseData[type] || verseData[type].length === 0) {
    return (
      <div className="w-8 px-1 py-1 text-xs text-center text-gray-400">
        —
      </div>
    );
  }
  
  const count = verseData[type].length;
  const typeColors = {
    P: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',  // Prediction - blue
    F: 'text-green-600 bg-green-50 dark:bg-green-900/20', // Fulfillment - green  
    V: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' // Verification - purple
  };
  
  const handleClick = () => {
    if (onNavigateToVerse) {
      // TODO: Open prophecy detail drawer with specific prophecy IDs
      console.log(`📜 Prophecy ${type} clicked for ${verseReference}: IDs ${verseData[type].join(', ')}`);
      // For now, just navigate to the verse itself
      onNavigateToVerse(verseReference);
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={`w-8 px-1 py-1 text-xs text-center font-medium rounded hover:opacity-75 transition-opacity ${typeColors[type]}`}
      title={`${type === 'P' ? 'Prediction' : type === 'F' ? 'Fulfillment' : 'Verification'}: ${count} reference${count !== 1 ? 's' : ''}`}
    >
      {count}
    </button>
  );
};

export default ProphecyCell;