import React from 'react';

interface HolyBookLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HolyBookLoader({ size = 'md', className = '' }: HolyBookLoaderProps) {
  const sizeMap = {
    sm: 80,
    md: 120,
    lg: 160
  };
  
  const pixelSize = sizeMap[size];
  const h = pixelSize * 0.45;
  const duration = 1400;
  const stroke = '#8b4513'; // Biblical brown color
  
  // Define the morphing paths
  const d1a = `M10,${h - 10} Q${pixelSize / 2},5 ${pixelSize - 10},${h - 10}`;
  const d1b = `M6,${h - 18} Q${pixelSize / 2},0 ${pixelSize - 6},${h - 18}`;
  
  const d2a = `M10,${h - 2} Q${pixelSize / 2},13 ${pixelSize - 10},${h - 2}`;
  const d2b = `M6,${h - 6} Q${pixelSize / 2},9 ${pixelSize - 6},${h - 6}`;
  
  const d3a = `M10,${h + 6} Q${pixelSize / 2},21 ${pixelSize - 10},${h + 6}`;
  const d3b = `M6,${h + 10} Q${pixelSize / 2},25 ${pixelSize - 6},${h + 10}`;

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-2 ${className}`}>
      <div className="relative">
        <svg
          width={pixelSize}
          height={h + 20}
          viewBox={`0 0 ${pixelSize} ${h + 20}`}
          role="img"
          aria-label="Fanning Bible pages"
          className="filter drop-shadow-sm"
        >
          {/* Path 1 - Top arc */}
          <path
            d={d1a}
            fill="none"
            stroke={stroke}
            strokeWidth={6}
            strokeLinecap="round"
          >
            <animate 
              attributeName="d"
              dur={`${duration}ms`}
              repeatCount="indefinite"
              values={`${d1a};${d1b};${d1a}`} 
            />
          </path>

          {/* Path 2 - Middle arc (staggered 0.1s) */}
          <path
            d={d2a}
            fill="none"
            stroke={stroke}
            strokeWidth={6}
            strokeLinecap="round"
          >
            <animate 
              attributeName="d"
              dur={`${duration}ms`}
              begin="0.1s"
              repeatCount="indefinite"
              values={`${d2a};${d2b};${d2a}`} 
            />
          </path>

          {/* Path 3 - Bottom arc (staggered 0.2s) */}
          <path
            d={d3a}
            fill="none"
            stroke={stroke}
            strokeWidth={6}
            strokeLinecap="round"
          >
            <animate 
              attributeName="d"
              dur={`${duration}ms`}
              begin="0.2s"
              repeatCount="indefinite"
              values={`${d3a};${d3b};${d3a}`} 
            />
          </path>
          
          {/* Divine sparkles with SMIL animation */}
          <circle cx={pixelSize * 0.2} cy={h * 0.3} r="1.5" fill="#daa520" opacity="0.7">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={pixelSize * 0.8} cy={h * 0.4} r="1" fill="#daa520" opacity="0.7">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.7s" repeatCount="indefinite" />
          </circle>
          <circle cx={pixelSize * 0.5} cy={h * 0.1} r="1.2" fill="#daa520" opacity="0.7">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="1.3s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    </div>
  );
}