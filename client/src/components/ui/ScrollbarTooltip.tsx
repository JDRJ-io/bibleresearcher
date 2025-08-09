import { useState, useEffect, useCallback } from 'react';

interface ScrollbarTooltipProps {
  containerRef: React.RefObject<HTMLDivElement>;
  totalVerses: number;
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  mousePosition?: { x: number; y: number };
  verseKeys: string[];
  scrollTop: number;
}

export function ScrollbarTooltip({ 
  containerRef, 
  totalVerses, 
  isVisible, 
  onVisibilityChange,
  mousePosition,
  verseKeys,
  scrollTop
}: ScrollbarTooltipProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [verseRef, setVerseRef] = useState('Gen.1:1');

  // Update tooltip position and verse based on current scrollTop state
  useEffect(() => {
    if (!isVisible || !mousePosition || !containerRef.current || !verseKeys.length) {
      return;
    }

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const ROW_HEIGHT = 40;
    
    // Use the scrollTop state that gets updated during drag (from VirtualBibleTable)
    const currentScrollTop = scrollTop;
    
    // Calculate which verse is at the center based on this scroll position
    const viewportCenter = (window.innerHeight - 85) / 2;
    const currentCenterScrollPosition = currentScrollTop + viewportCenter;
    const currentCenterVerseIndex = Math.floor(currentCenterScrollPosition / ROW_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(currentCenterVerseIndex, totalVerses - 1));
    const currentCenterVerse = verseKeys[clampedIndex] || 'Gen.1:1';
    
    // DEBUG: Log the calculation details
    console.log('🐛 TOOLTIP DEBUG FIXED:', {
      scrollTopState: scrollTop,
      containerScrollTop: container.scrollTop,
      viewportCenter,
      currentCenterScrollPosition,
      currentCenterVerseIndex,
      clampedIndex,
      currentCenterVerse,
      totalVerses,
      ROW_HEIGHT
    });
    
    setVerseRef(currentCenterVerse);
    
    // Position tooltip to the LEFT of the scrollbar at mouse Y position
    setPosition({
      x: rect.right - 180,
      y: mousePosition.y
    });
  }, [isVisible, mousePosition, containerRef, totalVerses, verseKeys, scrollTop]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed pointer-events-none bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-sm shadow-lg border border-blue-400"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-50%)',
        zIndex: 999999,
      }}
    >
      {verseRef}
    </div>
  );
}