import { useState, useEffect, useRef } from 'react';

interface ScrollPreviewTooltipProps {
  verseKeys: string[];
  containerRef: React.RefObject<HTMLDivElement>;
  isScrolling: boolean;
}

export function ScrollPreviewTooltip({ 
  verseKeys, 
  containerRef, 
  isScrolling 
}: ScrollPreviewTooltipProps) {
  const [currentVerse, setCurrentVerse] = useState<string>('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isScrolling || !containerRef.current || !verseKeys.length) {
      return;
    }

    const updateCurrentVerse = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const rowHeight = 40; // ROW_HEIGHT constant from VirtualRow
      
      // Calculate current verse index based on scroll position
      const currentIndex = Math.floor(scrollTop / rowHeight);
      const clampedIndex = Math.max(0, Math.min(currentIndex, verseKeys.length - 1));
      
      const verse = verseKeys[clampedIndex] || 'Gen.1:1';
      setCurrentVerse(verse);

      // Position tooltip in center-right of viewport
      const rect = container.getBoundingClientRect();
      setPosition({
        x: window.innerWidth - 120,
        y: rect.top + rect.height / 2
      });
    };

    // Update immediately
    updateCurrentVerse();

    // Set up scroll listener for real-time updates
    const handleScroll = () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(updateCurrentVerse, 16); // ~60fps
    };

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [isScrolling, verseKeys, containerRef]);

  // Don't show if not scrolling or no verse
  if (!isScrolling || !currentVerse) {
    return null;
  }

  return (
    <div
      className="fixed z-50 pointer-events-none transition-all duration-200 ease-out"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-50%)',
      }}
    >
      {/* Simple glass morphism tooltip */}
      <div
        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="text-gray-900 dark:text-white font-medium text-sm whitespace-nowrap">
          {currentVerse}
        </div>
      </div>
    </div>
  );
}