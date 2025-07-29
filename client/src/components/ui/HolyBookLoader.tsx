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
        @keyframes page-flutter {
          0%, 100% { 
            transform: perspective(100px) rotateX(2deg) rotateY(-1deg); 
            opacity: 0.9; 
          }
          25% { 
            transform: perspective(100px) rotateX(-1deg) rotateY(2deg); 
            opacity: 1; 
          }
          50% { 
            transform: perspective(100px) rotateX(1deg) rotateY(-2deg); 
            opacity: 0.95; 
          }
          75% { 
            transform: perspective(100px) rotateX(-2deg) rotateY(1deg); 
            opacity: 1; 
          }
        }
        
        @keyframes holy-glow {
          0%, 100% { 
            box-shadow: 0 0 8px rgba(251, 191, 36, 0.4), 
                       0 0 16px rgba(251, 191, 36, 0.2), 
                       0 0 24px rgba(251, 191, 36, 0.1);
          }
          50% { 
            box-shadow: 0 0 12px rgba(251, 191, 36, 0.6), 
                       0 0 24px rgba(251, 191, 36, 0.4), 
                       0 0 36px rgba(251, 191, 36, 0.2);
          }
        }
        
        @keyframes shimmer-text {
          0% { opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { opacity: 0.3; }
        }
        
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.6; }
          33% { transform: translateY(-4px) translateX(3px) scale(1.1); opacity: 0.8; }
          66% { transform: translateY(2px) translateX(-2px) scale(0.9); opacity: 0.7; }
        }
        
        @keyframes spine-glow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        
        .holy-book-flutter {
          animation: page-flutter 3s ease-in-out infinite;
        }
        
        .holy-book-glow {
          animation: holy-glow 2s ease-in-out infinite;
        }
        
        .holy-book-shimmer {
          animation: shimmer-text 1.8s ease-in-out infinite;
        }
        
        .holy-book-float {
          animation: float-particle 4s ease-in-out infinite;
        }
        
        .holy-book-spine-glow {
          animation: spine-glow 2.5s ease-in-out infinite;
        }
      `}</style>
      
      <div className={`inline-flex items-center justify-center ${className}`}>
        <div className={`relative ${sizeClasses[size]} perspective-1000`}>
          {/* Book Base - Flat like the image */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800 rounded-sm shadow-xl transform rotate-1">
            
            {/* Book Spine/Binding (center) */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-800 to-amber-900 dark:from-amber-600 dark:to-amber-700 transform -translate-x-1/2 rounded-sm holy-book-spine-glow"></div>
            
            {/* Left Page Fan */}
            <div className="absolute left-0 top-1 bottom-1 w-[48%] bg-white dark:bg-gray-50 rounded-l-sm shadow-inner holy-book-flutter">
              {/* Multiple page layers for depth */}
              <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 dark:from-gray-50 dark:to-gray-100 rounded-l-sm opacity-90"></div>
              <div className="absolute left-0.5 top-0.5 bottom-0.5 right-1 bg-white dark:bg-gray-50 rounded-l-sm opacity-80"></div>
              <div className="absolute left-1 top-1 bottom-1 right-2 bg-gradient-to-r from-white to-gray-50 dark:from-gray-50 dark:to-gray-100 rounded-l-sm opacity-70"></div>
              
              {/* Text lines */}
              <div className="absolute left-2 top-2 right-1 space-y-1">
                <div className="h-0.5 bg-gray-400 dark:bg-gray-500 rounded holy-book-shimmer" style={{ width: '80%' }}></div>
                <div className="h-0.5 bg-gray-400 dark:bg-gray-500 rounded holy-book-shimmer" style={{ width: '90%', animationDelay: '0.2s' }}></div>
                <div className="h-0.5 bg-gray-400 dark:bg-gray-500 rounded holy-book-shimmer" style={{ width: '70%', animationDelay: '0.4s' }}></div>
              </div>
            </div>
            
            {/* Right Page Fan */}
            <div className="absolute right-0 top-1 bottom-1 w-[48%] bg-white dark:bg-gray-50 rounded-r-sm shadow-inner holy-book-flutter" style={{ animationDelay: '0.5s' }}>
              {/* Multiple page layers for depth */}
              <div className="absolute inset-0 bg-gradient-to-l from-white to-gray-50 dark:from-gray-50 dark:to-gray-100 rounded-r-sm opacity-90"></div>
              <div className="absolute right-0.5 top-0.5 bottom-0.5 left-1 bg-white dark:bg-gray-50 rounded-r-sm opacity-80"></div>
              <div className="absolute right-1 top-1 bottom-1 left-2 bg-gradient-to-l from-white to-gray-50 dark:from-gray-50 dark:to-gray-100 rounded-r-sm opacity-70"></div>
              
              {/* Text lines */}
              <div className="absolute right-2 top-2 left-1 space-y-1">
                <div className="h-0.5 bg-gray-400 dark:bg-gray-500 rounded holy-book-shimmer" style={{ width: '75%', animationDelay: '0.6s' }}></div>
                <div className="h-0.5 bg-gray-400 dark:bg-gray-500 rounded holy-book-shimmer" style={{ width: '85%', animationDelay: '0.8s' }}></div>
                <div className="h-0.5 bg-gray-400 dark:bg-gray-500 rounded holy-book-shimmer" style={{ width: '65%', animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
          
          {/* Holy Glow Effect */}
          <div className="absolute inset-0 rounded-sm holy-book-glow opacity-50 pointer-events-none"></div>
          
          {/* Floating Light Particles */}
          <div className="absolute -inset-3">
            <div className="absolute top-1 left-1/4 w-1 h-1 bg-amber-300 rounded-full holy-book-float opacity-60"></div>
            <div className="absolute top-1/3 right-1/4 w-0.5 h-0.5 bg-yellow-300 rounded-full holy-book-float opacity-50" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-1/4 left-1/3 w-0.5 h-0.5 bg-amber-200 rounded-full holy-book-float opacity-40" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 right-1/3 w-0.5 h-0.5 bg-amber-300 rounded-full holy-book-float opacity-50" style={{ animationDelay: '1.5s' }}></div>
          </div>
        </div>
      </div>
    </>
  );
}