import { ChevronRight, ChevronLeft } from "lucide-react";

interface JoystickToggleProps {
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
  isPatchNotesBannerVisible?: boolean;
  isMobile?: boolean;
  isPortrait?: boolean;
  isMinimized?: boolean;
  stickyHeaderHeight?: number;
  bottomClearancePx?: number;
  topPosition?: number;
}

export function JoystickToggle({ 
  isVisible, 
  onToggle, 
  className = "", 
  isPatchNotesBannerVisible = true, 
  isMobile = false,
  isPortrait = false,
  isMinimized = false,
  stickyHeaderHeight = 0,
  bottomClearancePx = 96,
  topPosition,
}: JoystickToggleProps) {
  const headerHeight = isMobile
    ? (isPatchNotesBannerVisible ? 44 : 48) // Mobile: 44px tested on iPhone 17
    : (isPatchNotesBannerVisible ? 120 : 64); // Desktop: 64px header + 56px banner OR 64px header alone
  
  // Use dvh on mobile (handles browser UI), svh fallback for keyboards, vh on desktop
  const vhUnit = isMobile 
    ? (typeof CSS !== 'undefined' && CSS?.supports?.("height: 100dvh") ? "dvh" : "vh")
    : (typeof CSS !== 'undefined' && CSS?.supports?.("height: 100svh") ? "svh" : "vh");
  
  // Mobile portrait with banner: 65% (needs more clearance), without banner or desktop: 75%
  const heightPercent = (isMobile && isPatchNotesBannerVisible) ? 0.65 : 0.75;
  const scrollbarHeight = isMinimized
    ? `calc(100${vhUnit} - ${stickyHeaderHeight + 8}px - 68px)` // Focus Mode: account for header and joystick clearance
    : `calc((100${vhUnit} - ${headerHeight}px) * ${heightPercent})`; // Normal Mode
  
  // Portrait mode: align to top edge at headerHeight (no offset)
  // Landscape/desktop: use centered mode offset formula
  const scrollbarTop = isMinimized
    ? `${stickyHeaderHeight + 8}px` // Focus Mode: just below sticky headers
    : (isPortrait 
        ? `${headerHeight}px`
        : `calc(${headerHeight}px + (100${vhUnit} - ${headerHeight}px) * 0.125 + 8px)`);
  
  // Build style object with proper positioning
  // If topPosition is provided, use it directly (measured from hook)
  // Otherwise fall back to legacy calculation
  const posStyle: React.CSSProperties = topPosition !== undefined
    ? {
        top: `${topPosition}px`,
        right: 'calc(env(safe-area-inset-right, 0px))',
        height: '56px',
        touchAction: 'none',
        overscrollBehavior: 'contain',
      }
    : {
        top: `calc(${scrollbarTop} + ${scrollbarHeight} + 4px)`,
        right: 'calc(env(safe-area-inset-right, 0px))',
        height: '56px',
        touchAction: 'none',
        overscrollBehavior: 'contain',
      };
  
  return (
    <button
      onClick={onToggle}
      className={`fixed z-[60] transition-all duration-200 w-6 md:w-4 ${className}`}
      style={posStyle}
      data-testid="button-toggle-joystick"
      aria-label={isVisible ? "Hide joystick" : "Show joystick"}
    >
      <div 
        className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-700 rounded-l-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-all duration-200"
        style={{
          boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.06)',
        }}
      >
        {isVisible ? (
          <ChevronRight className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
        )}
      </div>
    </button>
  );
}
