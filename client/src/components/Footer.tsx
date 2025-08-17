import React, { useState } from 'react';
import { DocumentTooltip } from './DocumentTooltip';
import { loadDocument, availableDocuments, DocumentKey } from '../utils/documentLoader';

const Footer = () => {
  const [tooltip, setTooltip] = useState<{ key: DocumentKey; title: string } | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const openDocument = async (key: DocumentKey) => {
    const doc = availableDocuments[key];
    setTooltip({ key, title: doc.title });
    setIsLoading(true);
    
    try {
      const content = await loadDocument(doc.filename);
      setDocumentContent(content);
    } catch (error) {
      setDocumentContent('# Error\n\nFailed to load document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openAllDocs = () => {
    const allDocsContent = `# All Documents

Welcome to our document library. Click on any document below to read it:

## Legal Documents
- **Terms of Service** - Our terms and conditions
- **Privacy Policy** - How we handle your data
- **Policies** - Comprehensive platform policies

## Support & Information
- **Support** - Get help with your account
- **Acknowledgments** - Credits and attributions
- **Our Mission** - Learn about our purpose
- **Safety & Scam Prevention** - Stay safe online

## Community
- **Forum** - Join our community discussions
- **Donate** - Support our mission

---

For specific questions or support, please contact us through the appropriate channels listed in our support documentation.`;

    setTooltip({ key: 'policies', title: 'All Documents' });
    setDocumentContent(allDocsContent);
    setIsLoading(false);
  };

  const closeTooltip = () => {
    setTooltip(null);
    setDocumentContent('');
  };

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-background/95 light:bg-white/95">
        <div className="container mx-auto px-4 py-2">
          {/* Desktop: Single row layout */}
          <div className="hidden sm:flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => openDocument('tos')}
                className="hover:text-foreground transition-colors"
              >
                Terms
              </button>
              <button 
                onClick={() => openDocument('policies')}
                className="hover:text-foreground transition-colors"
              >
                Policies
              </button>
              <button 
                onClick={() => openDocument('privacy')}
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </button>
              <button 
                onClick={() => window.open('/forum', '_blank')}
                className="hover:text-foreground transition-colors"
              >
                Forum
              </button>
              <button 
                onClick={() => openAllDocs()}
                className="hover:text-foreground transition-colors"
              >
                All Docs
              </button>
              <button 
                onClick={() => openDocument('donate')}
                className="hover:text-foreground transition-colors"
              >
                Donate
              </button>
            </div>
            <div className="text-right">
              © 2025 Anointed.io
            </div>
          </div>

          {/* Mobile: Two row layout */}
          <div className="sm:hidden">
            <div className="flex justify-center items-center space-x-3 mb-1 text-xs text-muted-foreground">
              <button 
                onClick={() => openDocument('tos')}
                className="hover:text-foreground transition-colors"
              >
                ToS
              </button>
              <button 
                onClick={() => openDocument('policies')}
                className="hover:text-foreground transition-colors"
              >
                Policies
              </button>
              <button 
                onClick={() => openDocument('privacy')}
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => window.open('/forum', '_blank')}
                className="hover:text-foreground transition-colors"
              >
                Forum
              </button>
            </div>
            <div className="flex justify-center items-center space-x-3 text-xs text-muted-foreground">
              <button 
                onClick={() => openAllDocs()}
                className="hover:text-foreground transition-colors"
              >
                All Docs
              </button>
              <span>© 2025 Anointed.io</span>
              <button 
                onClick={() => openDocument('donate')}
                className="hover:text-foreground transition-colors"
              >
                Donate
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Document Tooltip */}
      <DocumentTooltip
        isOpen={!!tooltip}
        onClose={closeTooltip}
        title={tooltip?.title || ''}
        content={documentContent}
        isLoading={isLoading}
      />
    </>
  );
};

export default Footer;