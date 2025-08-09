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

  console.log('🎯 ScrollbarTooltip render:', { isVisible, verseRef, mousePosition, position });
  
  if (!isVisible || !verseRef) return null;

  return (
    <div
      className="fixed z-[9999] pointer-events-none bg-blue-600 text-white px-4 py-3 rounded-lg shadow-2xl text-sm font-bold whitespace-nowrap"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-50%)',
        fontSize: '14px',
        fontWeight: '700',
        minWidth: '120px',
        textAlign: 'center',
        border: '2px solid #3b82f6',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.5)'
      }}
    >
      <div>CENTER VERSE</div>
      <div className="text-lg">{verseRef}</div>
      {/* Simple arrow pointing to scrollbar */}
      <div 
        className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[10px] border-b-[10px] border-r-[10px] border-t-transparent border-b-transparent border-r-blue-600"
        style={{ marginRight: '-1px' }}
      />
    </div>
  );
}