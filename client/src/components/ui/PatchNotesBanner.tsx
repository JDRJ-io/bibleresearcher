/**
 * Mystical Patch Notes Banner Component
 * Divine announcement banner with holy radiance
 * Positioned between column headers and top header
 */

import { useState, useEffect } from 'react';
import { FileText, ChevronRight, X } from 'lucide-react';
import { PatchNotesModal } from './PatchNotesModal';
import { useTheme } from '@/components/bible/ThemeProvider';

interface PatchNotesBannerProps {
  isVisible?: boolean;
  onDismiss?: () => void;
}

export function PatchNotesBanner({ isVisible = true, onDismiss }: PatchNotesBannerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { theme } = useTheme();

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
    <div className={`relative w-full border-y backdrop-blur-sm
                    transition-all duration-300 ease-out
                    max-w-full overflow-hidden
                    px-3 sm:px-6 md:px-8 lg:px-12
                    ${theme === 'light' 
                      ? 'border-yellow-400/20 bg-gradient-to-r from-amber-100/80 via-yellow-50/90 to-orange-100/80' 
                      : 'border-yellow-500/30 bg-gradient-to-r from-slate-800/90 via-purple-900/80 to-indigo-900/90'}`}
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

      <div className="relative py-3 flex items-center min-h-[56px]">
        {/* Perfectly Centered Main Content */}
        <div className="absolute inset-0 flex items-center justify-center px-4 md:px-8">
          {/* Single row on larger screens with perfect alignment */}
          <div className="hidden lg:flex items-center justify-center space-x-4 text-center">
            <h3 className={`text-lg md:text-xl lg:text-2xl font-semibold bg-gradient-to-r ${theme === 'light' ? 'from-amber-700 via-orange-600 to-yellow-600' : 'from-yellow-400 via-purple-400 to-blue-400'} bg-clip-text text-transparent leading-tight tracking-wide`}>
              Start with prayer
            </h3>
            <span className={`${theme === 'light' ? 'text-amber-800/60' : 'text-yellow-300/60'} text-xl mx-2`}>•</span>
            <p className={`text-base md:text-lg lg:text-xl ${theme === 'light' ? 'text-amber-900/90' : 'text-yellow-100/90'} font-medium leading-tight tracking-wide`}>
              Welcome Holy Spirit
            </p>
          </div>
          
          {/* Tablet layout with stacked text to avoid overlap */}
          <div className="hidden sm:block lg:hidden text-center space-y-0.5">
            <h3 className={`text-base md:text-lg font-semibold bg-gradient-to-r ${theme === 'light' ? 'from-amber-700 via-orange-600 to-yellow-600' : 'from-yellow-400 via-purple-400 to-blue-400'} bg-clip-text text-transparent leading-tight tracking-wide`}>
              Start with prayer
            </h3>
            <p className={`text-sm md:text-base ${theme === 'light' ? 'text-amber-900/90' : 'text-yellow-100/90'} font-medium leading-tight tracking-wide`}>
              Welcome Holy Spirit
            </p>
          </div>
          
          {/* Mobile layout with perfect vertical centering */}
          <div className="sm:hidden text-center">
            <h3 className={`text-base font-semibold bg-gradient-to-r ${theme === 'light' ? 'from-amber-700 via-orange-600 to-yellow-600' : 'from-yellow-400 via-purple-400 to-blue-400'} bg-clip-text text-transparent leading-tight tracking-wide`}>
              Start with prayer
            </h3>
            <p className={`text-sm ${theme === 'light' ? 'text-amber-900/90' : 'text-yellow-100/90'} font-medium leading-tight tracking-wide`}>
              Welcome Holy Spirit
            </p>
          </div>
        </div>

        {/* Call to Action - Positioned on the right with better spacing */}
        <div className="relative z-10 ml-auto flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-full border transition-all duration-300
                      ${theme === 'light' ? 'bg-amber-200/30 hover:bg-amber-300/40' : 'bg-purple-800/30 hover:bg-purple-700/40'}
                      ${theme === 'light' ? 'border-amber-300/50 hover:border-amber-400/70' : 'border-purple-500/50 hover:border-purple-400/70'}
                      font-medium text-xs sm:text-sm
                      ${theme === 'light' ? 'text-amber-900' : 'text-yellow-100'}
                      hover:shadow-lg transform hover:scale-105 backdrop-blur-md`}
          >
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span className="hidden md:inline">View Updates</span>
              <span className="md:hidden">Updates</span>
              <ChevronRight className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-300 ${theme === 'light' ? 'text-amber-900' : 'text-yellow-100'} ${isHovered ? 'translate-x-1' : ''}`} />
            </div>
          </button>
          
          {/* Mobile-Optimized Dismiss Button - positioned after View Updates button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`p-1 xs:p-1.5 sm:p-1.5 rounded-full ${theme === 'light' ? 'bg-amber-200/20 hover:bg-amber-300/30' : 'bg-purple-800/20 hover:bg-purple-700/30'}
                       ${theme === 'light' ? 'text-amber-800/80 hover:text-amber-900' : 'text-yellow-200/80 hover:text-yellow-100'} transition-colors z-10`}
            >
              <X className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Divine Glow */}
      <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-px 
                    bg-gradient-to-r from-transparent ${theme === 'light' ? 'via-amber-500/60' : 'via-yellow-400/50'} to-transparent`} />
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