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
  // The columnState.columns includes all translation columns, but we need to exclude reference
  const visibleTranslationColumns = columnState.columns.filter(col => col.visible).length;
  const additionalColumns = (showCrossRefs ? 1 : 0) + (showProphecies ? 3 : 0) + (showNotes ? 1 : 0) + (showDates ? 1 : 0);
  // Don't count the reference column in our total since it's always visible and doesn't scroll
  const totalActiveColumns = (visibleTranslationColumns - 1) + additionalColumns; // -1 to exclude reference column from count
  

  
  // Calculate currently visible active columns range (excluding reference column)
  // Show how many content columns are currently visible, starting from offset
  const availableContentSlots = maxVisibleColumns - 1; // -1 for reference column
  const visibleActiveColumns = Math.min(availableContentSlots, totalActiveColumns - columnOffset);
  const currentStartColumn = columnOffset + 1; // Start from offset + 1 for active columns
  const currentEndColumn = columnOffset + visibleActiveColumns;
  
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

      {/* Column Indicator */}
      <div className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">
        <span>{currentStartColumn}-{currentEndColumn}</span>
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