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
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Map of URL paths and file paths to document keys
  const urlToDocumentKey: Record<string, DocumentKey> = {
    // URL-style paths
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
    '/acknowledgments': 'acknowledgments',
    '/acknowledgements': 'acknowledgments',
    '/contact': 'contact',
    '/licenses': 'licenses',
    // Relative file paths
    './Privacy Policy.md': 'privacy',
    './ToS.md': 'tos',
    './Policies.md': 'policies',
    './Acknowledgments.md': 'acknowledgments',
    './Donate.md': 'donate',
    './Disclaimer.md': 'disclaimer',
    './DMCA.md': 'dmca',
    './Accessibility.md': 'accessibility',
    './Community_Spaces.md': 'community',
    './Contributor Agreement original.md': 'contributor',
    './Delete_account.md': 'delete-account',
    './Our Mission Statement.md': 'mission',
    './Pricing.md': 'pricing',
    './Safety & Scam Prevention.md': 'safety',
    './cookies.md': 'cookies',
    './patch_notes.md': 'patch-notes',
    './support.md': 'support',
    './Contact.md': 'contact',
    './Licenses.md': 'licenses'
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as Node;
      if (tooltipRef.current && !tooltipRef.current.contains(target)) {
        const touch = e.touches[0];
        touchStartRef.current = { 
          x: touch.clientX, 
          y: touch.clientY,
          time: Date.now()
        };
      } else {
        touchStartRef.current = null;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const target = e.target as Node;
      if (tooltipRef.current && !tooltipRef.current.contains(target)) {
        const touch = e.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
        const deltaTime = Date.now() - touchStartRef.current.time;

        const wasScrollGesture = deltaX > 10 || deltaY > 10;
        const wasQuickTap = deltaTime < 500;

        if (!wasScrollGesture && wasQuickTap) {
          onClose();
        }
      }

      touchStartRef.current = null;
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      touchStartRef.current = null;
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
    <div 
      className="fixed z-50 w-80 sm:w-96 lg:w-[28rem] max-w-[calc(100vw-2rem)]"
      style={{
        bottom: 'calc(4rem + max(0px, env(safe-area-inset-bottom)))',
        right: 'max(1rem, calc(env(safe-area-inset-right) + 1rem))'
      }}
    >
      <div 
        ref={tooltipRef}
        className="bg-white/80 dark:bg-black/80 backdrop-blur-xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-t-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[calc(90vh-5rem)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-card/50 flex-shrink-0">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
            data-testid="button-close-document-tooltip"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-3 sm:p-4 flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div 
              ref={contentRef}
              className="prose prose-sm max-w-none dark:prose-invert
                         prose-headings:text-foreground dark:prose-headings:text-foreground prose-headings:font-bold prose-headings:mb-3 prose-headings:mt-4 first:prose-headings:mt-0
                         prose-p:text-foreground dark:prose-p:text-foreground prose-p:mb-4 prose-p:leading-relaxed prose-p:text-sm
                         prose-strong:text-foreground dark:prose-strong:text-foreground prose-strong:font-semibold
                         prose-li:text-foreground dark:prose-li:text-foreground prose-li:mb-2 prose-li:text-sm prose-li:leading-relaxed
                         prose-ol:mb-4 prose-ul:mb-4 prose-ol:pl-4 prose-ul:pl-4
                         prose-a:text-primary hover:prose-a:text-primary/80 prose-a:cursor-pointer
                         [&>ol]:list-decimal [&>ul]:list-disc [&>ol>li]:ml-4 [&>ul>li]:ml-4
                         [&>p>strong]:text-foreground dark:[&>p>strong]:text-foreground [&>p>strong]:font-bold [&>p>strong]:block [&>p>strong]:mb-2
                         [&>h1]:text-lg [&>h2]:text-base [&>h3]:text-sm [&>h4]:text-sm
                         [&_*]:text-foreground dark:[&_*]:text-foreground"
              dangerouslySetInnerHTML={{ __html: marked(content) }}
            />
          )}
        </div>
      </div>
    </div>
  );
};