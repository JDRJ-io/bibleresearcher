import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { SelectionInfo } from '@/hooks/useHighlightCapture';

const colors = ['210 80% 60%', '10 90% 60%', '120 70% 45%', '280 70% 65%'];

export function HighlightToolbar({ sel, onClose }: {
  sel: SelectionInfo | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  if (!sel) return null;

  async function save(col: string) {
    if (!user || !sel) return;
    
    await supabase.from('highlights').insert({
      user_id: user.id,
      verse_ref: sel.verseRef,
      translation: sel.translation,
      start_pos: sel.startPos,
      end_pos: sel.endPos,
      color_hsl: col,
    });
    onClose();
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