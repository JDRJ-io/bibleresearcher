import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProphecy } from '@/hooks/useProphecy';

interface ProphecyColumnsProps {
  verseId: string;
  columns: {
    predictions: boolean;
    fulfillments: boolean; 
    verification: boolean;
  };
  onReferenceClick: (ref: string) => void;
}

export function ProphecyColumns({ verseId, columns, onReferenceClick }: ProphecyColumnsProps) {
  const { getProphecyForVerse, openProphecyDetail } = useProphecy();
  
  const prophecyData = getProphecyForVerse(verseId);
  
  if (!prophecyData) {
    return (
      <>
        {columns.predictions && <div className="text-center text-gray-400">-</div>}
        {columns.fulfillments && <div className="text-center text-gray-400">-</div>}
        {columns.verification && <div className="text-center text-gray-400">-</div>}
      </>
    );
  }

  const renderProphecyCell = (type: 'P' | 'F' | 'V', color: string) => {
    const ids = prophecyData[type] || [];
    
    if (ids.length === 0) {
      return <div className="text-center text-gray-400">-</div>;
    }

    return (
      <div className="flex flex-wrap gap-1 justify-center">
        {ids.map(id => (
          <Button
            key={id}
            variant="outline"
            size="sm"
            className={`text-xs h-6 px-2 ${color}`}
            onClick={() => openProphecyDetail(id)}
          >
            {id}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <>
      {columns.predictions && renderProphecyCell('P', 'text-blue-600 border-blue-300')}
      {columns.fulfillments && renderProphecyCell('F', 'text-green-600 border-green-300')}
      {columns.verification && renderProphecyCell('V', 'text-purple-600 border-purple-300')}
    </>
  );
}