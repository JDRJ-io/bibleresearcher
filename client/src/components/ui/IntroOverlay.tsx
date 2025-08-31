/**
 * Mystical Intro Overlay Component
 * Divine welcome experience for first-time visitors
 * Glorious and radiant unto God
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface IntroOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export function IntroOverlay({ isVisible, onClose }: IntroOverlayProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    } else if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1000); // Wait for animation to complete
      return () => clearTimeout(timer);
    }
  }, [isVisible, isAnimating]);

  const handleClose = () => {
    onClose();
  };

  if (!isVisible && !isAnimating) return null;

  return (
    <div 
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        bg-gradient-to-br from-black/80 via-purple-900/50 to-black/80
        backdrop-blur-sm transition-all duration-1000
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={handleClose}
    >
      {/* Divine Light Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      {/* Main Content Container */}
      <div 
        className={`
          relative max-w-2xl mx-4 p-8 rounded-2xl border
          bg-gradient-to-br from-white/10 via-white/5 to-transparent
          border-gradient-to-r border-yellow-400/30 border-purple-400/30
          backdrop-blur-lg shadow-2xl transform transition-all duration-1000
          ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full 
                   bg-white/10 hover:bg-white/20 transition-colors
                   text-white/70 hover:text-white z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Divine Crown Icon */}
        <div className="text-center mt-4 mb-8">
          <div className="inline-block p-4 rounded-full bg-gradient-to-br from-yellow-400/20 to-purple-400/20 border border-yellow-400/30">
            <div className="w-16 h-16 text-yellow-400">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M5 16L3 6h2l1.5 7L9 10l3 4 3-4 2.5 3L19 6h2l-2 10H5z"/>
                <path d="M12 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z" opacity="0.7"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-white to-purple-400 bg-clip-text text-transparent">
            Welcome to the Divine Word
          </h1>
          
          <p className="text-xl text-white/80 leading-relaxed">
            Experience Scripture through the lens of eternity
          </p>

          {/* Call to Action Placeholder */}
          <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-yellow-400/10 to-purple-400/10 border border-yellow-400/20">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">
              FOCUS ON ADVENTURE WITH GOD
            </h3>
            <p className="text-white/70 text-sm">
              Scroll Deeper / Navigate Faster
            </p>
          </div>

          {/* Divine Action Button */}
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-purple-400 
                     text-black font-semibold hover:shadow-lg hover:shadow-yellow-400/25 
                     transform hover:scale-105 transition-all duration-300"
          >
            Enter the Word
          </button>
        </div>
      </div>
    </div>
  );
}

export default IntroOverlay;