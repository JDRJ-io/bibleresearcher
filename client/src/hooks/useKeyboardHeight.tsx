import { useEffect } from 'react';

export function useKeyboardHeight() {
  useEffect(() => {
    const root = document.documentElement;
    let largeVH = window.innerHeight;
    
    const v = (window as any).visualViewport;
    if (!v) {
      root.style.setProperty('--kb', '0px');
      root.style.setProperty('--lvh', `${largeVH}px`);
      return;
    }
    
    const updateLargeVH = () => {
      // Recalculate baseline when keyboard is hidden or orientation changes
      largeVH = window.innerHeight;
      root.style.setProperty('--lvh', `${largeVH}px`);
    };
    
    const onVisualViewportResize = () => {
      // When keyboard opens, visualViewport.height < largeVH
      const kb = Math.max(0, largeVH - v.height);
      
      // If visual viewport is back to full height, reset baseline
      if (kb < 20) {
        updateLargeVH();
      }
      
      // Only treat as keyboard if it's significant (ignore toolbars/minor changes)
      const keyboardHeight = kb > 80 ? kb : 0;
      root.style.setProperty('--kb', `${keyboardHeight}px`);
    };
    
    // Listen to orientation and window resize for baseline updates
    const onOrientationChange = () => {
      // Give browser time to settle after orientation change
      setTimeout(updateLargeVH, 100);
    };
    
    v.addEventListener('resize', onVisualViewportResize);
    window.addEventListener('orientationchange', onOrientationChange);
    window.addEventListener('resize', updateLargeVH);
    
    // Initial setup
    updateLargeVH();
    onVisualViewportResize();
    
    return () => {
      v.removeEventListener('resize', onVisualViewportResize);
      window.removeEventListener('orientationchange', onOrientationChange);
      window.removeEventListener('resize', updateLargeVH);
      root.style.setProperty('--kb', '0px');
    };
  }, []);
}
