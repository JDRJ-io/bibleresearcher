import { useEffect, useMemo } from 'react';
import { useBibleStore } from '@/App';

/**
 * Hook for managing column shifting navigation logic
 * Calculates which columns should be visible based on navigation offset
 * and updates the max visible columns based on viewport width
 */
export function useColumnShifting() {
  const { 
    navigationOffset,
    maxVisibleNavigableColumns,
    navigableColumns,
    containerWidthPx,
    columnWidthsPx,
    setMaxVisibleNavigableColumns,
    resetColumnShift,
    getVisibleSlice
  } = useBibleStore();

  // Reset navigation offset if it becomes invalid when columns change
  useEffect(() => {
    const totalNavigable = navigableColumns.length;
    const maxOffset = Math.max(0, totalNavigable - maxVisibleNavigableColumns);
    
    if (navigationOffset > maxOffset) {
      console.log('🔍 COLUMN SHIFTING: Resetting offset due to column changes:', {
        navigationOffset,
        maxOffset,
        totalNavigable,
        maxVisibleNavigableColumns
      });
      resetColumnShift();
    }
  }, [navigationOffset, navigableColumns.length, maxVisibleNavigableColumns, resetColumnShift]);

  // Get current visible slice information
  const visibleSlice = getVisibleSlice();

  return {
    navigationOffset,
    maxVisibleNavigableColumns,
    totalNavigableColumns: navigableColumns.length,
    visibleSlice,
    needsNavigation: navigableColumns.length > maxVisibleNavigableColumns
  };
}