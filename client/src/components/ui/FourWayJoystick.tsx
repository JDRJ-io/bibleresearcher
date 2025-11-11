import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import type { ScrollMode } from "@/lib/smartScrollbar";

interface FourWayJoystickProps {
  mode: ScrollMode;
  onLeft: () => void;
  onRight: () => void;
  onUp: () => void;
  onDown: () => void;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

type Direction = 'left' | 'right' | 'up' | 'down' | null;

function getModeIdentifier(mode: ScrollMode): string {
  switch (mode) {
    case 'global': return 'G';
    case 'testament': return 'T';
    case 'section': return 'S';
    case 'book': return 'B';
    case 'auto': return 'G';
    default: return 'G';
  }
}

export function FourWayJoystick({
  mode,
  onLeft,
  onRight,
  onUp,
  onDown,
  size = 56,
  className = "",
  style,
}: FourWayJoystickProps) {
  const [activeDirection, setActiveDirection] = useState<Direction>(null);
  const repeatTimerRef = useRef<number | null>(null);
  const modeChar = getModeIdentifier(mode);

  const HOLD_TRIGGER_MS = 300;
  const HOLD_REPEAT_MS = 220;
  
  // Scale factors based on size
  const scale = size / 56;
  const centerSize = Math.round(24 * scale);
  const arrowSize = Math.round(18 * scale);
  const modeFontSize = Math.round(10 * scale);
  const buttonSize = Math.round(20 * scale);
  const buttonInset = Math.round(-2 * scale);

  const fireDirection = (direction: Direction) => {
    if (!direction) return;
    
    switch (direction) {
      case 'left': onLeft(); break;
      case 'right': onRight(); break;
      case 'up': onUp(); break;
      case 'down': onDown(); break;
    }
  };

  const startRepeat = (direction: Direction) => {
    if (!direction || repeatTimerRef.current !== null) return;

    repeatTimerRef.current = window.setTimeout(() => {
      const interval = window.setInterval(() => {
        fireDirection(direction);
      }, HOLD_REPEAT_MS);
      
      repeatTimerRef.current = interval;
    }, HOLD_TRIGGER_MS);
  };

  const stopRepeat = () => {
    if (repeatTimerRef.current !== null) {
      clearTimeout(repeatTimerRef.current);
      clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
  };

  const handleDirectionClick = (direction: Direction) => {
    setActiveDirection(direction);
    fireDirection(direction);
    startRepeat(direction);
  };

  const handleDirectionRelease = () => {
    setActiveDirection(null);
    stopRepeat();
  };

  useEffect(() => {
    return () => {
      stopRepeat();
    };
  }, []);

  return (
    <div 
      className={`relative flex items-center justify-center select-none transition-all duration-200 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        opacity: activeDirection ? 1 : 0.8,
        transform: activeDirection ? 'scale(1.1)' : 'scale(1)',
        ...style,
      }}
      data-testid="four-way-joystick"
      aria-label="Four-way navigation joystick"
    >
      {/* Background circle */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none transition-all duration-200 bg-gray-300 dark:bg-gray-700"
      />

      {/* Outer ring glow */}
      <div 
        className="absolute inset-0 rounded-full transition-opacity duration-200 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
          opacity: activeDirection ? 1 : 0,
        }}
      />
      
      {/* Center mode indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="relative rounded-full flex items-center justify-center transition-transform duration-200"
          style={{
            width: `${centerSize}px`,
            height: `${centerSize}px`,
            background: 'rgb(59, 130, 246)',
            transform: activeDirection ? 'scale(0.92)' : 'scale(1)',
          }}
        >
          <span 
            className="font-bold tracking-wide transition-colors text-white/90 dark:text-white/95"
            style={{
              fontSize: `${modeFontSize}px`,
              textShadow: '0 0.5px 1px rgba(0, 0, 0, 0.25)',
            }}
          >
            {modeChar}
          </span>
        </div>
      </div>

      {/* Up button */}
      <button
        className="absolute flex items-center justify-center cursor-pointer transition-all duration-150 hover:scale-110 active:scale-95"
        style={{
          top: `${buttonInset}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${buttonSize}px`,
          height: `${buttonSize}px`,
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'none',
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDirectionClick('up');
        }}
        onPointerUp={handleDirectionRelease}
        onPointerCancel={handleDirectionRelease}
        onPointerLeave={handleDirectionRelease}
        data-testid="button-up"
        aria-label="Navigate up"
      >
        <div 
          className={`transition-all duration-150 ${activeDirection === 'up' ? 'scale-110' : ''}`}
          style={{
            filter: 'drop-shadow(0 3px 4px rgba(0, 0, 0, 0.6)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8)) drop-shadow(0 -1px 1px rgba(255, 255, 255, 0.1))',
          }}
        >
          <ChevronUp 
            style={{ width: arrowSize, height: arrowSize, color: activeDirection === 'up' ? 'rgba(59, 130, 246, 1)' : 'rgba(59, 130, 246, 0.85)' }} 
            className="transition-colors"
          />
        </div>
      </button>

      {/* Down button */}
      <button
        className="absolute flex items-center justify-center cursor-pointer transition-all duration-150 hover:scale-110 active:scale-95"
        style={{
          bottom: `${buttonInset}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${buttonSize}px`,
          height: `${buttonSize}px`,
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'none',
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDirectionClick('down');
        }}
        onPointerUp={handleDirectionRelease}
        onPointerCancel={handleDirectionRelease}
        onPointerLeave={handleDirectionRelease}
        data-testid="button-down"
        aria-label="Navigate down"
      >
        <div 
          className={`transition-all duration-150 ${activeDirection === 'down' ? 'scale-110' : ''}`}
          style={{
            filter: 'drop-shadow(0 3px 4px rgba(0, 0, 0, 0.6)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8)) drop-shadow(0 -1px 1px rgba(255, 255, 255, 0.1))',
          }}
        >
          <ChevronDown 
            style={{ width: arrowSize, height: arrowSize, color: activeDirection === 'down' ? 'rgba(59, 130, 246, 1)' : 'rgba(59, 130, 246, 0.85)' }} 
            className="transition-colors"
          />
        </div>
      </button>

      {/* Left button */}
      <button
        className="absolute flex items-center justify-center cursor-pointer transition-all duration-150 hover:scale-110 active:scale-95"
        style={{
          left: `${buttonInset}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: `${buttonSize}px`,
          height: `${buttonSize}px`,
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'none',
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDirectionClick('left');
        }}
        onPointerUp={handleDirectionRelease}
        onPointerCancel={handleDirectionRelease}
        onPointerLeave={handleDirectionRelease}
        data-testid="button-left"
        aria-label="Navigate left"
      >
        <div 
          className={`transition-all duration-150 ${activeDirection === 'left' ? 'scale-110' : ''}`}
          style={{
            filter: 'drop-shadow(0 3px 4px rgba(0, 0, 0, 0.6)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8)) drop-shadow(0 -1px 1px rgba(255, 255, 255, 0.1))',
          }}
        >
          <ChevronLeft 
            style={{ width: arrowSize, height: arrowSize, color: activeDirection === 'left' ? 'rgba(59, 130, 246, 1)' : 'rgba(59, 130, 246, 0.85)' }} 
            className="transition-colors"
          />
        </div>
      </button>

      {/* Right button */}
      <button
        className="absolute flex items-center justify-center cursor-pointer transition-all duration-150 hover:scale-110 active:scale-95"
        style={{
          right: `${buttonInset}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: `${buttonSize}px`,
          height: `${buttonSize}px`,
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'none',
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDirectionClick('right');
        }}
        onPointerUp={handleDirectionRelease}
        onPointerCancel={handleDirectionRelease}
        onPointerLeave={handleDirectionRelease}
        data-testid="button-right"
        aria-label="Navigate right"
      >
        <div 
          className={`transition-all duration-150 ${activeDirection === 'right' ? 'scale-110' : ''}`}
          style={{
            filter: 'drop-shadow(0 3px 4px rgba(0, 0, 0, 0.6)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8)) drop-shadow(0 -1px 1px rgba(255, 255, 255, 0.1))',
          }}
        >
          <ChevronRight 
            style={{ width: arrowSize, height: arrowSize, color: activeDirection === 'right' ? 'rgba(59, 130, 246, 1)' : 'rgba(59, 130, 246, 0.85)' }} 
            className="transition-colors"
          />
        </div>
      </button>
    </div>
  );
}
