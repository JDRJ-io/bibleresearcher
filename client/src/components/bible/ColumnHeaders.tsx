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
    <div 
      className="sticky top-16 left-0 right-0 z-30 border-b shadow-sm"
      style={{ 
        height: '48px',
        backgroundColor: 'var(--header-bg)',
        borderBottomColor: 'var(--border-color)'
      }}
    >
      <div className="overflow-hidden w-full h-full">
        <div 
          className="flex min-w-max h-full"
          style={{ 
            transform: `translateX(-${Math.round(scrollLeft)}px)`,
            willChange: 'transform'
          }}
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
    </div>
  );
}
