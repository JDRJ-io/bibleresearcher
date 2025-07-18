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
  const width = getColumnWidth(column, isMobile);
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
  
  // Simplified column order for now - will implement full slot system later
  const headerOrder = [
    "Reference", 
    ...selectedTranslations.map(t => t.abbreviation),
    ...(showProphecy ? ["P", "F", "V"] : [])
  ];
  
  const allColumns = headerOrder.map((name, index) => ({
    id: name.toLowerCase().replace(' ', '-'),
    name: name,
    type: name === 'Reference' ? 'reference' : ['P', 'F', 'V'].includes(name) ? 'prophecy' : 'translation',
    width: name === 'Reference' ? 'w-20' : ['P', 'F', 'V'].includes(name) ? 'w-20' : 'w-80',
    mobileWidth: name === 'Reference' ? 'w-16' : ['P', 'F', 'V'].includes(name) ? 'w-16' : 'w-full',
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