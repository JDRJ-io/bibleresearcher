import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { availableDocuments, DocumentKey } from '../utils/documentLoader';

interface DocumentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument: (key: DocumentKey) => void;
}

export const DocumentMenu: React.FC<DocumentMenuProps> = ({
  isOpen,
  onClose,
  onSelectDocument
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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

  const documentCategories = {
    legal: {
      title: 'Legal Documents',
      docs: [
        { key: 'tos' as DocumentKey, description: 'Our terms and conditions' },
        { key: 'privacy' as DocumentKey, description: 'How we handle your data' },
        { key: 'policies' as DocumentKey, description: 'Comprehensive platform policies' },
        { key: 'dmca' as DocumentKey, description: 'DMCA takedown policy' },
        { key: 'disclaimer' as DocumentKey, description: 'Legal disclaimers' },
        { key: 'cookies' as DocumentKey, description: 'Cookie usage policy' }
      ]
    },
    support: {
      title: 'Support & Information',
      docs: [
        { key: 'support' as DocumentKey, description: 'Get help with your account' },
        { key: 'acknowledgments' as DocumentKey, description: 'Credits and attributions' },
        { key: 'mission' as DocumentKey, description: 'Learn about our purpose' },
        { key: 'safety' as DocumentKey, description: 'Stay safe online' },
        { key: 'accessibility' as DocumentKey, description: 'Accessibility features' },
        { key: 'patch-notes' as DocumentKey, description: 'Latest updates and changes' },
        { key: 'delete-account' as DocumentKey, description: 'How to delete your account' }
      ]
    },
    business: {
      title: 'Business & Community',
      docs: [
        { key: 'pricing' as DocumentKey, description: 'Subscription plans and pricing' },
        { key: 'donate' as DocumentKey, description: 'Support our mission' },
        { key: 'community' as DocumentKey, description: 'Community spaces and guidelines' },
        { key: 'contributor' as DocumentKey, description: 'Contributor agreement' }
      ]
    }
  };

  return (
    <div className="fixed bottom-16 left-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
      <div 
        ref={menuRef}
        className="bg-background dark:bg-background border border-border rounded-t-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
          <h3 className="text-lg font-semibold text-foreground">All Documents</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-80 p-4">
          <div className="space-y-6">
            {Object.entries(documentCategories).map(([categoryKey, category]) => (
              <div key={categoryKey}>
                <h4 className="text-sm font-medium text-foreground/80 mb-3">{category.title}</h4>
                <div className="grid gap-2">
                  {category.docs.map(({ key, description }) => {
                    const doc = availableDocuments[key];
                    if (!doc) return null;
                    
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          onSelectDocument(key);
                          onClose();
                        }}
                        className="flex flex-col items-start p-3 rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                      >
                        <span className="font-medium text-sm text-foreground">{doc.title}</span>
                        <span className="text-xs text-muted-foreground mt-1">{description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card/30">
          <p className="text-xs text-muted-foreground text-center">
            Click any document to read it, or press Escape to close
          </p>
        </div>
      </div>
    </div>
  );
};