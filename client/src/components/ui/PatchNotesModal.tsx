import React, { useRef, useEffect, useState } from 'react';
import { X, Scroll } from 'lucide-react';
import { marked } from 'marked';

interface PatchNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatchNotesModal: React.FC<PatchNotesModalProps> = ({
  isOpen,
  onClose
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [patchNotes, setPatchNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
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

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch('/docs/changelog.md')
        .then(response => response.text())
        .then(content => {
          setPatchNotes(content);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Failed to load patch notes:', error);
          setPatchNotes('# Error\n\nFailed to load patch notes. Please try again.');
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="w-full max-w-3xl max-h-[80vh] bg-background dark:bg-background border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-purple-900/10 via-yellow-400/5 to-purple-900/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-yellow-400/20 to-purple-400/20 border border-yellow-400/30">
              <Scroll className="h-5 w-5 text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-yellow-500 to-purple-500 dark:from-yellow-400 dark:to-purple-400 bg-clip-text text-transparent">
              Divine Updates
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            </div>
          ) : (
            <div 
              className="prose prose-sm max-w-none dark:prose-invert 
                         prose-headings:text-foreground prose-headings:font-semibold
                         prose-h1:text-2xl prose-h1:bg-gradient-to-r prose-h1:from-yellow-500 prose-h1:to-purple-500 
                         dark:prose-h1:from-yellow-400 dark:prose-h1:to-purple-400 prose-h1:bg-clip-text prose-h1:text-transparent
                         prose-h2:text-xl prose-h2:text-foreground prose-h2:border-b prose-h2:border-border prose-h2:pb-2
                         prose-h3:text-lg prose-h3:text-yellow-600 dark:prose-h3:text-yellow-400
                         prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground 
                         prose-ul:list-disc prose-ol:list-decimal
                         prose-a:text-primary hover:prose-a:text-primary/80"
              dangerouslySetInnerHTML={{ __html: marked(patchNotes) }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-card/30">
          <p className="text-xs text-muted-foreground text-center">
            Stay blessed with the latest divine enhancements • Press Escape to close
          </p>
        </div>
      </div>
    </div>
  );
};