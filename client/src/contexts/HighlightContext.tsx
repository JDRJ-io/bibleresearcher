import React, { createContext, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useHighlightCapture, SelectionInfo } from '@/hooks/useHighlightCapture';
import { HighlightToolbar } from '@/components/highlights/HighlightToolbar';

export const HighlightProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sel, setSel] = useState<SelectionInfo | null>(null);
  useHighlightCapture(setSel);

  return (
    <>
      {children}
      <AnimatePresence>
        <HighlightToolbar sel={sel} onClose={() => setSel(null)} />
      </AnimatePresence>
    </>
  );
};