import React from 'react';

interface RowShellProps {
  rowHeight: number;
  children: React.ReactNode;
  verseRef: string;
  width?: string | number;
  minWidth?: string | number;
  onDoubleClick?: () => void;
}

/**
 * Lightweight row container that reserves height and provides stable layout
 * Used for both skeleton placeholder and actual verse content
 * Prevents layout shift when skeleton→content swap occurs
 */
export const RowShell = React.memo(function RowShell({
  rowHeight,
  children,
  verseRef,
  width,
  minWidth,
  onDoubleClick,
}: RowShellProps) {
  return (
    <div
      className="border-b border-gray-200 dark:border-gray-700 bible-verse-row"
      style={{
        height: rowHeight,
        width,
        minWidth,
        display: 'flex',
        contain: 'content',
        contentVisibility: 'auto',
      }}
      data-verse-ref={verseRef}
      onDoubleClick={onDoubleClick}
    >
      {children}
    </div>
  );
});
