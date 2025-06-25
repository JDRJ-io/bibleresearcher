import type { Translation } from '@/types/bible';

interface ColumnHeadersProps {
  selectedTranslations: Translation[];
  showNotes: boolean;
  showProphecy: boolean;
}

export function ColumnHeaders({ selectedTranslations, showNotes, showProphecy }: ColumnHeadersProps) {
  return (
    <div className="sticky top-0 z-20 grid grid-cols-[80px_1fr_1fr_auto] gap-2 px-4 py-2 bg-background/95 backdrop-blur-sm border-b font-semibold text-sm shadow-sm">
      <div>Index</div>
      <div>Verse</div>
      <div>Cross References</div>
      <div className="flex gap-2">
        {selectedTranslations.map(translation => (
          <div key={translation.id} className="min-w-[120px]">
            {translation.abbreviation}
          </div>
        ))}
        {showNotes && <div className="min-w-[120px]">Notes</div>}
        {showProphecy && <div className="min-w-[120px]">Prophecy</div>}
      </div>
    </div>
  );
}
