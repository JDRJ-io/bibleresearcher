import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { Button } from '@/components/ui/button';

export function ArrowPager({ windowPx }: { windowPx: number }) {
  const { page, start, carousel, visible, locked } = useLayoutStore((s) => ({
    page: s.page,
    start: s.start,
    carousel: s.carousel,
    visible: s.visible,
    locked: s.locked,
  }));
  
  const visibleColumns = visible(windowPx);
  const visCount = visibleColumns.length - locked.length;

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