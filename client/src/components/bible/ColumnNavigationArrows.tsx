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

  // Calculate only visible/active content columns (excluding reference column)
  // Don't double-count columns - just use the actual visible content columns from the viewport
  const visibleTranslationColumns = columnState.columns.filter(col => col.visible).length;
  const additionalColumns = (showProphecies ? 3 : 0) + (showNotes ? 1 : 0) + (showDates ? 1 : 0);
  // Count only translation columns (excluding reference) + additional columns (excluding cross-refs since it's already in columnState)
  const totalActiveColumns = (visibleTranslationColumns - 1) + additionalColumns; // -1 to exclude reference column from count
  

  

  
  // Calculate currently visible active columns range (excluding reference column)
  // Show how many content columns are currently visible, starting from offset
  const availableContentSlots = maxVisibleColumns - 1; // -1 for reference column
  const actualVisibleContentColumns = Math.min(availableContentSlots, totalActiveColumns - columnOffset);
  const currentStartColumn = 1; // Always start from 1 for simple numbering
  const currentEndColumn = actualVisibleContentColumns;
  
  // Calculate if arrows should be enabled
  const canGoLeft = columnOffset > 0;
  const canGoRight = columnOffset < Math.max(0, totalActiveColumns - availableContentSlots);
  
  // Show navigation if there are more columns than can fit in viewport
  if (totalActiveColumns <= availableContentSlots) {
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