import React, { useState, useEffect } from 'react';

interface BookPageTransitionProps {
  isVisible: boolean;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  pageCount?: number;
  speed?: 'slow' | 'medium' | 'fast';
}

export function BookPageTransition({ 
  isVisible, 
  onComplete, 
  size = 'md', 
  pageCount = 8,
  speed = 'medium' 
}: BookPageTransitionProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const sizeClasses = {
    sm: 'w-32 h-24',
    md: 'w-48 h-36',
    lg: 'w-64 h-48'
  };

  const speedSettings = {
    slow: { duration: 800, stagger: 150 },
    medium: { duration: 600, stagger: 100 },
    fast: { duration: 400, stagger: 80 }
  };

  const { duration, stagger } = speedSettings[speed];

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentPage(prev => {
        if (prev >= pageCount - 1) {
          clearInterval(interval);
          onComplete?.();
          return prev;
        }
        return prev + 1;
      });
    }, stagger);

    return () => clearInterval(interval);
  }, [isVisible, pageCount, stagger, onComplete]);

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes page-turn-right {
          0% { 
            transform: perspective(800px) rotateY(0deg) translateZ(0px);
            transform-origin: left center;
          }
          50% { 
            transform: perspective(800px) rotateY(-85deg) translateZ(40px);
            transform-origin: left center;
          }
          100% { 
            transform: perspective(800px) rotateY(-180deg) translateZ(0px);
            transform-origin: left center;
          }
        }
        
        @keyframes page-turn-left {
          0% { 
            transform: perspective(800px) rotateY(180deg) translateZ(0px);
            transform-origin: right center;
          }
          50% { 
            transform: perspective(800px) rotateY(95deg) translateZ(40px);
            transform-origin: right center;
          }
          100% { 
            transform: perspective(800px) rotateY(0deg) translateZ(0px);
            transform-origin: right center;
          }
        }

        @keyframes page-curve {
          0%, 100% {
            transform: perspective(800px) rotateX(0deg) rotateY(0deg);
          }
          50% {
            transform: perspective(800px) rotateX(5deg) rotateY(0deg);
          }
        }

        @keyframes book-glow {
          0%, 100% {
            box-shadow: 
              0 0 20px rgba(255, 215, 0, 0.3),
              0 0 40px rgba(255, 215, 0, 0.2),
              inset 0 0 20px rgba(255, 255, 255, 0.1);
          }
          50% {
            box-shadow: 
              0 0 30px rgba(255, 215, 0, 0.5),
              0 0 60px rgba(255, 215, 0, 0.3),
              inset 0 0 30px rgba(255, 255, 255, 0.2);
          }
        }

        .page-turning-right {
          animation: page-turn-right ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }

        .page-turning-left {
          animation: page-turn-left ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }

        .page-curve-effect {
          animation: page-curve ${duration * 2}ms ease-in-out infinite;
        }

        .book-spine-glow {
          animation: book-glow 2s ease-in-out infinite;
        }
      `}</style>
      
      <div className={`fixed inset-0 flex items-center justify-center bg-black/80 z-50`}>
        <div className={`relative ${sizeClasses[size]} book-spine-glow`}>
          {/* Book base */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 rounded-lg shadow-2xl" />
          
          {/* Book spine */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-600 via-yellow-500 to-yellow-600 transform -translate-x-1/2 z-20" />
          
          {/* Pages stack (right side) */}
          {Array.from({ length: pageCount }).map((_, index) => {
            const isFlipping = index === currentPage;
            const hasFlipped = index < currentPage;
            
            return (
              <div
                key={`page-${index}`}
                className={`absolute top-2 bottom-2 right-1 left-1/2 bg-gradient-to-br from-yellow-50 via-white to-yellow-100 rounded-r-md shadow-lg border border-yellow-200 ${
                  isFlipping ? 'page-turning-right' : hasFlipped ? 'page-turning-right opacity-0' : ''
                }`}
                style={{
                  zIndex: pageCount - index + 10,
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden'
                }}
              >
                {/* Page content lines */}
                <div className="p-2 h-full flex flex-col justify-start space-y-1">
                  {Array.from({ length: 8 }).map((_, lineIndex) => (
                    <div
                      key={lineIndex}
                      className="h-0.5 bg-gray-400 rounded opacity-60"
                      style={{
                        width: `${Math.random() * 40 + 50}%`,
                        animationDelay: `${lineIndex * 50}ms`
                      }}
                    />
                  ))}
                </div>
                
                {/* Page back side */}
                <div 
                  className="absolute inset-0 bg-gradient-to-bl from-yellow-100 via-white to-yellow-50 rounded-r-md border border-yellow-200"
                  style={{
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  <div className="p-2 h-full flex flex-col justify-start space-y-1">
                    {Array.from({ length: 8 }).map((_, lineIndex) => (
                      <div
                        key={lineIndex}
                        className="h-0.5 bg-gray-400 rounded opacity-60"
                        style={{
                          width: `${Math.random() * 40 + 50}%`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Pages stack (left side - already turned) */}
          <div className="absolute top-2 bottom-2 left-1 right-1/2 bg-gradient-to-bl from-yellow-50 via-white to-yellow-100 rounded-l-md shadow-lg border border-yellow-200">
            <div className="p-2 h-full flex flex-col justify-start space-y-1">
              {Array.from({ length: 6 }).map((_, lineIndex) => (
                <div
                  key={lineIndex}
                  className="h-0.5 bg-gray-400 rounded opacity-60"
                  style={{
                    width: `${Math.random() * 40 + 50}%`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Divine light rays */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-70 transform -translate-x-1/2 -translate-y-1/2 rotate-45" />
            <div className="absolute top-1/2 left-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-70 transform -translate-x-1/2 -translate-y-1/2 -rotate-45" />
            <div className="absolute top-1/2 left-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-80 transform -translate-x-1/2 -translate-y-1/2" />
          </div>

          {/* Sparkle effects */}
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={`sparkle-${index}`}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full opacity-80"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `sparkle ${1000 + Math.random() * 1000}ms ease-in-out infinite`,
                animationDelay: `${Math.random() * 2000}ms`
              }}
            />
          ))}
        </div>
        
        {/* Loading text */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-center">
          <div className="text-lg font-semibold mb-2">Turning Pages...</div>
          <div className="text-sm opacity-70">
            Page {currentPage + 1} of {pageCount}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}