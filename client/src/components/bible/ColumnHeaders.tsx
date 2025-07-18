import type { Translation } from '@/types/bible';
import { useTranslationMaps, useColumnKeys } from '@/store/translationSlice';
import { useBibleStore } from '@/App';
import { getVisibleColumns, getColumnWidth, COLUMN_LAYOUT } from '@/constants/columnLayout';

interface ColumnHeadersProps {
  selectedTranslations: Translation[];
  showNotes: boolean;
  showProphecy: boolean;
  showContext: boolean;
  scrollLeft: number;
  preferences: any;
  isGuest?: boolean;
}

interface HeaderCellProps {
  column: any;
  isMain?: boolean;
  isMobile?: boolean;
}

function HeaderCell({ column, isMain, isMobile }: HeaderCellProps) {
  // Use exact same width logic as VirtualRow
  const width = column.name === "Reference" ? "w-20" : 
               column.name === "Cross References" ? "w-60" : 
               ["P", "F", "V"].includes(column.name) ? "w-20" : "w-80";
  const bgClass = isMain ? "bg-blue-100 dark:bg-blue-900" : "bg-background";
  
  return (
    <div className={`${width} flex-shrink-0 flex items-center justify-center border-r px-1 font-semibold text-xs ${bgClass}`}>
      {column.name}
    </div>
  );
}

// Step 4.3-a. ColumnHeaders with slot-based system
export function ColumnHeaders({ 
  selectedTranslations, 
  showNotes, 
  showProphecy, 
  showContext, 
  scrollLeft, 
  preferences, 
  isGuest = true 
}: ColumnHeadersProps) {
  const { main, alternates } = useTranslationMaps();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Get store states for column visibility
  const { showCrossRefs, showProphecies } = useBibleStore();
  
  // Column order matching VirtualRow exactly - use main + alternates
  const headerOrder = [
    "Reference", 
    main,
    ...alternates,
    ...(showCrossRefs ? ["Cross References"] : []),
    ...(showProphecies ? ["P", "F", "V"] : [])
  ];
  
  const allColumns = headerOrder.map((name, index) => ({
    id: name.toLowerCase().replace(' ', '-'),
    name: name,
    type: name === 'Reference' ? 'reference' : 
          name === 'Cross References' ? 'cross-ref' :
          ['P', 'F', 'V'].includes(name) ? 'prophecy' : 'translation',
    position: index,
    isMain: name === main
  }));
  
  return (
    <div 
      className="sticky left-0 right-0 z-30 border-b shadow-sm"
      style={{ 
        top: '38px', // Mobile header height (matches BiblePage header)
        height: '40px',
        backgroundColor: 'var(--header-bg)',
        borderBottomColor: 'var(--border-color)',
        marginTop: '-1px' // Overlap border to eliminate gap
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
          {allColumns.map((column) => (
            <HeaderCell
              key={column.id}
              column={column}
              isMain={column.isMain}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
    </div>
  );
}