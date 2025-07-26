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
  // MATCH EXACT VIRTUALROW WIDTHS - Use same logic as VirtualRow getColumnWidth function
  const getAdaptiveStyle = () => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 375;

    // Determine screen size using same logic as VirtualRow
    let screenSize = 'desktop';
    if (viewportWidth < 768) {
      screenSize = 'mobile';
    } else if (viewportWidth < 1024) {
      screenSize = 'tablet';
    }

    // Use exact same width calculations as VirtualRow - prophecy columns use w-[200px]
    if (screenSize === 'mobile') {
      switch (column.slot) {
        case 0: return { width: '24px' };         // Reference - w-6 (24px)
        case 1: return { width: '80px' };        // Notes - w-20 (80px)
        case 2: return { width: '208px' };        // Main translation - w-52 (208px)
        case 7: return { width: '208px' };        // Cross References - w-52 (208px)
        case 8: case 9: case 10: return { width: '200px' }; // Prophecy P/F/V - w-[200px]
        case 11: return { width: '80px' };        // Dates - w-20 (80px)
        default: return { width: '160px' };       // Alt translations - w-40 (160px)
      }
    } else if (screenSize === 'tablet') {
      switch (column.slot) {
        case 0: return { width: '80px' };        // Reference - w-20 (80px)
        case 1: return { width: '192px' };        // Notes - w-48 (192px)
        case 2: return { width: '256px' };        // Main translation - w-64 (256px)
        case 7: return { width: '256px' };        // Cross References - w-64 (256px)
        case 8: case 9: case 10: return { width: '200px' }; // Prophecy P/F/V - w-[200px]
        case 11: return { width: '96px' };        // Dates - w-24 (96px)
        default: return { width: '256px' };       // Alt translations - w-64 (256px)
      }
    } else { // desktop
      switch (column.slot) {
        case 0: return { width: '80px' };        // Reference - w-20 (80px)
        case 1: return { width: '256px' };        // Notes - w-64 (256px)
        case 2: return { width: '320px' };        // Main translation - w-80 (320px)
        case 7: return { width: '320px' };        // Cross References - w-80 (320px)
        case 8: case 9: case 10: return { width: '200px' }; // Prophecy P/F/V - w-[200px]
        case 11: return { width: '120px' };       // Dates - w-30 (120px)
        default: return { width: '320px' };       // Alt translations - w-80 (320px)
      }
    }
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

    // Add notes column if both store state AND individual column visibility enable it
    if (slotConfig[1]?.visible) {
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

    // Add dates column if enabled
    if (showDates) {
      columns.push({
        slot: 11,
        type: 'context',
        name: 'Dates',
        visible: true,
        isMain: false
      });
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
  }, [showCrossRefs, showProphecies, showNotes, showDates, main, alternates, adaptiveIsMobile]);

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

  const topHeaderHeight = '64px'; // Same height for both mobile and desktop

  return (
    <div 
      className={`column-headers-container sticky z-40 bg-background border-b shadow-sm`}
      style={{ 
        left: -scrollLeft,  // keep horizontal sync only
        width: '100%',
        height: adaptiveIsMobile ? '48px' : '52px'
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