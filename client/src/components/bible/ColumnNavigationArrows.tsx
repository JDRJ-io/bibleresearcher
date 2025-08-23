import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
    columnState,
    // NEW: Use the dynamic visible count system
    visibleCount,
    navigableColumns,
    getVisibleSlice
  } = useBibleStore();

  const [layout, setLayout] = useState<LayoutResult | null>(null);
  const [measuredWidths, setMeasuredWidths] = useState<number[]>([]);
  const containerRef = useRef<HTMLElement | null>(null);
  const pillarRef = useRef<HTMLElement | null>(null);

  // Base widths for different column types (in pixels at zoom = 1.0) - memoized to prevent re-renders
  const baseWidths = useMemo((): Record<ColumnId, number> => ({
    KJV: 420,
    CrossRefs: 360,
    Prediction: 360,
    Fulfillment: 360,
    Verification: 360,
    Notes: 320
  }), []);

  // Build active columns list from store state (excluding reference pillar) - memoized to prevent re-renders
  const activeColumns = React.useMemo((): ColumnId[] => {
    const columns: ColumnId[] = ['KJV']; // Always include main translation
    
    if (showCrossRefs) columns.push('CrossRefs');
    if (showNotes) columns.push('Notes');
    if (showProphecies) {
      columns.push('Prediction', 'Fulfillment', 'Verification');
    }
    
    console.log('📋 Active Columns List:', { showProphecies, showCrossRefs, showNotes, activeColumns: columns });
    return columns;
  }, [showCrossRefs, showNotes, showProphecies]);

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

  // Calculate column widths from CSS multipliers (event-driven, no DOM polling)
  const calculateColumnWidths = useCallback(() => {
    const columnWidthMult = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--column-width-mult') || '1');
    const widths = activeColumns.map(colId => Math.round(baseWidths[colId] * columnWidthMult));
    
    console.log('📐 Calculated widths:', widths, 'for columns:', activeColumns, 'with multiplier:', columnWidthMult);
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
    
    // Get current calculated widths
    const currentWidths = calculateColumnWidths();

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
  }, [activeColumns, columnOffset, calculateColumnWidths]);

  // Recompute on mount and when dependencies change
  useEffect(() => {
    recomputeLayout();
  }, [recomputeLayout]);

  // Event-driven: Listen for CSS variable changes (presentation mode toggle)
  useEffect(() => {
    const onResize = () => recomputeLayout();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    // Listen for CSS custom property changes (column width multiplier)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const currentMult = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--column-width-mult') || '1');
          // Only recompute if the multiplier actually changed
          const previousMult = measuredWidths.length > 0 ? measuredWidths[0] / baseWidths[activeColumns[0]] : 1;
          if (Math.abs(currentMult - previousMult) > 0.1) {
            console.log('📡 Column width multiplier changed, recomputing layout');
            recomputeLayout();
          }
        }
      });
    });
    
    // Observe document root for style attribute changes
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    });
    
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      observer.disconnect();
    };
  }, [recomputeLayout, measuredWidths, baseWidths, activeColumns]);

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
        style={{
          backgroundColor: layout?.canGoLeft ? 'var(--bg-secondary)' : 'var(--bg-primary)',
          borderColor: 'var(--border-color)',
          color: layout?.canGoLeft ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: layout?.canGoLeft ? 'pointer' : 'not-allowed',
          opacity: layout?.canGoLeft ? 1 : 0.5
        }}
        className="flex items-center justify-center w-8 h-8 rounded-md transition-all border hover:opacity-80"
        title="Navigate left one column"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Column Indicator */}
      <div 
        className="flex items-center gap-1 px-2 py-1 text-xs rounded"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-color)'
        }}
      >
        <span>{layout?.labelStart}-{layout?.labelEnd}</span>
        <span>/</span>
        <span>{layout?.totalNavigableColumns}</span>
      </div>

      {/* Right Arrow */}
      <button
        onClick={handleNavigateRight}
        disabled={!layout?.canGoRight}
        style={{
          backgroundColor: layout?.canGoRight ? 'var(--bg-secondary)' : 'var(--bg-primary)',
          borderColor: 'var(--border-color)',
          color: layout?.canGoRight ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: layout?.canGoRight ? 'pointer' : 'not-allowed',
          opacity: layout?.canGoRight ? 1 : 0.5
        }}
        className="flex items-center justify-center w-8 h-8 rounded-md transition-all border hover:opacity-80"
        title="Navigate right one column"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}