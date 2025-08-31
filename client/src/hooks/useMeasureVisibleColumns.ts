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

      // Mobile portrait mode optimization - limit visible columns for better UX
      const isPortrait = window.innerHeight > window.innerWidth;
      const isMobile = width <= 640;
      
      if (isPortrait && isMobile && width <= 480) {
        // Only limit columns on very small screens (480px or less)
        // Filter out very narrow columns (like context) that might cause layout issues
        const essentialFixedColumns = fixedColumns.filter(id => {
          const w = columnWidthsPx[id] ?? 50;
          return w >= 30; // Filter out very narrow columns like context (40px)
        });
        
        const essentialNavigableColumns = navigableColumns.filter(id => {
          const w = columnWidthsPx[id] ?? 200;
          return w >= 100; // Ensure navigable columns are substantial enough
        });
        
        const totalColumns = essentialFixedColumns.length + Math.min(essentialNavigableColumns.length, 2);
        
        console.log(`📐 Very Small Mobile Portrait Mode: ${essentialFixedColumns.length} fixed + ${Math.min(essentialNavigableColumns.length, 2)} navigable = ${totalColumns} total`);
        
        // Log essential columns being displayed
        essentialFixedColumns.forEach(id => {
          const w = Math.max(1, columnWidthsPx[id] ?? 50);
          console.log(`📐 Fixed column ${id}: ${w}px`);
        });
        
        essentialNavigableColumns.slice(0, 2).forEach(id => {
          const w = Math.max(1, columnWidthsPx[id] ?? 200);
          console.log(`📐 Navigable column ${id}: ${w}px`);
        });

        setVisibleCount(totalColumns);
      } else {
        // Desktop/landscape - show all columns with horizontal scroll
        let totalColumns = fixedColumns.length + navigableColumns.length;
        
        console.log(`📐 Desktop/Landscape Mode: ${fixedColumns.length} fixed + ${navigableColumns.length} navigable = ${totalColumns} total`);
        
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
      }
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