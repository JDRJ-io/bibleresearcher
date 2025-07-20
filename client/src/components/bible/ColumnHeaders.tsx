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
  showNotes: propShowNotes, 
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
  const { showCrossRefs: storeShowCrossRefs, showProphecies, showNotes: storeShowNotes, showDates, columnState } = useBibleStore();
  
  // Use prop if provided, otherwise fall back to store state
  const showCrossRefs = propShowCrossRefs ?? storeShowCrossRefs;
  const showNotes = propShowNotes ?? storeShowNotes;
  
  // UI Layout Spec slot-based system (slots 0-19) - matching VirtualRow exactly
  const slotConfig = {
    0: { type: 'reference', header: 'Ref' },
    1: { type: 'notes', header: 'Notes', visible: showNotes },
    2: { type: 'main-translation', header: main, translationCode: main, visible: true },
    3: { type: 'cross-references', header: 'Cross References', visible: showCrossRefs },
    4: { type: 'dates', header: 'Date', visible: showDates },
    // Slots 5-16: Alternate translations (up to 12 as per UI Layout Spec)
    5: alternates[0] ? { type: 'alt-translation', header: alternates[0], translationCode: alternates[0], visible: true } : null,
    6: alternates[1] ? { type: 'alt-translation', header: alternates[1], translationCode: alternates[1], visible: true } : null,
    7: alternates[2] ? { type: 'alt-translation', header: alternates[2], translationCode: alternates[2], visible: true } : null,
    8: alternates[3] ? { type: 'alt-translation', header: alternates[3], translationCode: alternates[3], visible: true } : null,
    9: alternates[4] ? { type: 'alt-translation', header: alternates[4], translationCode: alternates[4], visible: true } : null,
    10: alternates[5] ? { type: 'alt-translation', header: alternates[5], translationCode: alternates[5], visible: true } : null,
    11: alternates[6] ? { type: 'alt-translation', header: alternates[6], translationCode: alternates[6], visible: true } : null,
    12: alternates[7] ? { type: 'alt-translation', header: alternates[7], translationCode: alternates[7], visible: true } : null,
    13: alternates[8] ? { type: 'alt-translation', header: alternates[8], translationCode: alternates[8], visible: true } : null,
    14: alternates[9] ? { type: 'alt-translation', header: alternates[9], translationCode: alternates[9], visible: true } : null,
    15: alternates[10] ? { type: 'alt-translation', header: alternates[10], translationCode: alternates[10], visible: true } : null,
    16: alternates[11] ? { type: 'alt-translation', header: alternates[11], translationCode: alternates[11], visible: true } : null,
    17: { type: 'prophecy-p', header: 'P', visible: showProphecies },
    18: { type: 'prophecy-f', header: 'F', visible: showProphecies },
    19: { type: 'prophecy-v', header: 'V', visible: showProphecies }
  };
  
  // Get all visible columns sorted by slot position, matching VirtualRow exactly  
  const visibleColumns = Object.entries(slotConfig)
    .map(([slotStr, config]) => ({
      slot: parseInt(slotStr),
      config,
      name: config?.header || '',
      type: config?.type || '',
      isMain: config?.type === 'main-translation',
      visible: config?.visible !== false
    }))
    .filter(col => col.config && col.visible) // Only render valid, visible slots
    .sort((a, b) => a.slot - b.slot);
  
  // Centering rule from UI_layout_spec.md: center when visibleColumns <= 3
  const shouldCenter = visibleColumns.length <= 3;
  
  const allColumns = visibleColumns.map(col => ({
    id: col.config?.header?.toLowerCase().replace(' ', '-') || '',
    name: col.config?.header || '',
    type: col.config?.type || '',
    position: col.slot,
    isMain: col.config?.translationCode === main,
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