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
    getProphecy(verseKey).then((row) => {
      if (!row) {
        setData({ pred: null, ful: null, ver: null });
        return;
      }
      
      // Parse the prophecy row format: "verseID $ id:type , id:type , …"
      const parts = row.split('$');
      if (parts.length < 2) {
        setData({ pred: null, ful: null, ver: null });
        return;
      }
      
      const items = parts[1].split(',');
      let pred = null, ful = null, ver = null;
      
      for (const item of items) {
        const [id, type] = item.trim().split(':');
        if (type === 'P') pred = id;
        else if (type === 'F') ful = id;
        else if (type === 'V') ver = id;
      }
      
      setData({ pred, ful, ver });
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
            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold">
              {data.pred}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="table-cell w-16 text-center">
        {data.ful ? (
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-xs font-bold">
              {data.ful}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="table-cell w-16 text-center">
        {data.ver ? (
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-500 text-white rounded-full text-xs font-bold">
              {data.ver}
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