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
            @keyframes pageFlip1 {
              0%, 20% { transform: rotateY(0deg) scaleX(1); opacity: 0.9; }
              25%, 45% { transform: rotateY(-15deg) scaleX(0.95); opacity: 0.7; }
              50%, 70% { transform: rotateY(-30deg) scaleX(0.9); opacity: 0.5; }
              75%, 95% { transform: rotateY(-45deg) scaleX(0.85); opacity: 0.3; }
              100% { transform: rotateY(-60deg) scaleX(0.8); opacity: 0.1; }
            }
            
            @keyframes pageFlip2 {
              0%, 15% { transform: rotateY(0deg) scaleX(1); opacity: 0.9; }
              20%, 40% { transform: rotateY(-12deg) scaleX(0.96); opacity: 0.75; }
              45%, 65% { transform: rotateY(-25deg) scaleX(0.92); opacity: 0.6; }
              70%, 90% { transform: rotateY(-38deg) scaleX(0.88); opacity: 0.4; }
              95%, 100% { transform: rotateY(-50deg) scaleX(0.84); opacity: 0.2; }
            }
            
            @keyframes pageFlip3 {
              0%, 10% { transform: rotateY(0deg) scaleX(1); opacity: 0.9; }
              15%, 35% { transform: rotateY(-10deg) scaleX(0.97); opacity: 0.8; }
              40%, 60% { transform: rotateY(-20deg) scaleX(0.94); opacity: 0.7; }
              65%, 85% { transform: rotateY(-32deg) scaleX(0.9); opacity: 0.5; }
              90%, 100% { transform: rotateY(-42deg) scaleX(0.86); opacity: 0.3; }
            }
            
            @keyframes pageFlip4 {
              0%, 5% { transform: rotateY(0deg) scaleX(1); opacity: 0.9; }
              10%, 30% { transform: rotateY(-8deg) scaleX(0.98); opacity: 0.85; }
              35%, 55% { transform: rotateY(-16deg) scaleX(0.96); opacity: 0.8; }
              60%, 80% { transform: rotateY(-26deg) scaleX(0.93); opacity: 0.6; }
              85%, 100% { transform: rotateY(-35deg) scaleX(0.9); opacity: 0.4; }
            }
            
            @keyframes bookGlow {
              0%, 100% { filter: drop-shadow(0 0 8px rgba(218, 165, 32, 0.3)); }
              50% { filter: drop-shadow(0 0 16px rgba(218, 165, 32, 0.6)); }
            }
            
            .holy-book-container {
              animation: bookGlow 3s ease-in-out infinite;
            }
            
            .page-layer-1 {
              animation: pageFlip1 2s ease-in-out infinite;
              transform-origin: left center;
            }
            
            .page-layer-2 {
              animation: pageFlip2 2s ease-in-out infinite 0.15s;
              transform-origin: left center;
            }
            
            .page-layer-3 {
              animation: pageFlip3 2s ease-in-out infinite 0.3s;
              transform-origin: left center;
            }
            
            .page-layer-4 {
              animation: pageFlip4 2s ease-in-out infinite 0.45s;
              transform-origin: left center;
            }
          `
        }} />
        
        <div className="holy-book-container w-full h-full relative">
          <svg 
            viewBox="0 0 120 80" 
            className="w-full h-full"
            fill="none"
          >
            {/* Book spine/binding */}
            <rect 
              x="58" 
              y="25" 
              width="4" 
              height="30" 
              fill="#8b4513" 
              rx="2"
              opacity="0.9"
            />
            
            {/* Left book cover */}
            <path 
              d="M10 25 L58 25 L58 55 L10 55 C8 55 6 53 6 51 L6 29 C6 27 8 25 10 25 Z" 
              fill="#654321" 
              stroke="#8b4513" 
              strokeWidth="1"
            />
            
            {/* Right book cover */}
            <path 
              d="M62 25 L110 25 C112 25 114 27 114 29 L114 51 C114 53 112 55 110 55 L62 55 L62 25 Z" 
              fill="#654321" 
              stroke="#8b4513" 
              strokeWidth="1"
            />
            
            {/* Animated pages - Layer 1 (Topmost) */}
            <g className="page-layer-1">
              <path 
                d="M12 27 L56 27 L56 53 L12 53 Z" 
                fill="#fffef7" 
                stroke="#e6e6e6" 
                strokeWidth="0.5"
              />
              {/* Text lines on page */}
              <line x1="16" y1="32" x2="52" y2="32" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
              <line x1="16" y1="36" x2="50" y2="36" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
              <line x1="16" y1="40" x2="52" y2="40" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
              <line x1="16" y1="44" x2="48" y2="44" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
            </g>
            
            {/* Animated pages - Layer 2 */}
            <g className="page-layer-2">
              <path 
                d="M13 28 L57 28 L57 52 L13 52 Z" 
                fill="#fefdf6" 
                stroke="#e6e6e6" 
                strokeWidth="0.5"
              />
              <line x1="17" y1="33" x2="53" y2="33" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
              <line x1="17" y1="37" x2="51" y2="37" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
              <line x1="17" y1="41" x2="53" y2="41" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
              <line x1="17" y1="45" x2="49" y2="45" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
            </g>
            
            {/* Animated pages - Layer 3 */}
            <g className="page-layer-3">
              <path 
                d="M14 29 L58 29 L58 51 L14 51 Z" 
                fill="#fdfcf5" 
                stroke="#e6e6e6" 
                strokeWidth="0.5"
              />
              <line x1="18" y1="34" x2="54" y2="34" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
              <line x1="18" y1="38" x2="52" y2="38" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
              <line x1="18" y1="42" x2="54" y2="42" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
              <line x1="18" y1="46" x2="50" y2="46" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
            </g>
            
            {/* Animated pages - Layer 4 (Bottom) */}
            <g className="page-layer-4">
              <path 
                d="M15 30 L59 30 L59 50 L15 50 Z" 
                fill="#fcfbf4" 
                stroke="#e6e6e6" 
                strokeWidth="0.5"
              />
              <line x1="19" y1="35" x2="55" y2="35" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
              <line x1="19" y1="39" x2="53" y2="39" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
              <line x1="19" y1="43" x2="55" y2="43" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
              <line x1="19" y1="47" x2="51" y2="47" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
            </g>
            
            {/* Right pages (static) */}
            <path 
              d="M64 27 L108 27 L108 53 L64 53 Z" 
              fill="#fffef7" 
              stroke="#e6e6e6" 
              strokeWidth="0.5"
              opacity="0.9"
            />
            {/* Right page text lines */}
            <line x1="68" y1="32" x2="104" y2="32" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
            <line x1="68" y1="36" x2="102" y2="36" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
            <line x1="68" y1="40" x2="104" y2="40" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
            <line x1="68" y1="44" x2="100" y2="44" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
            <line x1="68" y1="48" x2="104" y2="48" stroke="#333" strokeWidth="0.3" opacity="0.4"/>
            
            {/* Divine light rays emanating from the book */}
            <g opacity="0.3">
              <path d="M60 20 L60 10 M55 22 L45 12 M65 22 L75 12" 
                    stroke="#daa520" strokeWidth="2" fill="none">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
              </path>
            </g>
            
            {/* Golden cross on spine */}
            <g opacity="0.8">
              <line x1="60" y1="35" x2="60" y2="45" stroke="#daa520" strokeWidth="1"/>
              <line x1="56" y1="40" x2="64" y2="40" stroke="#daa520" strokeWidth="1"/>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}