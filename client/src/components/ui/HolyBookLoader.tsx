import React from 'react';

interface HolyBookLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HolyBookLoader({ size = 'md', className = '' }: HolyBookLoaderProps) {
  const sizeClasses = {
    sm: 'w-16 h-12',
    md: 'w-24 h-18', 
    lg: 'w-32 h-24'
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes fanPage {
              0% {
                d: path("M10,40 Q60,10 110,40");
              }
              50% {
                d: path("M5,35 Q60,5 115,35");
              }
              100% {
                d: path("M10,40 Q60,10 110,40");
              }
            }
            
            @keyframes divineGlow {
              0%, 100% { 
                filter: drop-shadow(0 0 8px rgba(218, 165, 32, 0.4));
                opacity: 0.6;
              }
              50% { 
                filter: drop-shadow(0 0 16px rgba(218, 165, 32, 0.8));
                opacity: 1;
              }
            }
            
            .fan-path {
              stroke: #8b4513;
              stroke-width: 3;
              stroke-linecap: round;
              fill: none;
              animation: fanPage 1.2s ease-in-out infinite;
              animation-delay: calc(var(--i) * 0.1s);
            }
            
            .divine-sparkle {
              animation: divineGlow 2s ease-in-out infinite;
              animation-delay: calc(var(--spark-delay) * 0.3s);
            }
          `
        }} />
        
        <div className="w-full h-full relative flex items-center justify-center">
          <svg 
            viewBox="0 0 120 70" 
            className="w-full h-full"
            aria-label="Fanning Bible pages"
            role="img"
          >
            {/* Three curved page arcs with staggered animation */}
            <path 
              className="fan-path"
              style={{ '--i': 0 } as any}
              d="M10,40 Q60,10 110,40"
            />
            <path 
              className="fan-path"
              style={{ '--i': 1 } as any}  
              d="M10,50 Q60,20 110,50"
            />
            <path 
              className="fan-path"
              style={{ '--i': 2 } as any}
              d="M10,60 Q60,30 110,60"
            />
            
            {/* Divine sparkles around the fan */}
            <circle 
              className="divine-sparkle"
              style={{ '--spark-delay': 0 } as any}
              cx="25" 
              cy="25" 
              r="1.5" 
              fill="#daa520"
            />
            <circle 
              className="divine-sparkle"
              style={{ '--spark-delay': 1 } as any}
              cx="95" 
              cy="30" 
              r="1" 
              fill="#daa520"
            />
            <circle 
              className="divine-sparkle"
              style={{ '--spark-delay': 2 } as any}
              cx="60" 
              cy="15" 
              r="1.2" 
              fill="#daa520"
            />
            <circle 
              className="divine-sparkle"
              style={{ '--spark-delay': 1.5 } as any}
              cx="80" 
              cy="55" 
              r="0.8" 
              fill="#daa520"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}