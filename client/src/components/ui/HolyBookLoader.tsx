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
          {/* Top page curves */}
          <path 
            d="M10 15 C25 8, 35 8, 50 15 C65 8, 75 8, 90 15" 
            stroke="#00bcd4" 
            strokeWidth="3" 
            fill="none"
          />
          
          {/* Second page curves */}
          <path 
            d="M10 25 C25 18, 35 18, 50 25 C65 18, 75 18, 90 25" 
            stroke="#0097a7" 
            strokeWidth="4" 
            fill="none"
          />
          
          {/* Third page curves */}
          <path 
            d="M10 35 C25 28, 35 28, 50 35 C65 28, 75 28, 90 35" 
            stroke="#00838f" 
            strokeWidth="5" 
            fill="none"
          />
          
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