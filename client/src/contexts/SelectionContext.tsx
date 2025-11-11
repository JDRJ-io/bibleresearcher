import React, {createContext, useContext, useMemo, useState} from 'react';

export type VerseSelection = {
  verseRef: string;        // e.g. "John.3:16"
  translation: string;     // e.g. "NKJV"
  startPos: number;        // 0-based
  endPos: number;          // end-exclusive
  textLength: number;      // length of the verse text (for clamping)
  rect?: DOMRect;          // where to place toolbar
};

type Ctx = {
  selection: VerseSelection | null;
  setSelection: (s: VerseSelection | null) => void;
  clearSelection: () => void;
};

const SelectionContext = createContext<Ctx | null>(null);

export function SelectionProvider({children}:{children: React.ReactNode}) {
  const [selection, setSelection] = useState<VerseSelection | null>(null);
  const clearSelection = () => {
    console.log('🐛 DEBUG: clearSelection called');
    setSelection(null);
  };
  
  const debugSetSelection = (s: VerseSelection | null) => {
    console.log('🐛 DEBUG: setSelection called with:', s);
    setSelection(s);
  };
  
  const value = useMemo(() => ({selection, setSelection: debugSetSelection, clearSelection}), [selection]);
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useVerseSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error('useVerseSelection must be used within <SelectionProvider>');
  return ctx;
}