import React from 'react';

interface HolyBookLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HolyBookLoader({ size = 'md', className = '' }: HolyBookLoaderProps) {
  const sizeClasses = {
    sm: 'w-20 h-16',
    md: 'w-24 h-20',
    lg: 'w-32 h-24'
  };

  return (
    <>
      <style>{`
        @keyframes holy-page-turn {
          0% { 
            transform: rotateY(0deg);
            opacity: 1;
          }
          20% {
            transform: rotateY(-20deg);
            opacity: 1;
          }
          40% { 
            transform: rotateY(-70deg);
            opacity: 0.8;
          }
          60% { 
            transform: rotateY(-110deg);
            opacity: 0.4;
          }
          80% {
            transform: rotateY(-160deg);
            opacity: 0.2;
          }
          100% {
            transform: rotateY(-180deg);
            opacity: 0;
          }
        }
        
        @keyframes divine-glow {
          0%, 100% { 
            box-shadow: 
              0 0 20px rgba(255, 215, 0, 0.6),
              0 0 40px rgba(255, 215, 0, 0.4),
              0 0 60px rgba(255, 255, 255, 0.3),
              inset 0 0 20px rgba(255, 215, 0, 0.2);
            filter: brightness(1.1);
          }
          50% { 
            box-shadow: 
              0 0 30px rgba(255, 215, 0, 0.8),
              0 0 60px rgba(255, 215, 0, 0.6),
              0 0 80px rgba(255, 255, 255, 0.4),
              inset 0 0 30px rgba(255, 215, 0, 0.3);
            filter: brightness(1.2);
          }
        }
        
        @keyframes holy-light-ray {
          0% { 
            transform: translateY(50px) scale(0);
            opacity: 0;
          }
          50% {
            transform: translateY(0px) scale(1);
            opacity: 0.6;
          }
          100% { 
            transform: translateY(-50px) scale(0.5);
            opacity: 0;
          }
        }
        
        @keyframes celestial-sparkle {
          0%, 100% { 
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1) rotate(180deg);
            opacity: 1;
          }
        }
        
        @keyframes book-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        
        .page-turn {
          animation: holy-page-turn 3s ease-in-out infinite;
          transform-origin: left center;
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
        
        .divine-book-glow {
          animation: divine-glow 4s ease-in-out infinite, book-pulse 6s ease-in-out infinite;
        }
        
        .holy-light {
          animation: holy-light-ray 4s ease-out infinite;
        }
        
        .celestial-sparkle {
          animation: celestial-sparkle 2s ease-in-out infinite;
        }
      `}</style>
      
      <div className={`inline-flex items-center justify-center ${className}`}>
        <div className={`relative ${sizeClasses[size]}`} style={{ perspective: '1000px' }}>
          
          {/* Divine light rays emanating from book */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-20 bg-gradient-to-t from-transparent via-yellow-300/30 to-transparent holy-light"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-20 bg-gradient-to-t from-transparent via-yellow-300/20 to-transparent holy-light rotate-45" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-20 bg-gradient-to-t from-transparent via-yellow-300/20 to-transparent holy-light -rotate-45" style={{ animationDelay: '2s' }}></div>
          </div>
          
          {/* Holy Book Base - Open book with divine glow */}
          <div className="absolute bottom-0 left-0 right-0 h-full divine-book-glow">
            
            {/* Book spine and cover */}
            <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-b from-amber-800 via-amber-700 to-amber-900 dark:from-amber-700 dark:via-amber-600 dark:to-amber-800 rounded-lg shadow-2xl">
              
              {/* Golden cross emblem on cover */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-gradient-to-b from-yellow-400 to-yellow-600"></div>
                <div className="absolute top-1 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
              </div>
            </div>
            
            {/* Left page (static) */}
            <div className="absolute left-1 top-1 w-[45%] h-[90%] bg-gradient-to-br from-white via-amber-50 to-yellow-50 dark:from-gray-100 dark:via-amber-100 dark:to-yellow-100 rounded-l-md shadow-inner">
              <div className="p-2 space-y-1">
                <div className="h-0.5 bg-amber-700/20 w-4/5"></div>
                <div className="h-0.5 bg-amber-700/20 w-5/6"></div>
                <div className="h-0.5 bg-amber-700/20 w-3/4"></div>
                <div className="h-0.5 bg-amber-700/20 w-5/6"></div>
                <div className="h-0.5 bg-amber-700/20 w-4/5"></div>
              </div>
            </div>
            
            {/* Right pages container for flipping animation */}
            <div className="absolute right-1 top-1 w-[45%] h-[90%]" style={{ transformStyle: 'preserve-3d' }}>
              
              {/* Page 1 - Currently visible right page */}
              <div className="absolute inset-0 bg-gradient-to-bl from-white via-amber-50 to-yellow-50 dark:from-gray-100 dark:via-amber-100 dark:to-yellow-100 rounded-r-md shadow-inner page-turn" style={{ animationDelay: '0s' }}>
                <div className="p-2 space-y-1">
                  <div className="h-0.5 bg-amber-700/20 w-5/6"></div>
                  <div className="h-0.5 bg-amber-700/20 w-4/5"></div>
                  <div className="h-0.5 bg-amber-700/20 w-5/6"></div>
                  <div className="h-0.5 bg-amber-700/20 w-3/4"></div>
                </div>
              </div>
              
              {/* Page 2 */}
              <div className="absolute inset-0 bg-gradient-to-bl from-white/95 via-amber-50/95 to-yellow-50/95 dark:from-gray-100/95 dark:via-amber-100/95 dark:to-yellow-100/95 rounded-r-md shadow-inner page-turn" style={{ animationDelay: '0.6s' }}>
                <div className="p-2 space-y-1">
                  <div className="h-0.5 bg-amber-700/15 w-4/5"></div>
                  <div className="h-0.5 bg-amber-700/15 w-5/6"></div>
                  <div className="h-0.5 bg-amber-700/15 w-3/4"></div>
                </div>
              </div>
              
              {/* Page 3 */}
              <div className="absolute inset-0 bg-gradient-to-bl from-white/90 via-amber-50/90 to-yellow-50/90 dark:from-gray-100/90 dark:via-amber-100/90 dark:to-yellow-100/90 rounded-r-md shadow-inner page-turn" style={{ animationDelay: '1.2s' }}>
                <div className="p-2 space-y-1">
                  <div className="h-0.5 bg-amber-700/10 w-5/6"></div>
                  <div className="h-0.5 bg-amber-700/10 w-4/5"></div>
                </div>
              </div>
              
              {/* Page 4 */}
              <div className="absolute inset-0 bg-gradient-to-bl from-white/85 via-amber-50/85 to-yellow-50/85 dark:from-gray-100/85 dark:via-amber-100/85 dark:to-yellow-100/85 rounded-r-md shadow-inner page-turn" style={{ animationDelay: '1.8s' }}>
                <div className="p-2 space-y-1">
                  <div className="h-0.5 bg-amber-700/5 w-4/5"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Celestial sparkles */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 right-3 w-1 h-1">
              <div className="absolute inset-0 bg-yellow-300 celestial-sparkle"></div>
              <div className="absolute inset-0 bg-yellow-300 celestial-sparkle rotate-45"></div>
            </div>
            <div className="absolute bottom-4 left-4 w-1 h-1" style={{ animationDelay: '0.7s' }}>
              <div className="absolute inset-0 bg-white celestial-sparkle"></div>
              <div className="absolute inset-0 bg-white celestial-sparkle rotate-45"></div>
            </div>
            <div className="absolute top-5 left-2 w-0.5 h-0.5" style={{ animationDelay: '1.4s' }}>
              <div className="absolute inset-0 bg-yellow-200 celestial-sparkle"></div>
              <div className="absolute inset-0 bg-yellow-200 celestial-sparkle rotate-45"></div>
            </div>
            <div className="absolute bottom-2 right-5 w-0.5 h-0.5" style={{ animationDelay: '2.1s' }}>
              <div className="absolute inset-0 bg-amber-200 celestial-sparkle"></div>
              <div className="absolute inset-0 bg-amber-200 celestial-sparkle rotate-45"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}