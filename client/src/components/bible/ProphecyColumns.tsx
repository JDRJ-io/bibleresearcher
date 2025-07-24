
import React, { useEffect, useState } from 'react';
import { useBibleStore } from '@/App';
import './ProphecyColumns.css';

interface ProphecyData {
  id: number;
  summary: string;
  prophecy: string[];
  fulfillment: string[];
  verification: string[];
}

interface ProphecyRowData {
  P: number[];
  F: number[];
  V: number[];
}

interface ProphecyBlockProps {
  prophecyData: ProphecyData;
  isAnchor: boolean;
  onVerseClick: (reference: string) => void;
}

function ProphecyBlock({ prophecyData, isAnchor, onVerseClick }: ProphecyBlockProps) {
  return (
    <div className={`prophecy-block mb-3 p-2 border border-gray-200 dark:border-gray-700 rounded ${isAnchor ? 'anchor bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''}`}>
      <div className="prophecy-header text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
        {prophecyData.id}. {prophecyData.summary}
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs">
        {/* Prediction Column */}
        <div className="prophecy-body">
          <div className="font-medium text-green-600 dark:text-green-400 mb-1">P</div>
          {prophecyData.prophecy.map((ref, idx) => (
            <button
              key={idx}
              onClick={() => onVerseClick(ref)}
              className="block text-blue-600 hover:text-blue-800 hover:underline cursor-pointer mb-1"
            >
              {ref.replace(/\./g, ' ')}
            </button>
          ))}
        </div>

        {/* Fulfillment Column */}
        <div className="prophecy-body">
          <div className="font-medium text-orange-600 dark:text-orange-400 mb-1">F</div>
          {prophecyData.fulfillment.map((ref, idx) => (
            <button
              key={idx}
              onClick={() => onVerseClick(ref)}
              className="block text-blue-600 hover:text-blue-800 hover:underline cursor-pointer mb-1"
            >
              {ref.replace(/\./g, ' ')}
            </button>
          ))}
        </div>

        {/* Verification Column */}
        <div className="prophecy-body">
          <div className="font-medium text-purple-600 dark:text-purple-400 mb-1">V</div>
          {prophecyData.verification.map((ref, idx) => (
            <button
              key={idx}
              onClick={() => onVerseClick(ref)}
              className="block text-blue-600 hover:text-blue-800 hover:underline cursor-pointer mb-1"
            >
              {ref.replace(/\./g, ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProphecyRow({ verseKey, onVerseClick }: { verseKey: string; onVerseClick: (reference: string) => void }) {
  const { prophecyData, prophecyIndex } = useBibleStore();
  const [prophecies, setProphecies] = useState<Array<{ data: ProphecyData; role: 'P' | 'F' | 'V' }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadProphecyDataForVerse = async () => {
      try {
        // Get prophecy roles for this verse from the parsed prophecy_rows.txt data
        const verseRoles = prophecyData[verseKey] || { P: [], F: [], V: [] };
        
        // Get all unique prophecy IDs that reference this verse
        const allIds = [...verseRoles.P, ...verseRoles.F, ...verseRoles.V];
        const uniqueIds = Array.from(new Set(allIds));
        
        if (uniqueIds.length === 0) {
          setProphecies([]);
          setIsLoading(false);
          return;
        }
        
        // Build prophecy blocks with role information
        const prophecyBlocks: Array<{ data: ProphecyData; role: 'P' | 'F' | 'V' }> = [];
        
        for (const id of uniqueIds) {
          const prophecyDetails = prophecyIndex[id];
          if (!prophecyDetails) continue;
          
          // Determine the role of this verse in this prophecy
          let role: 'P' | 'F' | 'V' = 'P';
          if (verseRoles.F.includes(id)) role = 'F';
          else if (verseRoles.V.includes(id)) role = 'V';
          
          prophecyBlocks.push({
            data: {
              id,
              summary: prophecyDetails.summary,
              prophecy: prophecyDetails.prophecy || [],
              fulfillment: prophecyDetails.fulfillment || [],
              verification: prophecyDetails.verification || []
            },
            role
          });
        }
        
        setProphecies(prophecyBlocks);
        
      } catch (error) {
        console.error('Failed to load prophecy data for verse:', verseKey, error);
        setProphecies([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProphecyDataForVerse();
  }, [verseKey, prophecyData, prophecyIndex]);
  
  if (isLoading) {
    return (
      <div className="flex h-full">
        {/* Loading skeletons for P, F, V columns */}
        <div className="w-16 flex-shrink-0 flex items-center justify-center border-r">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-8 rounded"></div>
        </div>
        <div className="w-16 flex-shrink-0 flex items-center justify-center border-r">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-8 rounded"></div>
        </div>
        <div className="w-16 flex-shrink-0 flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-8 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (prophecies.length === 0) {
    return (
      <div className="flex h-full">
        {/* Empty P, F, V columns */}
        <div className="w-16 flex-shrink-0 flex items-center justify-center text-gray-400 border-r">—</div>
        <div className="w-16 flex-shrink-0 flex items-center justify-center text-gray-400 border-r">—</div>
        <div className="w-16 flex-shrink-0 flex items-center justify-center text-gray-400">—</div>
      </div>
    );
  }
  
  return (
    <div className="flex h-full">
      {/* Prediction Column */}
      <div className="w-48 flex-shrink-0 border-r p-2 overflow-y-auto">
        <div className="text-xs font-bold text-green-600 dark:text-green-400 mb-2">Prediction</div>
        {prophecies.map((prophecy, index) => (
          <ProphecyBlock
            key={`${prophecy.data.id}-${index}`}
            prophecyData={prophecy.data}
            isAnchor={prophecy.role === 'P'}
            onVerseClick={onVerseClick}
          />
        ))}
      </div>

      {/* Fulfillment Column */}
      <div className="w-48 flex-shrink-0 border-r p-2 overflow-y-auto">
        <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">Fulfillment</div>
        {prophecies.map((prophecy, index) => (
          <ProphecyBlock
            key={`${prophecy.data.id}-${index}`}
            prophecyData={prophecy.data}
            isAnchor={prophecy.role === 'F'}
            onVerseClick={onVerseClick}
          />
        ))}
      </div>

      {/* Verification Column */}
      <div className="w-48 flex-shrink-0 p-2 overflow-y-auto">
        <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">Verification</div>
        {prophecies.map((prophecy, index) => (
          <ProphecyBlock
            key={`${prophecy.data.id}-${index}`}
            prophecyData={prophecy.data}
            isAnchor={prophecy.role === 'V'}
            onVerseClick={onVerseClick}
          />
        ))}
      </div>
    </div>
  );
}

export function ProphecyColumns({ verseIDs, onVerseClick }: { verseIDs: string[]; onVerseClick: (reference: string) => void }) {
  // For the VerseRow integration, we only expect one verseID
  const verseKey = verseIDs[0];
  
  if (!verseKey) {
    return (
      <div className="flex h-full">
        <div className="w-48 flex-shrink-0 flex items-center justify-center text-gray-400 border-r">—</div>
        <div className="w-48 flex-shrink-0 flex items-center justify-center text-gray-400 border-r">—</div>
        <div className="w-48 flex-shrink-0 flex items-center justify-center text-gray-400">—</div>
      </div>
    );
  }
  
  return <ProphecyRow verseKey={verseKey} onVerseClick={onVerseClick} />;
}
