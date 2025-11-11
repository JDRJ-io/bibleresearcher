import React, { createContext, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
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
  const [lastHighlight, setLastHighlight] = useState<LastHighlight | null>(null);
  const authResult = useAuth();
  const user = authResult?.user || null;

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

    // V1 Guard: Block legacy calls when V2 is enabled and V1 is disabled
    const V2 = import.meta.env.VITE_HIGHLIGHTS_V2_ENABLED === 'true';
    const V1_OFF = import.meta.env.VITE_HL_V1_DISABLED === 'true';
    const HARD_FAIL = import.meta.env.VITE_HL_V2_HARD_FAIL === 'true';
    
    if (V2 && V1_OFF) {
      const msg = 'V1 highlight delete blocked: V2 integration mode - fn_delete_highlight_by_id disabled';
      console.error('HL_LEGACY_CALL', { fn: 'fn_delete_highlight_by_id', highlightId: lastHighlight.id, stack: new Error().stack });
      if (HARD_FAIL) throw new Error(msg);
      console.error(msg);
      setLastHighlight(null); // Clear state even if blocked
      return;
    }

    try {
      console.log('⏪ Removing last highlight (Ctrl+Z):', lastHighlight);
      
      const { error } = await supabase().rpc('fn_delete_highlight_by_id', {
        p_id: lastHighlight.id
      });

      if (error) {
        console.error('❌ Error removing last highlight:', error);
        return;
      }

      console.log('✅ Last highlight removed');
      
      // V2 GUARD: Only invalidate cache for V1 system - V2 uses optimistic updates
      const V2 = import.meta.env.VITE_HIGHLIGHTS_V2_ENABLED === 'true';
      if (!V2) {
        queryClient.invalidateQueries({
          queryKey: ['hl:ranges', lastHighlight.verse_ref, lastHighlight.translation ?? null]
        });
        queryClient.invalidateQueries({
          queryKey: ['hl:verse', lastHighlight.verse_ref]
        });
      }
      
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
          onHighlightSaved={setLastHighlight}
        />
      </AnimatePresence>
    </>
  );
};