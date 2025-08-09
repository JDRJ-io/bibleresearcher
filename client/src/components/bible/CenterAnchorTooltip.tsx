// CenterAnchorTooltip.tsx - Shows current center verse during scrolling
import React from 'react';

interface CenterAnchorTooltipProps {
  visible: boolean;
  y: number;
  text: string;
}

export function CenterAnchorTooltip({ visible, y, text }: CenterAnchorTooltipProps) {
  if (!visible) return null;
  
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none
                 rounded-2xl px-4 py-2 text-sm font-medium
                 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm
                 border border-gray-200/50 dark:border-gray-700/50
                 shadow-lg text-gray-900 dark:text-gray-100"
      style={{ top: y - 20 }} // Position slightly above center
      role="status"
      aria-live="polite"
    >
      {text}
    </div>
  );
}