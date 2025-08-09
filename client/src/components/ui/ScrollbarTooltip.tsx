import { useState, useEffect, useCallback } from 'react';

interface ScrollbarTooltipProps {
  containerRef: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  mousePosition?: { x: number; y: number };
  verseKeys: string[];
  anchorIndex: number;
}

export function ScrollbarTooltip({ 
  containerRef, 
  isVisible, 
  onVisibilityChange,
  mousePosition,
  verseKeys,
  anchorIndex
}: ScrollbarTooltipProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [verseRef, setVerseRef] = useState('Gen.1:1');

  // Update tooltip position and verse based on loaded verse keys
  useEffect(() => {
    if (!isVisible || !mousePosition || !containerRef.current || !verseKeys.length) {
      return;
    }

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Simply read the current center verse from the loaded verse keys
    // The anchorIndex represents what's currently centered in the viewport
    const currentCenterVerse = verseKeys[anchorIndex] || verseKeys[0] || 'Gen.1:1';
    
    console.log('🎯 TOOLTIP SIMPLE:', {
      anchorIndex,
      currentCenterVerse,
      verseKeysLength: verseKeys.length,
      mouseY: mousePosition.y
    });
    
    setVerseRef(currentCenterVerse);
    
    // Position tooltip to the LEFT of the scrollbar at mouse Y position
    setPosition({
      x: rect.right - 180,
      y: mousePosition.y
    });
  }, [isVisible, mousePosition, containerRef, verseKeys, anchorIndex]);

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