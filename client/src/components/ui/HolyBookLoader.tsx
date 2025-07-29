import React from 'react';

interface HolyBookLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HolyBookLoader({ size = 'md', className = '' }: HolyBookLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-6',
    md: 'w-12 h-9',
    lg: 'w-16 h-12'
  };

  return (
    <>
      <style>{`
        @keyframes unfurl {
          0% { transform: rotateY(-180deg) scaleX(0); opacity: 0; }
          50% { transform: rotateY(-90deg) scaleX(0.5); opacity: 0.7; }
          100% { transform: rotateY(0deg) scaleX(1); opacity: 1; }
        }
        
        @keyframes holy-glow {
          0%, 100% { 
            box-shadow: 0 0 5px rgba(251, 191, 36, 0.3), 
                       0 0 10px rgba(251, 191, 36, 0.2), 
                       0 0 15px rgba(251, 191, 36, 0.1);
          }
          50% { 
            box-shadow: 0 0 10px rgba(251, 191, 36, 0.5), 
                       0 0 20px rgba(251, 191, 36, 0.3), 
                       0 0 30px rgba(251, 191, 36, 0.2);
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes shimmer {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
        
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-3px) translateX(2px); }
          66% { transform: translateY(1px) translateX(-1px); }
        }
        
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(2px) translateX(-2px); }
          66% { transform: translateY(-1px) translateX(1px); }
        }
        
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-1px) translateX(-1px); }
          66% { transform: translateY(2px) translateX(2px); }
        }
        
        .holy-book-unfurl {
          animation: unfurl 2s ease-in-out infinite;
        }
        
        .holy-book-glow {
          animation: holy-glow 3s ease-in-out infinite;
        }
        
        .holy-book-pulse {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .holy-book-shimmer {
          animation: shimmer 1.5s ease-in-out infinite;
        }
        
        .holy-book-float-1 {
          animation: float-1 4s ease-in-out infinite;
        }
        
        .holy-book-float-2 {
          animation: float-2 5s ease-in-out infinite;
        }
        
        .holy-book-float-3 {
          animation: float-3 3s ease-in-out infinite;
        }
      `}</style>
      
      <div className={`inline-flex items-center justify-center ${className}`}>
        <div className={`relative ${sizeClasses[size]}`}>
          {/* Book Base */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 rounded-sm shadow-lg">
            {/* Book Spine */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-300 to-amber-600 dark:from-amber-700 dark:to-amber-900 rounded-l-sm"></div>
            
            {/* Left Page */}
            <div className="absolute left-1 top-1 bottom-1 w-[45%] bg-white dark:bg-gray-100 rounded-sm shadow-inner holy-book-pulse">
              <div className="p-0.5 space-y-0.5">
                <div className="h-0.5 bg-gray-300 dark:bg-gray-400 rounded holy-book-shimmer"></div>
                <div className="h-0.5 bg-gray-300 dark:bg-gray-400 rounded holy-book-shimmer" style={{ animationDelay: '0.1s' }}></div>
                <div className="h-0.5 bg-gray-300 dark:bg-gray-400 rounded holy-book-shimmer" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
            
            {/* Right Page - Unfurling */}
            <div className="absolute right-1 top-1 bottom-1 w-[45%] bg-white dark:bg-gray-100 rounded-sm shadow-inner origin-left holy-book-unfurl">
              <div className="p-0.5 space-y-0.5">
                <div className="h-0.5 bg-gray-300 dark:bg-gray-400 rounded holy-book-shimmer" style={{ animationDelay: '0.3s' }}></div>
                <div className="h-0.5 bg-gray-300 dark:bg-gray-400 rounded holy-book-shimmer" style={{ animationDelay: '0.4s' }}></div>
                <div className="h-0.5 bg-gray-300 dark:bg-gray-400 rounded holy-book-shimmer" style={{ animationDelay: '0.5s' }}></div>
              </div>
            </div>
          </div>
          
          {/* Holy Glow Effect */}
          <div className="absolute inset-0 rounded-sm holy-book-glow opacity-60 pointer-events-none"></div>
          
          {/* Floating Light Particles */}
          <div className="absolute -inset-2">
            <div className="absolute top-0 left-1/4 w-1 h-1 bg-amber-300 rounded-full holy-book-float-1 opacity-70"></div>
            <div className="absolute top-1/3 right-1/4 w-0.5 h-0.5 bg-yellow-300 rounded-full holy-book-float-2 opacity-60"></div>
            <div className="absolute bottom-1/4 left-1/3 w-0.5 h-0.5 bg-amber-200 rounded-full holy-book-float-3 opacity-50"></div>
          </div>
        </div>
      </div>
    </>
  );
}