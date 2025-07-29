import React from 'react';

interface HolyBookLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HolyBookLoader({ size = 'md', className = '' }: HolyBookLoaderProps) {
  const sizeClasses = {
    sm: 'w-16 h-20',
    md: 'w-20 h-24',
    lg: 'w-24 h-32'
  };

  return (
    <>
      <style>{`
        @keyframes page-flow-up {
          0% { 
            transform: translateY(0px) translateX(0px) rotateX(0deg) scale(1);
            opacity: 0;
          }
          10% {
            transform: translateY(-2px) translateX(1px) rotateX(10deg) scale(1);
            opacity: 0.9;
          }
          30% { 
            transform: translateY(-15px) translateX(3px) rotateX(25deg) scale(0.95);
            opacity: 1;
            filter: blur(0px);
          }
          50% { 
            transform: translateY(-30px) translateX(5px) rotateX(45deg) scale(0.9);
            opacity: 0.9;
            filter: blur(0.5px);
          }
          70% {
            transform: translateY(-45px) translateX(7px) rotateX(65deg) scale(0.85);
            opacity: 0.6;
            filter: blur(1px);
          }
          90% { 
            transform: translateY(-60px) translateX(10px) rotateX(85deg) scale(0.8);
            opacity: 0.2;
            filter: blur(2px);
          }
          100% {
            transform: translateY(-70px) translateX(12px) rotateX(90deg) scale(0.75);
            opacity: 0;
            filter: blur(3px);
          }
        }
        
        @keyframes gentle-glow {
          0%, 100% { 
            box-shadow: 
              0 2px 10px rgba(255, 215, 0, 0.3),
              0 4px 20px rgba(255, 255, 255, 0.2),
              0 0 30px rgba(255, 215, 0, 0.1);
          }
          50% { 
            box-shadow: 
              0 2px 15px rgba(255, 215, 0, 0.5),
              0 4px 30px rgba(255, 255, 255, 0.3),
              0 0 40px rgba(255, 215, 0, 0.2);
          }
        }
        
        @keyframes wind-particle {
          0% { 
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          20% {
            opacity: 0.6;
          }
          100% { 
            transform: translateY(-80px) translateX(20px);
            opacity: 0;
          }
        }
        
        .page-flow {
          animation: page-flow-up 4s ease-out infinite;
          transform-origin: bottom center;
        }
        
        .holy-glow {
          animation: gentle-glow 3s ease-in-out infinite;
        }
        
        .wind-particle {
          animation: wind-particle 3s ease-out infinite;
        }
      `}</style>
      
      <div className={`inline-flex items-center justify-center ${className}`}>
        <div className={`relative ${sizeClasses[size]}`}>
          
          {/* Book laying on its back - side view */}
          <div className="absolute bottom-0 left-1/4 right-1/4 h-1/3 bg-gradient-to-r from-amber-800 via-amber-600 to-amber-700 dark:from-amber-700 dark:via-amber-500 dark:to-amber-600 rounded holy-glow">
            
            {/* Book spine (left edge) */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-amber-900 to-amber-800 dark:from-amber-800 dark:to-amber-700 rounded-l"></div>
            
            {/* Book pages (visible from side) */}
            <div className="absolute left-2 right-1 top-1 bottom-1 bg-gradient-to-r from-yellow-50 via-white to-yellow-50 dark:from-yellow-100 dark:via-gray-50 dark:to-yellow-100">
              {/* Page edge lines */}
              <div className="absolute inset-y-0 left-0 w-full flex">
                <div className="w-px bg-gray-300 dark:bg-gray-400 mx-0.5"></div>
                <div className="w-px bg-gray-300 dark:bg-gray-400 mx-0.5"></div>
                <div className="w-px bg-gray-300 dark:bg-gray-400 mx-0.5"></div>
                <div className="w-px bg-gray-300 dark:bg-gray-400 mx-0.5"></div>
              </div>
            </div>
          </div>
          
          {/* Flowing pages - multiple layers rising from the book */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-1/2">
            {/* Page 1 */}
            <div className="absolute inset-x-0 bottom-0 w-full h-8 page-flow">
              <div className="w-full h-full bg-gradient-to-t from-white via-yellow-50/90 to-transparent dark:from-gray-50 dark:via-yellow-100/90 dark:to-transparent rounded shadow-lg">
                <div className="p-1">
                  <div className="h-0.5 bg-amber-600/15 w-3/4 mx-auto"></div>
                  <div className="h-0.5 bg-amber-600/15 w-5/6 mx-auto mt-0.5"></div>
                </div>
              </div>
            </div>
            
            {/* Page 2 */}
            <div className="absolute inset-x-0 bottom-0 w-full h-8 page-flow" style={{ animationDelay: '0.5s' }}>
              <div className="w-full h-full bg-gradient-to-t from-white/90 via-amber-50/80 to-transparent dark:from-gray-50/90 dark:via-amber-100/80 dark:to-transparent rounded shadow-lg">
                <div className="p-1">
                  <div className="h-0.5 bg-amber-600/10 w-5/6 mx-auto"></div>
                  <div className="h-0.5 bg-amber-600/10 w-2/3 mx-auto mt-0.5"></div>
                </div>
              </div>
            </div>
            
            {/* Page 3 */}
            <div className="absolute inset-x-0 bottom-0 w-full h-8 page-flow" style={{ animationDelay: '1s' }}>
              <div className="w-full h-full bg-gradient-to-t from-yellow-50/80 via-white/70 to-transparent dark:from-yellow-100/80 dark:via-gray-50/70 dark:to-transparent rounded shadow-md">
                <div className="p-1">
                  <div className="h-0.5 bg-amber-600/8 w-2/3 mx-auto"></div>
                </div>
              </div>
            </div>
            
            {/* Page 4 */}
            <div className="absolute inset-x-0 bottom-0 w-full h-8 page-flow" style={{ animationDelay: '1.5s' }}>
              <div className="w-full h-full bg-gradient-to-t from-white/70 to-transparent dark:from-gray-50/70 dark:to-transparent rounded shadow-md"></div>
            </div>
            
            {/* Page 5 */}
            <div className="absolute inset-x-0 bottom-0 w-full h-8 page-flow" style={{ animationDelay: '2s' }}>
              <div className="w-full h-full bg-gradient-to-t from-amber-50/60 to-transparent dark:from-amber-100/60 dark:to-transparent rounded shadow"></div>
            </div>
          </div>
          
          {/* Holy Spirit wind particles */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-10 left-1/4 w-1 h-1 bg-yellow-300/60 rounded-full wind-particle"></div>
            <div className="absolute bottom-12 right-1/3 w-0.5 h-0.5 bg-white/50 rounded-full wind-particle" style={{ animationDelay: '0.8s' }}></div>
            <div className="absolute bottom-8 left-1/3 w-1 h-1 bg-amber-200/40 rounded-full wind-particle" style={{ animationDelay: '1.6s' }}></div>
            <div className="absolute bottom-14 right-1/4 w-0.5 h-0.5 bg-yellow-200/50 rounded-full wind-particle" style={{ animationDelay: '2.4s' }}></div>
          </div>
        </div>
      </div>
    </>
  );
}