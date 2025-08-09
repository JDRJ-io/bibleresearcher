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
    // Position tooltip to the LEFT of the scrollbar with some padding
    setPosition({
      x: rect.right - 180, // Move tooltip LEFT of scrollbar
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