import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { BibleVerse, AppPreferences } from "@/types/bible";

interface FastVirtualBibleTableProps {
  verses: BibleVerse[];
  currentCenterVerse: number;
  onNavigateToVerse: (reference: string) => void;
  onExpandVerse?: (verse: BibleVerse) => void;
  preferences?: Partial<AppPreferences>;
  getCrossReferences?: (reference: string) => any[];
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

const ROW_HEIGHT = 120; // Fixed height for each verse row
const BUFFER_SIZE = 50; // Render buffer around visible area

export function FastVirtualBibleTable({
  verses,
  currentCenterVerse,
  onNavigateToVerse,
  onExpandVerse,
  preferences,
  getCrossReferences = () => [],
  scrollContainerRef,
}: FastVirtualBibleTableProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = scrollContainerRef || useRef<HTMLDivElement>(null);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
  const endIndex = Math.min(
    verses.length - 1,
    Math.floor((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER_SIZE
  );

  // Get visible verses
  const visibleVerses = verses.slice(startIndex, endIndex + 1);
  const totalHeight = verses.length * ROW_HEIGHT;

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Scroll to center verse when it changes
  useEffect(() => {
    if (scrollRef.current && currentCenterVerse >= 0) {
      const targetScrollTop = currentCenterVerse * ROW_HEIGHT - containerHeight / 2;
      scrollRef.current.scrollTop = Math.max(0, targetScrollTop);
    }
  }, [currentCenterVerse, containerHeight]);

  // Handle cross-reference clicks
  const handleCrossRefClick = (reference: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`🔗 Cross-reference clicked: ${reference}`);
    onNavigateToVerse(reference);
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-muted/95 backdrop-blur border-b">
        <div className="grid grid-cols-12 gap-2 p-2 text-sm font-medium text-muted-foreground">
          <div className="col-span-1">Ref</div>
          <div className="col-span-5">KJV Text</div>
          <div className="col-span-6">Cross References</div>
        </div>
      </div>

      {/* Virtual scrolling container */}
      <div
        ref={scrollRef}
        className="h-full overflow-auto"
        onScroll={handleScroll}
        style={{ height: 'calc(100vh - 120px)' }}
      >
        {/* Total height container for accurate scrollbar */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Visible verses */}
          {visibleVerses.map((verse, index) => {
            const actualIndex = startIndex + index;
            const isCenter = actualIndex === currentCenterVerse;
            
            return (
              <div
                key={verse.id}
                id={`verse-${verse.id}`}
                data-verse-index={actualIndex}
                className={cn(
                  "absolute left-0 right-0 border-b border-border/50",
                  "hover:bg-muted/50 transition-colors",
                  isCenter && "bg-primary/5 border-primary/20"
                )}
                style={{
                  top: actualIndex * ROW_HEIGHT,
                  height: ROW_HEIGHT,
                }}
              >
                <div className="grid grid-cols-12 gap-2 p-2 h-full">
                  {/* Reference column */}
                  <div className="col-span-1 flex flex-col justify-start">
                    <div className="text-xs font-medium text-primary">
                      {verse.reference}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {verse.book} {verse.chapter}:{verse.verse}
                    </div>
                  </div>

                  {/* Verse text column */}
                  <div className="col-span-5 flex items-start">
                    <div 
                      className="text-sm leading-relaxed cursor-pointer hover:text-primary/80"
                      onClick={() => onExpandVerse?.(verse)}
                    >
                      {verse.text.KJV || 'Loading...'}
                    </div>
                  </div>

                  {/* Cross-references column */}
                  <div className="col-span-6 flex flex-wrap gap-1 items-start">
                    {getCrossReferences(verse.reference).slice(0, 6).map((crossRef, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => handleCrossRefClick(crossRef.reference, e)}
                        className={cn(
                          "inline-flex items-center px-2 py-1 rounded text-xs",
                          "bg-secondary/50 hover:bg-secondary text-secondary-foreground",
                          "border border-border/50 hover:border-primary/50",
                          "transition-all duration-200 hover:scale-105"
                        )}
                        title={crossRef.text}
                      >
                        <span className="font-medium">{crossRef.reference}</span>
                        {crossRef.text && (
                          <span className="ml-1 text-muted-foreground truncate max-w-[100px]">
                            {crossRef.text.length > 30 
                              ? crossRef.text.substring(0, 30) + "..." 
                              : crossRef.text
                            }
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}