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
          {/* Reference Column Header - Tighter */}
          <div className="w-20 flex-shrink-0 flex items-center justify-center border-r px-1 font-semibold text-xs bg-background">
            Reference
          </div>

          {/* Translation Headers - Tighter */}
          {selectedTranslations.map((translation) => (
            <div 
              key={translation.id}
              className="w-80 flex-shrink-0 flex items-center px-2 border-r font-semibold text-sm bg-background"
            >
              {translation.abbreviation} - {translation.name}
            </div>
          ))}

          {/* Cross References Header - Tighter */}
          <div className="w-60 flex-shrink-0 flex items-center px-2 border-r font-semibold text-sm bg-background">
            Cross References
          </div>

          {/* Prophecy Headers - Three Tighter Columns */}
          {showProphecy && (
            <>
              <div className="w-16 flex-shrink-0 flex items-center justify-center px-1 border-r font-semibold text-xs bg-background">
                P
              </div>
              <div className="w-16 flex-shrink-0 flex items-center justify-center px-1 border-r font-semibold text-xs bg-background">
                F
              </div>
              <div className="w-16 flex-shrink-0 flex items-center justify-center px-1 border-r font-semibold text-xs bg-background">
                V
              </div>
            </>
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
