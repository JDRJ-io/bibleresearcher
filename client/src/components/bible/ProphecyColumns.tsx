import React, { useEffect, useState } from 'react';
import { useBibleStore } from '@/App';
import { HolyBookLoader } from '@/components/ui/HolyBookLoader';
import { VerseText } from '@/components/highlights/VerseText';
import { expandVerseRange, getFirstVerseFromRange, isVerseRange } from '@/lib/verseRangeUtils';
import './ProphecyColumns.css';

interface ProphecyData {
  id: number;
  summary: string;
  prophecy: string[];  // Prediction verses (may contain ranges like "Gen.7:17-23")
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
    <div className="prophecy-block mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded text-sm">
      <div className={`prophecy-header font-medium ${typeColors[type]} mb-3 border-b pb-2 text-sm`}>
        {prophecyData.id}. {prophecyData.summary}
      </div>

      <div className="space-y-3">
        {verses.map((ref, idx) => {
          // Check if this is a verse range (e.g., "Gen.7:17-23")
          const isRange = isVerseRange(ref);
          const displayRef = ref;
          const navigationRef = isRange ? getFirstVerseFromRange(ref) : ref;
          
          // For ranges, expand to get all verse references and combine their text
          const verseRefs = isRange ? expandVerseRange(ref) : [ref];
          
          return (
            <div key={idx} className="mb-2">
              <button
                onClick={() => onVerseClick(navigationRef)}
                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium text-sm mb-1 block"
                title={isRange ? `Jump to ${navigationRef}` : undefined}
              >
                {displayRef}
              </button>
              {getVerseText && (
                <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded">
                  {verseRefs.map((verseRef, verseIdx) => {
                    const text = getVerseText(verseRef);
                    if (!text) return null;
                    
                    return (
                      <span key={verseIdx}>
                        {verseIdx > 0 && ' '}
                        <VerseText
                          verseRef={verseRef}
                          translation="KJV"
                          text={text}
                        />
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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

        // OPTIMIZATION: verseKey uses dot format - direct lookup
        const verseRoles = prophecyData?.[verseKey];
        const foundKey = verseKey;

        if (!verseRoles || (!verseRoles.P?.length && !verseRoles.F?.length && !verseRoles.V?.length)) {
          console.log(`❌ No prophecy data found for ${verseKey}`);
          console.log('Available prophecy data keys sample:', Object.keys(prophecyData || {}).slice(0, 10));
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
          const prophecyDetails = prophecyIndex?.[id];
          if (!prophecyDetails) {
            console.log(`⚠️ Missing prophecy details for ID ${id}`);
            continue;
          }

          prophecyBlocks.push({
            id: parseInt(id.toString()),
            summary: prophecyDetails.summary || `Prophecy ${id}`,
            // Show ALL verses for each prophecy type from the prophecyIndex
            prophecy: prophecyDetails.prophecy || [],  // All prediction verses for this prophecy
            fulfillment: prophecyDetails.fulfillment || [],  // All fulfillment verses for this prophecy
            verification: prophecyDetails.verification || []  // All verification verses for this prophecy
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
    if (prophecyData && prophecyIndex && Object.keys(prophecyData).length > 0 && Object.keys(prophecyIndex).length > 0) {
      loadProphecyDataForVerse();
    } else {
      console.log('⏳ Waiting for prophecy data to load...');
      setIsLoading(true);
    }
  }, [verseKey, prophecyData, prophecyIndex, mainTranslation]);

  if (isLoading) {
    return (
      <div className="flex h-full">
        {/* Separate P, F, V columns with loading - responsive widths */}
        <div style={{ width: 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))' }} className="flex-shrink-0 border-r p-2">
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">Prediction</div>
          <div className="flex justify-center py-4">
            <HolyBookLoader size="sm" />
          </div>
        </div>
        <div style={{ width: 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))' }} className="flex-shrink-0 border-r p-2">
          <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">Fulfillment</div>
          <div className="flex justify-center py-4">
            <HolyBookLoader size="sm" />
          </div>
        </div>
        <div style={{ width: 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))' }} className="flex-shrink-0 p-2">
          <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">Verification</div>
          <div className="flex justify-center py-4">
            <HolyBookLoader size="sm" />
          </div>
        </div>
      </div>
    );
  }

  if (prophecies.length === 0) {
    return (
      <div className="flex h-full">
        {/* Empty P, F, V columns - responsive widths */}
        <div style={{ width: 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))' }} className="flex-shrink-0 border-r p-2">
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">Prediction</div>
          <div className="text-gray-400 text-center">—</div>
        </div>
        <div style={{ width: 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))' }} className="flex-shrink-0 border-r p-2">
          <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">Fulfillment</div>
          <div className="text-gray-400 text-center">—</div>
        </div>
        <div style={{ width: 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))' }} className="flex-shrink-0 p-2">
          <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">Verification</div>
          <div className="text-gray-400 text-center">—</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Separate P, F, V columns - responsive widths for better content display */}
      <div style={{ width: 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))' }} className="flex-shrink-0 border-r p-2 overflow-y-auto">
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

      <div style={{ width: 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))' }} className="flex-shrink-0 border-r p-2 overflow-y-auto">
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

      <div style={{ width: 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))' }} className="flex-shrink-0 p-2 overflow-y-auto">
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
        <div style={{ width: 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))' }} className="flex-shrink-0 border-r p-2">
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">Prediction</div>
          <div className="text-gray-400 text-center">—</div>
        </div>
        <div style={{ width: 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))' }} className="flex-shrink-0 border-r p-2">
          <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2">Fulfillment</div>
          <div className="text-gray-400 text-center">—</div>
        </div>
        <div style={{ width: 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))' }} className="flex-shrink-0 p-2">
          <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">Verification</div>
          <div className="text-gray-400 text-center">—</div>
        </div>
      </div>
    );
  }

  return <ProphecyRow verseKey={verseKey} onVerseClick={onVerseClick} mainTranslation={mainTranslation} />;
}