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
        @keyframes pages-flip {
          0% { 
            transform: perspective(400px) rotateY(-25deg) rotateX(5deg);
            filter: blur(0px);
            opacity: 0.8;
          }
          25% { 
            transform: perspective(400px) rotateY(-5deg) rotateX(-2deg);
            filter: blur(1px);
            opacity: 1;
          }
          50% { 
            transform: perspective(400px) rotateY(10deg) rotateX(3deg);
            filter: blur(2px);
            opacity: 0.9;
          }
          75% { 
            transform: perspective(400px) rotateY(25deg) rotateX(-1deg);
            filter: blur(1px);
            opacity: 1;
          }
          100% { 
            transform: perspective(400px) rotateY(-25deg) rotateX(5deg);
            filter: blur(0px);
            opacity: 0.8;
          }
        }
        
        @keyframes holy-divine-glow {
          0%, 100% { 
            box-shadow: 
              0 0 20px rgba(255, 215, 0, 0.6),
              0 0 40px rgba(255, 215, 0, 0.3),
              0 0 60px rgba(255, 255, 255, 0.2),
              inset 0 0 20px rgba(255, 215, 0, 0.1);
            filter: brightness(1.1);
          }
          50% { 
            box-shadow: 
              0 0 30px rgba(255, 215, 0, 0.8),
              0 0 60px rgba(255, 215, 0, 0.5),
              0 0 90px rgba(255, 255, 255, 0.3),
              inset 0 0 30px rgba(255, 215, 0, 0.2);
            filter: brightness(1.3);
          }
        }
        
        @keyframes page-whisper {
          0%, 100% { 
            transform: translateX(0px) rotateZ(0deg);
            opacity: 0.4;
          }
          25% { 
            transform: translateX(-2px) rotateZ(-1deg);
            opacity: 0.8;
          }
          50% { 
            transform: translateX(3px) rotateZ(1deg);
            opacity: 0.6;
          }
          75% { 
            transform: translateX(-1px) rotateZ(-0.5deg);
            opacity: 0.9;
          }
        }
        
        @keyframes divine-particles {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) scale(1) rotate(0deg); 
            opacity: 0.7; 
          }
          33% { 
            transform: translateY(-8px) translateX(6px) scale(1.2) rotate(120deg); 
            opacity: 1; 
          }
          66% { 
            transform: translateY(4px) translateX(-4px) scale(0.8) rotate(240deg); 
            opacity: 0.8; 
          }
        }
        
        @keyframes sacred-text {
          0% { opacity: 0.2; transform: scale(0.98); }
          50% { opacity: 0.9; transform: scale(1.02); }
          100% { opacity: 0.2; transform: scale(0.98); }
        }
        
        @keyframes spine-radiance {
          0%, 100% { 
            opacity: 0.9; 
            transform: scaleY(1);
            filter: brightness(1.2);
          }
          50% { 
            opacity: 1; 
            transform: scaleY(1.05);
            filter: brightness(1.5);
          }
        }
        
        .holy-pages-flip {
          animation: pages-flip 2.5s ease-in-out infinite;
        }
        
        .holy-divine-glow {
          animation: holy-divine-glow 3s ease-in-out infinite;
        }
        
        .holy-page-whisper {
          animation: page-whisper 4s ease-in-out infinite;
        }
        
        .holy-divine-particles {
          animation: divine-particles 5s ease-in-out infinite;
        }
        
        .holy-sacred-text {
          animation: sacred-text 2s ease-in-out infinite;
        }
        
        .holy-spine-radiance {
          animation: spine-radiance 2.8s ease-in-out infinite;
        }
      `}</style>
      
      <div className={`inline-flex items-center justify-center ${className}`}>
        <div className={`relative ${sizeClasses[size]}`} style={{ perspective: '400px' }}>
          
          {/* Book Base */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-white dark:from-amber-900 dark:via-amber-800 dark:to-amber-700 rounded-lg shadow-2xl holy-divine-glow">
            
            {/* Sacred Spine */}
            <div className="absolute left-1/2 top-1 bottom-1 w-2 bg-gradient-to-b from-yellow-600 via-amber-700 to-yellow-800 dark:from-yellow-500 dark:via-amber-600 dark:to-yellow-700 transform -translate-x-1/2 rounded-full holy-spine-radiance"></div>
            
            {/* Left Page Stack with Motion Blur Effect */}
            <div className="absolute left-1 top-2 bottom-2 w-[46%] holy-pages-flip">
              {/* Base page */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-yellow-50 to-amber-50 dark:from-gray-50 dark:via-yellow-100 dark:to-amber-100 rounded-l-lg shadow-lg"></div>
              
              {/* Flipping pages with blur effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white to-yellow-100 dark:from-gray-50 dark:to-yellow-200 rounded-l-lg opacity-80 holy-page-whisper"></div>
              <div className="absolute left-1 top-1 bottom-1 right-2 bg-gradient-to-r from-white to-amber-50 dark:from-gray-50 dark:to-amber-100 rounded-l-lg opacity-60 holy-page-whisper" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute left-2 top-2 bottom-2 right-4 bg-gradient-to-r from-yellow-50 to-amber-100 dark:from-yellow-100 dark:to-amber-200 rounded-l-lg opacity-40 holy-page-whisper" style={{ animationDelay: '1s' }}></div>
              
              {/* Sacred Text */}
              <div className="absolute left-3 top-3 right-1 space-y-1 z-10">
                <div className="h-0.5 bg-amber-600 dark:bg-amber-700 rounded holy-sacred-text" style={{ width: '85%' }}></div>
                <div className="h-0.5 bg-amber-600 dark:bg-amber-700 rounded holy-sacred-text" style={{ width: '92%', animationDelay: '0.3s' }}></div>
                <div className="h-0.5 bg-amber-600 dark:bg-amber-700 rounded holy-sacred-text" style={{ width: '78%', animationDelay: '0.6s' }}></div>
                <div className="h-0.5 bg-amber-600 dark:bg-amber-700 rounded holy-sacred-text" style={{ width: '88%', animationDelay: '0.9s' }}></div>
              </div>
            </div>
            
            {/* Right Page Stack with Motion Blur Effect */}
            <div className="absolute right-1 top-2 bottom-2 w-[46%] holy-pages-flip" style={{ animationDelay: '1.2s' }}>
              {/* Base page */}
              <div className="absolute inset-0 bg-gradient-to-l from-white via-yellow-50 to-amber-50 dark:from-gray-50 dark:via-yellow-100 dark:to-amber-100 rounded-r-lg shadow-lg"></div>
              
              {/* Flipping pages with blur effect */}
              <div className="absolute inset-0 bg-gradient-to-l from-white to-yellow-100 dark:from-gray-50 dark:to-yellow-200 rounded-r-lg opacity-80 holy-page-whisper" style={{ animationDelay: '0.3s' }}></div>
              <div className="absolute right-1 top-1 bottom-1 left-2 bg-gradient-to-l from-white to-amber-50 dark:from-gray-50 dark:to-amber-100 rounded-r-lg opacity-60 holy-page-whisper" style={{ animationDelay: '0.8s' }}></div>
              <div className="absolute right-2 top-2 bottom-2 left-4 bg-gradient-to-l from-yellow-50 to-amber-100 dark:from-yellow-100 dark:to-amber-200 rounded-r-lg opacity-40 holy-page-whisper" style={{ animationDelay: '1.3s' }}></div>
              
              {/* Sacred Text */}
              <div className="absolute right-3 top-3 left-1 space-y-1 z-10">
                <div className="h-0.5 bg-amber-600 dark:bg-amber-700 rounded holy-sacred-text" style={{ width: '80%', animationDelay: '0.4s' }}></div>
                <div className="h-0.5 bg-amber-600 dark:bg-amber-700 rounded holy-sacred-text" style={{ width: '90%', animationDelay: '0.7s' }}></div>
                <div className="h-0.5 bg-amber-600 dark:bg-amber-700 rounded holy-sacred-text" style={{ width: '75%', animationDelay: '1s' }}></div>
                <div className="h-0.5 bg-amber-600 dark:bg-amber-700 rounded holy-sacred-text" style={{ width: '85%', animationDelay: '1.3s' }}></div>
              </div>
            </div>
          </div>
          
          {/* Divine Light Particles */}
          <div className="absolute -inset-4 pointer-events-none">
            <div className="absolute top-2 left-1/4 w-1 h-1 bg-yellow-300 rounded-full holy-divine-particles opacity-80"></div>
            <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-amber-300 rounded-full holy-divine-particles opacity-70" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-1/4 left-1/3 w-0.5 h-0.5 bg-yellow-200 rounded-full holy-divine-particles opacity-60" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-amber-400 rounded-full holy-divine-particles opacity-75" style={{ animationDelay: '1.5s' }}></div>
            <div className="absolute bottom-1/3 left-1/5 w-0.5 h-0.5 bg-yellow-300 rounded-full holy-divine-particles opacity-65" style={{ animationDelay: '2.5s' }}></div>
            <div className="absolute top-1/4 right-1/5 w-1.5 h-1.5 bg-white rounded-full holy-divine-particles opacity-60" style={{ animationDelay: '3s' }}></div>
          </div>
        </div>
      </div>
    </>
  );
}