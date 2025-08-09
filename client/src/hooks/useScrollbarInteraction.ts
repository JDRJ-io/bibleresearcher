import { useState, useEffect, useCallback, useRef } from 'react';

interface ScrollbarInteractionState {
  isVisible: boolean;
  isDragging: boolean;
  mousePosition: { x: number; y: number } | null;
}

export function useScrollbarInteraction(containerRef: React.RefObject<HTMLDivElement>) {
  const [state, setState] = useState<ScrollbarInteractionState>({
    isVisible: false,
    isDragging: false,
    mousePosition: null
  });
  
  const dragStartRef = useRef(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const throttleTimeoutRef = useRef<NodeJS.Timeout>();

  // Detect if mouse is over scrollbar area
  const isOverScrollbar = useCallback((e: MouseEvent, container: HTMLElement) => {
    const rect = container.getBoundingClientRect();
    const scrollbarWidth = container.offsetWidth - container.clientWidth;
    
    // Check if mouse is in the scrollbar area (right side)
    const isInScrollbarZone = e.clientX >= rect.right - scrollbarWidth - 5 && 
                              e.clientX <= rect.right + 5 &&
                              e.clientY >= rect.top && 
                              e.clientY <= rect.bottom;
    
    return isInScrollbarZone && scrollbarWidth > 0;
  }, []);

  // Throttled state update for smooth performance
  const updateState = useCallback((updates: Partial<ScrollbarInteractionState>) => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    throttleTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, ...updates }));
    }, 8); // High frequency updates for smooth experience
  }, []);

  // Auto-hide tooltip after inactivity
  const scheduleHide = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    hideTimeoutRef.current = setTimeout(() => {
      if (!dragStartRef.current) {
        updateState({ isVisible: false, mousePosition: null });
      }
    }, 1000); // Hide after 1 second of inactivity
  }, [updateState]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;
      
      const overScrollbar = isOverScrollbar(e, container);
      
      if (overScrollbar || dragStartRef.current) {
        // Clear any pending hide timeout
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
        
        updateState({
          isVisible: true,
          mousePosition: { x: e.clientX, y: e.clientY },
          isDragging: dragStartRef.current
        });
      } else if (!dragStartRef.current) {
        // Schedule hide when not over scrollbar and not dragging
        scheduleHide();
      }
    };

    // Mouse down handler - detect scrollbar drag start
    const handleMouseDown = (e: MouseEvent) => {
      if (!container) return;
      
      if (isOverScrollbar(e, container)) {
        dragStartRef.current = true;
        updateState({
          isVisible: true,
          isDragging: true,
          mousePosition: { x: e.clientX, y: e.clientY }
        });
        
        // Prevent text selection during drag
        e.preventDefault();
      }
    };

    // Mouse up handler - detect drag end
    const handleMouseUp = () => {
      if (dragStartRef.current) {
        dragStartRef.current = false;
        updateState({ isDragging: false });
        scheduleHide();
      }
    };

    // Mouse leave handler - hide when leaving container
    const handleMouseLeave = () => {
      if (!dragStartRef.current) {
        scheduleHide();
      }
    };

    // Scroll handler - show tooltip briefly during scroll
    const handleScroll = () => {
      if (!dragStartRef.current && state.isVisible) {
        scheduleHide();
      }
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      // Cleanup
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('scroll', handleScroll);
      
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [containerRef, isOverScrollbar, updateState, scheduleHide, state.isVisible]);

  return {
    isVisible: state.isVisible,
    isDragging: state.isDragging,
    mousePosition: state.mousePosition,
    setVisible: (visible: boolean) => updateState({ isVisible: visible })
  };
}