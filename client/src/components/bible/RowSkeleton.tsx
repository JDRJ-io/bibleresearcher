import React, { useMemo } from 'react';
import { getColumnWidthStyle } from '@/utils/columnWidth';

interface RowSkeletonProps {
  rowHeight: number;
  verseRef: string;
  columnCount: number;
  visibleColumnsConfig?: ReadonlyArray<any>;
  actualTotalWidth?: number;
  responsiveMinWidth?: number;
  needsHorizontalScroll?: boolean;
}

/**
 * Skeleton placeholder row that matches VirtualRow's structure
 * Uses same layout computation to prevent layout shift on skeleton→content swap
 * 
 * CRITICAL FIX: Now uses shared column width calculation from @/utils/columnWidth
 * to ensure exact width matching with VirtualRow cells
 */
export const RowSkeleton = React.memo(function RowSkeleton({ 
  rowHeight,
  verseRef,
  columnCount,
  visibleColumnsConfig,
  actualTotalWidth,
  responsiveMinWidth,
  needsHorizontalScroll
}: RowSkeletonProps) {
  const containerStyle = useMemo(() => ({
    height: rowHeight,
    width: needsHorizontalScroll && actualTotalWidth ? `${actualTotalWidth}px` : '100%',
    minWidth: responsiveMinWidth ? `${responsiveMinWidth}px` : undefined,
    display: 'flex',
    contain: 'content' as const,
    contentVisibility: 'auto' as const,
  }), [rowHeight, needsHorizontalScroll, actualTotalWidth, responsiveMinWidth]);
  
  // Use visibleColumnsConfig if available for precise width matching
  const columnsToRender = visibleColumnsConfig && visibleColumnsConfig.length > 0
    ? visibleColumnsConfig
    : Array.from({ length: columnCount }).map((_, idx) => ({ 
        slot: idx, 
        config: { type: idx === 0 ? 'reference' : 'main-translation' } 
      }));
  
  return (
    <div
      className="border-b border-gray-200 dark:border-gray-700 bible-verse-row"
      style={containerStyle}
      data-verse-ref={verseRef}
    >
      {columnsToRender.map((column, idx) => {
        const isLastColumn = idx === columnsToRender.length - 1;
        
        // Use shared utility to get exact same width as VirtualRow
        const columnWidth = getColumnWidthStyle(column);
        
        return (
          <div
            key={idx}
            className="skeleton-cell"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem',
              width: columnWidth,
              flexShrink: 0,
              borderRight: isLastColumn ? 'none' : '1px solid var(--border-color)',
            }}
          >
            <div
              className="skeleton-block"
              style={{
                height: '1em',
                width: '90%',
                background: 'var(--skeleton-bg, rgba(128, 128, 128, 0.15))',
                borderRadius: '3px',
                opacity: 0.25,
              }}
            />
          </div>
        );
      })}
    </div>
  );
});
