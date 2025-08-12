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

    let updateTimer: NodeJS.Timeout;
    const updateVisibleCount = () => {
      // THROTTLE UPDATES: Prevent excessive recalculations
      clearTimeout(updateTimer);
      updateTimer = setTimeout(() => {
        const containerRect = containerEl.getBoundingClientRect();
        const width = Math.round(containerRect.width);
        setContainerWidthPx(width);

        console.log('📐 useMeasureVisibleColumns: Container width =', width);

      // How many total columns (fixed + as many navigable as fit) can we show?
      // We count fixed first, then add navigable until we run out of room.
      let used = 0;
      let count = 0;

      // Include fixed columns first
      for (const id of fixedColumns) {
        const w = Math.max(1, columnWidthsPx[id] ?? 50); // Default 50px if not measured
        used += w;
        count += 1;
        console.log(`📐 Fixed column ${id}: ${w}px, total used: ${used}px`);
      }

      // Then add navigable columns until we run out of room
      for (const id of navigableColumns) {
        const w = Math.max(1, columnWidthsPx[id] ?? 200); // Default 200px if not measured
        if (used + w <= width || count === 0) {
          // Allow at least one column even if > width (e.g., 200% zoom case)
          used += w;
          count += 1;
          console.log(`📐 Navigable column ${id}: ${w}px, total used: ${used}px, count: ${count}`);
        } else {
          console.log(`📐 Navigable column ${id}: ${w}px would exceed width (${used + w}px > ${width}px), stopping`);
          break;
        }
      }

        console.log(`📐 Final calculation: ${count} columns fit in ${width}px (used: ${used}px)`);
        setVisibleCount(count);
      }, 50); // 50ms throttle for mobile performance
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
    return () => {
      clearTimeout(updateTimer);
      ro.disconnect();
    };
  }, [containerEl, fixedColumns, navigableColumns, columnWidthsPx, setVisibleCount, setContainerWidthPx]);
}