import { useState, useEffect } from 'react';

export function useTextSelection() {
  const [selection, setSelection] = useState<string>('');

  useEffect(() => {
    function handleSelectionChange() {
      const sel = window.getSelection();
      setSelection(sel?.toString() || '');
    }

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  return selection;
}