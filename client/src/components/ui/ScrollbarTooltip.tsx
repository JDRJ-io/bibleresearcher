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

  // Calculate center verse from current scroll position during dragging
  useEffect(() => {
    if (!isVisible || !mousePosition || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Calculate which verse would be in the center at current scroll position
    const centerY = currentScrollTop + container.clientHeight / 2;
    const centerIndex = Math.round(centerY / ROW_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(centerIndex, verseKeys.length - 1));
    const verse = verseKeys[clampedIndex] || 'Gen.1:1';
    
    setCurrentVerse(verse);
    setPosition({
      x: rect.right - 80, // Position to the left of scrollbar with some padding
      y: mousePosition.y
    });
  }, [isVisible, mousePosition, containerRef, currentScrollTop, verseKeys]);

  if (!isVisible || !currentVerse) return null;

  return (
    <div
      className="fixed z-[9999] pointer-events-none bg-blue-900 dark:bg-blue-800 text-white px-3 py-2 rounded-md shadow-lg text-sm font-bold whitespace-nowrap"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-50%)',
        fontSize: '14px',
        fontWeight: '700',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        border: '2px solid rgb(59, 130, 246)',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
      }}
    >
      {currentVerse}
    </div>
  );
}