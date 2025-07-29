import React from 'react';
import { HolyBookLoader } from './HolyBookLoader';
import BiblePageFan from './BiblePageFan';

interface LoaderSelectorProps {
  /** Choose which loader to display */
  type?: 'holy-book' | 'page-fan';
  /** Size for the loader */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Color for BiblePageFan (ignored for HolyBookLoader) */
  color?: string;
  /** Animation duration for BiblePageFan in ms */
  duration?: number;
}

export function LoaderSelector({
  type = 'page-fan',
  size = 'md',
  className = '',
  color = '#2fc2ff',
  duration = 1400,
}: LoaderSelectorProps) {
  // Convert size prop to pixel values for BiblePageFan
  const sizeMap = {
    sm: 80,
    md: 120,
    lg: 160,
  };

  if (type === 'holy-book') {
    return <HolyBookLoader size={size} className={className} />;
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <BiblePageFan 
        size={sizeMap[size]} 
        color={color} 
        duration={duration} 
      />
    </div>
  );
}