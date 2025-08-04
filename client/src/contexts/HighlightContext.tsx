import React, { createContext, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useHighlightCapture, SelectionInfo } from '@/hooks/useHighlightCapture';
import { HighlightToolbar } from '@/components/highlights/HighlightToolbar';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';

interface LastHighlight {
  id: string;
  verse_ref: string;
  translation: string;
  user_id: string;
}

export const HighlightProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sel, setSel] = useState<SelectionInfo | null>(null);
  const [lastHighlight, setLastHighlight] = useState<LastHighlight | null>(null);
  const { user } = useAuth();
  
  useHighlightCapture(setSel);

  // Ctrl+Z handler to remove last highlight
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'z' && lastHighlight && user) {
        e.preventDefault();
        removeLastHighlight();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lastHighlight, user]);

  async function removeLastHighlight() {
    if (!lastHighlight || !user) return;

    try {
      console.log('⏪ Removing last highlight (Ctrl+Z):', lastHighlight);
      
      const { error } = await supabase
        .from('highlights')
        .delete()
        .eq('id', lastHighlight.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error removing last highlight:', error);
        return;
      }

      console.log('✅ Last highlight removed');
      
      // Invalidate cache for the affected verse
      queryClient.invalidateQueries({
        queryKey: ['highlights', lastHighlight.verse_ref, lastHighlight.translation, user.id]
      });
      
      setLastHighlight(null);
    } catch (error) {
      console.error('💥 Failed to remove last highlight:', error);
    }
  }

  return (
    <>
      {children}
      <AnimatePresence>
        <HighlightToolbar 
          sel={sel} 
          onClose={() => setSel(null)}
          onHighlightSaved={setLastHighlight}
        />
      </AnimatePresence>
    </>
  );
};