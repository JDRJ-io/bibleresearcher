/**
 * Mystical Intro Overlay Component
 * Divine welcome experience for first-time visitors
 * Glorious and radiant unto God
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import crownFireHaloLogo from '@assets/anointed io fire crown halo_1762247373247.png';
import { useLandscapeSidecar } from '@/hooks/useLandscapeSidecar';

interface IntroOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export function IntroOverlay({ isVisible, onClose }: IntroOverlayProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCompactHeight, setIsCompactHeight] = useState(false);
  const isLandscape = useLandscapeSidecar();

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    } else if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isAnimating]);

  useEffect(() => {
    const checkHeight = () => {
      setIsCompactHeight(window.innerHeight < 500);
    };
    checkHeight();
    window.addEventListener('resize', checkHeight);
    return () => window.removeEventListener('resize', checkHeight);
  }, []);

  const handleClose = () => {
    onClose();
  };

  if (!isVisible && !isAnimating) {
    return null;
  }

  return (
    <div 
      className={`
        fixed inset-0 z-[70] flex items-center justify-center
        bg-gradient-to-br from-black/80 via-purple-900/50 to-black/80
        backdrop-blur-sm transition-all duration-1000
        px-2 sm:px-4 py-2 sm:py-4
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={handleClose}
    >
      {/* Divine Light Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-36 sm:h-36 lg:w-48 lg:h-48 bg-white/10 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      {/* Main Content Container */}
      <div 
        className={`
          relative w-full ${isLandscape ? "max-w-5xl" : "max-w-sm sm:max-w-lg"} 
          mx-2 sm:mx-4 p-6 sm:p-7 lg:p-8
          rounded-xl sm:rounded-2xl border border-white/20
          bg-white/8 backdrop-blur-2xl
          transform transition-all duration-1000
          shadow-[0_18px_60px_rgba(0,0,0,0.35)]
          ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
        `}
        onClick={(e) => e.stopPropagation()}
        style={{
          backdropFilter: 'blur(16px) saturate(140%)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          data-testid="button-close-intro"
          className="absolute top-3.5 right-3.5 w-10 h-10 rounded-full 
                   bg-white/14 hover:bg-white/25 transition-colors
                   text-white flex items-center justify-center z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Grid Layout - Two columns in landscape, stacked in portrait */}
        <div 
          className={isLandscape 
            ? "grid gap-11 items-start" 
            : "flex flex-col space-y-6"
          }
          style={isLandscape ? {
            gridTemplateColumns: 'minmax(340px, 48%) 1fr',
            gridTemplateRows: 'auto minmax(0, 1fr) auto',
            columnGap: '44px',
            rowGap: '18px'
          } : undefined}
        >
          {/* LEFT COLUMN - Branding */}
          <section 
            className={isLandscape ? "text-center" : "text-center"}
            style={isLandscape ? {
              gridColumn: '1',
              gridRow: '1 / -1'
            } : undefined}
          >
            {/* Title */}
            <h1 
              className={`
                font-extrabold leading-tight mb-4
                ${isCompactHeight && !isLandscape ? "text-xl" : "text-3xl sm:text-4xl lg:text-5xl"}
              `}
              style={{
                background: 'linear-gradient(to right, #fbbf24, #ffffff, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              <span className="block">Welcome to the</span>
              <span className="block">Divine Word</span>
            </h1>

            {/* Logo */}
            <div className="my-2 sm:my-3">
              <img 
                src={crownFireHaloLogo} 
                alt="Anointed logo" 
                className="w-20 h-20 sm:w-23 sm:h-23 mx-auto animate-pulse"
                style={{
                  filter: 'drop-shadow(0 0 12px rgba(255, 210, 80, 0.45))',
                  animation: 'glowPulse 4s ease-in-out infinite'
                }}
              />
            </div>

            {/* Brand Subtitle */}
            <p className="mt-3 text-sm sm:text-base text-white/90 tracking-wide">
              Powered by <strong className="text-white">Anointed.io</strong>
            </p>
          </section>

          {/* DIVIDER - Grid anchored, landscape only */}
          {isLandscape && (
            <div 
              className="w-px bg-white/16 pointer-events-none"
              style={{
                gridColumn: '1',
                gridRow: '1 / -1',
                justifySelf: 'end',
                alignSelf: 'stretch',
                margin: '8px 0'
              }}
              aria-hidden="true"
            />
          )}

          {/* RIGHT COLUMN - CTA */}
          <section 
            className={isLandscape ? "flex flex-col gap-4.5" : "flex flex-col gap-6"}
            style={isLandscape ? {
              gridColumn: '2',
              gridRow: '1 / -1',
              display: 'grid',
              gap: '18px',
              alignContent: 'start'
            } : undefined}
          >
            {/* Focus Card */}
            <div 
              className="p-5 sm:p-5.5 rounded-2xl bg-black/22 border border-white/22 text-center"
              style={{
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
              }}
            >
              <h3 className="text-base sm:text-lg font-extrabold text-yellow-300 tracking-wide mb-1.5">
                FOCUS ON ADVENTURE WITH GOD
              </h3>
              <p className="text-sm sm:text-base text-white/90 m-0">
                Scroll Deeper / Study Faster
              </p>
            </div>

            {/* Enter Button */}
            <button
              onClick={onClose}
              data-testid="button-enter-word"
              className={`
                px-7 py-3.5 rounded-full font-bold
                text-black bg-gradient-to-r from-yellow-400 to-purple-400
                transition-all duration-150
                hover:-translate-y-0.5
                active:translate-y-0
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400/60
                ${isLandscape ? "justify-self-center" : "w-full max-w-xs mx-auto"}
              `}
              style={{
                boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.12), 0 10px 28px rgba(0,0,0,0.28)'
              }}
            >
              Enter the Word
            </button>
          </section>
        </div>
      </div>

      <style>{`
        @keyframes glowPulse {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

export default IntroOverlay;
