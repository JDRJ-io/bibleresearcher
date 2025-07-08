import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';

interface ColumnHeadersProps {
  showCrossRefs?: boolean;
  showProphecy?: boolean;
  prophecyColumns?: {
    predictions: boolean;
    fulfillments: boolean;
    verification: boolean;
  };
}

export function ColumnHeaders({ 
  showCrossRefs = false, 
  showProphecy = false,
  prophecyColumns = { predictions: true, fulfillments: true, verification: true }
}: ColumnHeadersProps) {
  const { mainTranslation, alternates } = useTranslationMaps();

  // Memoized order computation - don't recompute on every render
  const headers = useMemo(() => {
    const order = [
      { key: 'reference', label: 'Reference', type: 'reference' },
      ...alternates.map(code => ({ key: code, label: code, type: 'alternate' })),
      { key: mainTranslation, label: mainTranslation, type: 'main' },
      ...(showCrossRefs ? [{ key: 'cross', label: 'Cross Refs', type: 'cross' }] : []),
      ...(showProphecy && prophecyColumns.predictions ? [{ key: 'predictions', label: 'Pred', type: 'prophecy' }] : []),
      ...(showProphecy && prophecyColumns.fulfillments ? [{ key: 'fulfillments', label: 'Ful', type: 'prophecy' }] : []),
      ...(showProphecy && prophecyColumns.verification ? [{ key: 'verification', label: 'Ver', type: 'prophecy' }] : [])
    ];
    return order;
  }, [alternates, mainTranslation, showCrossRefs, showProphecy, prophecyColumns]);

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b grid grid-cols-12 gap-px" data-testid="column-headers">
      {headers.map((header, index) => (
        <div 
          key={header.key}
          data-testid="column-header"
          className={`
            p-3 font-semibold text-sm border-r last:border-r-0
            ${header.type === 'main' ? 'font-bold bg-blue-50 dark:bg-blue-900/20' : ''}
            ${header.type === 'alternate' ? 'bg-gray-50 dark:bg-gray-800' : ''}
            ${header.type === 'prophecy' ? 'bg-purple-50 dark:bg-purple-900/20' : ''}
            ${header.type === 'cross' ? 'bg-green-50 dark:bg-green-900/20' : ''}
          `}
        >
          <div className="flex items-center justify-between">
            <span>{header.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}