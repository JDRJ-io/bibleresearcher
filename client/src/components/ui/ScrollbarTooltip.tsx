import { useState, useEffect, useCallback } from 'react';
import { getVerseKeyByIndex } from '@/lib/verseKeysLoader';

interface ScrollbarTooltipProps {
  containerRef: React.RefObject<HTMLDivElement>;
  totalVerses: number;
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  mousePosition?: { x: number; y: number }; // Position from VirtualBibleTable
}

export function ScrollbarTooltip({ 
  containerRef, 
  totalVerses, 
  isVisible, 
  onVisibilityChange,
  mousePosition 
}: ScrollbarTooltipProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [verseRef, setVerseRef] = useState('');

  // Update tooltip when mouse position changes during dragging
  useEffect(() => {
    if (!isVisible || !mousePosition || !containerRef.current) return;
    
    updateTooltip(mousePosition.y);
  }, [isVisible, mousePosition, containerRef, totalVerses]);

  const updateTooltip = useCallback((clientY: number) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Calculate which verse this scroll position would show
    const relativeY = clientY - rect.top;
    const scrollPercentage = Math.max(0, Math.min(1, relativeY / rect.height));
    const maxScroll = container.scrollHeight - container.clientHeight;
    const targetScroll = scrollPercentage * maxScroll;
    
    // Convert scroll position to verse index
    const ROW_HEIGHT = 60; // Match the row height from layout constants
    const verseIndex = Math.round(targetScroll / ROW_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(verseIndex, totalVerses - 1));
    
    // Get verse reference
    const verse = getVerseKeyByIndex(clampedIndex) || 'Gen.1:1';
    
    setVerseRef(verse);
    setPosition({
      x: rect.right + 10, // Position to the right of the scrollbar
      y: clientY - 15 // Center vertically on cursor
    });
  }, [containerRef, totalVerses]);

  // No need for separate event listeners - this will be controlled by VirtualBibleTable's scrollbar events

  if (!isVisible || !verseRef) return null;

  return (
    <div
      className="fixed z-[9999] pointer-events-none bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2 py-1 rounded shadow-lg text-xs font-medium transform -translate-y-1/2 whitespace-nowrap"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        fontSize: '11px',
        fontWeight: '500',
        fontFamily: 'Dancing Script, cursive',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.1s ease-out',
        maxHeight: '24px',
        lineHeight: '1.2'
      }}
    >
      {verseRef}
      {/* Small arrow pointing to scrollbar */}
      <div 
        className="absolute right-full top-1/2 transform -translate-y-1/2 border-2 border-transparent border-r-gray-900 dark:border-r-gray-100"
        style={{ marginRight: '-1px' }}
      />
    </div>
  );
}