
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

function ProphecyBlock({ prophecyData, isAnchor, onVerseClick, getVerseText }: ProphecyBlockProps & { getVerseText?: (ref: string) => string }) {
  return (
    <div className={`prophecy-block mb-2 p-2 border border-gray-200 dark:border-gray-700 rounded text-xs ${isAnchor ? 'anchor bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''}`}>
      <div className="prophecy-header font-medium text-blue-700 dark:text-blue-300 mb-2 border-b pb-1">
        {prophecyData.id}. {prophecyData.summary}
      </div>
      
      <div className="space-y-1">
        {/* Prediction References */}
        {prophecyData.prophecy.length > 0 && (
          <div>
            <div className="font-medium text-green-600 dark:text-green-400 mb-1">Prediction:</div>
            {prophecyData.prophecy.map((ref, idx) => (
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
        )}

        {/* Fulfillment References */}
        {prophecyData.fulfillment.length > 0 && (
          <div>
            <div className="font-medium text-orange-600 dark:text-orange-400 mb-1">Fulfillment:</div>
            {prophecyData.fulfillment.map((ref, idx) => (
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
        )}

        {/* Verification References */}
        {prophecyData.verification.length > 0 && (
          <div>
            <div className="font-medium text-purple-600 dark:text-purple-400 mb-1">Verification:</div>
            {prophecyData.verification.map((ref, idx) => (
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
        )}
      </div>
    </div>
  );
}

function ProphecyRow({ verseKey, onVerseClick, mainTranslation }: { verseKey: string; onVerseClick: (reference: string) => void; mainTranslation?: string }) {
  const { prophecyData, prophecyIndex, translations } = useBibleStore();
  const [prophecies, setProphecies] = useState<Array<{ data: ProphecyData; role: 'P' | 'F' | 'V' }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Helper function to get verse text for the current main translation
  const getVerseText = (reference: string): string => {
    if (!mainTranslation || !translations[mainTranslation]) return '';
    
    // Find the verse in the loaded translation data
    const translationData = translations[mainTranslation];
    const verse = translationData.find((v: any) => v.reference === reference);
    return verse?.text || '';
  };
  
  useEffect(() => {
    const loadProphecyDataForVerse = async () => {
      try {
        console.log(`🔮 Loading prophecy data for verse: ${verseKey}`);
        console.log(`📊 Available prophecy data keys: ${Object.keys(prophecyData).length}`);
        console.log(`📊 Available prophecy index keys: ${Object.keys(prophecyIndex).length}`);
        
        // Try multiple formats for verse key matching
        const possibleKeys = [
          verseKey,
          verseKey.replace(/\s/g, '.'), // "Gen 1:1" -> "Gen.1:1"  
          verseKey.replace(/\./g, ' ')   // "Gen.1:1" -> "Gen 1:1"
        ];
        
        let verseRoles = null;
        let foundKey = null;
        
        for (const key of possibleKeys) {
          if (prophecyData[key]) {
            verseRoles = prophecyData[key];
            foundKey = key;
            break;
          }
        }
        
        if (!verseRoles) {
          console.log(`❌ No prophecy data found for ${verseKey} (tried: ${possibleKeys.join(', ')})`);
          setProphecies([]);
          setIsLoading(false);
          return;
        }
        
        console.log(`✅ Found prophecy data for ${verseKey} (key: ${foundKey}):`, verseRoles);
        
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
          if (!prophecyDetails) {
            console.log(`⚠️ Missing prophecy details for ID ${id}`);
            continue;
          }
          
          // Determine the primary role of this verse in this prophecy
          let role: 'P' | 'F' | 'V' = 'P';
          if (verseRoles.F.includes(id)) role = 'F';
          else if (verseRoles.V.includes(id)) role = 'V';
          
          prophecyBlocks.push({
            data: {
              id,
              summary: prophecyDetails.summary || prophecyDetails.title || `Prophecy ${id}`,
              prophecy: prophecyDetails.prophecy || prophecyDetails.prediction || [],
              fulfillment: prophecyDetails.fulfillment || [],
              verification: prophecyDetails.verification || []
            },
            role
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
      {/* Single Column Layout - All prophecy data together */}
      <div className="w-full p-2 overflow-y-auto">
        <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">Prophecies ({prophecies.length})</div>
        {prophecies.map((prophecy, index) => (
          <ProphecyBlock
            key={`${prophecy.data.id}-${index}`}
            prophecyData={prophecy.data}
            isAnchor={true} // All blocks are anchored since they relate to this verse
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
  
  return <ProphecyRow verseKey={verseKey} onVerseClick={onVerseClick} mainTranslation={mainTranslation} />;
}
