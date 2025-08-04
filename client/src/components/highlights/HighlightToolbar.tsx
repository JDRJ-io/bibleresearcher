import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { SelectionInfo } from '@/hooks/useHighlightCapture';
import { queryClient } from '@/lib/queryClient';

const colors = ['210 80% 60%', '10 90% 60%', '120 70% 45%', '280 70% 65%'];

export function HighlightToolbar({ sel, onClose }: {
  sel: SelectionInfo | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  if (!sel) return null;

  async function save(col: string) {
    if (!user || !sel) return;
    
    try {
      console.log('💾 Saving highlight:', {
        verse_ref: sel.verseRef,
        translation: sel.translation,
        start_pos: sel.startPos,
        end_pos: sel.endPos,
        color_hsl: col,
        auth_user: user.id
      });

      const { data, error } = await supabase.from('highlights').insert({
        verse_ref: sel.verseRef,
        translation: sel.translation,
        start_pos: sel.startPos,
        end_pos: sel.endPos,
        color_hsl: col,
      });

      if (error) {
        console.error('❌ Error saving highlight:', error);
        throw error;
      }

      console.log('✅ Highlight saved successfully:', data);
      
      // Invalidate and refetch highlights for this verse
      queryClient.invalidateQueries({ 
        queryKey: ['highlights', sel.verseRef, sel.translation] 
      });
      
      // Clear the text selection after saving
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
      
      onClose();
    } catch (error) {
      console.error('💥 Failed to save highlight:', error);
      // Still close the toolbar even if save failed
      onClose();
    }
  }

  return (
    <motion.div
      className="fixed z-50 flex gap-2 p-2 rounded-xl bg-zinc-800 shadow"
      style={{ left: sel.pos.x, top: sel.pos.y }}
      initial={{ opacity: 0, scale: .8 }} 
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: .8 }}
    >
      {colors.map(c => (
        <button
          key={c}
          className="w-5 h-5 rounded-full"
          style={{ background: `hsl(${c})` }}
          onClick={() => save(c)}
        />
      ))}
    </motion.div>
  );
}