import { useState, useEffect, useCallback, useRef } from 'react';
import { getVerseKeyByIndex } from '@/lib/verseKeysLoader';
import { ROW_HEIGHT } from '@/constants/layout';

interface ScrollbarTooltipProps {
  containerRef: React.RefObject<HTMLDivElement>;
  totalVerses: number;
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  mousePosition?: { x: number; y: number } | null;
  isDragging?: boolean;
}

export function ScrollbarTooltip({ 
  containerRef, 
  totalVerses, 
  isVisible, 
  onVisibilityChange,
  mousePosition,
  isDragging = false
}: ScrollbarTooltipProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [verseRef, setVerseRef] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdateTimeRef = useRef(0);

  // Throttled update for performance during scrollbar dragging
  const updateTooltip = useCallback((clientY: number) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    
    // Throttle updates to 60fps max (16ms interval)
    if (timeSinceLastUpdate < 16 && !isDragging) {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => updateTooltip(clientY), 16 - timeSinceLastUpdate);
      return;
    }
    
    lastUpdateTimeRef.current = now;

    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Calculate which verse this scroll position would show
    const relativeY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const scrollPercentage = relativeY / rect.height;
    const maxScroll = container.scrollHeight - container.clientHeight;
    const targetScroll = scrollPercentage * maxScroll;
    
    // Convert scroll position to verse index using actual ROW_HEIGHT
    const verseIndex = Math.round(targetScroll / ROW_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(verseIndex, totalVerses - 1));
    
    // Get verse reference
    const verse = getVerseKeyByIndex(clampedIndex) || 'Gen.1:1';
    
    setVerseRef(verse);
    
    // Position tooltip to the right of scrollbar area, with smart positioning
    const tooltipWidth = 80; // Estimated tooltip width
    const tooltipX = rect.right + 12;
    const tooltipY = Math.max(20, Math.min(window.innerHeight - 40, clientY));
    
    setPosition({
      x: tooltipX + tooltipWidth > window.innerWidth ? rect.left - tooltipWidth - 12 : tooltipX,
      y: tooltipY
    });
  }, [containerRef, totalVerses, isDragging]);

  // Update tooltip when mouse position changes
  useEffect(() => {
    if (!isVisible || !mousePosition) return;
    
    setIsAnimating(true);
    updateTooltip(mousePosition.y);
    
    // Clear animation state after transition
    const animationTimer = setTimeout(() => setIsAnimating(false), 150);
    return () => clearTimeout(animationTimer);
  }, [isVisible, mousePosition, updateTooltip]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  if (!isVisible || !verseRef) return null;

  return (
    <div
      className={`fixed z-[9999] pointer-events-none transition-all duration-150 ease-out transform ${
        isAnimating ? 'scale-105' : 'scale-100'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-50%)',
      }}
    >
      {/* Glass morphism tooltip */}
      <div
        className="relative bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-lg px-3 py-2 shadow-xl border border-white/20 dark:border-white/10"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(12px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(12px) saturate(1.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        <div 
          className="text-gray-900 dark:text-white font-medium whitespace-nowrap"
          style={{
            fontSize: '12px',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            letterSpacing: '0.025em',
            lineHeight: '1.3'
          }}
        >
          {verseRef}
        </div>
        
        {/* Elegant arrow indicator */}
        <div 
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            left: position.x > window.innerWidth / 2 ? 'calc(100% - 2px)' : '-6px',
            width: '6px',
            height: '6px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1px',
            transform: 'rotate(45deg) translateY(-50%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        />
      </div>
    </div>
  );
}