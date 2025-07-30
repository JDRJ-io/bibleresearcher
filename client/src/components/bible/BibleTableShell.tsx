/**
 * Expert's Two-Mode Bible Table Shell
 * Production-ready container that handles both portrait and landscape orientations
 * 
 * Features:
 * - Single scroll ref shared by verse-jump & anchor logic
 * - Center-until-overflow behavior in landscape
 * - Exact three-column fit in portrait
 * - Smooth orientation transitions
 */

import React, { useRef, useEffect } from 'react';

interface BibleTableShellProps {
  children: React.ReactNode;
  onScrollRef?: (ref: React.RefObject<HTMLDivElement>) => void;
}

export function BibleTableShell({ children, onScrollRef }: BibleTableShellProps) {
  // Single ref shared by verse-jump & anchor logic
  const scrollRef = useRef<HTMLDivElement>(null);

  // Expose scroll ref to parent components
  useEffect(() => {
    if (onScrollRef) {
      onScrollRef(scrollRef);
    }
  }, [onScrollRef]);

  // Center-if-fits logic for landscape mode
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let userScrolled = false;
    let lastScrollLeft = 0;

    const handleScroll = () => {
      const currentScrollLeft = container.scrollLeft;
      if (Math.abs(currentScrollLeft - lastScrollLeft) > 5) {
        userScrolled = true;
      }
      lastScrollLeft = currentScrollLeft;
    };

    const handleResize = () => {
      // Only auto-center if user hasn't manually scrolled
      if (!userScrolled) {
        const track = container.firstElementChild as HTMLElement;
        if (track) {
          const containerWidth = container.clientWidth;
          const trackWidth = track.scrollWidth;
          
          // Center if track fits within container
          if (trackWidth <= containerWidth) {
            container.scrollLeft = 0; // Let mx-auto CSS handle centering
          }
        }
      }
    };

    // Handle orientation changes and resizes
    const mediaQuery = window.matchMedia('(orientation: landscape)');
    const orientationHandler = () => {
      // Reset user scroll flag on orientation change
      userScrolled = false;
      setTimeout(handleResize, 100); // Small delay for CSS to apply
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    mediaQuery.addEventListener('change', orientationHandler);

    // Initial check
    handleResize();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', orientationHandler);
    };
  }, []);

  return (
    /* Horizontal scroller */
    <div
      ref={scrollRef}
      className="
        w-full h-full
        overflow-x-auto overflow-y-hidden
        overscroll-x-contain touch-pan-x
        scroll-smooth
      "
      style={{
        // Ensure smooth scrolling behavior
        scrollBehavior: 'smooth',
      }}
    >
      {/* Flex track that grows to its content width */}
      <div
        className="
          flex flex-row items-stretch
          w-max mx-auto
          portrait:h-full
          min-h-full
        "
      >
        {children}
      </div>
    </div>
  );
}