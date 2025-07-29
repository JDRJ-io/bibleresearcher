import React from 'react';

interface HolyBookLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HolyBookLoader({ size = 'md', className = '' }: HolyBookLoaderProps) {
  const sizeClasses = {
    sm: 'w-12 h-8',
    md: 'w-16 h-12',
    lg: 'w-20 h-16'
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <svg 
          viewBox="0 0 100 60" 
          className="w-full h-full"
          fill="none"
        >
          {/* Bottom spine curve */}
          <path 
            d="M10 45 C25 38, 35 38, 50 45 C65 38, 75 38, 90 45" 
            stroke="#006064" 
            strokeWidth="6" 
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}