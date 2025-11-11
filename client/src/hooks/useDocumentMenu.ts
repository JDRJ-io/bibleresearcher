import { useState } from 'react';
import { DocumentKey, loadDocument, availableDocuments } from '@/utils/documentLoader';

export function useDocumentMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tooltip, setTooltip] = useState<{
    key: DocumentKey;
    title: string;
  } | null>(null);
  const [documentContent, setDocumentContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const openDocument = async (key: DocumentKey) => {
    const doc = availableDocuments[key];
    setTooltip({ key, title: doc.title });
    setIsLoading(true);

    try {
      const content = await loadDocument(doc.filename);
      setDocumentContent(content);
    } catch (error) {
      setDocumentContent(
        "# Error\n\nFailed to load document. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openAllDocs = () => {
    setIsMenuOpen(true);
  };

  const handleDocumentSelect = async (key: DocumentKey) => {
    await openDocument(key);
  };

  const closeTooltip = () => {
    setTooltip(null);
    setDocumentContent("");
  };

  return {
    isMenuOpen,
    setIsMenuOpen,
    tooltip,
    documentContent,
    isLoading,
    openDocument,
    openAllDocs,
    handleDocumentSelect,
    closeTooltip,
  };
}