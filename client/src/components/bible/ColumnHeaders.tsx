import type { Translation } from '@/types/bible';
import { useTranslationMaps, useColumnKeys } from '@/store/translationSlice';
import { useBibleStore } from '@/App';
import { getVisibleColumns, getColumnWidth, COLUMN_LAYOUT } from '@/constants/columnLayout';

interface ColumnHeadersProps {
  selectedTranslations: Translation[];
  showNotes: boolean;
  showProphecy: boolean;
  showCrossRefs?: boolean;
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
  // Mobile-optimized width logic matching VirtualRow exactly
  const width = isMobile ? 
    (column.name === "Reference" ? "w-16" : 
     column.name === "Cross References" ? "w-12" : 
     ["P", "F", "V"].includes(column.name) ? "w-8" : "flex-1") :
    (column.name === "Reference" ? "w-20" : 
     column.name === "Cross References" ? "w-60" : 
     ["P", "F", "V"].includes(column.name) ? "w-20" : "w-80");
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
  showCrossRefs: propShowCrossRefs,
  showContext, 
  scrollLeft, 
  preferences, 
  isGuest = true 
}: ColumnHeadersProps) {
  const { main, alternates } = useTranslationMaps();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Get store states for column visibility  
  const { showCrossRefs: storeShowCrossRefs, showProphecies, columnState } = useBibleStore();
  
  // Use prop if provided, otherwise fall back to store state
  const showCrossRefs = propShowCrossRefs ?? storeShowCrossRefs;
  
  // UI Layout Spec slot-based system (slots 0-19)
  const slotConfig = {
    0: { type: 'reference', header: 'Ref' },
    1: { type: 'notes', header: 'Notes' },
    2: { type: 'main-translation', header: main, translationCode: main },
    3: { type: 'cross-references', header: 'Cross References' },
    4: { type: 'dates', header: 'Date' },
    // Slots 5-16: Alternate translations
    ...Object.fromEntries(alternates.map((alt, i) => [
      5 + i, { type: 'alt-translation', header: alt, translationCode: alt }
    ])),
    17: { type: 'prophecy-p', header: 'P' },
    18: { type: 'prophecy-f', header: 'F' },
    19: { type: 'prophecy-v', header: 'V' }
  };
  
  // Get visible columns from store and sort by slot
  const visibleColumns = columnState.columns
    .filter(col => col.visible)
    .sort((a, b) => a.slot - b.slot)
    .map(col => ({ ...col, config: slotConfig[col.slot] }))
    .filter(col => col.config); // Only render slots that have config
  
  // Centering rule from UI_layout_spec.md: center when visibleColumns <= 3
  const shouldCenter = visibleColumns.length <= 3;
  
  const allColumns = visibleColumns.map(col => ({
    id: col.config.header.toLowerCase().replace(' ', '-'),
    name: col.config.header,
    type: col.config.type,
    position: col.slot,
    isMain: col.config.translationCode === main,
    slot: col.slot
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
        <div className={shouldCenter ? "flex justify-center w-full h-full" : ""}>
          <div 
            className="flex min-w-max h-full"
            style={{ 
              transform: shouldCenter ? undefined : `translateX(-${Math.round(scrollLeft)}px)`,
              willChange: shouldCenter ? undefined : 'transform'
            }}
          >
            {allColumns.map((column) => (
              <HeaderCell
                key={`slot-${column.slot}`}
                column={column}
                isMain={column.isMain}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}