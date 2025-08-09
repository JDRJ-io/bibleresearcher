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
    console.log('🎯 UPDATE TOOLTIP CALLED:', { 
      clientY, 
      hasContainer: !!containerRef.current, 
      verseKeysLength: verseKeys.length 
    });
    
    if (!containerRef.current || !verseKeys.length) {
      console.log('🎯 UPDATE TOOLTIP EARLY RETURN:', { 
        hasContainer: !!containerRef.current, 
        verseKeysLength: verseKeys.length 
      });
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
    
    console.log('🎯 TOOLTIP CALCULATION:', {
      rect: { width: rect.width, height: rect.height, top: rect.top, right: rect.right },
      relativeY,
      scrollPercentage,
      centerVerseIndex,
      clampedIndex,
      verse,
      totalVerses
    });
    
    setVerseRef(verse);
    setPosition({
      x: rect.right + 15, // Position to the right of the scrollbar with some spacing
      y: clientY // Center vertically on cursor
    });
  }, [containerRef, totalVerses, verseKeys]);

  // Update tooltip when mouse position changes during dragging - optimized with requestAnimationFrame
  useEffect(() => {
    console.log('🎯 TOOLTIP EFFECT TRIGGERED:', {
      isVisible,
      hasMousePosition: !!mousePosition,
      mousePosition,
      hasContainer: !!containerRef.current
    });
    
    if (!isVisible || !mousePosition || !containerRef.current) {
      console.log('🎯 TOOLTIP EFFECT EARLY RETURN:', {
        isVisible,
        hasMousePosition: !!mousePosition,
        hasContainer: !!containerRef.current
      });
      return;
    }
    
    let rafId: number;
    const updateFrame = () => {
      try {
        console.log('🎯 TOOLTIP RAF FRAME EXECUTING with mouseY:', mousePosition.y);
        updateTooltip(mousePosition.y);
      } catch (error) {
        console.warn('ScrollbarTooltip updateTooltip error:', error);
      }
    };
    
    rafId = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(rafId);
  }, [isVisible, mousePosition, updateTooltip]);

  console.log('🎯 TOOLTIP RENDER:', { 
    isVisible, 
    verseRef, 
    mousePosition,
    position,
    verseKeysLength: verseKeys.length,
    totalVerses,
    containerExists: !!containerRef.current
  });
  
  if (!isVisible || !verseRef) return null;

  return (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-50%)',
      }}
    >
      {/* Modern glass morphism tooltip with blue theme */}
      <div className="relative bg-blue-600/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-2xl border border-blue-400/30">
        <div className="text-xs font-medium opacity-90 tracking-wide uppercase">Center Verse</div>
        <div className="text-lg font-bold tracking-tight">{verseRef}</div>
        
        {/* Smooth animated arrow pointing to scrollbar */}
        <div 
          className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[10px] border-b-[10px] border-r-[12px] border-t-transparent border-b-transparent border-r-blue-600/95"
          style={{ marginRight: '-1px' }}
        />
      </div>
    </div>
  );
}