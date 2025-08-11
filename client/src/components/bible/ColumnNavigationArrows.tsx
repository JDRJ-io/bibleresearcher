import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
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

  // Track current width state (normal or expanded)
  const [isExpanded, setIsExpanded] = useState(false);

  // Column width control - increases non-reference/non-date columns by 200px
  const toggleColumnWidth = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    // Get current width multiplier
    const currentMultiplier = parseFloat(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--column-width-mult') || '1'
    );
    
    // Calculate new multiplier based on 200px increase for standard column widths
    // Assume base column width is around 300px, so 200px increase = ~1.67x multiplier
    const newMultiplier = newExpanded ? Math.max(currentMultiplier, 1.67) : 1;
    
    // Apply the new width multiplier
    document.documentElement.style.setProperty('--column-width-mult', newMultiplier.toString());
    
    console.log(`🎛️ Column Width Toggled: ${newExpanded ? 'Expanded' : 'Normal'} (${newMultiplier}x)`);
  }, [isExpanded]);

  // Calculate total available columns that can be navigated
  const visibleColumns = columnState.columns.filter(col => col.visible).length;
  const additionalColumns = (showCrossRefs ? 1 : 0) + (showProphecies ? 3 : 0) + (showNotes ? 1 : 0) + (showDates ? 1 : 0);
  const totalNavigableColumns = visibleColumns + additionalColumns;
  
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

      {/* Column Width Toggle */}
      <button
        onClick={toggleColumnWidth}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-md transition-colors",
          "border border-gray-300 dark:border-gray-600",
          "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700",
          "text-gray-700 dark:text-gray-300 cursor-pointer",
          isExpanded && "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600"
        )}
        title={isExpanded ? "Reduce column width (-200px)" : "Expand column width (+200px)"}
      >
        {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>
    </div>
  );
}