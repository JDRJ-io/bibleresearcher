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

    // Lock body scroll
    document.body.style.overflow = 'hidden';

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
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch('/important_docs/patch_notes.md')
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
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm" 
      style={{ zIndex: 99999 }}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-[calc(100vw-1rem)] sm:max-w-3xl max-h-[80vh] bg-background dark:bg-background border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
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
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto overflow-x-hidden p-6 max-h-[60vh]" style={{ scrollBehavior: 'smooth' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            </div>
          ) : (
            <div 
              className="prose prose-sm max-w-none text-foreground
                         [&_*]:text-foreground
                         [&_p]:text-foreground
                         [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_h5]:text-foreground [&_h6]:text-foreground
                         [&_li]:text-foreground [&_ul]:text-foreground [&_ol]:text-foreground
                         [&_span]:text-foreground [&_strong]:text-foreground [&_em]:text-foreground [&_div]:text-foreground
                         [&_blockquote]:text-foreground [&_code]:text-foreground [&_pre]:text-foreground
                         [&_table]:text-foreground [&_th]:text-foreground [&_td]:text-foreground"
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