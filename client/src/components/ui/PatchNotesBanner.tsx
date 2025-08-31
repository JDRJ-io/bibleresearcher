/**
 * Mystical Patch Notes Banner Component
 * Divine announcement banner with holy radiance
 * Positioned between column headers and top header
 */

import { useState, useEffect } from 'react';
import { FileText, ChevronRight, X } from 'lucide-react';
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
    <div className="relative w-full border-y border-yellow-400/20 dark:border-yellow-500/30 backdrop-blur-sm
                    transition-all duration-300 ease-out
                    max-w-full overflow-hidden
                    px-2 sm:px-4 md:px-6 lg:px-8
                    bg-gradient-to-r from-amber-100/80 via-yellow-50/90 to-orange-100/80
                    dark:from-slate-800/90 dark:via-purple-900/80 dark:to-indigo-900/90"
         style={{
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

      <div className="relative px-2 sm:px-4 md:px-6 lg:px-8 py-3 flex items-center 
                      min-h-[56px]">
        {/* Mobile-Optimized Left Side */}
        <div className="flex items-center justify-center flex-1 min-w-0 pr-14 sm:pr-16 md:pr-20">
          {/* Single row on wider screens, two rows on mobile */}
          <div className="hidden sm:flex items-center space-x-3">
            <h3 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-amber-700 via-orange-600 to-yellow-600 dark:from-yellow-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              Start with prayer
            </h3>
            <span className="text-amber-800/50 dark:text-yellow-300/50 text-lg">•</span>
            <p className="text-sm md:text-base text-amber-900/90 dark:text-yellow-100/90 font-medium">
              Welcome Holy Spirit
            </p>
          </div>
          
          {/* Two rows on mobile for better readability */}
          <div className="sm:hidden text-center space-y-1">
            <h3 className="text-sm font-semibold bg-gradient-to-r from-amber-700 via-orange-600 to-yellow-600 dark:from-yellow-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              Start with prayer
            </h3>
            <p className="text-xs text-amber-900/90 dark:text-yellow-100/90 font-medium">
              Welcome Holy Spirit
            </p>
          </div>
        </div>

        {/* Adaptive Call to Action */}
        <div className="flex items-center absolute right-1 xs:right-2 sm:right-4 md:right-6 lg:right-8 flex-shrink-0 space-x-1">
          <button
            onClick={() => setIsModalOpen(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="px-1.5 xs:px-2 sm:px-4 md:px-5 lg:px-6 py-1 xs:py-1.5 sm:py-2 md:py-2.5 rounded-full border transition-all duration-300
                      bg-amber-200/30 hover:bg-amber-300/40 dark:bg-purple-800/30 dark:hover:bg-purple-700/40
                      border-amber-300/50 hover:border-amber-400/70 dark:border-purple-500/50 dark:hover:border-purple-400/70
                      font-medium text-xs sm:text-sm md:text-base
                      text-amber-900 dark:text-yellow-100
                      hover:shadow-lg transform hover:scale-105 backdrop-blur-md"
          >
            <div className="flex items-center space-x-0.5 xs:space-x-1 sm:space-x-2 md:space-x-2.5">
              <span className="hidden sm:inline md:text-base">View Updates</span>
              <span className="sm:hidden text-xs">Updates</span>
              <ChevronRight className={`h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 transition-transform duration-300 text-amber-900 dark:text-yellow-100 ${isHovered ? 'translate-x-1' : ''}`} />
            </div>
          </button>
          
          {/* Mobile-Optimized Dismiss Button - positioned after View Updates button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 xs:p-1.5 sm:p-1.5 rounded-full bg-amber-200/20 hover:bg-amber-300/30 dark:bg-purple-800/20 dark:hover:bg-purple-700/30
                       text-amber-800/80 hover:text-amber-900 dark:text-yellow-200/80 dark:hover:text-yellow-100 transition-colors z-10"
            >
              <X className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Divine Glow */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-px 
                    bg-gradient-to-r from-transparent via-amber-500/60 to-transparent dark:via-yellow-400/50" />
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