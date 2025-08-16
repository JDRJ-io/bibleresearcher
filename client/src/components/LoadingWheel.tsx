import React from 'react';

interface LoadingWheelProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function LoadingWheel({ 
  message = 'Loading...', 
  size = 'medium',
  className = '' 
}: LoadingWheelProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6', 
    large: 'h-8 w-8'
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className={`animate-spin rounded-full border-4 ${sizeClasses[size]}`} style={{background: 'conic-gradient(from 0deg, #fbbf24, #ec4899, #8b5cf6, #06b6d4, #fbbf24)', filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))'}} />
      {message && (
        <span className="text-sm text-yellow-300 font-bold animate-pulse" style={{textShadow: '0 0 8px rgba(251, 191, 36, 0.8), 0 0 16px rgba(251, 191, 36, 0.4)'}}>
          {message}
        </span>
      )}
    </div>
  );
}

interface TranslationLoadingOverlayProps {
  translationName: string;
  progress: number;
  onCancel?: () => void;
}

export function TranslationLoadingOverlay({ 
  translationName, 
  progress,
  onCancel 
}: TranslationLoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/80 via-black/90 to-indigo-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-purple-900/40 via-black/60 to-indigo-900/40 backdrop-blur-lg border border-purple-400/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-purple-500/20">
        {/* Mystical Background Effects */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-purple-500/30 rounded-full blur-xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-400/25 rounded-full blur-lg animate-pulse delay-500" />
        </div>
        <div className="text-center relative z-10">
          <LoadingWheel size="large" />
          <h3 className="mt-4 text-lg font-semibold bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
            Loading {translationName}
          </h3>
          <p className="mt-2 text-sm text-purple-200/80">
            Loading Bible translation data...
          </p>
          
          {/* Progress bar */}
          <div className="mt-4 w-full bg-purple-900/50 rounded-full h-3 border border-purple-400/20">
            <div 
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-400 h-3 rounded-full transition-all duration-500 ease-out shadow-lg shadow-purple-500/30"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-purple-300/80 font-medium">
            {progress}% complete
          </div>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="mt-4 px-6 py-2 text-sm text-purple-300/80 hover:text-purple-200 bg-purple-800/20 hover:bg-purple-700/30 rounded-lg border border-purple-400/20 hover:border-purple-400/40 transition-all duration-300"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}