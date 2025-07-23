
import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, Zap } from 'lucide-react';

interface ProphecyRowData {
  P: number[];
  F: number[];
  V: number[];
}

function ProphecyRow({ verseKey }: { verseKey: string }) {
  const [data, setData] = useState<ProphecyRowData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Load prophecy data using the established cache system
    const loadProphecyData = async () => {
      try {
        const { getProphecyForVerse } = await import('@/lib/prophecyCache');
        const prophecyData = getProphecyForVerse(verseKey);
        
        if (!prophecyData || prophecyData.length === 0) {
          setData({ P: [], F: [], V: [] });
        } else {
          // Extract P, F, V arrays from the first prophecy entry
          const entry = prophecyData[0];
          setData({
            P: entry.P || [],
            F: entry.F || [],
            V: entry.V || []
          });
        }
      } catch (error) {
        console.error('Failed to load prophecy data for verse:', verseKey, error);
        setData({ P: [], F: [], V: [] });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProphecyData();
  }, [verseKey]);
  
  if (isLoading) {
    return (
      <div className="flex h-full">
        {/* Loading skeletons */}
        <div className="w-16 flex-shrink-0 flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-4 rounded-full"></div>
        </div>
        <div className="w-16 flex-shrink-0 flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-4 rounded-full"></div>
        </div>
        <div className="w-16 flex-shrink-0 flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-4 rounded-full"></div>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="flex h-full">
        <div className="w-16 flex-shrink-0 flex items-center justify-center text-gray-400">—</div>
        <div className="w-16 flex-shrink-0 flex items-center justify-center text-gray-400">—</div>
        <div className="w-16 flex-shrink-0 flex items-center justify-center text-gray-400">—</div>
      </div>
    );
  }
  
  return (
    <div className="flex h-full">
      {/* Prediction Column */}
      <div className="w-16 flex-shrink-0 flex items-center justify-center border-r">
        {data.P && data.P.length > 0 ? (
          <div className="flex items-center justify-center" title={`${data.P.length} prediction(s): ${data.P.join(', ')}`}>
            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold cursor-pointer hover:bg-blue-600 transition-colors">
              P
            </span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </div>
      
      {/* Fulfillment Column */}
      <div className="w-16 flex-shrink-0 flex items-center justify-center border-r">
        {data.F && data.F.length > 0 ? (
          <div className="flex items-center justify-center" title={`${data.F.length} fulfillment(s): ${data.F.join(', ')}`}>
            <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-xs font-bold cursor-pointer hover:bg-green-600 transition-colors">
              F
            </span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </div>
      
      {/* Verification Column */}
      <div className="w-16 flex-shrink-0 flex items-center justify-center">
        {data.V && data.V.length > 0 ? (
          <div className="flex items-center justify-center" title={`${data.V.length} verification(s): ${data.V.join(', ')}`}>
            <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-500 text-white rounded-full text-xs font-bold cursor-pointer hover:bg-purple-600 transition-colors">
              V
            </span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </div>
    </div>
  );
}

export function ProphecyColumns({ verseIDs }: { verseIDs: string[] }) {
  // For the VerseRow integration, we only expect one verseID
  const verseKey = verseIDs[0];
  
  if (!verseKey) {
    return (
      <div className="flex h-full">
        <div className="w-16 flex-shrink-0 flex items-center justify-center text-gray-400">—</div>
        <div className="w-16 flex-shrink-0 flex items-center justify-center text-gray-400">—</div>
        <div className="w-16 flex-shrink-0 flex items-center justify-center text-gray-400">—</div>
      </div>
    );
  }
  
  return <ProphecyRow verseKey={verseKey} />;
}
