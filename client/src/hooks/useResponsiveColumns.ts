import { useState, useEffect, useMemo } from 'react';

export interface ResponsiveColumnConfig {
  isPortrait: boolean;
  isLandscape: boolean;
  isTouchDevice: boolean;
  columnAlignment: 'centered' | 'left-based';
  enableHorizontalScroll: boolean;
  referenceWidth: string;
  mainTranslationWidth: string;
  crossRefWidth: string;
  containerClass: string;
  // Enhanced responsive properties for intelligent column management
  screenWidth: number;
  availableWidth: number;
  maxColumnsBeforeScroll: number;
  shouldOptimizeForPortrait: boolean;
  columnPixelWidths: {
    reference: number;
    mainTranslation: number;
    crossReference: number;
    alternate: number;
    prophecy: number;
    notes: number;
    context: number;
  };
}

export function useResponsiveColumns(): ResponsiveColumnConfig {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const config = useMemo((): ResponsiveColumnConfig => {
    const { width, height } = windowSize;
    const isPortrait = height > width;
    const isLandscape = width > height;
    const isTouchDevice = 'ontouchstart' in window;
    
    // Calculate available width (accounting for scrollbars and padding)
    const availableWidth = width - 20; // 20px for scrollbars/padding
    
    // Intelligent column width calculation based on screen size
    const calculateOptimalWidths = () => {
      if (isPortrait) {
        // Portrait mode: Maximize available width utilization
        const isSmallScreen = width <= 480;
        const isMediumScreen = width > 480 && width <= 768;
        
        if (isSmallScreen) {
          // Ultra-compact for small screens - use 95% of available width
          const usableWidth = Math.floor(availableWidth * 0.95);
          const refWidth = 32; // Minimal reference
          const remaining = usableWidth - refWidth;
          const equalColumnWidth = Math.floor(remaining / 2); // Split remaining equally
          
          return {
            reference: refWidth,
            mainTranslation: equalColumnWidth,
            crossReference: equalColumnWidth,
            alternate: Math.floor(equalColumnWidth * 0.8), // Slightly smaller alternates
            prophecy: 50,
            notes: Math.floor(equalColumnWidth * 0.9),
            context: 120
          };
        } else if (isMediumScreen) {
          // Medium screens - optimize but give more breathing room
          const usableWidth = Math.floor(availableWidth * 0.9);
          const refWidth = 40;
          const remaining = usableWidth - refWidth;
          const equalColumnWidth = Math.floor(remaining / 2);
          
          return {
            reference: refWidth,
            mainTranslation: equalColumnWidth,
            crossReference: equalColumnWidth,
            alternate: Math.floor(equalColumnWidth * 0.85),
            prophecy: 60,
            notes: equalColumnWidth,
            context: 140
          };
        } else {
          // Large portrait screens (tablets)
          return {
            reference: 50,
            mainTranslation: 220,
            crossReference: 220,
            alternate: 200,
            prophecy: 70,
            notes: 220,
            context: 160
          };
        }
      } else {
        // Landscape mode: Standard larger widths
        return {
          reference: 80,
          mainTranslation: 320,
          crossReference: 320,
          alternate: 280,
          prophecy: 80,
          notes: 300,
          context: 200
        };
      }
    };
    
    const pixelWidths = calculateOptimalWidths();
    
    // Calculate how many core columns can fit before horizontal scroll is needed
    const coreColumnsWidth = pixelWidths.reference + pixelWidths.mainTranslation + pixelWidths.crossReference;
    const maxColumnsBeforeScroll = Math.floor(availableWidth / 160); // Rough estimate
    
    return {
      isPortrait,
      isLandscape,
      isTouchDevice,
      columnAlignment: isPortrait ? 'left-based' : 'centered',
      enableHorizontalScroll: true, // Always enable for 20-column system
      referenceWidth: `${pixelWidths.reference}px`,
      mainTranslationWidth: `${pixelWidths.mainTranslation}px`,
      crossRefWidth: `${pixelWidths.crossReference}px`,
      containerClass: isPortrait ? 'overflow-x-auto flex-nowrap' : 'overflow-x-auto justify-start',
      // Enhanced properties
      screenWidth: width,
      availableWidth,
      maxColumnsBeforeScroll,
      shouldOptimizeForPortrait: isPortrait && width <= 768,
      columnPixelWidths: pixelWidths
    };
  }, [windowSize]);

  return config;
}