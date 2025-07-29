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
    <>
      <style>{`
        @keyframes page-flip {
          0% { 
            opacity: 0;
            transform: rotateY(-90deg);
          }
          50% { 
            opacity: 1;
            transform: rotateY(0deg);
          }
          100% { 
            opacity: 0;
            transform: rotateY(90deg);
          }
        }
        
        .page-sliver {
          animation: page-flip 2s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>
      
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
            
            {/* Animated page slivers */}
            <path 
              d="M20 42 C30 36, 40 36, 50 42 C60 36, 70 36, 80 42" 
              stroke="#00bcd4" 
              strokeWidth="1" 
              fill="none"
              className="page-sliver"
              style={{ animationDelay: '0s' }}
            />
            <path 
              d="M22 41 C32 35, 42 35, 50 41 C58 35, 68 35, 78 41" 
              stroke="#4dd0e1" 
              strokeWidth="1" 
              fill="none"
              className="page-sliver"
              style={{ animationDelay: '0.3s' }}
            />
            <path 
              d="M24 40 C34 34, 44 34, 50 40 C56 34, 66 34, 76 40" 
              stroke="#80deea" 
              strokeWidth="1" 
              fill="none"
              className="page-sliver"
              style={{ animationDelay: '0.6s' }}
            />
            <path 
              d="M26 39 C36 33, 46 33, 50 39 C54 33, 64 33, 74 39" 
              stroke="#b2ebf2" 
              strokeWidth="1" 
              fill="none"
              className="page-sliver"
              style={{ animationDelay: '0.9s' }}
            />
          </svg>
        </div>
      </div>
    </>
  );
}