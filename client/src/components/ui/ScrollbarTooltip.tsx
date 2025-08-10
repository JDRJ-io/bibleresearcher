import { useState, useEffect, useCallback } from 'react';
import { getVerseKeyByIndex } from '@/lib/verseKeysLoader';
import { ROW_HEIGHT } from '@/constants/layout';

interface ScrollbarTooltipProps {
  containerRef: React.RefObject<HTMLDivElement>;
  totalVerses: number;
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  mousePosition?: { x: number; y: number }; // Position from VirtualBibleTable
  currentScrollTop?: number; // Current scroll position during dragging
  verseKeys: string[]; // Verse keys array for direct access
}

export function ScrollbarTooltip({ 
  containerRef, 
  totalVerses, 
  isVisible, 
  onVisibilityChange,
  mousePosition,
  currentScrollTop,
  verseKeys
}: ScrollbarTooltipProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [verseRef, setVerseRef] = useState('');

  // Update tooltip when scroll position changes during dragging
  useEffect(() => {
    if (!isVisible || !mousePosition || !containerRef.current || currentScrollTop === undefined) return;
    
    updateTooltip();
  }, [isVisible, mousePosition, containerRef, totalVerses, currentScrollTop, verseKeys]);

  const updateTooltip = useCallback(() => {
    if (!containerRef.current || !mousePosition || currentScrollTop === undefined) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Calculate center verse index from current scroll position
    const scrollCenter = currentScrollTop + container.clientHeight / 2;
    const centerIndex = Math.round(scrollCenter / ROW_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(centerIndex, verseKeys.length - 1));
    
    // Get verse reference directly from verseKeys array
    const verse = verseKeys[clampedIndex] || 'Gen.1:1';
    
    setVerseRef(verse);
    setPosition({
      x: rect.left - 10, // Position to the LEFT of the scrollbar as requested
      y: mousePosition.y - 15 // Center vertically on cursor
    });
  }, [containerRef, mousePosition, currentScrollTop, verseKeys]);

  // No need for separate event listeners - this will be controlled by VirtualBibleTable's scrollbar events

  if (!isVisible || !verseRef) return null;

  return (
    <div
      className="fixed z-[9999] pointer-events-none bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded shadow-lg text-sm font-medium whitespace-nowrap"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-100%) translateY(-50%)', // Position to left of cursor
        fontSize: '13px',
        fontWeight: '600',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.1s ease-out'
      }}
    >
      {verseRef}
    </div>
  );
}