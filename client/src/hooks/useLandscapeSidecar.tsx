import { useEffect, useState } from 'react';

/**
 * Shared landscape detection hook for sidecar two-pane layouts
 * Uses Visual Viewport API for keyboard-aware detection
 * Returns true when aspect ratio ≥ 1.3 AND min-width ≥ 568px
 */
export function useLandscapeSidecar() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkLandscape = () => {
      const visualViewport = window.visualViewport;
      
      // Use Visual Viewport API (accounts for mobile keyboard, browser chrome)
      // Fall back to window dimensions if not available
      const width = visualViewport?.width ?? window.innerWidth;
      const height = visualViewport?.height ?? window.innerHeight;
      
      const aspectRatio = width / height;
      const isLandscapeMode = aspectRatio >= 1.3 && width >= 568;
      setIsLandscape(isLandscapeMode);
    };
    
    checkLandscape();
    
    // Listen to both window resize and visual viewport resize
    // Visual viewport changes when keyboard opens/closes
    const visualViewport = window.visualViewport;
    
    window.addEventListener('resize', checkLandscape);
    visualViewport?.addEventListener('resize', checkLandscape);
    
    return () => {
      window.removeEventListener('resize', checkLandscape);
      visualViewport?.removeEventListener('resize', checkLandscape);
    };
  }, []);

  return isLandscape;
}
