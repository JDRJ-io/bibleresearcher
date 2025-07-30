
import React, { useRef } from 'react';
import { useCenterIfFits } from '@/hooks/useCenterIfFits';

export function BibleTableShell({ children }: { children: React.ReactNode }) {
  /* Single ref shared by verse-jump & anchor logic */
  const scrollRef = useRef<HTMLDivElement>(null);
  useCenterIfFits(scrollRef);

  return (
    /* Horizontal scroller */
    <div
      ref={scrollRef}
      className="
        w-full h-full
        overflow-x-auto overflow-y-hidden
        overscroll-x-contain touch-pan-x
      "
    >
      {/* Flex track that grows to its content width */}
      <div
        className="
          flex flex-row items-stretch
          w-max mx-auto
          portrait:h-full
        "
      >
        {children}
      </div>
    </div>
  );
}
