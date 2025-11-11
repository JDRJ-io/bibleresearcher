import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBibleStore } from '@/App';
import { useColumnAlignmentStateMachine } from '@/hooks/useColumnAlignmentStateMachine';

interface ColumnNavigationArrowsProps {
  className?: string;
  scrollLeftOne?: () => void;
  scrollRightOne?: () => void;
  canScrollLeft?: boolean;
  canScrollRight?: boolean;
}

export function ColumnNavigationArrows({ 
  className = '', 
  scrollLeftOne, 
  scrollRightOne, 
  canScrollLeft, 
  canScrollRight 
}: ColumnNavigationArrowsProps) {
  const { 
    shiftColumnsLeft, 
    shiftColumnsRight
  } = useBibleStore();

  // Get state machine values for intelligent arrow control
  const alignmentState = useColumnAlignmentStateMachine();

  // Use measurement-based functions if provided, otherwise fall back to store functions
  const leftAction = scrollLeftOne || shiftColumnsLeft;
  const rightAction = scrollRightOne || shiftColumnsRight;
  
  // STATE MACHINE CONTROLLED: Use alignment state for arrow enablement
  const canGoLeft = canScrollLeft ?? alignmentState.canShiftLeft;
  const canGoRight = canScrollRight ?? alignmentState.canShiftRight;

  // Generate tooltip text based on current state
  const getTooltipText = (direction: 'left' | 'right') => {
    if (alignmentState.state === 'centered') {
      return "All columns fit — add more columns or widen your window to enable shifting";
    }
    
    if (direction === 'left' && !canGoLeft) {
      return "No more columns in this direction";
    }
    
    if (direction === 'right' && !canGoRight) {
      return "No more columns in this direction";
    }
    
    return direction === 'left' ? "Show previous column" : "Show next column";
  };

  // Don't render if arrows are disabled by state machine
  if (!alignmentState.arrowsEnabled) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={leftAction}
        disabled={!canGoLeft}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
        title={getTooltipText('left')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={rightAction}
        disabled={!canGoRight}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
        title={getTooltipText('right')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}