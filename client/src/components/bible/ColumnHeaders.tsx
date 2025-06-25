import type { Translation } from '@/types/bible';

interface ColumnHeadersProps {
  selectedTranslations: Translation[];
  showNotes: boolean;
  showProphecy: boolean;
}

export function ColumnHeaders({ selectedTranslations, showNotes, showProphecy }: ColumnHeadersProps) {
  const activeTranslations = selectedTranslations.filter(t => t.selected);
  
  return (
    <div className="sticky top-0 z-10 bg-background border-b">
      <div className="flex min-w-full" style={{ height: '48px' }}>
        {/* Reference Column Header */}
        <div className="w-24 flex-shrink-0 flex items-center justify-center border-r px-2 font-semibold text-sm bg-muted/50">
          Reference
        </div>

        {/* KJV Header */}
        <div className="w-80 flex-shrink-0 flex items-center px-3 border-r font-semibold text-sm bg-muted/50">
          KJV - King James Version
        </div>

        {/* Cross References Header */}
        <div className="w-60 flex-shrink-0 flex items-center px-3 border-r font-semibold text-sm bg-muted/50">
          Cross References
        </div>

        {/* Strong's Header */}
        <div className="w-60 flex-shrink-0 flex items-center px-3 border-r font-semibold text-sm bg-muted/50">
          Strong's Concordance
        </div>

        {/* Additional Translation Headers */}
        {activeTranslations.filter(t => t.id !== 'KJV').map(translation => (
          <div key={translation.id} className="w-80 flex-shrink-0 flex items-center px-3 border-r font-semibold text-sm bg-muted/50">
            {translation.abbreviation} - {translation.name}
          </div>
        ))}
        
        {/* Notes Header */}
        {showNotes && (
          <div className="w-60 flex-shrink-0 flex items-center px-3 border-r font-semibold text-sm bg-muted/50">
            Personal Notes
          </div>
        )}
        
        {/* Prophecy Header */}
        {showProphecy && (
          <div className="w-60 flex-shrink-0 flex items-center px-3 font-semibold text-sm bg-muted/50">
            Prophecy & Fulfillment
          </div>
        )}
      </div>
    </div>
  );
}
