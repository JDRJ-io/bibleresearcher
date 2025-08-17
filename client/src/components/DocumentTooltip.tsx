import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { X } from 'lucide-react';

interface DocumentTooltipProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  isLoading?: boolean;
}

export const DocumentTooltip: React.FC<DocumentTooltipProps> = ({
  isOpen,
  onClose,
  title,
  content,
  isLoading = false
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-16 right-4 z-50 w-80 sm:w-96 lg:w-[28rem] xl:w-[32rem] max-w-[calc(100vw-2rem)]">
      <div 
        ref={tooltipRef}
        className="bg-background dark:bg-background border border-border rounded-t-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-96 sm:max-h-[28rem] lg:max-h-[32rem] xl:max-h-[36rem] p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div 
              className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary hover:prose-a:text-primary/80"
              dangerouslySetInnerHTML={{ __html: marked(content) }}
            />
          )}
        </div>
      </div>
    </div>
  );
};