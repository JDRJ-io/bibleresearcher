import { useState, useEffect, useCallback } from 'react';
import type { ScrollRoot } from '@/hooks/useScrollRoot';

interface ScrollbarTooltipProps {
  scrollRoot: ScrollRoot;
  containerRef: React.RefObject<HTMLDivElement>;
  scrollbarWrapperRef?: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
  mousePosition?: { x: number; y: number };
  verseKeys: string[];
  currentScrollTop: number;
  effectiveRowHeight: number;
}

export function ScrollbarTooltip({ 
  scrollRoot,
  containerRef,
  scrollbarWrapperRef,
  isVisible, 
  mousePosition,
  verseKeys,
  currentScrollTop,
  effectiveRowHeight
}: ScrollbarTooltipProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [currentVerse, setCurrentVerse] = useState('');

  // Calculate center verse from current scroll position during dragging - UNIFIED
  useEffect(() => {
    if (!isVisible || !mousePosition || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Use unified scroll root for viewport height - no more branching logic
    const viewportHeight = scrollRoot.getClientHeight();
    const centerY = currentScrollTop + viewportHeight / 2;
    const centerIndex = Math.round(centerY / effectiveRowHeight);
    const clampedIndex = Math.max(0, Math.min(centerIndex, verseKeys.length - 1));
    const verse = verseKeys[clampedIndex] || 'Gen.1:1';
    
    // INSTANT updates - no setState delays
    setCurrentVerse(verse);
    setPosition({
      x: rect.right - 80,
      y: mousePosition.y // Already viewport coordinate from touch.clientY
    });
  }, [isVisible, mousePosition, currentScrollTop, verseKeys, scrollRoot, effectiveRowHeight]);

  if (!isVisible || !currentVerse) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-50%)',
        zIndex: 10000,
        pointerEvents: 'none',
        padding: '2px 6px',
        backgroundColor: 'rgb(59, 130, 246)',
        color: 'white',
        borderRadius: '3px',
        fontSize: '11px',
        fontWeight: '500',
        whiteSpace: 'nowrap'
      }}
    >
      {currentVerse}
    </div>
  );
}