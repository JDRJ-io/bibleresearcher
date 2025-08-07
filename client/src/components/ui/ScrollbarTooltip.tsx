import { useState, useEffect, useCallback } from 'react';
import { getVerseKeyByIndex } from '@/lib/verseKeysLoader';

interface ScrollbarTooltipProps {
  containerRef: React.RefObject<HTMLDivElement>;
  totalVerses: number;
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
}

export function ScrollbarTooltip({ 
  containerRef, 
  totalVerses, 
  isVisible, 
  onVisibilityChange 
}: ScrollbarTooltipProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [verseRef, setVerseRef] = useState('');
  const [isDragging, setIsDragging] = useState(false);

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

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      // Check if click is on or near the scrollbar
      const rect = container.getBoundingClientRect();
      const scrollbarWidth = 24; // Match mobile scrollbar width
      const isOnScrollbar = e.clientX >= rect.right - scrollbarWidth;
      
      if (isOnScrollbar) {
        setIsDragging(true);
        onVisibilityChange(true);
        updateTooltip(e.clientY);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateTooltip(e.clientY);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onVisibilityChange(false);
      }
    };

    // Touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      const scrollbarWidth = 24;
      const isOnScrollbar = touch.clientX >= rect.right - scrollbarWidth;
      
      if (isOnScrollbar) {
        setIsDragging(true);
        onVisibilityChange(true);
        updateTooltip(touch.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        const touch = e.touches[0];
        updateTooltip(touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        onVisibilityChange(false);
      }
    };

    // Add event listeners
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, isDragging, onVisibilityChange, updateTooltip]);

  if (!isVisible || !verseRef) return null;

  return (
    <div
      className="fixed z-[9999] pointer-events-none bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-1 rounded-md shadow-lg text-sm font-medium transform -translate-y-1/2 whitespace-nowrap"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        fontSize: '12px',
        fontWeight: '600',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.1s ease-out'
      }}
    >
      {verseRef}
      {/* Small arrow pointing to scrollbar */}
      <div 
        className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-100"
        style={{ marginRight: '-1px' }}
      />
    </div>
  );
}