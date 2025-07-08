import { useState, useEffect } from 'react';

interface ColumnVisibilityState {
  crossRefs: boolean;
  prophecy: boolean;
  prophecyColumns: {
    predictions: boolean;
    fulfillments: boolean;
    verification: boolean;
  };
}

export function useColumnVisibility() {
  const [visibility, setVisibility] = useState<ColumnVisibilityState>({
    crossRefs: false,
    prophecy: false,
    prophecyColumns: {
      predictions: true,
      fulfillments: true,
      verification: true
    }
  });

  // Store cross/proph data in useBibleStore() keyed by slice so we don't refetch when user toggles columns
  const toggleCrossRefs = () => {
    setVisibility(prev => ({ ...prev, crossRefs: !prev.crossRefs }));
  };

  const toggleProphecy = () => {
    setVisibility(prev => ({ ...prev, prophecy: !prev.prophecy }));
  };

  const toggleProphecyColumn = (column: keyof ColumnVisibilityState['prophecyColumns']) => {
    setVisibility(prev => ({
      ...prev,
      prophecyColumns: {
        ...prev.prophecyColumns,
        [column]: !prev.prophecyColumns[column]
      }
    }));
  };

  // Hook into useColumnVisibility() or header checkbox states
  const getColumnCount = (alternatesCount: number) => {
    let count = 2 + alternatesCount; // Reference + main + alternates
    
    if (visibility.crossRefs) count += 1;
    if (visibility.prophecy) {
      if (visibility.prophecyColumns.predictions) count += 1;
      if (visibility.prophecyColumns.fulfillments) count += 1;
      if (visibility.prophecyColumns.verification) count += 1;
    }
    
    return count;
  };

  return {
    ...visibility,
    toggleCrossRefs,
    toggleProphecy,
    toggleProphecyColumn,
    getColumnCount
  };
}