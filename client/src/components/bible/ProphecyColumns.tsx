
import React, { useEffect, useState } from 'react';
import { useBibleStore } from '@/App';
import './ProphecyColumns.css';

interface ProphecyData {
  id: number;
  summary: string;
  prophecy: string[];  // Prediction verses
  fulfillment: string[];
  verification: string[];
}

interface ProphecyBlockProps {
  prophecyData: ProphecyData;
  type: 'P' | 'F' | 'V';
  onVerseClick: (reference: string) => void;
  getVerseText?: (ref: string) => string;
}

function ProphecyBlock({ prophecyData, type, onVerseClick, getVerseText }: ProphecyBlockProps) {
  const typeLabels = {
    P: 'Prediction',
    F: 'Fulfillment', 
    V: 'Verification'
  };
  
  const typeColors = {
    P: 'text-blue-600 dark:text-blue-400',
    F: 'text-orange-600 dark:text-orange-400',
    V: 'text-purple-600 dark:text-purple-400'
  };
  
  const verses = type === 'P' ? prophecyData.prophecy : 
                type === 'F' ? prophecyData.fulfillment : 
                              prophecyData.verification;
  
  if (verses.length === 0) return null;
  
  return (
    <div className="prophecy-block mb-3 p-2 border border-gray-200 dark:border-gray-700 rounded text-xs">
      <div className={`prophecy-header font-medium ${typeColors[type]} mb-2 border-b pb-1`}>
        {prophecyData.id}. {prophecyData.summary}
      </div>
      
      <div className="space-y-1">
        {verses.map((ref, idx) => (
          <div key={idx} className="mb-1">
            <button
              onClick={() => onVerseClick(ref)}
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
            >
              {ref.replace(/\./g, ' ')}
            </button>
            {getVerseText && (
              <div className="text-gray-600 dark:text-gray-400 text-xs mt-0.5 leading-tight">
                {getVerseText(ref)?.substring(0, 80)}...
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProphecyRow({ verseKey, onVerseClick, mainTranslation }: { 
  verseKey: string; 
  onVerseClick: (reference: string) => void; 
  mainTranslation?: string 
}) {
  const { prophecyData, prophecyIndex, translations } = useBibleStore();
  const [prophecies, setProphecies] = useState<ProphecyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Helper function to get verse text
  const getVerseText = (reference: string): string => {
    if (!mainTranslation || !translations[mainTranslation]) return '';
    const translationData = translations[mainTranslation];
    const verse = translationData.find((v: any) => v.reference === reference);
    return verse?.text || '';
  };
  
  useEffect(() => {
    const loadProphecyDataForVerse = async () => {
      try {
        console.log(`🔮 Loading prophecy data for verse: ${verseKey}`);
        
        // Try multiple formats for verse key matching
        const possibleKeys = [
          verseKey,
          verseKey.replace(/\s/g, '.'), // "Gen 1:1" -> "Gen.1:1"  
          verseKey.replace(/\./g, ' ')   // "Gen.1:1" -> "Gen 1:1"
        ];
        
        let verseRoles = null;
        let foundKey = null;
        
        // Look up verse in prophecyData (this comes from prophecy_index.txt parsing)
        for (const key of possibleKeys) {
          if (prophecyData[key]) {
            verseRoles = prophecyData[key];
            foundKey = key;
            break;
          }
        }
        
        if (!verseRoles) {
          console.log(`❌ No prophecy data found for ${verseKey}`);
          setProphecies([]);
          setIsLoading(false);
          return;
        }
        
        console.log(`✅ Found prophecy data for ${verseKey} (key: ${foundKey}):`, verseRoles);
        
        // Get all unique prophecy IDs that reference this verse
        const allIds = [...(verseRoles.P || []), ...(verseRoles.F || []), ...(verseRoles.V || [])];
        const uniqueIds = Array.from(new Set(allIds));
        
        if (uniqueIds.length === 0) {
          setProphecies([]);
          setIsLoading(false);
          return;
        }
        
        // Build prophecy data from prophecy_rows.json
        const prophecyBlocks: ProphecyData[] = [];
        
        for (const id of uniqueIds) {
          const prophecyDetails = prophecyIndex[id];
          if (!prophecyDetails) {
            console.log(`⚠️ Missing prophecy details for ID ${id}`);
            continue;
          }
          
          prophecyBlocks.push({
            id: parseInt(id.toString()),
            summary: prophecyDetails.summary || `Prophecy ${id}`,
            prophecy: prophecyDetails.prophecy || [],
            fulfillment: prophecyDetails.fulfillment || [],
            verification: prophecyDetails.verification || []
          });
        }
        
        console.log(`✅ Built ${prophecyBlocks.length} prophecy blocks for ${verseKey}`);
        setProphecies(prophecyBlocks);
        
      } catch (error) {
        console.error('Failed to load prophecy data for verse:', verseKey, error);
        setProphecies([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only load if we have prophecy data available
    if (Object.keys(prophecyData).length > 0 && Object.keys(prophecyIndex).length > 0) {
      loadProphecyDataForVerse();
    } else {
      console.log('⏳ Waiting for prophecy data to load...');
      setIsLoading(true);
    }
  }, [verseKey, prophecyData, prophecyIndex, mainTranslation]);
  
  if (isLoading) {
    return (
      <div className="flex h-full">
        {/* Separate P, F, V columns with loading */}
        <div className="w-48 flex-shrink-0 border-r p-2">
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">Prediction</div>
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-full rounded"></div>
        </div>
        <div className="w-48 flex-shrink-0 border-r p-2">
          <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">Fulfillment</div>
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-full rounded"></div>
        </div>
        <div className="w-48 flex-shrink-0 p-2">
          <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">Verification</div>
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-full rounded"></div>
        </div>
      </div>
    );
  }
  
  if (prophecies.length === 0) {
    return (
      <div className="flex h-full">
        {/* Empty P, F, V columns */}
        <div className="w-48 flex-shrink-0 border-r p-2">
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">Prediction</div>
          <div className="text-gray-400 text-center">—</div>
        </div>
        <div className="w-48 flex-shrink-0 border-r p-2">
          <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">Fulfillment</div>
          <div className="text-gray-400 text-center">—</div>
        </div>
        <div className="w-48 flex-shrink-0 p-2">
          <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">Verification</div>
          <div className="text-gray-400 text-center">—</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-full">
      {/* Separate P, F, V columns as you specified */}
      <div className="w-48 flex-shrink-0 border-r p-2 overflow-y-auto">
        <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">Prediction</div>
        {prophecies.map((prophecy) => (
          <ProphecyBlock
            key={`P-${prophecy.id}`}
            prophecyData={prophecy}
            type="P"
            onVerseClick={onVerseClick}
            getVerseText={getVerseText}
          />
        ))}
      </div>
      
      <div className="w-48 flex-shrink-0 border-r p-2 overflow-y-auto">
        <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">Fulfillment</div>
        {prophecies.map((prophecy) => (
          <ProphecyBlock
            key={`F-${prophecy.id}`}
            prophecyData={prophecy}
            type="F"
            onVerseClick={onVerseClick}
            getVerseText={getVerseText}
          />
        ))}
      </div>
      
      <div className="w-48 flex-shrink-0 p-2 overflow-y-auto">
        <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">Verification</div>
        {prophecies.map((prophecy) => (
          <ProphecyBlock
            key={`V-${prophecy.id}`}
            prophecyData={prophecy}
            type="V"
            onVerseClick={onVerseClick}
            getVerseText={getVerseText}
          />
        ))}
      </div>
    </div>
  );
}

export function ProphecyColumns({ verseIDs, onVerseClick, mainTranslation }: { 
  verseIDs: string[]; 
  onVerseClick: (reference: string) => void; 
  mainTranslation?: string;
}) {
  const verseKey = verseIDs[0];
  
  if (!verseKey) {
    return (
      <div className="flex h-full">
        <div className="w-48 flex-shrink-0 border-r p-2">
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">Prediction</div>
          <div className="text-gray-400 text-center">—</div>
        </div>
        <div className="w-48 flex-shrink-0 border-r p-2">
          <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">Fulfillment</div>
          <div className="text-gray-400 text-center">—</div>
        </div>
        <div className="w-48 flex-shrink-0 p-2">
          <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">Verification</div>
          <div className="text-gray-400 text-center">—</div>
        </div>
      </div>
    );
  }
  
  return <ProphecyRow verseKey={verseKey} onVerseClick={onVerseClick} mainTranslation={mainTranslation} />;
}
