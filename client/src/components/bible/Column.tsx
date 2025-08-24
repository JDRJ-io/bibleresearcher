import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface ColumnProps {
  id: string;
  title: string;
  width: string;
  children: React.ReactNode;
  isDraggable?: boolean;
  className?: string;
}

export function Column({ id, title, width, children, isDraggable = true, className = "" }: ColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`col ${className} ${isDragging ? 'opacity-50' : ''}`}
      {...attributes}
    >
      {/* Column Header - Sticky within this column */}
      <div 
        className="col__header"
        data-col={id}
        style={{
          backgroundColor: 'var(--header-bg)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-color)'
        }}
      >
        <div className="flex items-center justify-center h-full px-2">
          {isDraggable && (
            <div {...listeners} className="cursor-grab mr-1 opacity-50 hover:opacity-100">
              <GripVertical size={14} />
            </div>
          )}
          <span className="text-xs font-medium truncate">{title}</span>
        </div>
      </div>
      
      {/* Column Body - Contains all rows for this column */}
      <div className="col__body">
        {children}
      </div>
    </div>
  );
}