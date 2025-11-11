import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Monitor } from 'lucide-react';
import { useBibleStore } from '@/App';

interface ColumnPivotControlsProps {
  className?: string;
  isPresentationMode?: boolean;
  onTogglePresentation?: () => void;
  showLeftArrow?: boolean;
  showRightArrow?: boolean;
  showPresentButton?: boolean;
  // Working viewport methods that move both headers and body together
  scrollLeftOne?: () => void;
  scrollRightOne?: () => void;
  canScrollLeft?: boolean;
  canScrollRight?: boolean;
}

export function ColumnPivotControls({ 
  className, 
  isPresentationMode = false, 
  onTogglePresentation,
  showLeftArrow = true,
  showRightArrow = true,
  showPresentButton = true,
  scrollLeftOne,
  scrollRightOne,
  canScrollLeft,
  canScrollRight
}: ColumnPivotControlsProps) {
  const { 
    shiftColumnsLeft, 
    shiftColumnsRight, 
    canShiftLeft, 
    canShiftRight,
    getCurrentPivotColumn
  } = useBibleStore();

  const currentPivotColumn = getCurrentPivotColumn();
  // 🎯 Read cached active columns (no setState during render)
  const activeColumns = useBibleStore(s => s._activeColumnsCache);
  const canPivot = activeColumns.length > 1;

  const handlePivotLeft = () => {
    if (canShiftLeft()) {
      shiftColumnsLeft();
    }
  };

  const handlePivotRight = () => {
    if (canShiftRight()) {
      shiftColumnsRight();
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      {/* Left pivot arrow - touch-friendly with blue styling */}
      {showLeftArrow && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePivotLeft}
          disabled={!canShiftLeft()}
          className="h-8 w-8 p-0 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-800/60 dark:active:bg-blue-700/70 transition-colors touch-manipulation disabled:opacity-40"
          title="Shift to previous column"
        >
          <ChevronLeft className="w-4 h-4 text-blue-700 dark:text-blue-300" />
        </Button>
      )}

      {/* Present button */}
      {showPresentButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onTogglePresentation}
          className="h-6 px-2 text-xs"
          title="Toggle presentation mode"
        >
          <Monitor className="w-3 h-3 mr-1" />
          {isPresentationMode ? 'Exit' : 'Present'}
        </Button>
      )}

      {/* Right pivot arrow - touch-friendly with blue styling */}
      {showRightArrow && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePivotRight}
          disabled={!canShiftRight()}
          className="h-8 w-8 p-0 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 dark:bg-blue-900/50 dark:hover:bg-blue-800/60 dark:active:bg-blue-700/70 transition-colors touch-manipulation disabled:opacity-40"
          title="Shift to next column"
        >
          <ChevronRight className="w-4 h-4 text-blue-700 dark:text-blue-300" />
        </Button>
      )}
    </div>
  );
}