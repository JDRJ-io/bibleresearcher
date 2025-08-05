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
      <div className={`animate-spin rounded-full border-2 border-blue-500 border-t-transparent ${sizeClasses[size]}`} />
      {message && (
        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="text-center">
          <LoadingWheel size="large" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Loading {translationName}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Loading Bible translation data...
          </p>
          
          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {progress}% complete
          </div>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="mt-4 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}