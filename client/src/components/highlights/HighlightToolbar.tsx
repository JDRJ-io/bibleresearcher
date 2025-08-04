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

  async function removeHighlight() {
    if (!user || !sel) return;
    
    try {
      console.log('🗑️ Removing highlights for selection:', {
        verse_ref: sel.verseRef,
        translation: sel.translation,
        start_pos: sel.startPos,
        end_pos: sel.endPos,
        supabase_user: user.id
      });

      // Find and delete any overlapping highlights
      const { error } = await supabase
        .from('highlights')
        .delete()
        .eq('verse_ref', sel.verseRef)
        .eq('translation', sel.translation)
        .or(`and(start_pos.lte.${sel.endPos},end_pos.gte.${sel.startPos})`);

      if (error) {
        console.error('❌ Error removing highlight:', error);
        throw error;
      }

      console.log('✅ Highlight removed successfully');
      
      // Invalidate and refetch highlights for this verse
      queryClient.invalidateQueries({ 
        queryKey: ['highlights', sel.verseRef, sel.translation] 
      });
      
      // Clear the text selection after removing
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
      
      onClose();
    } catch (error) {
      console.error('💥 Failed to remove highlight:', error);
      onClose();
    }
  }

  async function save(col: string) {
    if (!user || !sel) return;
    
    try {
      console.log('💾 Saving highlight:', {
        verse_ref: sel.verseRef,
        translation: sel.translation,
        start_pos: sel.startPos,
        end_pos: sel.endPos,
        color_hsl: col,
        supabase_user: user.id,
        user_email: user.email
      });

      // First remove any overlapping highlights to prevent conflicts
      const { error: deleteError } = await supabase
        .from('highlights')
        .delete()
        .eq('verse_ref', sel.verseRef)
        .eq('translation', sel.translation)
        .or(`and(start_pos.lte.${sel.endPos},end_pos.gte.${sel.startPos})`);
      
      if (deleteError) {
        console.log('🔄 No overlapping highlights to delete (or delete failed):', deleteError);
      }

      // Then insert the new highlight
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
      style={{ left: sel.pos.x - 60, top: sel.pos.y }}
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
      {/* Remove/Clear button */}
      <button
        onClick={removeHighlight}
        className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:scale-110 transition-transform"
        title="Remove highlight"
      >
        <span className="text-gray-600 dark:text-gray-300 text-xs font-bold">×</span>
      </button>
    </motion.div>
  );
}