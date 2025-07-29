import React from 'react';

interface HolyBookLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HolyBookLoader({ size = 'md', className = '' }: HolyBookLoaderProps) {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40'
  };

  return (
    <>
      <style>{`
        @keyframes book-3d-stand {
          0%, 100% { 
            transform: perspective(800px) rotateY(0deg) rotateX(-10deg);
          }
          50% { 
            transform: perspective(800px) rotateY(5deg) rotateX(-10deg);
          }
        }
        
        @keyframes pages-spiral-out {
          0% { 
            transform: rotateY(0deg) translateZ(0px) translateX(0px);
            opacity: 0;
          }
          20% {
            transform: rotateY(30deg) translateZ(10px) translateX(5px);
            opacity: 0.9;
            filter: blur(0px);
          }
          40% { 
            transform: rotateY(90deg) translateZ(30px) translateX(20px);
            opacity: 1;
            filter: blur(1px);
          }
          60% { 
            transform: rotateY(180deg) translateZ(50px) translateX(40px);
            opacity: 0.8;
            filter: blur(2px);
          }
          80% {
            transform: rotateY(270deg) translateZ(30px) translateX(50px);
            opacity: 0.4;
            filter: blur(3px);
          }
          100% { 
            transform: rotateY(360deg) translateZ(0px) translateX(60px);
            opacity: 0;
            filter: blur(4px);
          }
        }
        
        @keyframes pages-curve-motion {
          0% { 
            transform: rotateY(0deg) translateZ(0px) translateX(0px) translateY(0px);
            opacity: 0;
          }
          25% {
            transform: rotateY(45deg) translateZ(20px) translateX(15px) translateY(-10px) rotateZ(10deg);
            opacity: 1;
            filter: blur(0.5px);
          }
          50% { 
            transform: rotateY(135deg) translateZ(40px) translateX(35px) translateY(-20px) rotateZ(25deg);
            opacity: 0.9;
            filter: blur(1.5px);
          }
          75% {
            transform: rotateY(225deg) translateZ(25px) translateX(45px) translateY(-5px) rotateZ(35deg);
            opacity: 0.5;
            filter: blur(2.5px);
          }
          100% { 
            transform: rotateY(315deg) translateZ(5px) translateX(55px) translateY(10px) rotateZ(45deg);
            opacity: 0;
            filter: blur(3px);
          }
        }
        
        @keyframes holy-radiance {
          0%, 100% { 
            box-shadow: 
              0 0 20px rgba(255, 215, 0, 0.4),
              0 0 40px rgba(255, 255, 255, 0.3),
              0 0 60px rgba(255, 215, 0, 0.2),
              0 0 80px rgba(255, 255, 255, 0.1);
          }
          50% { 
            box-shadow: 
              0 0 30px rgba(255, 215, 0, 0.6),
              0 0 60px rgba(255, 255, 255, 0.5),
              0 0 90px rgba(255, 215, 0, 0.3),
              0 0 120px rgba(255, 255, 255, 0.2);
          }
        }
        
        @keyframes spirit-particles {
          0% { 
            transform: translateY(0px) translateX(0px) translateZ(0px);
            opacity: 0;
          }
          20% {
            transform: translateY(-20px) translateX(10px) translateZ(10px);
            opacity: 0.8;
          }
          50% { 
            transform: translateY(-40px) translateX(-5px) translateZ(20px);
            opacity: 1;
          }
          80% {
            transform: translateY(-60px) translateX(15px) translateZ(5px);
            opacity: 0.4;
          }
          100% { 
            transform: translateY(-80px) translateX(-10px) translateZ(0px);
            opacity: 0;
          }
        }
        
        .book-3d-container {
          transform-style: preserve-3d;
          perspective: 800px;
        }
        
        .book-3d-stand {
          animation: book-3d-stand 4s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        
        .page-spiral-1 {
          animation: pages-spiral-out 3s ease-out infinite;
        }
        
        .page-spiral-2 {
          animation: pages-curve-motion 3.5s ease-out infinite 0.3s;
        }
        
        .page-spiral-3 {
          animation: pages-spiral-out 3s ease-out infinite 0.6s;
        }
        
        .page-spiral-4 {
          animation: pages-curve-motion 3.5s ease-out infinite 0.9s;
        }
        
        .page-spiral-5 {
          animation: pages-spiral-out 3s ease-out infinite 1.2s;
        }
        
        .page-spiral-6 {
          animation: pages-curve-motion 3.5s ease-out infinite 1.5s;
        }
        
        .holy-radiance {
          animation: holy-radiance 3s ease-in-out infinite;
        }
        
        .spirit-particle {
          animation: spirit-particles 4s ease-out infinite;
        }
      `}</style>
      
      <div className={`inline-flex items-center justify-center ${className}`}>
        <div className={`relative ${sizeClasses[size]} book-3d-container`}>
          
          {/* 3D Book Standing Vertically */}
          <div className="absolute inset-0 flex items-center justify-center book-3d-stand">
            
            {/* Book Spine (vertical center) */}
            <div className="absolute w-3 h-full bg-gradient-to-b from-amber-700 via-yellow-600 to-amber-800 dark:from-amber-600 dark:via-yellow-500 dark:to-amber-700 holy-radiance"
                 style={{ transform: 'translateZ(10px)' }}></div>
            
            {/* Book Cover (back) */}
            <div className="absolute inset-y-0 left-1/2 w-1/2 bg-gradient-to-r from-amber-100 to-yellow-50 dark:from-amber-800 dark:to-yellow-700 origin-left"
                 style={{ transform: 'rotateY(-30deg) translateZ(2px)' }}></div>
            
            {/* Book Cover (front) */}
            <div className="absolute inset-y-0 right-1/2 w-1/2 bg-gradient-to-l from-amber-100 to-yellow-50 dark:from-amber-800 dark:to-yellow-700 origin-right"
                 style={{ transform: 'rotateY(30deg) translateZ(2px)' }}></div>
            
            {/* Flying Pages - Creating the spiral vortex effect */}
            {/* Layer 1 - Inner spiral */}
            <div className="absolute inset-0 origin-center page-spiral-1">
              <div className="absolute top-1/4 left-1/2 w-16 h-20 bg-gradient-to-br from-white via-yellow-50 to-amber-50 dark:from-gray-50 dark:via-yellow-100 dark:to-amber-100 rounded-sm shadow-lg"
                   style={{ transform: 'translateX(-50%)' }}>
                <div className="m-2 space-y-1">
                  <div className="h-0.5 bg-amber-600/30 w-3/4"></div>
                  <div className="h-0.5 bg-amber-600/30 w-full"></div>
                  <div className="h-0.5 bg-amber-600/30 w-2/3"></div>
                </div>
              </div>
            </div>
            
            {/* Layer 2 - Mid spiral */}
            <div className="absolute inset-0 origin-center page-spiral-2">
              <div className="absolute top-1/3 left-1/2 w-14 h-18 bg-gradient-to-bl from-white via-amber-50 to-yellow-100 dark:from-gray-50 dark:via-amber-100 dark:to-yellow-200 rounded-sm shadow-lg"
                   style={{ transform: 'translateX(-50%) skewY(5deg)' }}>
                <div className="m-2 space-y-1">
                  <div className="h-0.5 bg-amber-600/25 w-4/5"></div>
                  <div className="h-0.5 bg-amber-600/25 w-2/3"></div>
                </div>
              </div>
            </div>
            
            {/* Layer 3 - Outer spiral */}
            <div className="absolute inset-0 origin-center page-spiral-3">
              <div className="absolute top-1/2 left-1/2 w-12 h-16 bg-gradient-to-br from-yellow-50 via-white to-amber-100 dark:from-yellow-100 dark:via-gray-50 dark:to-amber-200 rounded-sm shadow-lg"
                   style={{ transform: 'translateX(-50%) translateY(-50%) rotateZ(-10deg)' }}>
                <div className="m-1.5 space-y-1">
                  <div className="h-0.5 bg-amber-600/20 w-3/5"></div>
                  <div className="h-0.5 bg-amber-600/20 w-4/5"></div>
                </div>
              </div>
            </div>
            
            {/* Layer 4 - Far spiral */}
            <div className="absolute inset-0 origin-center page-spiral-4">
              <div className="absolute top-2/3 left-1/2 w-10 h-14 bg-gradient-to-bl from-amber-50 via-yellow-100 to-white dark:from-amber-100 dark:via-yellow-200 dark:to-gray-50 rounded-sm shadow-lg"
                   style={{ transform: 'translateX(-50%) rotateZ(15deg)' }}>
                <div className="m-1 space-y-0.5">
                  <div className="h-0.5 bg-amber-600/15 w-2/3"></div>
                </div>
              </div>
            </div>
            
            {/* Layer 5 - Distant spiral */}
            <div className="absolute inset-0 origin-center page-spiral-5">
              <div className="absolute top-1/4 left-1/2 w-8 h-12 bg-gradient-to-br from-white to-yellow-50 dark:from-gray-50 dark:to-yellow-100 rounded-sm shadow-md opacity-80"
                   style={{ transform: 'translateX(-50%) skewX(-5deg)' }}></div>
            </div>
            
            {/* Layer 6 - Farthest spiral */}
            <div className="absolute inset-0 origin-center page-spiral-6">
              <div className="absolute top-1/2 left-1/2 w-6 h-10 bg-gradient-to-bl from-yellow-50 to-white dark:from-yellow-100 dark:to-gray-50 rounded-sm shadow-md opacity-60"
                   style={{ transform: 'translateX(-50%) translateY(-50%) rotateZ(-20deg)' }}></div>
            </div>
          </div>
          
          {/* Holy Spirit Particles */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-yellow-300 rounded-full spirit-particle"></div>
            <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white rounded-full spirit-particle" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-amber-200 rounded-full spirit-particle" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 right-1/4 w-0.5 h-0.5 bg-yellow-200 rounded-full spirit-particle" style={{ animationDelay: '1.5s' }}></div>
            <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-white rounded-full spirit-particle" style={{ animationDelay: '2.5s' }}></div>
          </div>
        </div>
      </div>
    </>
  );
}