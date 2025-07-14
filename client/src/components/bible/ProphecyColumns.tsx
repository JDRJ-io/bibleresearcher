import React from 'react';
import { useBibleStore } from '@/App';

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
              {row?.P ? (Array.isArray(row.P) ? row.P.join('; ') : row.P) : ''}
            </td>
            <td className="table-cell">
              {row?.F ? (Array.isArray(row.F) ? row.F.join('; ') : row.F) : ''}
            </td>
            <td className="table-cell">
              {row?.V ? (Array.isArray(row.V) ? row.V.join('; ') : row.V) : ''}
            </td>
          </React.Fragment>
        );
      })}
    </>
  );
}