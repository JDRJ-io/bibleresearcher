import React, { useState, useEffect } from 'react';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import { getProphecy } from '@/data/BibleDataAPI';

const SkeletonCell = () => (
  <td className="table-cell">
    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-full rounded"></div>
  </td>
);

interface ProphecyRowData {
  pred: string | null;
  ful: string | null;
  ver: string | null;
}

function ProphecyRow({ verseKey }: { verseKey: string }) {
  const translationMaps = useTranslationMaps();
  const [data, setData] = useState<ProphecyRowData | null>(null);
  
  useEffect(() => {
    // Use the same data loading approach as cross-references
    import('@/lib/prophecyCache').then(({ getProphecyForVerse }) => {
      const prophecyData = getProphecyForVerse(verseKey);
      
      if (!prophecyData || prophecyData.length === 0) {
        setData({ pred: null, ful: null, ver: null });
        return;
      }
      
      // Extract P, F, V arrays from the first prophecy entry
      const entry = prophecyData[0];
      setData({
        pred: entry.P && entry.P.length > 0 ? entry.P.join(',') : null,
        ful: entry.F && entry.F.length > 0 ? entry.F.join(',') : null,
        ver: entry.V && entry.V.length > 0 ? entry.V.join(',') : null
      });
    }).catch(() => {
      setData({ pred: null, ful: null, ver: null });
    });
  }, [verseKey]);
  
  if (!data) {
    return (
      <>
        <SkeletonCell />
        <SkeletonCell />
        <SkeletonCell />
      </>
    );
  }
  
  return (
    <>
      <td className="table-cell w-16 text-center">
        {data.pred ? (
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold cursor-pointer hover:bg-blue-600">
              P
            </span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="table-cell w-16 text-center">
        {data.ful ? (
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-xs font-bold cursor-pointer hover:bg-green-600">
              F
            </span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="table-cell w-16 text-center">
        {data.ver ? (
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-500 text-white rounded-full text-xs font-bold cursor-pointer hover:bg-purple-600">
              V
            </span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
    </>
  );
}

export function ProphecyColumns({ verseIDs }: { verseIDs: string[] }) {
  return (
    <>
      {verseIDs.map(verseKey => (
        <ProphecyRow key={verseKey} verseKey={verseKey} />
      ))}
    </>
  );
}