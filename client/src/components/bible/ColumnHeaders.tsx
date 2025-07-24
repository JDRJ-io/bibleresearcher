import { useMemo, useState, useEffect } from 'react';
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
  // MATCH EXACT CSS ADAPTIVE WIDTHS - No Tailwind classes, use inline styles that match the CSS
  const getAdaptiveStyle = () => {
    if (!isMobile) {
      // Desktop widths
      if (column.name === "Ref" || column.name === "Reference" || column.name === "#") return { width: '80px' };
      if (column.name === "Notes") return { width: '256px' };
      if (column.name === "Cross Refs" || column.name === "Cross References") return { width: '320px' };
      if (["P", "F", "V"].includes(column.name)) return { width: '80px' };
      return { width: '320px' }; // Main translation
    }

    // Mobile adaptive widths - EXACTLY match the CSS media queries
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 375;

    if (column.name === "Ref" || column.name === "Reference" || column.name === "#") {
      // Reference column responsive sizing
      if (viewportWidth >= 768 && viewportWidth <= 1024) return { width: '40px' }; // Tablet
      if (viewportWidth >= 667 && viewportWidth <= 896) return { width: '32px' }; // Landscape
      return { width: '24px' }; // Base mobile
    }

    if (column.name === "Notes") return { width: '80px' };

    if (column.name === "Cross Refs" || column.name === "Cross References") {
      // Cross-refs responsive sizing
      if (viewportWidth >= 768 && viewportWidth <= 1024) return { width: `calc((100vw - 100px) * 0.45)` };
      if (viewportWidth >= 667 && viewportWidth <= 896) return { width: `calc((100vw - 80px) * 0.46)` };
      return { width: `calc((100vw - 60px) * 0.48)` };
    }

    if (["P", "F", "V"].includes(column.name)) return { width: '64px' };

    // Main translation responsive sizing
    if (viewportWidth >= 768 && viewportWidth <= 1024) return { width: `calc((100vw - 100px) * 0.45)` };
    if (viewportWidth >= 667 && viewportWidth <= 896) return { width: `calc((100vw - 80px) * 0.46)` };
    return { width: `calc((100vw - 60px) * 0.48)` };
  };

  const bgClass = isMain ? "bg-blue-100 dark:bg-blue-900" : "bg-background";

  // Enhanced text styling for reference column
  const textClass = (column.name === "Ref" || column.name === "Reference" || column.name === "#") 
    ? "font-bold text-sm" // Bigger, bolder text for reference header
    : "font-bold text-xs";

  return (
    <div 
      className={`flex-shrink-0 flex items-center justify-center border-r px-1 ${textClass} leading-none ${bgClass}`}
      style={getAdaptiveStyle()}
    >
      {isMobile && (column.name === "Ref" || column.name === "Reference") ? "#" : column.name}
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

  // Make headers adaptive to screen size changes
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 768);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const adaptiveIsMobile = screenWidth < 768;

  // Get store states for column visibility
  const { 
    showCrossRefs: storeShowCrossRefs, 
    showProphecies, 
    showNotes: storeShowNotes, 
    showDates, 
    columnState,
    isInitialized 
  } = useBibleStore();

  // Use prop if provided, otherwise fall back to store state
  const showCrossRefs = propShowCrossRefs ?? storeShowCrossRefs;
  const showNotes = propShowNotes ?? storeShowNotes;

  // Prevent render if store not initialized
  if (!isInitialized) {
    console.log('⚠️ ColumnHeaders: Store not initialized, skipping render');
    return null;
  }

  console.log('📋 ColumnHeaders render state:', { 
    isInitialized, 
    showCrossRefs, 
    showProphecies, 
    showNotes,
    main,
    alternates: alternates.length
  });

  // Use store's columnState as the authoritative source, enhanced with translation data
  const slotConfig: Record<number, any> = {};

  // Always show reference column (slot 0)
  slotConfig[0] = { type: 'reference', header: 'Ref', visible: true };

  // Always show main translation (slot 2 - moved to accommodate Notes at slot 1)  
  slotConfig[2] = { type: 'main-translation', header: main || 'KJV', translationCode: main || 'KJV', visible: true };

  // Map all column types based on store state - updated slot assignments
  if (columnState?.columns) {
    columnState.columns.forEach(col => {
    switch (col.slot) {
      case 1:
        // Notes column (moved to slot 1 between Ref and Main)
        slotConfig[1] = { type: 'notes', header: 'Notes', visible: col.visible && showNotes };
        break;
      case 7:
        // Cross References column (moved from slot 6 to 7)
        slotConfig[7] = { type: 'cross-refs', header: 'Cross Refs', visible: col.visible && showCrossRefs };
        break;
      case 8:
        // Prophecy P column (moved from slot 7 to 8)
        slotConfig[8] = { type: 'prophecy-p', header: 'P', visible: col.visible && showProphecies };
        break;
      case 9:
        // Prophecy F column (moved from slot 8 to 9)
        slotConfig[9] = { type: 'prophecy-f', header: 'F', visible: showProphecies };
        break;
      case 10:
        // Prophecy V column (moved from slot 9 to 10)
        slotConfig[10] = { type: 'prophecy-v', header: 'V', visible: showProphecies };
        break;
      case 11:
        // Dates column (unchanged)
        slotConfig[11] = { type: 'context', header: 'Dates', visible: col.visible && showDates };
        break;
    }
    });
  } else {
    // Fallback when columnState is not available
    console.log('⚠️ ColumnHeaders: columnState not available, using fallback');
    if (showCrossRefs) slotConfig[7] = { type: 'cross-refs', header: 'Cross Refs', visible: true };
    if (showProphecies) {
      slotConfig[8] = { type: 'prophecy-p', header: 'P', visible: true };
      slotConfig[9] = { type: 'prophecy-f', header: 'F', visible: true };
      slotConfig[10] = { type: 'prophecy-v', header: 'V', visible: true };
    }
  }

  // Dynamically add alternate translation columns to slots 3-6 (shifted due to Notes at slot 1)
  alternates.forEach((translationCode, index) => {
    const slot = 3 + index; // Start at slot 3 for alternates (shifted from 2)
    if (slot <= 6) { // Max 4 alternate translations (slots 3-6)
      slotConfig[slot] = { 
        type: 'alt-translation', 
        header: translationCode, 
        translationCode, 
        visible: true  // Show all active alternate translations
      };
    }
  });

  // Debug logging
  console.log('📋 ColumnHeaders slotConfig:', Object.keys(slotConfig).map(slot => ({ 
    slot: parseInt(slot), 
    type: slotConfig[parseInt(slot)]?.type, 
    header: slotConfig[parseInt(slot)]?.header, 
    visible: slotConfig[parseInt(slot)]?.visible 
  })));

  // Build visible columns directly from our state
  const visibleColumns = useMemo(() => {
    const columns = [];

    // Always add reference column
    columns.push({
      slot: 0,
      type: 'reference',
      name: 'Ref',
      visible: true,
      isMain: false
    });

    // Add notes column if store state enables it
    if (showNotes) {
      columns.push({
        slot: 1,
        type: 'notes',
        name: 'Notes',
        visible: true,
        isMain: false
      });
    }

    // Always add main translation
    columns.push({
      slot: 2,
      type: 'main-translation',
      name: main || 'KJV',
      visible: true,
      isMain: true
    });

    // Add alternate translations (slots 3-6)
    alternates.forEach((translationCode, index) => {
      const slot = 3 + index;
      if (slot <= 6) {
        columns.push({
          slot,
          type: 'alt-translation',
          name: translationCode,
          visible: true,
          isMain: false
        });
      }
    });

    // Add cross references if enabled
    if (showCrossRefs) {
      columns.push({
        slot: 7,
        type: 'cross-refs',
        name: 'Cross Refs',
        visible: true,
        isMain: false
      });
    }

    // Add prophecy columns if enabled
    if (showProphecies) {
      columns.push(
        {
          slot: 8,
          type: 'prophecy-p',
          name: 'P',
          visible: true,
          isMain: false
        },
        {
          slot: 9,
          type: 'prophecy-f',
          name: 'F',
          visible: true,
          isMain: false
        },
        {
          slot: 10,
          type: 'prophecy-v',
          name: 'V',
          visible: true,
          isMain: false
        }
      );
    }

    // On mobile, only show Reference, Main Translation, and Cross References
    if (adaptiveIsMobile) {
      return columns.filter(col => 
        col.type === 'reference' || 
        col.type === 'main-translation' || 
        col.type === 'cross-refs'
      );
    }

    return columns;
  }, [showCrossRefs, showProphecies, showNotes, main, alternates, adaptiveIsMobile]);

  console.log('📋 ColumnHeaders visibleColumns:', visibleColumns.map(col => ({ slot: col.slot, name: col.name, type: col.type, visible: col.visible })));

  // Calculate if we should center based on total column width vs viewport
  const estimatedTotalWidth = useMemo(() => {
    let width = 0;
    width += 80; // Reference column ~80px
    width += 320; // Main translation ~320px
    if (showCrossRefs) width += 320; // Cross refs ~320px (matches translations)
    if (showProphecies) width += 180; // P+F+V ~60px each
    width += (alternates.length * 320); // Alt translations ~320px each
    return width;
  }, [showCrossRefs, showProphecies, alternates]);

  // Get viewport width
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;

  // FORCE LEFT-ALIGN for mobile and narrow screens (< 1000px)
  // Only center on wide desktop screens when content fits
  const shouldCenter = !adaptiveIsMobile && viewportWidth >= 1000 && estimatedTotalWidth <= viewportWidth * 0.95;

  const allColumns = visibleColumns.map(col => ({
    id: col.name.toLowerCase().replace(' ', '-'),
    name: col.name,
    type: col.type,
    position: col.slot,
    isMain: col.isMain,
    slot: col.slot
  }));

  // Split columns: reference (sticky) and others (scrollable)
  const referenceColumn = allColumns.find(col => col.slot === 0);
  const otherColumns = allColumns.filter(col => col.slot !== 0);

  const topHeaderHeight = adaptiveIsMobile ? '48px' : '64px';

  return (
    <div 
      className={`column-headers sticky z-40 bg-background border-b shadow-sm`}
      style={{ 
        top: `${topHeaderHeight || 60}px`,
        left: -scrollLeft,
        position: 'sticky',
        width: '100%'
      }}
    >
      <div className="overflow-hidden w-full h-full flex">
        {shouldCenter ? (
          // Centered layout for few columns
          <div className="flex justify-center w-full h-full">
            <div className="flex min-w-max h-full">
              {allColumns.map((column) => (
                <HeaderCell
                  key={`slot-${column.slot}`}
                  column={column}
                  isMain={column.isMain}
                  isMobile={adaptiveIsMobile}
                />
              ))}
            </div>
          </div>
        ) : (
          // Left-anchored layout - simple layout without sticky positioning
          <div className="flex min-w-max h-full">
            <div 
              className="flex min-w-max h-full"
              style={{ 
                transform: `translateX(-${Math.round(scrollLeft)}px)`,
                willChange: 'transform'
              }}
            >
              {allColumns.map((column) => (
                <HeaderCell
                  key={`slot-${column.slot}`}
                  column={column}
                  isMain={column.isMain}
                  isMobile={adaptiveIsMobile}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}