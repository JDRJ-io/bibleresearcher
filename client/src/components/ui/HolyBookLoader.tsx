import React from 'react';

interface HolyBookLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HolyBookLoader({ size = 'md', className = '' }: HolyBookLoaderProps) {
  const sizeClasses = {
    sm: 'w-16 h-12',
    md: 'w-20 h-16',
    lg: 'w-24 h-20'
  };

  return (
    <>
      <style>{`
        @keyframes gentle-pulse {
          0%, 100% { 
            opacity: 0.8;
          }
          50% { 
            opacity: 1;
          }
        }
        
        @keyframes page-flutter {
          0%, 100% { 
            transform: rotateY(0deg);
          }
          50% { 
            transform: rotateY(-5deg);
          }
        }
        
        .book-glow {
          filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.5));
          animation: gentle-pulse 3s ease-in-out infinite;
        }
        
        .page-flutter {
          animation: page-flutter 4s ease-in-out infinite;
        }
      `}</style>
      
      <div className={`inline-flex items-center justify-center ${className}`}>
        <div className={`relative ${sizeClasses[size]} book-glow`} style={{ perspective: '200px' }}>
          
          {/* Center spine */}
          <div className="absolute top-1/4 bottom-1/4 left-1/2 -translate-x-1/2 w-1 bg-amber-800 dark:bg-amber-700 z-20"></div>
          
          {/* Left pages fanned out */}
          <div className="absolute left-0 top-0 bottom-0 right-1/2" style={{ transformStyle: 'preserve-3d' }}>
            {/* Back page */}
            <div className="absolute inset-0 bg-yellow-50 dark:bg-yellow-100 rounded-l-lg shadow-sm" 
                 style={{ transform: 'rotateY(25deg)', transformOrigin: 'right center' }}></div>
            {/* Middle page */}
            <div className="absolute inset-0 bg-amber-50 dark:bg-amber-100 rounded-l-lg shadow-sm" 
                 style={{ transform: 'rotateY(15deg)', transformOrigin: 'right center' }}></div>
            {/* Front page */}
            <div className="absolute inset-0 bg-white dark:bg-gray-100 rounded-l-lg shadow-md page-flutter" 
                 style={{ transform: 'rotateY(5deg)', transformOrigin: 'right center' }}>
              <div className="p-1 space-y-0.5 mt-1">
                <div className="h-px bg-gray-300 dark:bg-gray-400 w-3/4 ml-1"></div>
                <div className="h-px bg-gray-300 dark:bg-gray-400 w-2/3 ml-1"></div>
                <div className="h-px bg-gray-300 dark:bg-gray-400 w-3/4 ml-1"></div>
              </div>
            </div>
          </div>
          
          {/* Right pages fanned out */}
          <div className="absolute right-0 top-0 bottom-0 left-1/2" style={{ transformStyle: 'preserve-3d' }}>
            {/* Back page */}
            <div className="absolute inset-0 bg-yellow-50 dark:bg-yellow-100 rounded-r-lg shadow-sm" 
                 style={{ transform: 'rotateY(-25deg)', transformOrigin: 'left center' }}></div>
            {/* Middle page */}
            <div className="absolute inset-0 bg-amber-50 dark:bg-amber-100 rounded-r-lg shadow-sm" 
                 style={{ transform: 'rotateY(-15deg)', transformOrigin: 'left center' }}></div>
            {/* Front page */}
            <div className="absolute inset-0 bg-white dark:bg-gray-100 rounded-r-lg shadow-md page-flutter" 
                 style={{ transform: 'rotateY(-5deg)', transformOrigin: 'left center', animationDelay: '2s' }}>
              <div className="p-1 space-y-0.5 mt-1">
                <div className="h-px bg-gray-300 dark:bg-gray-400 w-3/4 mr-1 ml-auto"></div>
                <div className="h-px bg-gray-300 dark:bg-gray-400 w-2/3 mr-1 ml-auto"></div>
                <div className="h-px bg-gray-300 dark:bg-gray-400 w-3/4 mr-1 ml-auto"></div>
              </div>
            </div>
          </div>
          
          {/* Small cross on spine */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <div className="w-3 h-3 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-yellow-600"></div>
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-0.5 bg-yellow-600"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}