import { useState, useEffect, useCallback } from 'react';
import { ROW_HEIGHT } from '@/constants/layout';

interface ScrollbarTooltipProps {
  containerRef: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
  mousePosition?: { x: number; y: number };
  currentCenterVerse: string; // Pass the actual center verse directly
}

export function ScrollbarTooltip({ 
  containerRef, 
  isVisible, 
  mousePosition,
  currentCenterVerse
}: ScrollbarTooltipProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Update tooltip position when mouse moves during dragging
  useEffect(() => {
    if (!isVisible || !mousePosition || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    setPosition({
      x: rect.right - 80, // Position to the left of scrollbar with some padding
      y: mousePosition.y
    });
  }, [isVisible, mousePosition, containerRef]);

  if (!isVisible || !currentCenterVerse) return null;

  return (
    <div
      className="fixed z-[9999] pointer-events-none bg-blue-900 dark:bg-blue-800 text-white px-3 py-2 rounded-md shadow-lg text-sm font-bold whitespace-nowrap"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-50%)',
        fontSize: '14px',
        fontWeight: '700',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        border: '2px solid rgb(59, 130, 246)',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
      }}
    >
      {currentCenterVerse}
    </div>
  );
}