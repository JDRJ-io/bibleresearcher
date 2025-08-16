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
      <div className={`animate-spin rounded-full border-4 border-transparent ${sizeClasses[size]}`} style={{background: 'conic-gradient(from 0deg, #ff0000, #0080ff, #ffff00, #ff0000)', boxShadow: '0 0 20px #ff0000, inset 0 0 20px #0080ff'}} />
      {message && (
        <span className="text-sm font-bold animate-pulse" style={{color: '#0080ff', textShadow: '0 0 10px #0080ff'}}>
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
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: 'radial-gradient(circle, #ff0000aa, #000000, #0080ffaa)'}}>
      <div className="rounded-2xl p-6 max-w-sm w-full mx-4" style={{background: 'linear-gradient(135deg, #ff000055, #000000aa, #0080ff55)', border: '3px solid #ff0000', boxShadow: '0 0 30px #ff0000, inset 0 0 20px #000000'}}>
        {/* Mystical Background Effects */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 rounded-full animate-pulse" style={{background: '#ff0000', boxShadow: '0 0 40px #ff0000'}} />
          <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full animate-pulse delay-1000" style={{background: '#0080ff', boxShadow: '0 0 50px #0080ff'}} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full animate-pulse delay-500" style={{background: '#ffff00', boxShadow: '0 0 30px #ffff00'}} />
        </div>
        <div className="text-center relative z-10">
          <LoadingWheel size="large" />
          <h3 className="mt-4 text-lg font-bold" style={{background: 'linear-gradient(90deg, #ff0000, #0080ff, #ffff00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 10px #ffffff'}}>
            Loading {translationName}
          </h3>
          <p className="mt-2 text-sm font-medium" style={{color: '#00ffff', textShadow: '0 0 8px #00ffff'}}>
            Loading Bible translation data...
          </p>
          
          {/* Progress bar */}
          <div className="mt-4 w-full rounded-full h-4" style={{background: '#333333', border: '2px solid #ff0000', boxShadow: '0 0 15px #ff0000'}}>
            <div 
              className="h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #ff0000, #0080ff, #ffff00)', boxShadow: '0 0 20px #ff0000' }}
            />
          </div>
          <div className="mt-2 text-xs font-bold" style={{color: '#00ffff', textShadow: '0 0 8px #00ffff'}}>
            {progress}% complete
          </div>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="mt-4 px-6 py-2 text-sm font-bold rounded-lg transition-all duration-300" style={{color: '#ffffff', background: '#0080ff', border: '2px solid #00ffff', boxShadow: '0 0 15px #0080ff'}}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}