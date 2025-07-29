import { useState, useEffect } from 'react';

interface AdaptivePortraitConfig {
  isPortrait: boolean;
  screenWidth: number;
  screenHeight: number;
  safeViewportWidth: number;
  coreColumnsWidth: number;
  guaranteedFit: boolean;
  adaptiveWidths: {
    reference: number;
    mainTranslation: number;
    crossReference: number;
    alternate: number;
    prophecy: number;
    notes: number;
    context: number;
  };
}

// Precision calculator for portrait mode - guarantees core columns always fit
function calculatePrecisionPortraitWidths(viewportWidth: number, viewportHeight: number): AdaptivePortraitConfig['adaptiveWidths'] {
  const isPortrait = viewportHeight > viewportWidth;
  
  if (!isPortrait) {
    // Landscape - use standard comfortable widths
    return {
      reference: 72,    // 4.5rem equivalent
      mainTranslation: 352, // 22rem equivalent  
      crossReference: 288,  // 18rem equivalent
      alternate: 320,   // 20rem equivalent
      prophecy: 352,    // Same as main
      notes: 320,
      context: 192
    };
  }

  // Portrait precision mode - calculate based on EXACT viewport dimensions
  console.log('🎯 Portrait Precision Mode:', { viewportWidth, viewportHeight });
  
  // Account for scrollbars, borders, and safe margins
  const safeWidth = viewportWidth - 24; // Conservative safe margin
  
  // Core column distribution: Ref (7%) + Main (46.5%) + Cross-refs (46.5%) = 100%
  const refPortion = 0.07;
  const mainPortion = 0.465;
  const crossPortion = 0.465;
  
  const calculatedRef = Math.floor(safeWidth * refPortion);
  const calculatedMain = Math.floor(safeWidth * mainPortion);
  const calculatedCross = Math.floor(safeWidth * crossPortion);
  
  // Apply absolute minimums for readability
  const minRef = 24;   // Absolute minimum for reference numbers
  const minMain = 120; // Absolute minimum for readable text
  const minCross = 100; // Absolute minimum for cross-references
  
  let finalRef = Math.max(minRef, calculatedRef);
  let finalMain = Math.max(minMain, calculatedMain);
  let finalCross = Math.max(minCross, calculatedCross);
  
  // Ensure total doesn't exceed safe width
  const totalCalculated = finalRef + finalMain + finalCross;
  if (totalCalculated > safeWidth) {
    // Proportional compression while maintaining minimums
    const excessWidth = totalCalculated - safeWidth;
    const compressionRatio = (safeWidth - minRef - minMain - minCross) / (totalCalculated - minRef - minMain - minCross);
    
    if (compressionRatio > 0) {
      finalRef = minRef + Math.floor((finalRef - minRef) * compressionRatio);
      finalMain = minMain + Math.floor((finalMain - minMain) * compressionRatio);
      finalCross = minCross + Math.floor((finalCross - minCross) * compressionRatio);
    } else {
      // Extreme compression - use absolute minimums
      finalRef = minRef;
      finalMain = minMain;
      finalCross = minCross;
    }
  }
  
  console.log('📐 Calculated Widths:', {
    safeWidth,
    ref: finalRef,
    main: finalMain,
    cross: finalCross,
    total: finalRef + finalMain + finalCross,
    fits: (finalRef + finalMain + finalCross) <= safeWidth
  });

  return {
    reference: finalRef,
    mainTranslation: finalMain,
    crossReference: finalCross,
    alternate: Math.floor(finalMain * 0.85), // 85% of main for alternates
    prophecy: finalMain,  // Same width as main translation
    notes: Math.floor(finalMain * 0.75), // 75% of main for notes
    context: Math.floor(finalMain * 0.65)  // 65% of main for context
  };
}

export function useAdaptivePortraitColumns(): AdaptivePortraitConfig {
  const [config, setConfig] = useState<AdaptivePortraitConfig>(() => {
    if (typeof window === 'undefined') {
      // SSR fallback - assume iPhone SE dimensions
      const fallbackWidths = calculatePrecisionPortraitWidths(375, 667);
      return {
        isPortrait: true,
        screenWidth: 375,
        screenHeight: 667,
        safeViewportWidth: 351,
        coreColumnsWidth: fallbackWidths.reference + fallbackWidths.mainTranslation + fallbackWidths.crossReference,
        guaranteedFit: true,
        adaptiveWidths: fallbackWidths
      };
    }

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isPortrait = screenHeight > screenWidth;
    const safeViewportWidth = screenWidth - 24;
    
    const adaptiveWidths = calculatePrecisionPortraitWidths(screenWidth, screenHeight);
    const coreColumnsWidth = adaptiveWidths.reference + adaptiveWidths.mainTranslation + adaptiveWidths.crossReference;
    const guaranteedFit = coreColumnsWidth <= safeViewportWidth;

    return {
      isPortrait,
      screenWidth,
      screenHeight,
      safeViewportWidth,
      coreColumnsWidth,
      guaranteedFit,
      adaptiveWidths
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateConfig = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const isPortrait = screenHeight > screenWidth;
      const safeViewportWidth = screenWidth - 24;
      
      const adaptiveWidths = calculatePrecisionPortraitWidths(screenWidth, screenHeight);
      const coreColumnsWidth = adaptiveWidths.reference + adaptiveWidths.mainTranslation + adaptiveWidths.crossReference;
      const guaranteedFit = coreColumnsWidth <= safeViewportWidth;

      console.log('📱 Adaptive Portrait Update:', {
        dimensions: `${screenWidth}×${screenHeight}`,
        isPortrait,
        safeViewportWidth,
        coreColumnsWidth,
        guaranteedFit,
        widths: adaptiveWidths
      });

      setConfig({
        isPortrait,
        screenWidth,
        screenHeight,
        safeViewportWidth,
        coreColumnsWidth,
        guaranteedFit,
        adaptiveWidths
      });
    };

    updateConfig();
    
    // Listen for both resize and orientation changes
    window.addEventListener('resize', updateConfig);
    window.addEventListener('orientationchange', () => {
      // Delay to ensure orientation change is complete
      setTimeout(updateConfig, 150);
    });
    
    return () => {
      window.removeEventListener('resize', updateConfig);
      window.removeEventListener('orientationchange', updateConfig);
    };
  }, []);

  return config;
}