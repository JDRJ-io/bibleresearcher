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
  
  // Define the morphing paths with significant curve differences
  const d1a = `M10,38 Q${pixelSize / 2},8 ${pixelSize - 10},38`;   // tighter curve
  const d1b = `M6,30 Q${pixelSize / 2},-2 ${pixelSize - 6},30`;    // looser fan
  
  const d2a = `M10,46 Q${pixelSize / 2},16 ${pixelSize - 10},46`;  // tighter curve  
  const d2b = `M6,38 Q${pixelSize / 2},6 ${pixelSize - 6},38`;     // looser fan
  
  const d3a = `M10,54 Q${pixelSize / 2},24 ${pixelSize - 10},54`;  // tighter curve
  const d3b = `M6,46 Q${pixelSize / 2},14 ${pixelSize - 6},46`;    // looser fan

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
            strokeLinejoin="round"
          >
            <animate 
              attributeName="d"
              dur="1.4s"
              repeatCount="indefinite"
              values={`${d1a};${d1b};${d1a}`} 
            />
          </path>

          {/* Path 2 - Middle arc (staggered 0.08s) */}
          <path
            d={d2a}
            fill="none"
            stroke={stroke}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate 
              attributeName="d"
              dur="1.4s"
              begin="0.08s"
              repeatCount="indefinite"
              values={`${d2a};${d2b};${d2a}`} 
            />
          </path>

          {/* Path 3 - Bottom arc (staggered 0.16s) */}
          <path
            d={d3a}
            fill="none"
            stroke={stroke}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate 
              attributeName="d"
              dur="1.4s"
              begin="0.16s"
              repeatCount="indefinite"
              values={`${d3a};${d3b};${d3a}`} 
            />
          </path>
          
          {/* Divine sparkles with gentle shimmer */}
          <g>
            <circle cx="20" cy="25" r="1.5" fill="#daa520" opacity="0.7">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={pixelSize - 20} cy="30" r="1" fill="#daa520" opacity="0.7">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" begin="0.8s" repeatCount="indefinite" />
            </circle>
            <circle cx={pixelSize / 2} cy="15" r="1.2" fill="#daa520" opacity="0.7">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" begin="1.6s" repeatCount="indefinite" />
            </circle>
            <circle cx={pixelSize * 0.75} cy="55" r="0.8" fill="#daa520" opacity="0.7">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" begin="2.1s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>
      </div>
    </div>
  );
}