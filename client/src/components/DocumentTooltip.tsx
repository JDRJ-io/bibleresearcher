import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { X } from 'lucide-react';

// Configure marked for better formatting
marked.setOptions({
  breaks: true, // Convert line breaks to <br> tags
  gfm: true,    // GitHub Flavored Markdown
});

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
              className="prose prose-sm max-w-none dark:prose-invert
                         prose-headings:text-foreground prose-headings:font-bold prose-headings:mb-3 prose-headings:mt-4 first:prose-headings:mt-0
                         prose-p:text-foreground prose-p:mb-4 prose-p:leading-relaxed prose-p:text-sm
                         prose-strong:text-foreground prose-strong:font-semibold
                         prose-li:text-foreground prose-li:mb-2 prose-li:text-sm prose-li:leading-relaxed
                         prose-ol:mb-4 prose-ul:mb-4 prose-ol:pl-4 prose-ul:pl-4
                         prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80
                         [&>ol]:list-decimal [&>ul]:list-disc [&>ol>li]:ml-4 [&>ul>li]:ml-4
                         [&>p>strong]:text-foreground [&>p>strong]:font-bold [&>p>strong]:block [&>p>strong]:mb-2
                         [&>h1]:text-lg [&>h2]:text-base [&>h3]:text-sm [&>h4]:text-sm"
              dangerouslySetInnerHTML={{ __html: marked(content) }}
            />
          )}
        </div>
      </div>
    </div>
  );
};