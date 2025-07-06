import { useState } from "react";
import type { Translation } from '@/types/bible';
import { Lock, Unlock, GripVertical } from "lucide-react";
import { useColumnReorder, ColumnConfig } from "../../hooks/useColumnReorder";

interface ColumnHeadersProps {
  selectedTranslations: Translation[];
  showNotes: boolean;
  showProphecy: boolean;
  showContext: boolean;
  scrollLeft: number;
  onColumnOrderChange?: (columns: ColumnConfig[]) => void;
}

export function ColumnHeaders({ selectedTranslations, showNotes, showProphecy, scrollLeft, onColumnOrderChange }: ColumnHeadersProps) {
  const { columns, isLayoutLocked, toggleLayoutLock, moveColumn } = useColumnReorder(selectedTranslations);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    if (isLayoutLocked) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (isLayoutLocked || draggedIndex === null) return;
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (isLayoutLocked || draggedIndex === null) return;
    moveColumn(draggedIndex, toIndex);
    setDraggedIndex(null);
    onColumnOrderChange?.(columns);
  };
  return (
    <div 
      className="sticky top-16 left-0 right-0 z-30 border-b shadow-sm"
      style={{ 
        height: '48px',
        backgroundColor: 'var(--header-bg)',
        borderBottomColor: 'var(--border-color)'
      }}
    >
      {/* Layout Lock Button */}
      <div className="absolute top-1 right-4 z-40">
        <button
          onClick={toggleLayoutLock}
          className={`p-1 rounded transition-colors ${
            isLayoutLocked 
              ? 'text-gray-600 hover:text-gray-800' 
              : 'text-blue-600 hover:text-blue-800'
          }`}
          title={isLayoutLocked ? 'Unlock column layout' : 'Lock column layout'}
        >
          {isLayoutLocked ? <Lock size={16} /> : <Unlock size={16} />}
        </button>
      </div>

      <div className="overflow-hidden w-full h-full">
        <div 
          className="flex min-w-max h-full"
          style={{ 
            transform: `translateX(-${Math.round(scrollLeft)}px)`,
            willChange: 'transform'
          }}
        >
          {columns.map((column, index) => (
            <div
              key={column.id}
              draggable={!isLayoutLocked}
              onDragStart={(e) => {
                if (isLayoutLocked) {
                  e.preventDefault();
                  return;
                }
                e.dataTransfer.setData('text/plain', index.toString());
                handleDragStart(index);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (!isLayoutLocked && draggedIndex !== null) {
                  e.dataTransfer.dropEffect = 'move';
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (isLayoutLocked) return;
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                handleDrop(e, index);
              }}
              className={`${column.width} flex-shrink-0 flex items-center border-r font-semibold bg-background transition-colors ${
                !isLayoutLocked 
                  ? 'cursor-grab hover:bg-gray-100 dark:hover:bg-gray-800 active:cursor-grabbing' 
                  : 'cursor-default'
              } ${draggedIndex === index ? 'opacity-50 bg-blue-100 dark:bg-blue-900' : ''}`}
              style={{ userSelect: 'none' }}
            >
              {!isLayoutLocked && (
                <GripVertical size={12} className="text-gray-400 mr-1 flex-shrink-0" />
              )}
              <span className={`${column.type === 'reference' ? 'text-xs px-1' : 'text-sm px-3'} truncate`}>
                {column.title}
              </span>
            </div>
          ))}

          {/* Prophecy Header - Only show if enabled */}
          {showProphecy && (
            <div className="w-64 flex-shrink-0 flex items-center px-3 border-r font-semibold text-sm bg-background">
              Prophecy & Fulfillment
            </div>
          )}
          
          {/* Notes Header - Only show if enabled */}
          {showNotes && (
            <div className="w-60 flex-shrink-0 flex items-center px-3 font-semibold text-sm bg-background">
              Personal Notes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
