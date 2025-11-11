import React, { useState, useEffect } from 'react';

interface RealisticBookTransitionProps {
  isVisible: boolean;
  onComplete?: () => void;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RealisticBookTransition({ 
  isVisible, 
  onComplete, 
  message = "Loading...",
  size = 'md' 
}: RealisticBookTransitionProps) {
  const [currentPageSet, setCurrentPageSet] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  const sizeClasses = {
    sm: 'w-40 h-28',
    md: 'w-64 h-44',
    lg: 'w-80 h-56'
  };

  useEffect(() => {
    if (!isVisible) return;

    const flipInterval = setInterval(() => {
      setIsFlipping(true);
      
      setTimeout(() => {
        setCurrentPageSet(prev => (prev + 1) % 3);
        setIsFlipping(false);
      }, 800);
    }, 2000);

    return () => clearInterval(flipInterval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes realistic-page-flip {
          0% {
            transform: perspective(1200px) rotateY(0deg) rotateX(0deg);
            transform-origin: left center;
          }
          25% {
            transform: perspective(1200px) rotateY(-45deg) rotateX(-5deg);
            transform-origin: left center;
          }
          50% {
            transform: perspective(1200px) rotateY(-90deg) rotateX(-8deg);
            transform-origin: left center;
          }
          75% {
            transform: perspective(1200px) rotateY(-135deg) rotateX(-5deg);  
            transform-origin: left center;
          }
          100% {
            transform: perspective(1200px) rotateY(-180deg) rotateX(0deg);
            transform-origin: left center;
          }
        }

        @keyframes page-curve-up {
          0%, 100% {
            transform: perspective(1000px) rotateX(0deg) rotateZ(0deg);
          }
          50% {
            transform: perspective(1000px) rotateX(8deg) rotateZ(1deg);
          }
        }

        @keyframes page-flutter {
          0%, 100% {
            transform: perspective(800px) rotateY(0deg) rotateZ(0deg);
          }
          25% {
            transform: perspective(800px) rotateY(2deg) rotateZ(0.5deg);
          }
          75% {
            transform: perspective(800px) rotateY(-2deg) rotateZ(-0.5deg);
          }
        }

        @keyframes golden-shimmer {
          0% {
            background-position: -100% 0;
          }
          100% {
            background-position: 100% 0;
          }
        }

        @keyframes divine-pulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        .page-flipping {
          animation: realistic-page-flip 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .page-curved {
          animation: page-curve-up 3s ease-in-out infinite;
        }

        .page-flutter {
          animation: page-flutter 4s ease-in-out infinite;
        }

        .golden-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 215, 0, 0.3) 25%,
            rgba(255, 255, 255, 0.5) 50%,
            rgba(255, 215, 0, 0.3) 75%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: golden-shimmer 2s ease-in-out infinite;
        }

        .divine-glow {
          animation: divine-pulse 2.5s ease-in-out infinite;
        }
      `}</style>
      
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-amber-900/90 via-amber-800/95 to-amber-900/90 z-50">
        <div className={`relative ${sizeClasses[size]} divine-glow`}>
          
          {/* Book base and spine */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 rounded-lg shadow-2xl">
            {/* Golden shimmer overlay */}
            <div className="absolute inset-0 golden-shimmer rounded-lg" />
          </div>
          
          {/* Central spine with decorative cross */}
          <div className="absolute left-1/2 top-2 bottom-2 w-2 bg-gradient-to-b from-yellow-600 via-yellow-500 to-yellow-600 transform -translate-x-1/2 z-30 rounded-full shadow-lg">
            <div className="absolute top-1/2 left-1/2 w-4 h-4 transform -translate-x-1/2 -translate-y-1/2">
              <div className="absolute inset-0 bg-yellow-300 rounded-full opacity-80" />
              <div className="absolute top-1/2 left-1/2 w-2 h-0.5 bg-amber-800 transform -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 w-0.5 h-2 bg-amber-800 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Left page (already read) */}
          <div className="absolute top-3 bottom-3 left-2 right-1/2 mr-1 page-flutter">
            <div className="w-full h-full bg-gradient-to-br from-yellow-50 via-white to-cream-100 rounded-l-lg shadow-lg border border-yellow-200 overflow-hidden">
              <div className="p-3 h-full flex flex-col justify-start space-y-1.5">
                {/* Simulate text lines */}
                {Array.from({ length: 12 }).map((_, lineIndex) => (
                  <div
                    key={lineIndex}
                    className="h-0.5 bg-gradient-to-r from-gray-600 to-gray-400 rounded opacity-60"
                    style={{
                      width: `${Math.random() * 30 + 60}%`,
                      marginLeft: lineIndex % 3 === 0 ? '10%' : '0%'
                    }}
                  />
                ))}
              </div>
              
              {/* Page shadow for depth */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 pointer-events-none" />
            </div>
          </div>

          {/* Right pages (flipping stack) */}
          <div className="absolute top-3 bottom-3 right-2 left-1/2 ml-1">
            {/* Base right page */}
            <div className="absolute inset-0 bg-gradient-to-bl from-yellow-50 via-white to-cream-100 rounded-r-lg shadow-lg border border-yellow-200 page-curved">
              <div className="p-3 h-full flex flex-col justify-start space-y-1.5">
                {Array.from({ length: 12 }).map((_, lineIndex) => (
                  <div
                    key={lineIndex}
                    className="h-0.5 bg-gradient-to-r from-gray-600 to-gray-400 rounded opacity-60"
                    style={{
                      width: `${Math.random() * 30 + 60}%`,
                      marginLeft: lineIndex % 3 === 0 ? '10%' : '0%'
                    }}
                  />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/10 pointer-events-none" />
            </div>

            {/* Flipping page layers */}
            {Array.from({ length: 6 }).map((_, pageIndex) => (
              <div
                key={`flip-page-${pageIndex}`}
                className={`absolute inset-0 bg-gradient-to-bl from-yellow-100 via-white to-cream-50 rounded-r-lg shadow-xl border border-yellow-200 ${
                  isFlipping && pageIndex < 2 ? 'page-flipping' : ''
                }`}
                style={{
                  zIndex: 40 - pageIndex,
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  opacity: pageIndex > 3 ? 0.3 : 1 - (pageIndex * 0.1)
                }}
              >
                {/* Front side */}
                <div className="p-3 h-full flex flex-col justify-start space-y-1.5">
                  {Array.from({ length: 12 }).map((_, lineIndex) => (
                    <div
                      key={lineIndex}
                      className="h-0.5 bg-gradient-to-r from-gray-600 to-gray-400 rounded opacity-60"
                      style={{
                        width: `${Math.random() * 30 + 60}%`,
                        marginLeft: lineIndex % 4 === 0 ? '15%' : '0%'
                      }}
                    />
                  ))}
                </div>

                {/* Back side (when flipped) */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-cream-50 via-white to-yellow-100 rounded-r-lg border border-yellow-200"
                  style={{
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  <div className="p-3 h-full flex flex-col justify-start space-y-1.5">
                    {Array.from({ length: 12 }).map((_, lineIndex) => (
                      <div
                        key={lineIndex}
                        className="h-0.5 bg-gradient-to-r from-gray-500 to-gray-300 rounded opacity-50"
                        style={{
                          width: `${Math.random() * 30 + 60}%`,
                          marginLeft: lineIndex % 4 === 0 ? '15%' : '0%'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Divine light rays emanating from book */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            <div className="absolute top-1/2 left-1/2 w-48 h-0.5 bg-gradient-to-r from-transparent via-yellow-300/70 to-transparent transform -translate-x-1/2 -translate-y-1/2 rotate-0" />
            <div className="absolute top-1/2 left-1/2 w-40 h-0.5 bg-gradient-to-r from-transparent via-yellow-300/70 to-transparent transform -translate-x-1/2 -translate-y-1/2 rotate-45" />
            <div className="absolute top-1/2 left-1/2 w-40 h-0.5 bg-gradient-to-r from-transparent via-yellow-300/70 to-transparent transform -translate-x-1/2 -translate-y-1/2 -rotate-45" />
            <div className="absolute top-1/2 left-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-white/80 to-transparent transform -translate-x-1/2 -translate-y-1/2 rotate-90" />
          </div>

          {/* Mystical sparkles around book */}
          {Array.from({ length: 20 }).map((_, index) => (
            <div
              key={`sparkle-${index}`}
              className="absolute w-1 h-1 bg-yellow-200 rounded-full"
              style={{
                top: `${10 + Math.random() * 80}%`,
                left: `${10 + Math.random() * 80}%`,
                animation: `sparkle ${800 + Math.random() * 1200}ms ease-in-out infinite`,
                animationDelay: `${Math.random() * 3000}ms`,
                opacity: 0.8
              }}
            />
          ))}
        </div>

        {/* Loading message */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-white text-xl font-semibold mb-2 drop-shadow-lg">
            {message}
          </div>
          <div className="text-yellow-200 text-sm opacity-80">
            Sacred pages turning...
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }
      `}</style>
    </>
  );
}