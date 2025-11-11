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
      const isPortrait = height > width;
      
      // Calculate header scale based on screen resolution and orientation
      let headerScale = 1.0;
      let menuScale = 1.0;
      
      // Special portrait mode constraints - more conservative sizing
      if (isPortrait && width <= 640) {
        // Portrait mobile - very compact header to maximize content space
        headerScale = 0.75;
        menuScale = 0.8;
      } else if (isPortrait && width <= 768) {
        // Portrait tablet - slightly larger but still compact
        headerScale = 0.8;
        menuScale = 0.85;
      } else if (width >= 1920) {
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
        // Landscape mobile - compact UI
        headerScale = 0.85;
        menuScale = 0.9;
      }
      
      // Apply adaptive scaling to CSS variables
      document.documentElement.style.setProperty('--adaptive-header-scale', headerScale.toString());
      document.documentElement.style.setProperty('--adaptive-menu-scale', menuScale.toString());
      
      // Apply scaling to logo and icon sizes for consistency
      const logoScale = headerScale; // Use same scale as header
      // For mobile portrait, make text even smaller to prevent layout issues
      const textScale = (isPortrait && width <= 640) ? logoScale * 0.7 : logoScale;
      
      // Logo is now fixed at 32px (w-8 h-8) to match other buttons
      document.documentElement.style.setProperty('--anointed-logo-size', '32px');
      document.documentElement.style.setProperty('--anointed-text-size', `${Math.round(24 * textScale)}px`);
      document.documentElement.style.setProperty('--anointed-icon-size', '16px');
      document.documentElement.style.setProperty('--anointed-spacing', `${Math.round(8 * logoScale)}px`);
      
      // Update CSS variables for top header heights based on orientation and size
      const baseDesktopHeight = 64;
      const baseMobileHeight = 48;
      const actualDesktopHeight = Math.round(baseDesktopHeight * headerScale);
      const actualMobileHeight = Math.round(baseMobileHeight * headerScale);
      
      document.documentElement.style.setProperty('--top-header-height-desktop', `${actualDesktopHeight}px`);
      document.documentElement.style.setProperty('--top-header-height-mobile', `${actualMobileHeight}px`);
      document.documentElement.style.setProperty('--column-header-height', isPortrait ? '20px' : '20px');
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