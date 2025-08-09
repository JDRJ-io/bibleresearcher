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

  // Update tooltip position and verse when mouse moves
  useEffect(() => {
    if (!isVisible || !mousePosition || !containerRef.current || !verseKeys.length) {
      return;
    }

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const ROW_HEIGHT = 40;
    
    // Get current scroll position from container
    const currentScrollTop = container.scrollTop;
    const maxScroll = Math.max(0, totalVerses * ROW_HEIGHT - window.innerHeight + 85);
    
    // Calculate where mouse drag would scroll to (same logic as scrollbar drag)
    const startY = rect.top + (currentScrollTop / maxScroll) * rect.height;
    const deltaY = mousePosition.y - startY;
    const scrollRatio = deltaY / (window.innerHeight - 85);
    const newScrollTop = Math.max(0, Math.min(maxScroll, currentScrollTop + (scrollRatio * maxScroll)));
    
    // Calculate which verse will be at center after this scroll position
    const viewportCenter = (window.innerHeight - 85) / 2;
    const centerScrollPosition = newScrollTop + viewportCenter;
    const centerVerseIndex = Math.floor(centerScrollPosition / ROW_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(centerVerseIndex, totalVerses - 1));
    const verse = verseKeys[clampedIndex] || 'Gen.1:1';
    
    setVerseRef(verse);
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