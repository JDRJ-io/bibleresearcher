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

// EXACT THREE-COLUMN PORTRAIT SYSTEM - User's Specification
function calculatePrecisionPortraitWidths(viewportWidth: number, viewportHeight: number): AdaptivePortraitConfig['adaptiveWidths'] {
  const isPortrait = viewportHeight > viewportWidth;

  if (!isPortrait) {
    // Landscape - use standard comfortable widths
    return {
      reference: 72,    // 4.5rem equivalent
      mainTranslation: 352, // 22rem equivalent  
      crossReference: 288,  // 18rem equivalent
      alternate: 352,   // Same as main translation
      prophecy: 352,    // Same as main
      notes: 320,
      context: 120      // Thinner for landscape mode
    };
  }

  // Portrait mode - UNLIMITED COLUMNS: Set standard widths that work with horizontal scrolling
  // All columns should be accessible via horizontal scroll regardless of viewport width
  console.log('🎯 UNLIMITED-COLUMN Portrait Mode:', { viewportWidth, viewportHeight });

  // Set standard fixed widths that work well for horizontal scrolling
  // No need to calculate based on viewport - let horizontal scrolling handle overflow
  const refWidth = 50;        // Fixed reference width
  const mainWidth = 280;      // Standard main translation width
  const crossWidth = 260;     // Standard cross-reference width
  const alternateWidth = 280; // Same as main translation
  const prophecyWidth = 280;  // Same as main translation
  const notesWidth = 250;     // Slightly narrower for notes
  const contextWidth = 80;    // Thin for context indicators

  console.log('📐 UNLIMITED-COLUMN Portrait Calculation:', {
    viewportWidth,
    fixedWidths: {
      reference: refWidth,
      mainTranslation: mainWidth,
      crossReference: crossWidth,
      alternate: alternateWidth,
      prophecy: prophecyWidth,
      notes: notesWidth,
      context: contextWidth
    },
    totalAvailable: 'Unlimited with horizontal scroll'
  });

  return {
    reference: refWidth,
    mainTranslation: mainWidth,
    crossReference: crossWidth,
    alternate: alternateWidth,
    prophecy: prophecyWidth,
    notes: notesWidth,
    context: contextWidth
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

  // Function to update CSS variables with current adaptive widths
  const updateCSSVariables = (widths: AdaptivePortraitConfig['adaptiveWidths']) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--adaptive-ref-width', `${widths.reference}px`);
      root.style.setProperty('--adaptive-main-width', `${widths.mainTranslation}px`);
      root.style.setProperty('--adaptive-cross-width', `${widths.crossReference}px`);
      root.style.setProperty('--adaptive-alt-width', `${widths.alternate}px`);
      root.style.setProperty('--adaptive-prophecy-width', `${widths.prophecy}px`);
      root.style.setProperty('--adaptive-notes-width', `${widths.notes}px`);
      root.style.setProperty('--adaptive-context-width', `${widths.context}px`);

      console.log('🎯 CSS Variables Updated:', {
        '--adaptive-ref-width': `${widths.reference}px`,
        '--adaptive-main-width': `${widths.mainTranslation}px`,
        '--adaptive-cross-width': `${widths.crossReference}px`
      });
    }
  };

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

      // Update CSS variables FIRST
      updateCSSVariables(adaptiveWidths);

      // Then update React state
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

    // Initial update
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

  // Update CSS variables whenever config changes
  useEffect(() => {
    updateCSSVariables(config.adaptiveWidths);
  }, [config.adaptiveWidths]);

  return config;
}