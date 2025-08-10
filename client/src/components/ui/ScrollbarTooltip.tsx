import { useState, useEffect, useCallback } from 'react';
import { ROW_HEIGHT } from '@/constants/layout';

interface ScrollbarTooltipProps {
  containerRef: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
  mousePosition?: { x: number; y: number };
  verseKeys: string[];
  currentScrollTop: number;
}

export function ScrollbarTooltip({ 
  containerRef, 
  isVisible, 
  mousePosition,
  verseKeys,
  currentScrollTop
}: ScrollbarTooltipProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [currentVerse, setCurrentVerse] = useState('');

  // Calculate center verse from current scroll position during dragging - INSTANT
  useEffect(() => {
    if (!isVisible || !mousePosition || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // INSTANT calculation - no async operations
    const centerY = currentScrollTop + container.clientHeight / 2;
    const centerIndex = Math.round(centerY / ROW_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(centerIndex, verseKeys.length - 1));
    const verse = verseKeys[clampedIndex] || 'Gen.1:1';
    
    // INSTANT updates - no setState delays
    setCurrentVerse(verse);
    setPosition({
      x: rect.right - 80,
      y: mousePosition.y
    });
  }, [isVisible, mousePosition, currentScrollTop, verseKeys]); // Removed containerRef dependency for speed

  if (!isVisible || !currentVerse) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-50%)',
        zIndex: 9999,
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