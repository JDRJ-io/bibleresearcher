import React from 'react';
import { LoadingWheel } from '../LoadingWheel';

interface LoaderSelectorProps {
  /** Choose which loader to display */
  type?: 'blue-circle' | 'loading-wheel';
  /** Size for the loader */
  size?: 'small' | 'medium' | 'large';
  /** Additional CSS classes */
  className?: string;
  /** Loading message */
  message?: string;
}

export function LoaderSelector({
  type = 'blue-circle',
  size = 'medium',
  className = '',
  message = 'Loading...'
}: LoaderSelectorProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <LoadingWheel 
        size={size}
        message={message}
      />
    </div>
  );
}