import React from 'react';
import { useBibleStore } from '@/providers/BibleDataProvider';

export function ProphecyColumns({ verseIDs }: { verseIDs: string[] }) {
  const { store } = useBibleStore();
  const prophecies = store?.prophecies || {};
  
  return (
    <>
      {verseIDs.map(id => {
        const row = prophecies[id];
        return (
          <React.Fragment key={id}>
            <td className="table-cell">
              {row?.P?.join('; ')}
            </td>
            <td className="table-cell">
              {row?.F?.join('; ')}
            </td>
            <td className="table-cell">
              {row?.V?.join('; ')}
            </td>
          </React.Fragment>
        );
      })}
    </>
  );
}