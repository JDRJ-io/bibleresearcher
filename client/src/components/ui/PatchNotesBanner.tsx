/**
 * Mystical Patch Notes Banner Component
 * Divine announcement banner with holy radiance
 * Positioned between column headers and top header
 */

import { useState, useEffect } from 'react';
import { Scroll, ChevronRight, X } from 'lucide-react';
import { PatchNotesModal } from './PatchNotesModal';

interface PatchNotesBannerProps {
  isVisible?: boolean;
  onDismiss?: () => void;
}

export function PatchNotesBanner({ isVisible = true, onDismiss }: PatchNotesBannerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-close banner on scroll
  useEffect(() => {
    if (!isVisible || !onDismiss) return;
    
    const handleScroll = () => {
      onDismiss();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  return (
    <>
    <div className="relative w-full border-y border-yellow-400/20 backdrop-blur-sm
                    transition-all duration-300 ease-out
                    max-w-full overflow-hidden
                    px-2 sm:px-4 md:px-6 lg:px-8"
         style={{
           background: 'linear-gradient(90deg, #D8C4F8 0%, #FAEDC5 50%, #EEC8D7 100%)',
           minHeight: '56px'
         }}>
      {/* Divine Glow Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10" />
      
      {/* Holy Light Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/2 w-2 h-2 bg-yellow-400/40 rounded-full blur-sm animate-pulse" />
        <div className="absolute right-1/3 top-1/2 w-1 h-1 bg-purple-400/60 rounded-full blur-sm animate-pulse delay-500" />
        <div className="absolute left-3/4 top-1/2 w-1.5 h-1.5 bg-white/30 rounded-full blur-sm animate-pulse delay-1000" />
      </div>

      <div className="relative px-4 sm:px-4 md:px-6 lg:px-8 py-3 flex items-center justify-center 
                      min-h-[56px]">
        {/* Mobile-Optimized Left Side */}
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-5 flex-1 min-w-0 justify-center">
          <div className="p-1.5 sm:p-2 md:p-2.5 lg:p-3 rounded-full bg-gradient-to-br from-yellow-400/20 to-purple-400/20 
                         border border-yellow-400/30 flex-shrink-0">
            <Scroll className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 lg:h-5.5 lg:w-5.5 text-yellow-400" />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 md:space-x-4 flex-1 min-w-0 text-center sm:text-left">
            <h3 className="text-xs xs:text-xs sm:text-sm md:text-base lg:text-lg truncate"
                style={{
                  color: '#D97706',
                  fontWeight: '700'
                }}>
              Divine Updates
            </h3>
            <span className="hidden sm:inline text-xs md:text-sm" style={{ color: '#6B7280' }}>•</span>
            <p className="text-xs xs:text-xs sm:text-sm md:text-base truncate"
               style={{ color: '#374151' }}>
              Latest sacred enhancements
            </p>
          </div>
        </div>

        {/* Adaptive Call to Action */}
        <div className="flex items-center absolute right-4 sm:right-4 md:right-6 lg:right-8 flex-shrink-0 space-x-2">
          <button
            onClick={() => setIsModalOpen(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-1 xs:py-1.5 sm:py-2 md:py-2.5 rounded-full border transition-all duration-300
                      bg-white/20 hover:bg-white/30 border-white/30 hover:border-white/50
                      font-medium text-xs xs:text-xs sm:text-sm md:text-base
                      hover:shadow-lg transform hover:scale-105"
            style={{
              color: '#D97706',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-2.5">
              <span className="hidden sm:inline md:text-base">View Updates</span>
              <span className="sm:hidden text-xs">Updates</span>
              <ChevronRight className={`h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
            </div>
          </button>
          
          {/* Mobile-Optimized Dismiss Button - positioned after View Updates button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 
                       text-white/70 hover:text-white/90 transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Divine Glow */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-px 
                    bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />
    </div>
    
    {/* Patch Notes Modal - Rendered outside the banner container */}
    {isModalOpen && (
      <PatchNotesModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    )}
    </>
  );
}

export default PatchNotesBanner;