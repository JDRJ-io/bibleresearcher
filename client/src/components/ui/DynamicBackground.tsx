/**
 * Dynamic Background Component
 * Provides animated gradient backgrounds that show through glass morphism effects
 */

import { useTheme } from '@/components/bible/ThemeProvider';
import { useEffect, useState } from 'react';

interface DynamicBackgroundProps {
  enhanced?: boolean;
  className?: string;
}

export function DynamicBackground({ enhanced = false, className = '' }: DynamicBackgroundProps) {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  // Fade in background after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Additional CSS classes based on props
  const backgroundClasses = [
    'dynamic-background',
    enhanced && 'enhanced',
    isVisible && 'opacity-100',
    !isVisible && 'opacity-0',
    className
  ].filter(Boolean).join(' ');

  return <div className={backgroundClasses} />;
}

export default DynamicBackground;