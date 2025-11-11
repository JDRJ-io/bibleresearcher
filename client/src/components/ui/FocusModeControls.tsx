import { useState, useEffect } from 'react';
import { Maximize2 } from 'lucide-react';

/**
 * Focus Mode Control for landscape mobile
 * Toggle button to hide header/footer for maximum screen space
 */
export function FocusModeControls() {
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const savedFocusMode = localStorage.getItem('FOCUS_MODE') === '1';
    setIsFocusMode(savedFocusMode);

    // Apply focus mode class if saved
    if (savedFocusMode) {
      document.documentElement.classList.add('focus-mode');
    }
  }, []);

  // Toggle focus mode
  const toggleFocusMode = () => {
    const newValue = !isFocusMode;
    setIsFocusMode(newValue);
    
    if (newValue) {
      document.documentElement.classList.add('focus-mode');
      localStorage.setItem('FOCUS_MODE', '1');
    } else {
      document.documentElement.classList.remove('focus-mode');
      localStorage.setItem('FOCUS_MODE', '0');
    }
  };

  return (
    <button
      onClick={toggleFocusMode}
      className="fixed z-[1000] lg:hidden px-3 py-2 rounded-lg shadow-lg bg-black/70 text-white text-sm backdrop-blur hover:bg-black/80 transition-colors"
      style={{
        bottom: `calc(env(safe-area-inset-bottom, 0px) + 12px)`,
        left: `calc(env(safe-area-inset-left, 0px) + 12px)`,
      }}
      title="Toggle Focus Mode"
      data-testid="button-focus-mode-toggle"
    >
      <Maximize2 className="w-4 h-4 inline mr-1" />
      {isFocusMode ? 'Exit' : 'Focus'}
    </button>
  );
}
