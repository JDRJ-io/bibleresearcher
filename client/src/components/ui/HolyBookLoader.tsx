import React from 'react';

interface HolyBookLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HolyBookLoader({ size = 'md', className = '' }: HolyBookLoaderProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div>Loading...</div>
    </div>
  );
}