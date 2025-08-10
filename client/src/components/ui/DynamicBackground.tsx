/**
 * Enhanced Dynamic Background Component - Theme Pack v1
 * Provides theme-specific animated backgrounds with performance optimization
 * Auto-adapts to device capabilities and user preferences
 */

import { useEffect, useState } from 'react';

interface DynamicBackgroundProps {
  className?: string;
}

// Theme to animation mapping from the expert's guidance
const themeToAnimation = {
  light: 'bg-waves',
  dark: 'bg-aurora',
  'voodoo-blue': 'bg-aurora',
  midnight: 'bg-stars',
  sepia: 'bg-bokeh',
  sunset: 'bg-gradient-shift',
  eden: 'bg-waves',
  royal: 'bg-aurora',
  hologram: 'bg-hologram',
} as const;

export function DynamicBackground({ className = '' }: DynamicBackgroundProps) {
  const [currentTheme, setCurrentTheme] = useState<string>('light');
  const [animationClass, setAnimationClass] = useState<string>('');

  useEffect(() => {
    // Detect current theme from document root class
    const detectTheme = () => {
      const rootClasses = document.documentElement.className.split(' ');
      const themeClass = rootClasses.find(cls => 
        Object.keys(themeToAnimation).includes(cls)
      );
      return themeClass || 'light';
    };

    // Set initial theme and animation
    const theme = detectTheme();
    setCurrentTheme(theme);
    setAnimationClass(themeToAnimation[theme as keyof typeof themeToAnimation] || '');

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      const newTheme = detectTheme();
      if (newTheme !== currentTheme) {
        setCurrentTheme(newTheme);
        setAnimationClass(themeToAnimation[newTheme as keyof typeof themeToAnimation] || '');
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [currentTheme]);

  const backgroundClasses = [
    'dynamic-background',
    animationClass,
    className
  ].filter(Boolean).join(' ');

  return <div className={backgroundClasses} />;
}

export default DynamicBackground;