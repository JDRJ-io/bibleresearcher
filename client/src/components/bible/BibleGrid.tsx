import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Column } from './Column';

interface ColumnConfig {
  id: string;
  title: string;
  width: string;
  type: 'reference' | 'main-translation' | 'alt-translation' | 'cross-refs' | 'notes' | 'prophecy';
  isDraggable?: boolean;
}

interface BibleGridProps {
  columns: ColumnConfig[];
  onColumnReorder?: (activeId: string, overId: string) => void;
  children: Record<string, React.ReactNode>;
  className?: string;
}

export function BibleGrid({ columns, onColumnReorder, children, className = "" }: BibleGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id && onColumnReorder) {
      onColumnReorder(active.id as string, over!.id as string);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className={`gridX ${className}`}>
        <SortableContext 
          items={columns.map(col => col.id)} 
          strategy={horizontalListSortingStrategy}
        >
          {columns.map(column => (
            <Column
              key={column.id}
              id={column.id}
              title={column.title}
              width={column.width}
              isDraggable={column.isDraggable !== false}
            >
              {children[column.id]}
            </Column>
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}