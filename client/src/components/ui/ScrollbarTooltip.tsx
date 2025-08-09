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

  const updateTooltip = useCallback((clientY: number) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Calculate scroll position based on mouse Y position relative to the scroll container
    const relativeY = clientY - rect.top;
    const scrollPercentage = Math.max(0, Math.min(1, relativeY / rect.height));
    const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
    const targetScrollTop = scrollPercentage * maxScroll;
    
    // Calculate which verse would be at the CENTER of the viewport at this scroll position
    const ROW_HEIGHT = 60; // Match the row height from layout constants
    const viewportCenter = container.clientHeight / 2;
    const centerScrollPosition = targetScrollTop + viewportCenter;
    const centerVerseIndex = Math.floor(centerScrollPosition / ROW_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(centerVerseIndex, totalVerses - 1));
    
    // Get verse reference that will be at center when scroll ends
    const verse = getVerseKeyByIndex(clampedIndex) || 'Gen.1:1';
    
    setVerseRef(verse);
    setPosition({
      x: rect.right + 15, // Position to the right of the scrollbar with some spacing
      y: clientY // Center vertically on cursor
    });
  }, [containerRef, totalVerses]);

  // Update tooltip when mouse position changes during dragging
  useEffect(() => {
    if (!isVisible || !mousePosition || !containerRef.current) return;
    
    try {
      updateTooltip(mousePosition.y);
    } catch (error) {
      console.warn('ScrollbarTooltip updateTooltip error:', error);
    }
  }, [isVisible, mousePosition, containerRef, totalVerses, updateTooltip]);

  // No need for separate event listeners - this will be controlled by VirtualBibleTable's scrollbar events

  if (!isVisible || !verseRef) return null;

  return (
    <div
      className="fixed z-[9999] pointer-events-none bg-blue-600 dark:bg-blue-500 text-white px-3 py-2 rounded-lg shadow-2xl text-sm font-semibold transform -translate-y-1/2 whitespace-nowrap border-2 border-blue-400 dark:border-blue-300"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        fontSize: '13px',
        fontWeight: '600',
        fontFamily: 'Inter, system-ui, sans-serif',
        backdropFilter: 'blur(8px)',
        animation: 'slideInRight 0.15s ease-out',
        minHeight: '40px',
        lineHeight: '1.3',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className="flex flex-col items-center">
        <div className="text-xs opacity-90 font-medium tracking-wide">CENTER VERSE</div>
        <div className="text-base font-bold tracking-tight">{verseRef}</div>
      </div>
      {/* Enhanced arrow pointing to scrollbar */}
      <div 
        className="absolute right-full top-1/2 transform -translate-y-1/2"
        style={{ marginRight: '-1px' }}
      >
        <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-r-[8px] border-t-transparent border-b-transparent border-r-blue-600 dark:border-r-blue-500" />
        <div className="absolute top-1/2 transform -translate-y-1/2 right-[6px] w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent border-r-blue-400 dark:border-r-blue-300" />
      </div>
    </div>
  );
}