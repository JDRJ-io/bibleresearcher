import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBibleStore } from '@/App';
import { cn } from '@/lib/utils';
import { makeColumnScroller } from '@/utils/scrollNav';

interface ColumnNavigationArrowsProps {
  className?: string;
  headerRef?: React.RefObject<HTMLElement>;
  bodyRef?: React.RefObject<HTMLElement>;
}

export function ColumnNavigationArrows({ className, headerRef, bodyRef }: ColumnNavigationArrowsProps) {
  const { 
    buildActiveColumns, 
    showCrossRefs, 
    showProphecies, 
    showPrediction,
    showFulfillment,
    showVerification,
    showNotes,
    translationState 
  } = useBibleStore();
  
  // Get navigable column keys (everything except reference)
  // Now properly depends on the actual state that determines active columns
  const navigableKeys = useMemo(() => {
    const columns = buildActiveColumns();
    return columns
      .filter(col => col.key !== 'reference' && col.key !== 'index')
      .map(col => col.key);
  }, [
    buildActiveColumns, 
    showCrossRefs, 
    showProphecies, 
    showPrediction,
    showFulfillment,
    showVerification,
    showNotes,
    translationState.alternates
  ]);

  // Create column scroller instance
  const scroller = useMemo(() => {
    if (!headerRef?.current || !bodyRef?.current || !navigableKeys.length) {
      return null;
    }
    return makeColumnScroller({
      headerEl: headerRef.current,
      bodyEl: bodyRef.current,
      navigableKeys,
    });
  }, [headerRef?.current, bodyRef?.current, navigableKeys]);

  // Track visible range state
  const [visibleRange, setVisibleRange] = useState({
    start: 1,
    end: 1,
    total: 0,
    canGoLeft: false,
    canGoRight: false
  });

  // Update visible range when scroll changes
  useEffect(() => {
    if (!scroller) return;
    
    const updateRange = () => {
      const range = scroller.getVisibleRange();
      setVisibleRange(range);
    };
    
    updateRange();
    
    // Listen for scroll changes
    if (bodyRef?.current) {
      bodyRef.current.addEventListener('scroll', updateRange, { passive: true });
      return () => {
        bodyRef.current?.removeEventListener('scroll', updateRange);
      };
    }
  }, [scroller, bodyRef?.current]);

  // Cleanup scroller on unmount
  useEffect(() => {
    return () => {
      if (scroller) {
        scroller.destroy();
      }
    };
  }, [scroller]);

  // Debug logging for navigation state
  console.log('🔍 ColumnNavigationArrows Debug:', {
    hasScroller: !!scroller,
    visibleRange,
    navigableKeysLength: navigableKeys.length,
    headerRefCurrent: !!headerRef?.current,
    bodyRefCurrent: !!bodyRef?.current
  });

  // Don't show navigation if no scroller or all columns fit
  if (!scroller || visibleRange.total <= 1) {
    console.log('🚫 Navigation arrows hidden - scroller:', !!scroller, 'total columns:', visibleRange.total);
    return null;
  }

  const handleNavigateLeft = () => {
    console.log('🔍 Left arrow clicked!', { canGoLeft: visibleRange.canGoLeft, hasScroller: !!scroller });
    if (visibleRange.canGoLeft && scroller) {
      console.log('⬅️ Scrolling left...');
      scroller.left();
    }
  };

  const handleNavigateRight = () => {
    console.log('🔍 Right arrow clicked!', { canGoRight: visibleRange.canGoRight, hasScroller: !!scroller });
    if (visibleRange.canGoRight && scroller) {
      console.log('➡️ Scrolling right...');
      scroller.right();
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Left Arrow */}
      <button
        onClick={handleNavigateLeft}
        disabled={!visibleRange.canGoLeft}
        style={{
          backgroundColor: visibleRange.canGoLeft ? 'var(--bg-secondary)' : 'var(--bg-primary)',
          borderColor: 'var(--border-color)',
          color: visibleRange.canGoLeft ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: visibleRange.canGoLeft ? 'pointer' : 'not-allowed',
          opacity: visibleRange.canGoLeft ? 1 : 0.5
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
        <span>{visibleRange.start}-{visibleRange.end}</span>
        <span>/</span>
        <span>{visibleRange.total}</span>
      </div>

      {/* Right Arrow */}
      <button
        onClick={handleNavigateRight}
        disabled={!visibleRange.canGoRight}
        style={{
          backgroundColor: visibleRange.canGoRight ? 'var(--bg-secondary)' : 'var(--bg-primary)',
          borderColor: 'var(--border-color)',
          color: visibleRange.canGoRight ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: visibleRange.canGoRight ? 'pointer' : 'not-allowed',
          opacity: visibleRange.canGoRight ? 1 : 0.5
        }}
        className="flex items-center justify-center w-8 h-8 rounded-md transition-all border hover:opacity-80"
        title="Navigate right one column"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}