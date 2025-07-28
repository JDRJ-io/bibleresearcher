import { useEffect } from 'react';

/**
 * Hook for automatic adaptive sizing based on screen resolution
 * Handles top header and menu scaling automatically
 */
export function useAdaptiveScaling() {
  useEffect(() => {
    const updateAdaptiveScaling = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Calculate header scale based on screen resolution
      let headerScale = 1.0;
      let menuScale = 1.0;
      
      // Adaptive scaling based on screen resolution
      if (width >= 1920) {
        // Large screens (1920px+) - slightly larger UI
        headerScale = 1.1;
        menuScale = 1.05;
      } else if (width >= 1440) {
        // Medium-large screens (1440-1919px) - standard size
        headerScale = 1.0;
        menuScale = 1.0;
      } else if (width >= 1024) {
        // Medium screens (1024-1439px) - slightly smaller
        headerScale = 0.95;
        menuScale = 0.98;
      } else if (width >= 768) {
        // Small screens (768-1023px) - smaller UI
        headerScale = 0.9;
        menuScale = 0.95;
      } else {
        // Mobile screens (<768px) - compact UI
        headerScale = 0.85;
        menuScale = 0.9;
      }
      
      // Apply adaptive scaling to CSS variables
      document.documentElement.style.setProperty('--adaptive-header-scale', headerScale.toString());
      document.documentElement.style.setProperty('--adaptive-menu-scale', menuScale.toString());
    };
    
    // Initial calculation
    updateAdaptiveScaling();
    
    // Update on resize
    window.addEventListener('resize', updateAdaptiveScaling);
    
    return () => {
      window.removeEventListener('resize', updateAdaptiveScaling);
    };
  }, []);
}