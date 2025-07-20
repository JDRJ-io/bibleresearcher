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
  const { 
    showCrossRefs: storeShowCrossRefs, 
    showProphecies, 
    showNotes: storeShowNotes, 
    showDates, 
    columnState,
    isInitialized 
  } = useBibleStore();

  // Prevent render if store not initialized
  if (!isInitialized) {
    return null;
  }

  // Use prop if provided, otherwise fall back to store state
  const showCrossRefs = propShowCrossRefs ?? storeShowCrossRefs;
  const showNotes = propShowNotes ?? storeShowNotes;

  // Use store's columnState as the authoritative source, enhanced with translation data
  const slotConfig: Record<number, any> = {};

  columnState.columns.forEach(col => {
    switch (col.slot) {
      case 0:
        slotConfig[0] = { type: 'reference', header: 'Ref', visible: col.visible };
        break;
      case 1:
        slotConfig[1] = { type: 'main-translation', header: main, translationCode: main, visible: col.visible };
        break;
      case 2:
        if (alternates[0]) slotConfig[2] = { type: 'alt-translation', header: alternates[0], translationCode: alternates[0], visible: col.visible && !!alternates[0] };
        break;
      case 3:
        if (alternates[1]) slotConfig[3] = { type: 'alt-translation', header: alternates[1], translationCode: alternates[1], visible: col.visible && !!alternates[1] };
        break;
      case 4:
        if (alternates[2]) slotConfig[4] = { type: 'alt-translation', header: alternates[2], translationCode: alternates[2], visible: col.visible && !!alternates[2] };
        break;
      case 5:
        if (alternates[3]) slotConfig[5] = { type: 'alt-translation', header: alternates[3], translationCode: alternates[3], visible: col.visible && !!alternates[3] };
        break;
      case 6:
        slotConfig[6] = { type: 'cross-refs', header: 'Cross Refs', visible: col.visible };
        break;
      case 7:
        slotConfig[7] = { type: 'prophecy-p', header: 'P', visible: col.visible };
        break;
      case 8:
        slotConfig[8] = { type: 'prophecy-f', header: 'F', visible: col.visible };
        break;
      case 9:
        slotConfig[9] = { type: 'prophecy-v', header: 'V', visible: col.visible };
        break;
      case 10:
        slotConfig[10] = { type: 'notes', header: 'Notes', visible: col.visible };
        break;
      case 11:
        slotConfig[11] = { type: 'context', header: 'Context', visible: col.visible };
        break;
    }
  });

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