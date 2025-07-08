import type { Translation } from '@/types/bible';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';

interface ColumnHeadersProps {
  selectedTranslations: Translation[];
  showNotes: boolean;
  showProphecy: boolean;
  showContext: boolean;
  scrollLeft: number;
}

interface HeaderCellProps {
  verse: string;
  isMain?: boolean;
}

function HeaderCell({ verse, isMain }: HeaderCellProps) {
  const width = verse === "Ref" ? "w-20" : verse === "Cross References" ? "w-60" : ["P", "F", "V"].includes(verse) ? "w-20" : "w-80";
  const bgClass = isMain ? "bg-blue-100 dark:bg-blue-900" : "bg-background";
  
  return (
    <div className={`${width} flex-shrink-0 flex items-center justify-center border-r px-1 font-semibold text-xs ${bgClass}`}>
      {verse}
    </div>
  );
}

// Step 4.3-a. ColumnHeaders
export function ColumnHeaders({ selectedTranslations, showNotes, showProphecy, scrollLeft }: ColumnHeadersProps) {
  const { mainTranslation, alternates } = useTranslationMaps();
  
  // Build column order: Reference, ...alternates, mainTranslation, Cross, P, F, V
  const headerOrder = [
    "Reference", 
    ...alternates, 
    mainTranslation, 
    "Cross", 
    ...(showProphecy ? ["P", "F", "V"] : [])
  ];
  
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
          {headerOrder.map((key: string) => {
            if (key === "Reference") return <HeaderCell key="ref" verse="Ref" />;
            if (key === "Cross") return <HeaderCell key="cross" verse="Cross References" />;
            if (["P", "F", "V"].includes(key)) return <HeaderCell key={key} verse={key} />;
            // otherwise it's a translation code
            const isMain = key === mainTranslation;
            return (
              <HeaderCell
                key={key}
                verse={key}
                isMain={isMain}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}