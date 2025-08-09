/**
 * Mystical Patch Notes Banner Component
 * Divine announcement banner with holy radiance
 * Positioned between column headers and top header
 */

import { useState } from 'react';
import { Scroll, ChevronRight, X } from 'lucide-react';

interface PatchNotesBannerProps {
  isVisible?: boolean;
  onDismiss?: () => void;
}

export function PatchNotesBanner({ isVisible = true, onDismiss }: PatchNotesBannerProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="relative w-full bg-gradient-to-r from-purple-900/20 via-yellow-400/10 to-purple-900/20 
                    border-y border-yellow-400/20 backdrop-blur-sm
                    transition-all duration-300 ease-out
                    max-w-full overflow-hidden
                    px-2 sm:px-6">
      {/* Divine Glow Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent" />
      
      {/* Holy Light Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/2 w-2 h-2 bg-yellow-400/40 rounded-full blur-sm animate-pulse" />
        <div className="absolute right-1/3 top-1/2 w-1 h-1 bg-purple-400/60 rounded-full blur-sm animate-pulse delay-500" />
        <div className="absolute left-3/4 top-1/2 w-1.5 h-1.5 bg-white/30 rounded-full blur-sm animate-pulse delay-1000" />
      </div>

      <div className="relative px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between 
                      min-h-[40px] sm:min-h-[48px]">
        {/* Mobile-Optimized Left Side */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-br from-yellow-400/20 to-purple-400/20 
                         border border-yellow-400/30 flex-shrink-0">
            <Scroll className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-yellow-500 to-purple-500 
                          dark:from-yellow-400 dark:to-purple-400 
                          bg-clip-text text-transparent truncate">
              Divine Updates
            </h3>
            <span className="hidden sm:inline text-xs text-gray-600 dark:text-white/60">•</span>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-white/70 truncate">
              Latest sacred enhancements
            </p>
          </div>
        </div>

        {/* Mobile-Optimized Call to Action */}
        <div className="flex items-center ml-2 sm:ml-4 flex-shrink-0">
          <button
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
              px-3 sm:px-6 py-1.5 sm:py-2 rounded-full border transition-all duration-300
              bg-gradient-to-r from-yellow-400/10 to-purple-400/10
              border-yellow-400/30 hover:border-yellow-400/50
              text-gray-800 dark:text-white/90 hover:text-gray-900 dark:hover:text-white font-medium text-xs sm:text-sm
              hover:shadow-lg hover:shadow-yellow-400/20
              transform hover:scale-105
              ${isHovered ? 'from-yellow-400/20 to-purple-400/20' : ''}
            `}
          >
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span className="hidden sm:inline">View Updates</span>
              <span className="sm:hidden">Updates</span>
              <ChevronRight className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile-Optimized Dismiss Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 
                     text-white/50 hover:text-white/70 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Bottom Divine Glow */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-px 
                    bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />
    </div>
  );
}

export default PatchNotesBanner;