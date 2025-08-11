import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBibleStore } from '@/App';
import { cn } from '@/lib/utils';

interface ColumnNavigationArrowsProps {
  className?: string;
}

export function ColumnNavigationArrows({ className }: ColumnNavigationArrowsProps) {
  const { 
    columnOffset, 
    maxVisibleColumns,
    navigateColumnLeft, 
    navigateColumnRight,
    showCrossRefs,
    showProphecies,
    showNotes,
    showDates,
    columnState
  } = useBibleStore();

  // Calculate total navigable columns (excluding reference column since it's fixed)
  // Dates are now inline with reference column, so don't count them separately
  const contentColumns = (showCrossRefs ? 1 : 0) + (showProphecies ? 3 : 0) + (showNotes ? 1 : 0);
  // Count main translation as 1, plus any alternate translations from columnState
  const translationColumns = columnState.columns.filter(col => 
    col.visible && (col.slot === 3 || col.slot >= 12) // main translation (slot 3) + alternates (slot 12+)
  ).length;
  const totalNavigableColumns = contentColumns + translationColumns;
  
  // Calculate if arrows should be enabled
  const canGoLeft = columnOffset > 0;
  const canGoRight = columnOffset < Math.max(0, totalNavigableColumns - maxVisibleColumns);
  
  // Don't show navigation if all columns fit in viewport
  if (totalNavigableColumns <= maxVisibleColumns) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Left Arrow */}
      <button
        onClick={navigateColumnLeft}
        disabled={!canGoLeft}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-md transition-colors",
          "border border-gray-300 dark:border-gray-600",
          canGoLeft 
            ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer" 
            : "bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed"
        )}
        title="Navigate left one column"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Column Indicator */}
      <div className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">
        <span>{columnOffset + 1}-{Math.min(columnOffset + maxVisibleColumns, totalNavigableColumns)}</span>
        <span>/</span>
        <span>{totalNavigableColumns}</span>
      </div>

      {/* Right Arrow */}
      <button
        onClick={navigateColumnRight}
        disabled={!canGoRight}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-md transition-colors",
          "border border-gray-300 dark:border-gray-600",
          canGoRight 
            ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer" 
            : "bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed"
        )}
        title="Navigate right one column"
      >
        <ChevronRight size={16} />
      </button>


    </div>
  );
}