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
      <div className={`animate-spin rounded-full border-2 border-transparent bg-gradient-to-r from-red-500 via-blue-500 to-yellow-400 bg-clip-border ${sizeClasses[size]}`} style={{backgroundImage: 'conic-gradient(from 0deg, #ef4444, #3b82f6, #f59e0b, #ef4444)'}} />
      {message && (
        <span className="text-sm text-blue-600 dark:text-blue-300 font-medium animate-pulse">
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
    <div className="fixed inset-0 bg-gradient-to-br from-red-900/80 via-black/90 to-blue-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-red-900/40 via-black/60 to-blue-900/40 backdrop-blur-lg border border-red-400/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-red-500/20">
        {/* Mystical Background Effects */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-red-500/40 rounded-full blur-xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-400/35 rounded-full blur-lg animate-pulse delay-500" />
        </div>
        <div className="text-center relative z-10">
          <LoadingWheel size="large" />
          <h3 className="mt-4 text-lg font-semibold bg-gradient-to-r from-red-300 via-blue-300 to-yellow-300 bg-clip-text text-transparent">
            Loading {translationName}
          </h3>
          <p className="mt-2 text-sm text-blue-200/80">
            Loading Bible translation data...
          </p>
          
          {/* Progress bar */}
          <div className="mt-4 w-full bg-red-900/50 rounded-full h-3 border border-red-400/20">
            <div 
              className="bg-gradient-to-r from-red-500 via-blue-500 to-yellow-400 h-3 rounded-full transition-all duration-500 ease-out shadow-lg shadow-red-500/30"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-blue-300/80 font-medium">
            {progress}% complete
          </div>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="mt-4 px-6 py-2 text-sm text-blue-300/80 hover:text-blue-200 bg-blue-800/20 hover:bg-blue-700/30 rounded-lg border border-blue-400/20 hover:border-blue-400/40 transition-all duration-300"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}