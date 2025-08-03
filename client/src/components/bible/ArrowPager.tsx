import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';

export function ArrowPager({ windowPx }: { windowPx: number }) {
  const page = useLayoutStore((s) => s.page);
  const start = useLayoutStore((s) => s.start);
  const carousel = useLayoutStore((s) => s.carousel);
  const locked = useLayoutStore((s) => s.locked);
  
  // Calculate visible count directly to avoid calling visible() function
  const visCount = useMemo(() => {
    const COL_WIDTH = {
      ref: 80,
      dates: 140,
      notes: 320,
      main: 320,
      crossRefs: 360,
      prediction: 360,
      verification: 360,
      fulfillment: 360,
      'alt-1': 320,
      'alt-2': 320,
      'alt-3': 320,
      'alt-4': 320,
      'alt-5': 320,
      'alt-6': 320,
      'alt-7': 320,
      'alt-8': 320,
    };
    
    const ARROW_GUTTER = 48;
    const PINNED_WIDTH = locked.reduce((w, id) => w + COL_WIDTH[id], 0) + ARROW_GUTTER;
    let avail = windowPx - PINNED_WIDTH;
    let count = 0;
    
    for (let i = start; i < carousel.length && avail > 0; i++) {
      const id = carousel[i];
      const w = COL_WIDTH[id];
      if (w <= avail) {
        count++;
        avail -= w;
      } else break;
    }
    
    return count;
  }, [windowPx, locked, start, carousel]);

  const canLeft = start > 0;
  const canRight = start + visCount < carousel.length;

  return (
    <div className="absolute right-0 top-0 h-full flex items-center gap-1 px-2 bg-gradient-to-l from-background via-background to-transparent pointer-events-none">
      <Button
        variant="ghost"
        size="icon"
        disabled={!canLeft}
        onClick={() => page(-1, windowPx)}
        className="h-8 w-8 pointer-events-auto disabled:opacity-30"
        aria-label="Previous columns"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!canRight}
        onClick={() => page(1, windowPx)}
        className="h-8 w-8 pointer-events-auto disabled:opacity-30"
        aria-label="Next columns"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}