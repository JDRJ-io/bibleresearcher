import { useState } from "react";
import { DocumentTooltip } from "./DocumentTooltip";
import { DocumentMenu } from "./DocumentMenu";
import { useDocumentMenu } from "@/hooks/useDocumentMenu";
import { SupportUsModal } from "./SupportUsModal";
// import { ForumQuickAccess } from "./ForumQuickAccess";
// import { MessageSquare } from "lucide-react";
import { Heart } from "lucide-react";

const Footer = () => {
  const {
    isMenuOpen,
    setIsMenuOpen,
    tooltip,
    documentContent,
    isLoading,
    openDocument,
    openAllDocs,
    handleDocumentSelect,
    closeTooltip,
  } = useDocumentMenu();

  // const [isForumOpen, setIsForumOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  return (
    <>
      <footer className="site-footer fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-background/95 light:bg-white/95" style={{ touchAction: 'none', overscrollBehavior: 'contain' }}>
        <div className="container mx-auto px-4 py-2">
          {/* Desktop & Mobile: Unified layout */}
          <div className="flex justify-center items-center gap-3 text-sm">
            <button
              onClick={() => openAllDocs()}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-all-docs"
            >
              All Docs
            </button>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground font-medium">© Anointed.io™</span>
            <span className="text-muted-foreground">·</span>
            <button
              onClick={() => setIsSupportOpen(true)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-support-us"
            >
              <Heart className="w-4 h-4" />
              Support Us
            </button>
            {/* Temporarily hidden - Forum button will be active later
            <button
              onClick={() => setIsForumOpen(true)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-forum-quick"
            >
              <MessageSquare className="w-4 h-4" />
              Forum
            </button>
            */}
          </div>
        </div>
      </footer>

      {/* Support Us Modal */}
      <SupportUsModal isOpen={isSupportOpen} onClose={setIsSupportOpen} />

      {/* Forum Quick Access Popup - Temporarily hidden */}
      {/* <ForumQuickAccess isOpen={isForumOpen} onClose={() => setIsForumOpen(false)} /> */}

      {/* Document Menu */}
      <DocumentMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSelectDocument={handleDocumentSelect}
      />

      {/* Document Tooltip */}
      <DocumentTooltip
        isOpen={!!tooltip}
        onClose={closeTooltip}
        title={tooltip?.title || ""}
        content={documentContent}
        isLoading={isLoading}
        onOpenDocument={openDocument}
      />
    </>
  );
};

export default Footer;
