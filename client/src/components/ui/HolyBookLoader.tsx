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
        @keyframes holy-page-ascend {
          0% { 
            transform: translateY(0) rotateX(0deg) scale(1);
            opacity: 1;
          }
          20% {
            transform: translateY(-10px) rotateX(-15deg) scale(1.05);
            opacity: 1;
          }
          40% { 
            transform: translateY(-30px) rotateX(-30deg) scale(1.1);
            opacity: 0.9;
          }
          60% { 
            transform: translateY(-60px) rotateX(-45deg) scale(1.05);
            opacity: 0.7;
          }
          80% {
            transform: translateY(-100px) rotateX(-60deg) scale(0.9);
            opacity: 0.4;
          }
          100% {
            transform: translateY(-150px) rotateX(-75deg) scale(0.7);
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
        
        .page-ascend {
          animation: holy-page-ascend 3s ease-out infinite;
          transform-origin: bottom center;
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
        
        .book-perpendicular {
          transform: rotateX(-70deg) translateZ(20px);
          transform-style: preserve-3d;
        }
      `}</style>
      
      <div className={`inline-flex items-center justify-center ${className}`}>
        <div className={`relative ${sizeClasses[size]}`} style={{ perspective: '800px' }}>
          
          {/* Divine light rays emanating upward to heaven */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-32 bg-gradient-to-t from-yellow-300/40 via-yellow-300/20 to-transparent holy-light"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-32 bg-gradient-to-t from-yellow-300/30 via-yellow-300/15 to-transparent holy-light rotate-12" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-32 bg-gradient-to-t from-yellow-300/30 via-yellow-300/15 to-transparent holy-light -rotate-12" style={{ animationDelay: '2s' }}></div>
          </div>
          
          {/* Holy Book Base - Perpendicular book with divine glow */}
          <div className="absolute bottom-0 left-0 right-0 h-full divine-book-glow book-perpendicular">
            
            {/* Book spine - standing perpendicular */}
            <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-amber-900 via-amber-800 to-amber-700 dark:from-amber-800 dark:via-amber-700 dark:to-amber-600 rounded-t-lg shadow-2xl">
              
              {/* Golden cross emblem on spine */}
              <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-8 h-8">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-gradient-to-b from-yellow-400 to-yellow-600"></div>
                <div className="absolute top-1 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
              </div>
            </div>
            
            {/* Open book pages - V shape */}
            <div className="absolute inset-x-0 bottom-0 h-[90%]" style={{ transformStyle: 'preserve-3d' }}>
              
              {/* Left page */}
              <div className="absolute left-0 bottom-0 w-[48%] h-full bg-gradient-to-br from-white via-amber-50 to-yellow-50 dark:from-gray-100 dark:via-amber-100 dark:to-yellow-100 shadow-lg" style={{ transform: 'rotateY(-25deg)', transformOrigin: 'right bottom' }}>
                <div className="p-2 space-y-1">
                  <div className="h-0.5 bg-amber-700/20 w-4/5"></div>
                  <div className="h-0.5 bg-amber-700/20 w-5/6"></div>
                  <div className="h-0.5 bg-amber-700/20 w-3/4"></div>
                  <div className="h-0.5 bg-amber-700/20 w-5/6"></div>
                </div>
              </div>
              
              {/* Right page */}
              <div className="absolute right-0 bottom-0 w-[48%] h-full bg-gradient-to-bl from-white via-amber-50 to-yellow-50 dark:from-gray-100 dark:via-amber-100 dark:to-yellow-100 shadow-lg" style={{ transform: 'rotateY(25deg)', transformOrigin: 'left bottom' }}>
                <div className="p-2 space-y-1">
                  <div className="h-0.5 bg-amber-700/20 w-5/6"></div>
                  <div className="h-0.5 bg-amber-700/20 w-4/5"></div>
                  <div className="h-0.5 bg-amber-700/20 w-5/6"></div>
                  <div className="h-0.5 bg-amber-700/20 w-3/4"></div>
                </div>
              </div>
            </div>
            
            {/* Ascending pages container */}
            <div className="absolute inset-x-0 bottom-0 h-full" style={{ transformStyle: 'preserve-3d' }}>
              
              {/* Page 1 - Ascending to heaven */}
              <div className="absolute inset-x-4 bottom-0 h-16 bg-gradient-to-t from-white via-amber-50/90 to-yellow-50/80 dark:from-gray-100 dark:via-amber-100/90 dark:to-yellow-100/80 rounded-t shadow-lg page-ascend" style={{ animationDelay: '0s' }}>
                <div className="p-2 space-y-0.5">
                  <div className="h-0.5 bg-amber-700/20 w-5/6 mx-auto"></div>
                  <div className="h-0.5 bg-amber-700/20 w-4/5 mx-auto"></div>
                </div>
              </div>
              
              {/* Page 2 */}
              <div className="absolute inset-x-4 bottom-0 h-16 bg-gradient-to-t from-white/95 via-amber-50/85 to-yellow-50/75 dark:from-gray-100/95 dark:via-amber-100/85 dark:to-yellow-100/75 rounded-t shadow-lg page-ascend" style={{ animationDelay: '0.6s' }}>
                <div className="p-2 space-y-0.5">
                  <div className="h-0.5 bg-amber-700/15 w-4/5 mx-auto"></div>
                  <div className="h-0.5 bg-amber-700/15 w-5/6 mx-auto"></div>
                </div>
              </div>
              
              {/* Page 3 */}
              <div className="absolute inset-x-4 bottom-0 h-16 bg-gradient-to-t from-white/90 via-amber-50/80 to-yellow-50/70 dark:from-gray-100/90 dark:via-amber-100/80 dark:to-yellow-100/70 rounded-t shadow-lg page-ascend" style={{ animationDelay: '1.2s' }}>
                <div className="p-2 space-y-0.5">
                  <div className="h-0.5 bg-amber-700/10 w-5/6 mx-auto"></div>
                </div>
              </div>
              
              {/* Page 4 */}
              <div className="absolute inset-x-4 bottom-0 h-16 bg-gradient-to-t from-white/85 via-amber-50/75 to-yellow-50/65 dark:from-gray-100/85 dark:via-amber-100/75 dark:to-yellow-100/65 rounded-t shadow-lg page-ascend" style={{ animationDelay: '1.8s' }}>
                <div className="p-2 space-y-0.5">
                  <div className="h-0.5 bg-amber-700/5 w-4/5 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Celestial stars in the heavens */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 right-3 w-1 h-1">
              <div className="absolute inset-0 bg-white celestial-sparkle"></div>
              <div className="absolute inset-0 bg-white celestial-sparkle rotate-45"></div>
            </div>
            <div className="absolute top-4 left-4 w-1.5 h-1.5" style={{ animationDelay: '0.7s' }}>
              <div className="absolute inset-0 bg-yellow-200 celestial-sparkle"></div>
              <div className="absolute inset-0 bg-yellow-200 celestial-sparkle rotate-45"></div>
            </div>
            <div className="absolute top-8 right-6 w-0.5 h-0.5" style={{ animationDelay: '1.4s' }}>
              <div className="absolute inset-0 bg-white celestial-sparkle"></div>
              <div className="absolute inset-0 bg-white celestial-sparkle rotate-45"></div>
            </div>
            <div className="absolute top-3 left-8 w-0.5 h-0.5" style={{ animationDelay: '2.1s' }}>
              <div className="absolute inset-0 bg-yellow-300 celestial-sparkle"></div>
              <div className="absolute inset-0 bg-yellow-300 celestial-sparkle rotate-45"></div>
            </div>
            <div className="absolute top-10 right-4 w-1 h-1" style={{ animationDelay: '1s' }}>
              <div className="absolute inset-0 bg-white celestial-sparkle"></div>
              <div className="absolute inset-0 bg-white celestial-sparkle rotate-45"></div>
            </div>
            <div className="absolute top-6 left-1 w-0.5 h-0.5" style={{ animationDelay: '2.5s' }}>
              <div className="absolute inset-0 bg-yellow-100 celestial-sparkle"></div>
              <div className="absolute inset-0 bg-yellow-100 celestial-sparkle rotate-45"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}