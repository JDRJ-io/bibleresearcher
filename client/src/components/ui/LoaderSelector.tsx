import React from 'react';
import { HolyBookLoader } from './HolyBookLoader';
import BibleHairFan from './BibleHairFan';

interface LoaderSelectorProps {
  /** Choose which loader to display */
  type?: 'holy-book' | 'hair-fan';
  /** Size for the loader */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Color for BibleHairFan (ignored for HolyBookLoader) */
  color?: string;
  /** Animation duration for BibleHairFan in ms */
  duration?: number;
  /** Fan spread in degrees */
  spread?: number;
  /** Number of strands */
  strands?: number;
}

export function LoaderSelector({
  type = 'hair-fan',
  size = 'md',
  className = '',
  color = '#d4af37',
  duration = 1200,
  spread = 60,
  strands = 25,
}: LoaderSelectorProps) {
  // Convert size prop to pixel values for BibleHairFan
  const sizeMap = {
    sm: 100,
    md: 140,
    lg: 180,
  };

  if (type === 'holy-book') {
    return <HolyBookLoader size={size} className={className} />;
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <BibleHairFan 
        size={sizeMap[size]} 
        color={color} 
        duration={duration}
        spread={spread}
        strands={strands}
      />
    </div>
  );
}