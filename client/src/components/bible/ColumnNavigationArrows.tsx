import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBibleStore } from '@/App';
import { cn } from '@/lib/utils';
import { computeVisibleRangeDynamic, type ColumnId, type LayoutResult } from '@/utils/columnLayout';

interface ColumnNavigationArrowsProps {
  className?: string;
}

export function ColumnNavigationArrows({ className }: ColumnNavigationArrowsProps) {
  const { 
    columnOffset, 
    setColumnOffset,
    showCrossRefs,
    showProphecies,
    showNotes,
    columnState
  } = useBibleStore();

  const [layout, setLayout] = useState<LayoutResult | null>(null);
  const [measuredWidths, setMeasuredWidths] = useState<number[]>([]);
  const containerRef = useRef<HTMLElement | null>(null);
  const pillarRef = useRef<HTMLElement | null>(null);

  // Base widths for different column types (in pixels at zoom = 1.0)
  const baseWidths: Record<ColumnId, number> = {
    KJV: 420,
    CrossRefs: 360,
    Prediction: 360,
    Fulfillment: 360,
    Verification: 360,
    Notes: 320
  };

  // Build active columns list from store state (excluding reference pillar)
  const activeColumns: ColumnId[] = [];
  
  // Always include main translation
  activeColumns.push('KJV');
  
  if (showCrossRefs) activeColumns.push('CrossRefs');
  if (showNotes) activeColumns.push('Notes');
  if (showProphecies) {
    activeColumns.push('Prediction', 'Fulfillment', 'Verification');
  }
  
  console.log('📋 Active Columns List:', { showProphecies, showCrossRefs, showNotes, activeColumns });

  // Determine target slots based on screen size and orientation
  const isPortrait = window.innerHeight > window.innerWidth;
  const viewportWidth = window.innerWidth;
  
  let targetSlots: number;
  if (isPortrait) {
    if (viewportWidth <= 430) targetSlots = 2; // Small phones
    else if (viewportWidth <= 768) targetSlots = 2; // Larger phones/tablets  
    else targetSlots = 3; // Portrait tablets
  } else {
    if (viewportWidth <= 768) targetSlots = 3; // Small landscape screens
    else if (viewportWidth <= 1024) targetSlots = 4; // Medium landscape screens
    else targetSlots = 5; // Large landscape screens
  }

  // For prophecy view in portrait, we need special handling since we have 5 total columns
  // but can only show 2 at a time, so we need to ensure navigation reaches all columns
  if (isPortrait && showProphecies && activeColumns.length === 5) {
    targetSlots = 2; // Show 2 columns but allow navigation to reach all 5
  }

  // Measure actual column widths from DOM
  const measureColumnWidths = useCallback(() => {
    const widths: number[] = [];
    const columnWidthMult = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--column-width-mult') || '1');
    
    activeColumns.forEach((colId, index) => {
      // Map column IDs to the actual data-column types used in the DOM
      const columnTypeMap: Record<string, string> = {
        'KJV': 'main-translation',
        'CrossRefs': 'cross-refs', 
        'Notes': 'notes',
        'Prediction': 'prophecy',
        'Fulfillment': 'prophecy', 
        'Verification': 'prophecy'
      };
      
      const columnType = columnTypeMap[colId] || colId.toLowerCase();
      
      // Try multiple selectors to find the actual column element
      const selectors = [
        `[data-column="${columnType}"]`,
        `[data-column="${colId}"]`,
        `[data-col="${colId}"]`,
        `.column-header-cell:nth-child(${index + 2})`, // +2 because ref column is first
      ];
      
      let columnEl: HTMLElement | null = null;
      let foundSelector = '';
      for (const selector of selectors) {
        columnEl = document.querySelector(selector);
        if (columnEl) {
          foundSelector = selector;
          break;
        }
      }
      
      if (columnEl) {
        const width = Math.round(columnEl.getBoundingClientRect().width);
        widths.push(width);
        console.log(`📏 Measured ${colId}: ${width}px (found via "${foundSelector}")`);
      } else {
        // Fallback to base width with current zoom multiplier
        const fallbackWidth = Math.round(baseWidths[colId] * columnWidthMult);
        widths.push(fallbackWidth);
        console.log(`📏 Fallback ${colId}: ${fallbackWidth}px (base: ${baseWidths[colId]} * mult: ${columnWidthMult}) - no element found`);
      }
    });
    
    console.log('📐 All measured widths:', widths, 'for columns:', activeColumns);
    setMeasuredWidths(widths);
    return widths;
  }, [activeColumns, baseWidths]);

  // Compute layout on mount and when critical dependencies change
  const recomputeLayout = useCallback(() => {
    // Find container and pillar elements in DOM
    const containerEl = document.querySelector('.column-headers-wrapper') || 
                       document.querySelector('.virtual-bible-table');
    const pillarEl = document.querySelector('[data-column="reference"]') || 
                    document.querySelector('.column-header-cell');

    if (!containerEl || !pillarEl) return;

    const containerWidthPx = Math.round(containerEl.getBoundingClientRect().width);
    const pillarWidthPx = Math.round(pillarEl.getBoundingClientRect().width);
    
    // Get current measured widths or measure them now
    const currentWidths = measureColumnWidths();

    const res = computeVisibleRangeDynamic({
      containerWidthPx,
      pillarWidthPx,
      gapPx: 0, // No gaps between columns currently
      activeColumns,
      widthsPx: currentWidths, // Use measured widths instead of base * zoom
      baseWidths, // fallback
      zoom: 1.0, // Not needed when using measured widths
      offset: columnOffset,
      ghostSlots: 1 // Allow reaching the last column even if only one fits
    });
    
    setLayout(res);
    
    console.log('🎯 Smart Column Layout (Dynamic):', {
      activeColumns,
      containerWidthPx,
      pillarWidthPx,
      contentViewportPx: res.contentViewportPx,
      measuredWidths: currentWidths,
      totalMeasuredWidth: currentWidths.reduce((a, b) => a + b, 0),
      visibleRange: `${res.labelStart}-${res.labelEnd}`,
      visibleCount: res.visibleCount,
      totalNavigable: res.totalNavigableColumns,
      canGoLeft: res.canGoLeft,
      canGoRight: res.canGoRight,
      columnWidthMult: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--column-width-mult') || '1')
    });
  }, [activeColumns, columnOffset, baseWidths, measureColumnWidths]);

  // Recompute on mount and when dependencies change
  useEffect(() => {
    recomputeLayout();
  }, [recomputeLayout]);

  // Listen for resize, orientation changes, and column width changes
  useEffect(() => {
    const onResize = () => recomputeLayout();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    // Set up ResizeObserver to detect column width changes (e.g., from presentation mode)
    let resizeObserver: ResizeObserver | null = null;
    
    const setupResizeObserver = () => {
      const containerEl = document.querySelector('.column-headers-wrapper') || 
                         document.querySelector('.virtual-bible-table');
      
      if (containerEl && 'ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(entries => {
          // Debounce to avoid excessive recalculations
          setTimeout(() => recomputeLayout(), 50);
        });
        
        // Observe the container and any visible column elements
        resizeObserver.observe(containerEl);
        
        // Also observe individual column elements if we can find them
        activeColumns.forEach((colId, index) => {
          const columnEl = document.querySelector(`[data-column="${colId}"]`) ||
                          document.querySelector(`.column-header-cell:nth-child(${index + 2})`);
          if (columnEl && resizeObserver) {
            resizeObserver.observe(columnEl);
          }
        });
      }
    };
    
    // Set up observer after a brief delay to ensure DOM is ready
    setTimeout(setupResizeObserver, 100);
    
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [recomputeLayout, activeColumns]);

  if (!layout || layout.totalNavigableColumns <= layout.visibleCount) {
    return null; // All columns fit, no navigation needed
  }

  const handleNavigateLeft = () => {
    if (layout?.canGoLeft && setColumnOffset) {
      setColumnOffset(layout.startIndex - 1);
    }
  };

  const handleNavigateRight = () => {
    if (layout?.canGoRight && setColumnOffset) {
      setColumnOffset(layout.startIndex + 1);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Left Arrow */}
      <button
        onClick={handleNavigateLeft}
        disabled={!layout?.canGoLeft}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-md transition-colors",
          "border border-gray-300 dark:border-gray-600",
          layout?.canGoLeft 
            ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer" 
            : "bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed"
        )}
        title="Navigate left one column"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Column Indicator */}
      <div className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">
        <span>{layout?.labelStart}-{layout?.labelEnd}</span>
        <span>/</span>
        <span>{layout?.totalNavigableColumns}</span>
      </div>

      {/* Right Arrow */}
      <button
        onClick={handleNavigateRight}
        disabled={!layout?.canGoRight}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-md transition-colors",
          "border border-gray-300 dark:border-gray-600",
          layout?.canGoRight 
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