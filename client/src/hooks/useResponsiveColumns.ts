import { useState, useEffect, useMemo } from 'react';
import { useViewportStore } from "@/stores/viewportStore";

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
  // PERF FIX: Use viewport store instead of creating resize listener
  const viewportW = useViewportStore(s => s.viewportW);
  const viewportH = useViewportStore(s => s.viewportH);
  
  const [windowSize, setWindowSize] = useState({
    width: viewportW,
    height: viewportH,
  });

  useEffect(() => {
    setWindowSize({
      width: viewportW,
      height: viewportH,
    });
  }, [viewportW, viewportH]);

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
        const isSmallScreen = width <= 640;
        const isMediumScreen = width > 640 && width <= 768;
        
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
            alternate: equalColumnWidth, // Same as all other columns
            prophecy: equalColumnWidth, // Same as all other columns
            notes: equalColumnWidth,    // Same as all other columns
            context: equalColumnWidth   // Same as all other columns
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
            alternate: equalColumnWidth, // Same as all other columns
            prophecy: equalColumnWidth,  // Same as all other columns
            notes: equalColumnWidth,     // Same as all other columns
            context: equalColumnWidth    // Same as all other columns
          };
        } else {
          // Large portrait screens (tablets)
          return {
            reference: 50,
            mainTranslation: 220,
            crossReference: 220,
            alternate: 220, // Same as all other columns
            prophecy: 220,  // Same as all other columns
            notes: 220,     // Same as all other columns
            context: 220    // Same as all other columns
          };
        }
      } else {
        // Landscape mode: Standard larger widths (all columns same size except reference)
        return {
          reference: 80,
          mainTranslation: 320,
          crossReference: 320,
          alternate: 320, // Same as all other columns
          prophecy: 320,  // Same as all other columns
          notes: 320,     // Same as all other columns
          context: 320    // Same as all other columns
        };
      }
    };
    
    const pixelWidths = calculateOptimalWidths();
    
    // Allow unlimited columns with horizontal scrolling - no column limits
    const maxColumnsBeforeScroll = Infinity; // Unlimited columns
    
    return {
      isPortrait,
      isLandscape,
      isTouchDevice,
      columnAlignment: 'left-based', // Will be overridden by VirtualBibleTable state machine
      enableHorizontalScroll: true, // Always enable horizontal scrolling
      referenceWidth: `${pixelWidths.reference}px`,
      mainTranslationWidth: `${pixelWidths.mainTranslation}px`,
      crossRefWidth: `${pixelWidths.crossReference}px`,
      containerClass: 'overflow-x-auto overflow-y-hidden', // Always allow horizontal scrolling
      // Enhanced properties
      screenWidth: width,
      availableWidth,
      maxColumnsBeforeScroll, // No limit on columns
      shouldOptimizeForPortrait: false, // No portrait optimizations that limit columns
      columnPixelWidths: pixelWidths
    };
  }, [windowSize]);

  return config;
}