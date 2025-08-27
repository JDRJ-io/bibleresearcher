import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { X } from 'lucide-react';
import { DocumentKey } from '../utils/documentLoader';

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
  onOpenDocument?: (documentKey: DocumentKey) => Promise<void>;
}

export const DocumentTooltip: React.FC<DocumentTooltipProps> = ({
  isOpen,
  onClose,
  title,
  content,
  isLoading = false,
  onOpenDocument
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Map of URL paths to document keys
  const urlToDocumentKey: Record<string, DocumentKey> = {
    '/privacy': 'privacy',
    '/pricing': 'pricing',
    '/tos': 'tos',
    '/policies': 'policies',
    '/support': 'support',
    '/donate': 'donate',
    '/mission': 'mission',
    '/safety': 'safety',
    '/accessibility': 'accessibility',
    '/community': 'community',
    '/contributor': 'contributor',
    '/dmca': 'dmca',
    '/disclaimer': 'disclaimer',
    '/cookies': 'cookies',
    '/patch-notes': 'patch-notes',
    '/delete-account': 'delete-account',
    '/privacy_policy': 'privacy',
    '/acknowledgments': 'acknowledgments'
  };

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

  // Handle clicks on links within the document content
  useEffect(() => {
    if (!isOpen || !contentRef.current || !onOpenDocument) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') {
        const href = target.getAttribute('href');
        if (href && urlToDocumentKey[href]) {
          e.preventDefault();
          e.stopPropagation();
          const documentKey = urlToDocumentKey[href];
          onOpenDocument(documentKey);
        }
      }
    };

    contentRef.current.addEventListener('click', handleLinkClick);

    return () => {
      if (contentRef.current) {
        contentRef.current.removeEventListener('click', handleLinkClick);
      }
    };
  }, [isOpen, onOpenDocument, urlToDocumentKey]);

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
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
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
              ref={contentRef}
              className="prose prose-sm max-w-none
                         text-foreground dark:text-foreground 
                         [&_*]:text-foreground [&_*]:dark:text-background
                         [&_p]:text-foreground [&_p]:dark:text-background
                         [&_h1]:text-foreground [&_h1]:dark:text-background
                         [&_h2]:text-foreground [&_h2]:dark:text-background
                         [&_h3]:text-foreground [&_h3]:dark:text-background
                         [&_h4]:text-foreground [&_h4]:dark:text-background
                         [&_li]:text-foreground [&_li]:dark:text-background
                         [&_span]:text-foreground [&_span]:dark:text-background
                         [&_strong]:text-foreground [&_strong]:dark:text-background
                         [&_em]:text-foreground [&_em]:dark:text-background
                         [&_div]:text-foreground [&_div]:dark:text-background
                         [&>ol]:list-decimal [&>ul]:list-disc [&>ol>li]:ml-4 [&>ul>li]:ml-4
                         [&>p>strong]:font-bold [&>p>strong]:block [&>p>strong]:mb-2
                         [&>h1]:text-lg [&>h2]:text-base [&>h3]:text-sm [&>h4]:text-sm"
              dangerouslySetInnerHTML={{ __html: marked(content) }}
            />
          )}
        </div>
      </div>
    </div>
  );
};