/**
 * Navigation Controls
 * Back/forward navigation with history popover on hover/long-press
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNavigationHistory } from '@/lib/navigationHistory';
import { useLocation } from 'wouter';
import { NavigationHistoryPopover } from './NavigationHistoryPopover';

interface NavigationControlsProps {
  className?: string;
}

export function NavigationControls({ className = '' }: NavigationControlsProps) {
  const { 
    canGoBack, 
    canGoForward, 
    history, 
    goBack, 
    goForward,
  } = useNavigationHistory();
  
  const [, setLocation] = useLocation();
  const [showBackPopover, setShowBackPopover] = useState(false);
  const [showForwardPopover, setShowForwardPopover] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const handleBack = () => {
    const entry = goBack();
    if (entry) {
      setLocation(`/${entry.verse_reference}`);
      setShowBackPopover(false);
    }
  };

  const handleForward = () => {
    const entry = goForward();
    if (entry) {
      setLocation(`/${entry.verse_reference}`);
      setShowForwardPopover(false);
    }
  };

  const navigateToVerse = (verseRef: string) => {
    setLocation(`/${verseRef}`);
    setShowBackPopover(false);
    setShowForwardPopover(false);
  };

  // Desktop: Show popover on hover after delay
  const handleBackHoverStart = () => {
    if (!canGoBack || history.length === 0) return;
    
    hoverTimerRef.current = setTimeout(() => {
      setShowBackPopover(true);
    }, 500); // 500ms hover delay
  };

  const handleBackHoverEnd = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  // Mobile: Long-press detection
  const handleBackTouchStart = () => {
    touchStartTimeRef.current = Date.now();
    longPressTimerRef.current = setTimeout(() => {
      setShowBackPopover(true);
    }, 500); // 500ms long-press
  };

  const handleBackTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    const pressDuration = Date.now() - touchStartTimeRef.current;
    // If it was a quick tap (< 500ms), navigate back
    if (pressDuration < 500 && !showBackPopover) {
      handleBack();
    }
  };

  const handleForwardHoverStart = () => {
    if (!canGoForward || history.length === 0) return;
    
    hoverTimerRef.current = setTimeout(() => {
      setShowForwardPopover(true);
    }, 500);
  };

  const handleForwardHoverEnd = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const handleForwardTouchStart = () => {
    touchStartTimeRef.current = Date.now();
    longPressTimerRef.current = setTimeout(() => {
      setShowForwardPopover(true);
    }, 500);
  };

  const handleForwardTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    const pressDuration = Date.now() - touchStartTimeRef.current;
    if (pressDuration < 500 && !showForwardPopover) {
      handleForward();
    }
  };

  const hasHistory = history.length > 0;

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Back Button with Popover */}
      <Popover open={showBackPopover} onOpenChange={setShowBackPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={!canGoBack}
            onMouseEnter={handleBackHoverStart}
            onMouseLeave={handleBackHoverEnd}
            onTouchStart={handleBackTouchStart}
            onTouchEnd={handleBackTouchEnd}
            className="p-2 group relative"
            title="Go back (hover or long-press for history)"
            data-testid="button-back"
          >
            <div className="flex items-center gap-0.5">
              <ChevronLeft className="h-4 w-4" />
              {hasHistory && canGoBack && (
                <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          className="p-0 bg-background/95 backdrop-blur-md border border-border/50 shadow-xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <NavigationHistoryPopover
            history={history}
            onSelectVerse={navigateToVerse}
          />
        </PopoverContent>
      </Popover>

      {/* Forward Button with Popover */}
      <Popover open={showForwardPopover} onOpenChange={setShowForwardPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleForward}
            disabled={!canGoForward}
            onMouseEnter={handleForwardHoverStart}
            onMouseLeave={handleForwardHoverEnd}
            onTouchStart={handleForwardTouchStart}
            onTouchEnd={handleForwardTouchEnd}
            className="p-2 group relative"
            title="Go forward (hover or long-press for history)"
            data-testid="button-forward"
          >
            <div className="flex items-center gap-0.5">
              {hasHistory && canGoForward && (
                <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
              )}
              <ChevronRight className="h-4 w-4" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          className="p-0 bg-background/95 backdrop-blur-md border border-border/50 shadow-xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <NavigationHistoryPopover
            history={history}
            onSelectVerse={navigateToVerse}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
