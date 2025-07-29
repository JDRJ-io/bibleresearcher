import React from 'react';

interface HolyBookLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HolyBookLoader({ size = 'md', className = '' }: HolyBookLoaderProps) {
  const sizeClasses = {
    sm: 'w-20 h-14',
    md: 'w-24 h-18',
    lg: 'w-28 h-22'
  };

  return (
    <>
      <style>{`
        @keyframes pages-flowing {
          0%, 100% { 
            transform: translateY(0px) rotateX(2deg) skewX(1deg);
            opacity: 0.7;
          }
          25% { 
            transform: translateY(-3px) rotateX(-1deg) skewX(-2deg);
            opacity: 0.9;
          }
          50% { 
            transform: translateY(2px) rotateX(3deg) skewX(0deg);
            opacity: 0.8;
          }
          75% { 
            transform: translateY(-1px) rotateX(-2deg) skewX(1deg);
            opacity: 1;
          }
        }
        
        @keyframes wind-flutter {
          0%, 100% { 
            transform: translateX(0px) translateY(0px) rotateZ(0deg);
            opacity: 0.6;
          }
          33% { 
            transform: translateX(4px) translateY(-2px) rotateZ(2deg);
            opacity: 0.9;
          }
          66% { 
            transform: translateX(-2px) translateY(1px) rotateZ(-1deg);
            opacity: 0.7;
          }
        }
        
        @keyframes holy-spirit-glow {
          0%, 100% { 
            box-shadow: 
              0 0 15px rgba(255, 255, 255, 0.4),
              0 0 30px rgba(255, 215, 0, 0.3),
              0 0 45px rgba(255, 255, 255, 0.2);
            filter: brightness(1.1);
          }
          50% { 
            box-shadow: 
              0 0 25px rgba(255, 255, 255, 0.6),
              0 0 50px rgba(255, 215, 0, 0.5),
              0 0 75px rgba(255, 255, 255, 0.3);
            filter: brightness(1.3);
          }
        }
        
        @keyframes spirit-wind {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) scale(1) rotate(0deg); 
            opacity: 0.5; 
          }
          25% { 
            transform: translateY(-6px) translateX(8px) scale(1.1) rotate(90deg); 
            opacity: 0.8; 
          }
          50% { 
            transform: translateY(-12px) translateX(4px) scale(0.9) rotate(180deg); 
            opacity: 0.6; 
          }
          75% { 
            transform: translateY(-8px) translateX(-6px) scale(1.2) rotate(270deg); 
            opacity: 0.9; 
          }
        }
        
        @keyframes sacred-breath {
          0% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
          100% { opacity: 0.3; transform: scale(1); }
        }
        
        @keyframes binding-radiance {
          0%, 100% { 
            opacity: 0.8; 
            transform: scaleX(1);
            filter: brightness(1.1);
          }
          50% { 
            opacity: 1; 
            transform: scaleX(1.1);
            filter: brightness(1.4);
          }
        }
        
        .holy-pages-flowing {
          animation: pages-flowing 3s ease-in-out infinite;
        }
        
        .holy-wind-flutter {
          animation: wind-flutter 2.5s ease-in-out infinite;
        }
        
        .holy-spirit-glow {
          animation: holy-spirit-glow 4s ease-in-out infinite;
        }
        
        .holy-spirit-wind {
          animation: spirit-wind 6s ease-in-out infinite;
        }
        
        .holy-sacred-breath {
          animation: sacred-breath 2.2s ease-in-out infinite;
        }
        
        .holy-binding-radiance {
          animation: binding-radiance 3.2s ease-in-out infinite;
        }
      `}</style>
      
      <div className={`inline-flex items-center justify-center ${className}`}>
        <div className={`relative ${sizeClasses[size]}`}>
          
          {/* Book Base - Laying flat face up */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-yellow-50 dark:from-amber-900 dark:via-amber-800 dark:to-yellow-700 rounded-lg shadow-2xl holy-spirit-glow">
            
            {/* Book Binding (left edge) */}
            <div className="absolute left-0 top-1 bottom-1 w-2 bg-gradient-to-b from-amber-700 via-yellow-600 to-amber-800 dark:from-amber-600 dark:via-yellow-500 dark:to-amber-700 rounded-l-lg holy-binding-radiance"></div>
            
            {/* Left Page - flowing in the wind */}
            <div className="absolute left-2 top-1 bottom-1 w-[45%] holy-pages-flowing">
              {/* Base page */}
              <div className="absolute inset-0 bg-gradient-to-br from-white via-yellow-50 to-amber-50 dark:from-gray-50 dark:via-yellow-100 dark:to-amber-100 rounded shadow-lg"></div>
              
              {/* Flowing pages - multiple layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-white to-yellow-100 dark:from-gray-50 dark:to-yellow-200 rounded opacity-80 holy-wind-flutter"></div>
              <div className="absolute left-1 top-1 bottom-1 right-1 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-100 dark:to-amber-200 rounded opacity-60 holy-wind-flutter" style={{ animationDelay: '0.7s' }}></div>
              <div className="absolute left-2 top-2 bottom-2 right-2 bg-gradient-to-br from-amber-50 to-white dark:from-amber-100 dark:to-gray-50 rounded opacity-40 holy-wind-flutter" style={{ animationDelay: '1.4s' }}></div>
              
              {/* Sacred Text flowing */}
              <div className="absolute left-2 top-2 right-1 space-y-1 z-10">
                <div className="h-0.5 bg-amber-700 dark:bg-amber-800 rounded holy-sacred-breath" style={{ width: '90%' }}></div>
                <div className="h-0.5 bg-amber-700 dark:bg-amber-800 rounded holy-sacred-breath" style={{ width: '85%', animationDelay: '0.4s' }}></div>
                <div className="h-0.5 bg-amber-700 dark:bg-amber-800 rounded holy-sacred-breath" style={{ width: '92%', animationDelay: '0.8s' }}></div>
                <div className="h-0.5 bg-amber-700 dark:bg-amber-800 rounded holy-sacred-breath" style={{ width: '88%', animationDelay: '1.2s' }}></div>
              </div>
            </div>
            
            {/* Right Page - flowing in the wind */}
            <div className="absolute right-1 top-1 bottom-1 w-[45%] holy-pages-flowing" style={{ animationDelay: '1.5s' }}>
              {/* Base page */}
              <div className="absolute inset-0 bg-gradient-to-bl from-white via-yellow-50 to-amber-50 dark:from-gray-50 dark:via-yellow-100 dark:to-amber-100 rounded shadow-lg"></div>
              
              {/* Flowing pages - multiple layers */}
              <div className="absolute inset-0 bg-gradient-to-bl from-white to-yellow-100 dark:from-gray-50 dark:to-yellow-200 rounded opacity-80 holy-wind-flutter" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute left-1 top-1 bottom-1 right-1 bg-gradient-to-bl from-yellow-50 to-amber-100 dark:from-yellow-100 dark:to-amber-200 rounded opacity-60 holy-wind-flutter" style={{ animationDelay: '1.2s' }}></div>
              <div className="absolute left-2 top-2 bottom-2 right-2 bg-gradient-to-bl from-amber-50 to-white dark:from-amber-100 dark:to-gray-50 rounded opacity-40 holy-wind-flutter" style={{ animationDelay: '1.9s' }}></div>
              
              {/* Sacred Text flowing */}
              <div className="absolute left-1 top-2 right-2 space-y-1 z-10">
                <div className="h-0.5 bg-amber-700 dark:bg-amber-800 rounded holy-sacred-breath" style={{ width: '87%', animationDelay: '0.6s' }}></div>
                <div className="h-0.5 bg-amber-700 dark:bg-amber-800 rounded holy-sacred-breath" style={{ width: '93%', animationDelay: '1s' }}></div>
                <div className="h-0.5 bg-amber-700 dark:bg-amber-800 rounded holy-sacred-breath" style={{ width: '89%', animationDelay: '1.4s' }}></div>
                <div className="h-0.5 bg-amber-700 dark:bg-amber-800 rounded holy-sacred-breath" style={{ width: '91%', animationDelay: '1.8s' }}></div>
              </div>
            </div>
          </div>
          
          {/* Holy Spirit Wind Particles */}
          <div className="absolute -inset-6 pointer-events-none">
            {/* Larger wind particles representing the Holy Spirit */}
            <div className="absolute top-0 left-1/4 w-2 h-2 bg-white rounded-full holy-spirit-wind opacity-70"></div>
            <div className="absolute top-1/4 right-1/3 w-1.5 h-1.5 bg-yellow-200 rounded-full holy-spirit-wind opacity-60" style={{ animationDelay: '1.5s' }}></div>
            <div className="absolute bottom-1/4 left-1/5 w-1 h-1 bg-amber-200 rounded-full holy-spirit-wind opacity-50" style={{ animationDelay: '3s' }}></div>
            <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-white rounded-full holy-spirit-wind opacity-65" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-yellow-300 rounded-full holy-spirit-wind opacity-55" style={{ animationDelay: '4s' }}></div>
            <div className="absolute top-1/3 right-1/5 w-1.5 h-1.5 bg-amber-300 rounded-full holy-spirit-wind opacity-60" style={{ animationDelay: '2.5s' }}></div>
            <div className="absolute bottom-1/5 left-2/5 w-1 h-1 bg-white rounded-full holy-spirit-wind opacity-45" style={{ animationDelay: '3.5s' }}></div>
            <div className="absolute top-1/5 right-2/5 w-2 h-2 bg-yellow-100 rounded-full holy-spirit-wind opacity-50" style={{ animationDelay: '4.5s' }}></div>
          </div>
        </div>
      </div>
    </>
  );
}