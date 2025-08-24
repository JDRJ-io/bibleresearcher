import { useEffect } from 'react';
import { useBibleStore } from '@/App';

export function useMeasureVisibleColumns(containerEl: HTMLElement | null) {
  const {
    fixedColumns,
    navigableColumns,
    columnWidthsPx,
    setVisibleCount,
    setContainerWidthPx
  } = useBibleStore();

  useEffect(() => {
    if (!containerEl) return;

    const updateVisibleCount = () => {
      const containerRect = containerEl.getBoundingClientRect();
      const width = Math.round(containerRect.width);
      setContainerWidthPx(width);

      console.log('📐 useMeasureVisibleColumns: Container width =', width);

      // FIXED: Show ALL active columns instead of limiting by width
      // This resolves the issue where 5+ alternate translation columns go blank
      // and where combinations of columns cause display limits and scrolling issues
      
      let totalColumns = fixedColumns.length + navigableColumns.length;
      
      console.log(`📐 Showing ALL active columns: ${fixedColumns.length} fixed + ${navigableColumns.length} navigable = ${totalColumns} total`);
      
      // Log all columns being displayed
      fixedColumns.forEach(id => {
        const w = Math.max(1, columnWidthsPx[id] ?? 50);
        console.log(`📐 Fixed column ${id}: ${w}px`);
      });
      
      navigableColumns.forEach(id => {
        const w = Math.max(1, columnWidthsPx[id] ?? 200);
        console.log(`📐 Navigable column ${id}: ${w}px`);
      });

      console.log(`📐 Final calculation: ${totalColumns} columns (all active columns shown, horizontal scroll enabled)`);
      setVisibleCount(totalColumns);
    };

    // Initial calculation
    updateVisibleCount();

    // Watch for container resize
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateVisibleCount();
      }
    });

    ro.observe(containerEl);
    return () => ro.disconnect();
  }, [containerEl, fixedColumns, navigableColumns, columnWidthsPx, setVisibleCount, setContainerWidthPx]);
}