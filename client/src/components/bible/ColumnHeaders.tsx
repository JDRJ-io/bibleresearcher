import type { Translation } from '@/types/bible';

interface ColumnHeadersProps {
  selectedTranslations: Translation[];
  showNotes: boolean;
  showProphecy: boolean;
  showContext: boolean;
  scrollLeft: number;
}

export function ColumnHeaders({ selectedTranslations, showNotes, showProphecy, scrollLeft }: ColumnHeadersProps) {
  return (
    <div className="sticky top-16 z-20 bg-background border-b overflow-hidden">
      <div 
        className="flex min-w-max transition-transform duration-100 ease-out"
        style={{ transform: `translateX(-${scrollLeft}px)` }}
      >
        {/* Reference Column Header */}
        <div className="w-24 flex-shrink-0 flex items-center justify-center border-r px-2 font-semibold text-sm bg-background">
          Reference
        </div>

        {/* KJV Header */}
        <div className="w-80 flex-shrink-0 flex items-center px-3 border-r font-semibold text-sm bg-background">
          KJV - King James Version
        </div>

        {/* Cross References Header */}
        <div className="w-60 flex-shrink-0 flex items-center px-3 border-r font-semibold text-sm bg-background">
          Cross References
        </div>

        {/* Prophecy Header - Only show if enabled */}
        {showProphecy && (
          <div className="w-64 flex-shrink-0 flex items-center px-3 border-r font-semibold text-sm bg-background">
            Prophecy & Fulfillment
          </div>
        )}
        
        {/* Notes Header - Only show if enabled */}
        {showNotes && (
          <div className="w-60 flex-shrink-0 flex items-center px-3 font-semibold text-sm bg-background">
            Personal Notes
          </div>
        )}
      </div>
    </div>
  );
}
