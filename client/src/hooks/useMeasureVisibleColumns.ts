import { useEffect, useCallback } from 'react';
import { useBibleStore } from '@/App';
import { useViewportStore } from '@/stores/viewportStore';

export function useMeasureVisibleColumns(containerRef: React.RefObject<HTMLElement>) {
  // PERF FIX: Use viewport store instead of window event listeners
  const viewportW = useViewportStore(s => s.viewportW);
  const viewportH = useViewportStore(s => s.viewportH);
  
  const {
    setContainerWidthPx,
    setGapPx,
    setColumnWidthPx,
    setMaxVisibleNavigableColumns,
    navigableColumns
  } = useBibleStore();

  const measureAndUpdateColumns = useCallback(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    // Measure container width
    const containerRect = containerEl.getBoundingClientRect();
    const containerWidth = Math.round(containerRect.width);
    setContainerWidthPx(containerWidth);

    // Get computed styles for gap/padding measurements
    const computedStyle = getComputedStyle(containerEl);
    const gap = parseFloat(computedStyle.columnGap || computedStyle.gridColumnGap || computedStyle.gap || '0');
    const paddingLeft = parseFloat(computedStyle.paddingLeft || '0');
    const paddingRight = parseFloat(computedStyle.paddingRight || '0');
    const totalPadding = paddingLeft + paddingRight;
    
    setGapPx(gap);

    // Find the first row to measure actual column widths
    const firstRow = containerEl.querySelector('[data-verse-ref]');
    if (firstRow) {
      // Measure reference column (fixed, always present)
      const referenceCell = firstRow.querySelector('[data-testid*="reference"]');
      const referenceWidth = referenceCell ? Math.round(referenceCell.getBoundingClientRect().width) : 60;
      setColumnWidthPx('reference', referenceWidth);

      // Measure a representative navigable column (translation/cross-refs)
      const navigableCell = firstRow.querySelector('[data-testid*="translation"], [data-testid*="cross-ref"]');
      const navigableWidth = navigableCell ? Math.round(navigableCell.getBoundingClientRect().width) : 200;
      
      // Set width for all navigable column types
      setColumnWidthPx('translation', navigableWidth);
      setColumnWidthPx('cross-ref', navigableWidth);
      setColumnWidthPx('prophecy', navigableWidth);

      // Calculate how many navigable columns fit in available space
      // Available space = containerWidth - referenceWidth - padding - (gaps between all columns)
      const availableForNavigable = containerWidth - referenceWidth - totalPadding - gap; // gap after reference
      
      // Check if we're in landscape mode
      const isLandscape = viewportW > viewportH;
      
      // Show all navigable columns - no artificial limits
      const maxVisibleNavigable = navigableColumns.length;

      setMaxVisibleNavigableColumns(maxVisibleNavigable);

      // Silenced - too noisy during resize/scroll
    } else {
      // Fallback calculations if no row is rendered yet
      const estimatedReferenceWidth = 60;
      const estimatedNavigableWidth = 200;
      const estimatedGap = gap || 8;
      
      const availableForNavigable = containerWidth - estimatedReferenceWidth - totalPadding - estimatedGap;
      
      // Show all navigable columns - no artificial limits (fallback calculation)
      const maxVisibleNavigable = navigableColumns.length;
      
      setMaxVisibleNavigableColumns(maxVisibleNavigable);
      
      // Silenced - too noisy during resize/scroll
    }
  }, [containerRef, setContainerWidthPx, setGapPx, setColumnWidthPx, setMaxVisibleNavigableColumns, navigableColumns]);

  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    // Initial measurement
    measureAndUpdateColumns();

    // Watch for container resize
    const ro = new ResizeObserver(() => {
      measureAndUpdateColumns();
    });

    ro.observe(containerEl);
    
    return () => {
      ro.disconnect();
    };
  }, [containerRef, measureAndUpdateColumns, viewportW, viewportH]);
}