import { useState, useEffect, useMemo } from 'react';

interface ResponsiveColumnConfig {
  isPortrait: boolean;
  isLandscape: boolean;
  isTouchDevice: boolean;
  columnAlignment: 'centered' | 'left-based';
  enableHorizontalScroll: boolean;
  referenceWidth: string;
  mainTranslationWidth: string;
  crossRefWidth: string;
  containerClass: string;
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

    if (isPortrait) {
      // Portrait mode: Left-based layout with horizontal scroll
      return {
        isPortrait: true,
        isLandscape: false,
        isTouchDevice,
        columnAlignment: 'left-based',
        enableHorizontalScroll: true,
        referenceWidth: 'w-10', // Extra thin reference column (40px)
        mainTranslationWidth: 'w-50', // Compressed main translation (200px)
        crossRefWidth: 'w-40', // Compressed cross references (160px)
        containerClass: 'overflow-x-auto flex-nowrap'
      };
    } else {
      // Landscape mode: Centered layout
      return {
        isPortrait: false,
        isLandscape: true,
        isTouchDevice,
        columnAlignment: 'centered',
        enableHorizontalScroll: false,
        referenceWidth: 'w-20', // Standard reference column (80px)
        mainTranslationWidth: 'w-80', // Main translation (320px)
        crossRefWidth: 'w-64', // Cross references (256px)
        containerClass: 'justify-center'
      };
    }
  }, [windowSize]);

  return config;
}