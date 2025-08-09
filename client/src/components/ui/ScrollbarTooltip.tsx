import { useState, useEffect, useCallback } from 'react';

interface ScrollbarTooltipProps {
  containerRef: React.RefObject<HTMLDivElement>;
  totalVerses: number;
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  mousePosition?: { x: number; y: number };
  verseKeys: string[];
}

export function ScrollbarTooltip({ 
  containerRef, 
  totalVerses, 
  isVisible, 
  onVisibilityChange,
  mousePosition,
  verseKeys
}: ScrollbarTooltipProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [verseRef, setVerseRef] = useState('Gen.1:1');

  // Update tooltip position and verse based on current scrollbar dragger position
  useEffect(() => {
    if (!isVisible || !mousePosition || !containerRef.current || !verseKeys.length) {
      return;
    }

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const ROW_HEIGHT = 40;
    
    // Get CURRENT scroll position (what's already centered)
    const currentScrollTop = container.scrollTop;
    
    // Calculate which verse is CURRENTLY at the center based on scrollbar dragger position
    const viewportCenter = (window.innerHeight - 85) / 2;
    const currentCenterScrollPosition = currentScrollTop + viewportCenter;
    const currentCenterVerseIndex = Math.floor(currentCenterScrollPosition / ROW_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(currentCenterVerseIndex, totalVerses - 1));
    const currentCenterVerse = verseKeys[clampedIndex] || 'Gen.1:1';
    
    // DEBUG: Log the calculation details
    console.log('🐛 TOOLTIP DEBUG:', {
      currentScrollTop,
      viewportCenter,
      currentCenterScrollPosition,
      currentCenterVerseIndex,
      clampedIndex,
      currentCenterVerse,
      totalVerses,
      ROW_HEIGHT,
      windowHeight: window.innerHeight,
      verseKeysLength: verseKeys.length,
      firstVerse: verseKeys[0],
      lastVerse: verseKeys[verseKeys.length - 1]
    });
    
    setVerseRef(currentCenterVerse);
    
    // Position tooltip to the LEFT of the scrollbar at mouse Y position
    setPosition({
      x: rect.right - 180,
      y: mousePosition.y
    });
  }, [isVisible, mousePosition, containerRef, totalVerses, verseKeys]);

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