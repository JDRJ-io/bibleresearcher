/**
 * Navigation Controls
 * Back/forward navigation with history dropdown
 */

import React from 'react';
import { ChevronLeft, ChevronRight, History, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useNavigationHistory } from '@/lib/navigationHistory';
import { useLocation } from 'wouter';

interface NavigationControlsProps {
  className?: string;
}

export function NavigationControls({ className = '' }: NavigationControlsProps) {
  const { 
    canGoBack, 
    canGoForward, 
    recentHistory, 
    goBack, 
    goForward, 
    clearHistory 
  } = useNavigationHistory();
  
  const [, setLocation] = useLocation();

  const handleBack = () => {
    const entry = goBack();
    if (entry) {
      setLocation(`/${entry.verse_reference}`);
    }
  };

  const handleForward = () => {
    const entry = goForward();
    if (entry) {
      setLocation(`/${entry.verse_reference}`);
    }
  };

  const navigateToVerse = (verseRef: string) => {
    setLocation(`/${verseRef}`);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        disabled={!canGoBack}
        className="p-2"
        title="Go back in history"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Forward Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleForward}
        disabled={!canGoForward}
        className="p-2"
        title="Go forward in history"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* History Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            title="View navigation history"
            disabled={recentHistory.length === 0}
          >
            <History className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Recent Locations
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {recentHistory.length === 0 ? (
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground">No history available</span>
            </DropdownMenuItem>
          ) : (
            recentHistory.map((entry, index) => (
              <DropdownMenuItem
                key={`${entry.verse_reference}-${entry.visited_at}`}
                onClick={() => navigateToVerse(entry.verse_reference)}
                className="flex flex-col items-start space-y-1 py-2 cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-sm">
                    {entry.verse_reference}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.translation}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTime(entry.visited_at)}
                </span>
              </DropdownMenuItem>
            ))
          )}
          
          {recentHistory.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => clearHistory()}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear History
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}