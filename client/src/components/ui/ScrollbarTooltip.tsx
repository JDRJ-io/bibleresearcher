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
  const [verseRef, setVerseRef] = useState('');

  // High-performance tooltip update with modern optimizations
  const updateTooltip = useCallback((clientY: number) => {
    if (!containerRef.current || !verseKeys.length) {
      return;
    }

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Calculate scroll position based on mouse Y position relative to the scroll container
    const relativeY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const scrollPercentage = relativeY / rect.height;
    
    // Calculate which verse would be at the CENTER based on scroll percentage
    const centerVerseIndex = Math.floor(scrollPercentage * (totalVerses - 1));
    const clampedIndex = Math.max(0, Math.min(centerVerseIndex, totalVerses - 1));
    
    // Get verse reference efficiently
    const verse = verseKeys[clampedIndex] || verseKeys[0] || 'Gen.1:1';
    
    setVerseRef(verse);
    setPosition({
      x: rect.right + 15, // Position to the right of the scrollbar with some spacing
      y: clientY // Center vertically on cursor
    });
  }, [containerRef, totalVerses, verseKeys]);

  // Update tooltip when mouse position changes during dragging - optimized with requestAnimationFrame
  useEffect(() => {
    if (!isVisible || !mousePosition || !containerRef.current) {
      return;
    }
    
    let rafId: number;
    const updateFrame = () => {
      try {
        updateTooltip(mousePosition.y);
      } catch (error) {
        console.warn('ScrollbarTooltip updateTooltip error:', error);
      }
    };
    
    rafId = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(rafId);
  }, [isVisible, mousePosition, updateTooltip]);

  // Force visibility during drag and show default verse if no verseRef yet
  if (!isVisible) {
    return null;
  }
  
  const displayRef = verseRef || 'Loading...';

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-50%)',
        zIndex: 10000,
      }}
    >
      {/* Bold tooltip with high visibility */}
      <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-xl border-2 border-blue-400 font-bold text-lg">
        {displayRef}
        
        {/* Arrow pointing left to scrollbar */}
        <div 
          className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[8px] border-b-[8px] border-r-[8px] border-t-transparent border-b-transparent border-r-blue-600"
        />
      </div>
    </div>
  );
}