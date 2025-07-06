import { useState, useCallback } from 'react';

export type ColumnType = 'reference' | 'translation' | 'crossReferences' | 'prophecy' | 'notes';

export interface ColumnConfig {
  id: string;
  type: ColumnType;
  title: string;
  width: string;
  visible: boolean;
  translationId?: string;
}

export interface UseColumnReorderReturn {
  columns: ColumnConfig[];
  isLayoutLocked: boolean;
  toggleLayoutLock: () => void;
  moveColumn: (fromIndex: number, toIndex: number) => void;
  resetColumnOrder: () => void;
}

const defaultColumns: ColumnConfig[] = [
  { id: 'reference', type: 'reference', title: 'Reference', width: 'w-16', visible: true },
  { id: 'kjv', type: 'translation', title: 'KJV - King James Version', width: 'w-72', visible: true, translationId: 'KJV' },
  { id: 'crossReferences', type: 'crossReferences', title: 'Cross References', width: 'w-48', visible: true },
];

export function useColumnReorder(selectedTranslations: any[] = []): UseColumnReorderReturn {
  const [isLayoutLocked, setIsLayoutLocked] = useState(true);
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    // Initialize with default columns plus selected translations
    const translationColumns = selectedTranslations.map((translation, index) => ({
      id: `translation-${translation.id}`,
      type: 'translation' as ColumnType,
      title: `${translation.abbreviation} - ${translation.name}`,
      width: 'w-72',
      visible: true,
      translationId: translation.id
    }));
    
    return [
      defaultColumns[0], // reference
      ...translationColumns,
      defaultColumns[2], // cross references
    ];
  });

  const toggleLayoutLock = useCallback(() => {
    setIsLayoutLocked(prev => !prev);
  }, []);

  const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
    if (isLayoutLocked) return;
    
    setColumns(prev => {
      const newColumns = [...prev];
      const [movedColumn] = newColumns.splice(fromIndex, 1);
      newColumns.splice(toIndex, 0, movedColumn);
      return newColumns;
    });
  }, [isLayoutLocked]);

  const resetColumnOrder = useCallback(() => {
    setColumns([...defaultColumns]);
  }, []);

  return {
    columns,
    isLayoutLocked,
    toggleLayoutLock,
    moveColumn,
    resetColumnOrder,
  };
}