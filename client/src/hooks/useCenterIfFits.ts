
import { useEffect, useRef } from 'react';

export function useCenterIfFits(scrollRef: React.RefObject<HTMLDivElement>) {
  const userScrolledRef = useRef(false);
  const lastScrollLeftRef = useRef(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    // Track user scroll to avoid bouncing back on orientation change
    const handleScroll = () => {
      const currentScrollLeft = element.scrollLeft;
      if (Math.abs(currentScrollLeft - lastScrollLeftRef.current) > 5) {
        userScrolledRef.current = true;
      }
      lastScrollLeftRef.current = currentScrollLeft;
    };

    // Center track if it fits and user hasn't scrolled
    const centerIfFits = () => {
      const track = element.firstElementChild as HTMLElement;
      if (!track) return;

      const containerWidth = element.clientWidth;
      const trackWidth = track.scrollWidth;

      // Only center if track fits AND user hasn't manually scrolled
      if (trackWidth <= containerWidth && !userScrolledRef.current) {
        element.scrollLeft = 0; // Reset to natural centered position
      }
    };

    // Set up event listeners
    element.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', centerIfFits, { passive: true });
    
    // Initial centering
    centerIfFits();

    return () => {
      element.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', centerIfFits);
    };
  }, []);

  // Reset user scroll flag when explicitly navigating to verses
  const resetScrollFlag = () => {
    userScrolledRef.current = false;
  };

  return { resetScrollFlag };
}
