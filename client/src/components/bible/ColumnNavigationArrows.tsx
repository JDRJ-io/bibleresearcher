import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBibleStore } from '@/App';
import { cn } from '@/lib/utils';

interface ColumnNavigationArrowsProps {
  className?: string;
}

export function ColumnNavigationArrows({ className }: ColumnNavigationArrowsProps) {
  const { 
    navigateColumnLeft,
    navigateColumnRight,
    getVisibleSlice,
    setContainerWidthPx,
    setGapPx,
    setFallbackVisibleNavigableCount,
    buildActiveColumns
  } = useBibleStore();

  const slice = getVisibleSlice();

  // Update responsive configuration when viewport changes
  useEffect(() => {
    const updateResponsiveConfig = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const viewportWidth = window.innerWidth;
      
      let maxVisibleNavigableColumns;
      if (isPortrait) {
        if (viewportWidth <= 430) maxVisibleNavigableColumns = 2;
        else if (viewportWidth <= 768) maxVisibleNavigableColumns = 3;
        else maxVisibleNavigableColumns = 4;
      } else {
        if (viewportWidth <= 768) maxVisibleNavigableColumns = 4;
        else if (viewportWidth <= 1024) maxVisibleNavigableColumns = 6;
        else maxVisibleNavigableColumns = 8;
      }
      
      setFallbackVisibleNavigableCount(maxVisibleNavigableColumns);
    };
    
    updateResponsiveConfig();
    window.addEventListener('resize', updateResponsiveConfig);
    window.addEventListener('orientationchange', updateResponsiveConfig);
    
    return () => {
      window.removeEventListener('resize', updateResponsiveConfig);
      window.removeEventListener('orientationchange', updateResponsiveConfig);
    };
  }, [setFallbackVisibleNavigableCount]);

  // Update container measurements when DOM changes
  useEffect(() => {
    const updateMeasurements = () => {
      const containerEl = document.querySelector('.column-headers-wrapper') || 
                         document.querySelector('.virtual-bible-table');
      const pillarEl = document.querySelector('[data-column="reference"]');
      
      if (containerEl && pillarEl) {
        const containerWidth = Math.round(containerEl.getBoundingClientRect().width);
        const pillarWidth = Math.round(pillarEl.getBoundingClientRect().width);
        const availableWidth = containerWidth - pillarWidth;
        
        setContainerWidthPx(availableWidth);
      }
      
      // Set gap from CSS
      const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--column-gap-px') || '0');
      setGapPx(gap);
    };
    
    updateMeasurements();
    
    const resizeObserver = new ResizeObserver(updateMeasurements);
    const containerEl = document.querySelector('.column-headers-wrapper');
    if (containerEl) {
      resizeObserver.observe(containerEl);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [setContainerWidthPx, setGapPx]);

  // Debug logging
  useEffect(() => {
    console.log('🎯 Unified Navigation State:', {
      totalNavigable: slice.totalNavigable,
      visibleRange: `${slice.labelStart}-${slice.labelEnd}`,
      visibleCount: slice.visibleNavigableCount,
      canGoLeft: slice.canGoLeft,
      canGoRight: slice.canGoRight,
      modeUsed: slice.modeUsed
    });
  }, [slice]);


  if (slice.totalNavigable <= slice.visibleNavigableCount) {
    return null; // All columns fit, no navigation needed
  }

  const handleNavigateLeft = () => {
    if (slice.canGoLeft) {
      navigateColumnLeft();
    }
  };

  const handleNavigateRight = () => {
    if (slice.canGoRight) {
      navigateColumnRight();
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Left Arrow */}
      <button
        onClick={handleNavigateLeft}
        disabled={!slice.canGoLeft}
        style={{
          backgroundColor: slice.canGoLeft ? 'var(--bg-secondary)' : 'var(--bg-primary)',
          borderColor: 'var(--border-color)',
          color: slice.canGoLeft ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: slice.canGoLeft ? 'pointer' : 'not-allowed',
          opacity: slice.canGoLeft ? 1 : 0.5
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
        <span>{slice.labelStart}-{slice.labelEnd}</span>
        <span>/</span>
        <span>{slice.totalNavigable}</span>
      </div>

      {/* Right Arrow */}
      <button
        onClick={handleNavigateRight}
        disabled={!slice.canGoRight}
        style={{
          backgroundColor: slice.canGoRight ? 'var(--bg-secondary)' : 'var(--bg-primary)',
          borderColor: 'var(--border-color)',
          color: slice.canGoRight ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: slice.canGoRight ? 'pointer' : 'not-allowed',
          opacity: slice.canGoRight ? 1 : 0.5
        }}
        className="flex items-center justify-center w-8 h-8 rounded-md transition-all border hover:opacity-80"
        title="Navigate right one column"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}