// Unified column width system for exact header-to-content matching
// This ensures perfect alignment between ColumnHeaders and VirtualRow cells

interface ColumnInfo {
  slot: number;
  visible: boolean;
  widthRem: number;
  displayOrder: number;
}

/**
 * Convert rem width to exact pixel width
 * Uses 1rem = 16px standard
 */
export function getColumnPixelWidth(widthRem: number): string {
  return `${widthRem * 16}px`;
}

/**
 * Get column width from columnState by slot number
 * Returns exact pixel width as CSS string
 */
export function getSlotWidth(columnState: { columns: ColumnInfo[] }, slot: number): string {
  const columnInfo = columnState.columns.find(col => col.slot === slot);
  if (!columnInfo) {
    console.warn(`No column info found for slot ${slot}`);
    return '160px'; // fallback
  }
  
  return getColumnPixelWidth(columnInfo.widthRem);
}

/**
 * Get Tailwind class equivalent for a rem width
 * Used for backward compatibility with Tailwind-based cells
 */
export function getRemToTailwindClass(widthRem: number): string {
  // Standard Tailwind width mapping (w-X = X * 0.25rem)
  const tailwindValue = Math.round(widthRem / 0.25);
  return `w-${tailwindValue}`;
}

// ========== NEW: Shared column width calculation for skeleton/content consistency ==========

export interface ColumnConfig {
  slot: number;
  originalSlot?: number;
  config?: {
    type: string;
    translationCode?: string;
    visible?: boolean;
  };
  visible?: boolean;
}

export interface ComputedColumnWidth {
  width: string;
  flexShrink: number;
}

/**
 * Calculate responsive column width using CSS calc expressions
 * This matches the logic in VirtualRow's getResponsiveColumnPixelWidth function
 * Ensures consistent widths between RowSkeleton and VirtualRow to prevent layout shifts
 * 
 * @param column - Column configuration object
 * @returns CSS calc() expression for the column width
 */
export function getColumnWidthStyle(column: ColumnConfig): string {
  const slotNumber = column.originalSlot ?? column.slot;
  const columnType = column.config?.type;
  
  // MOBILE-AWARE LAYOUT: Use narrow layout for mobile devices in BOTH portrait and landscape
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1024;
  const isPortrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
  const useMobileLayout = isMobile; // Use mobile layout for BOTH portrait and landscape on mobile devices
  
  // Use adaptive CSS variables with column-width-mult scaling (IDENTICAL to VirtualRow)
  if (useMobileLayout) {
    // Mobile layout (portrait OR landscape on mobile devices)
    if (slotNumber === 0) return 'calc(var(--adaptive-ref-width) * var(--column-width-mult, 1))';
    if (slotNumber === 2 && columnType === 'notes') return 'calc(var(--adaptive-notes-width) * var(--column-width-mult, 1))';
    if (slotNumber === 3 && columnType === 'main-translation') return 'calc(var(--adaptive-main-width) * var(--column-width-mult, 1))';
    if (slotNumber === 1 && columnType === 'notes') return 'calc(var(--adaptive-notes-width) * var(--column-width-mult, 1))';
    if (slotNumber === 2 && columnType === 'main-translation') return 'calc(var(--adaptive-main-width) * var(--column-width-mult, 1))';
    if (slotNumber >= 3 && slotNumber <= 14 && columnType === 'alt-translation') return 'calc(var(--adaptive-alt-width) * var(--column-width-mult, 1))';
    if (slotNumber === 15 && columnType === 'cross-refs') return 'calc(var(--adaptive-cross-width) * var(--column-width-mult, 1))';
    if (slotNumber === 16 && columnType === 'prophecy') return 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))';
    if (slotNumber === 19 && columnType === 'hybrid') return 'calc(var(--adaptive-main-width) * var(--column-width-mult, 1))';
    return 'calc(var(--adaptive-alt-width) * var(--column-width-mult, 1))';
  } else {
    // Desktop layout (landscape on desktop devices with width > 1024px)
    if (slotNumber === 0) return 'calc(var(--adaptive-ref-width) * var(--column-width-mult, 1))';
    if (slotNumber === 2) return 'calc(var(--adaptive-notes-width) * var(--column-width-mult, 1))';
    if (slotNumber === 3) return 'calc(var(--adaptive-main-width) * var(--column-width-mult, 1))';
    if (slotNumber === 1) return 'calc(var(--adaptive-notes-width) * var(--column-width-mult, 1))';
    if (slotNumber === 2) return 'calc(var(--adaptive-main-width) * var(--column-width-mult, 1))';
    if (slotNumber >= 3 && slotNumber <= 14) return 'calc(var(--adaptive-alt-width) * var(--column-width-mult, 1))';
    if (slotNumber === 15) return 'calc(var(--adaptive-cross-width) * var(--column-width-mult, 1))';
    if (slotNumber === 16) return 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))';
    if (slotNumber === 19 && columnType === 'hybrid') return 'calc(var(--adaptive-main-width) * var(--column-width-mult, 1))';
    return 'calc(var(--adaptive-cross-width) * var(--column-width-mult, 1))';
  }
}

/**
 * Calculate column style object with width and flexShrink
 * Used by both VirtualRow and RowSkeleton for consistent styling
 * 
 * @param column - Column configuration object
 * @returns Style object with width and flexShrink properties
 */
export function getColumnStyle(column: ColumnConfig): ComputedColumnWidth {
  return {
    width: getColumnWidthStyle(column),
    flexShrink: 0
  };
}

/**
 * Calculate actual total width by reading computed CSS values
 * This matches VirtualRow's actualTotalWidth calculation
 * 
 * @param visibleColumns - Array of visible column configurations
 * @returns Total width in pixels
 */
export function calculateActualTotalWidth(visibleColumns: ColumnConfig[]): number {
  if (typeof window === 'undefined') return 0;
  
  let totalWidth = 0;
  
  visibleColumns.forEach(col => {
    const config = col.config;
    if (!config || config.visible === false) return;
    
    let columnWidth = 0;
    
    // Use the same CSS variable logic as column cells
    switch (config.type) {
      case 'reference': {
        const refWidthVar = getComputedStyle(document.documentElement).getPropertyValue('--adaptive-ref-width').trim();
        columnWidth = refWidthVar ? parseInt(refWidthVar) : 50;
        break;
      }
      
      case 'main-translation': {
        const mainWidthVar = getComputedStyle(document.documentElement).getPropertyValue('--adaptive-main-width').trim();
        columnWidth = mainWidthVar ? parseInt(mainWidthVar) : 300;
        break;
      }
      
      case 'cross-refs': {
        const crossWidthVar = getComputedStyle(document.documentElement).getPropertyValue('--adaptive-cross-width').trim();
        columnWidth = crossWidthVar ? parseInt(crossWidthVar) : 300;
        break;
      }
      
      case 'alt-translation':
      case 'prophecy':
      case 'notes':
      case 'hybrid': {
        const standardWidthVar = getComputedStyle(document.documentElement).getPropertyValue('--adaptive-main-width').trim();
        columnWidth = standardWidthVar ? parseInt(standardWidthVar) : 300;
        break;
      }
      
      default:
        columnWidth = 300; // fallback
        break;
    }
    
    totalWidth += columnWidth;
  });
  
  return totalWidth;
}