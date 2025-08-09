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
    
    // Calculate which verse based on mouse Y position
    const relativeY = Math.max(0, Math.min(rect.height, mousePosition.y - rect.top));
    const scrollPercentage = relativeY / rect.height;
    const centerVerseIndex = Math.floor(scrollPercentage * (totalVerses - 1));
    const clampedIndex = Math.max(0, Math.min(centerVerseIndex, totalVerses - 1));
    const verse = verseKeys[clampedIndex] || 'Gen.1:1';
    
    setVerseRef(verse);
    setPosition({
      x: rect.right + 20,
      y: mousePosition.y
    });
  }, [isVisible, mousePosition, containerRef, totalVerses, verseKeys]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed pointer-events-none bg-red-600 text-white px-4 py-3 rounded-lg font-bold text-lg shadow-2xl border-2 border-red-400"
      style={{
        left: `${mousePosition?.x ? mousePosition.x + 20 : 100}px`,
        top: `${mousePosition?.y ? mousePosition.y : 100}px`,
        transform: 'translateY(-50%)',
        zIndex: 999999,
      }}
    >
      TOOLTIP TEST: {verseRef} - DRAG: {isVisible ? 'YES' : 'NO'}
    </div>
  );
}