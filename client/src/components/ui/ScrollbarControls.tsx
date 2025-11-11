import { ChevronUp, ChevronDown } from "lucide-react";
import type { ScrollMode } from "@/lib/smartScrollbar";

interface ScrollbarControlsProps {
  mode: ScrollMode;
  locked?: boolean; // DEPRECATED: auto-zoom removed, kept for compatibility
  onToggleLock?: () => void; // DEPRECATED: auto-zoom removed, kept for compatibility
  onPreviousMode: () => void;
  onNextMode: () => void;
  className?: string;
  style?: React.CSSProperties;
}

function getModeIdentifier(mode: ScrollMode): string {
  switch (mode) {
    case 'global': return 'G';
    case 'testament': return 'T';
    case 'section': return 'S';
    case 'book': return 'B';
    case 'auto': return 'G'; // Auto starts at global
    default: return 'G';
  }
}

export function ScrollbarControls({
  mode,
  locked, // DEPRECATED: not used, auto-zoom removed
  onToggleLock, // DEPRECATED: not used, auto-zoom removed
  onPreviousMode,
  onNextMode,
  className = "",
  style,
}: ScrollbarControlsProps) {
  const modeChar = getModeIdentifier(mode);
  
  return (
    <div 
      className={`flex flex-col items-center gap-px bg-black/60 dark:bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl p-0.5 shadow-lg ${className}`} 
      style={style}
    >
      {/* Mode identifier */}
      <div 
        className="text-[9px] font-semibold tracking-wider text-white/80 select-none py-0.5"
        aria-label={`Current mode: ${mode}`}
      >
        {modeChar}
      </div>
      
      {/* Previous mode (up arrow) */}
      <button
        onClick={onPreviousMode}
        aria-label="Previous scrollbar mode"
        data-testid="scrollbar-prev-mode"
        className="relative h-6 w-6 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-blue-400 sb-hit"
        style={{
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <ChevronUp className="h-3.5 w-3.5 relative z-10" />
      </button>
      
      {/* REMOVED: Lock toggle button (auto-zoom feature removed) */}
      
      {/* Next mode (down arrow) */}
      <button
        onClick={onNextMode}
        aria-label="Next scrollbar mode"
        data-testid="scrollbar-next-mode"
        className="relative h-6 w-6 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-blue-400 sb-hit"
        style={{
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <ChevronDown className="h-3.5 w-3.5 relative z-10" />
      </button>
    </div>
  );
}
