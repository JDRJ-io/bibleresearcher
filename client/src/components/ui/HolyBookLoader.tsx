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
          {/* Page layers fanning out */}
          <path 
            d="M15 40 C30 33, 40 33, 50 40 C60 33, 70 33, 85 40" 
            stroke="#f5f5dc" 
            strokeWidth="2" 
            fill="none"
            opacity="0.8"
          />
          
          <path 
            d="M12 42 C27 35, 37 35, 50 42 C63 35, 73 35, 88 42" 
            stroke="#f0e68c" 
            strokeWidth="2.5" 
            fill="none"
            opacity="0.9"
          />
          
          <path 
            d="M10 44 C25 37, 35 37, 50 44 C65 37, 75 37, 90 44" 
            stroke="#daa520" 
            strokeWidth="3" 
            fill="none"
          />
          
          {/* Bottom spine curve */}
          <path 
            d="M10 45 C25 38, 35 38, 50 45 C65 38, 75 38, 90 45" 
            stroke="#8b4513" 
            strokeWidth="4" 
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}