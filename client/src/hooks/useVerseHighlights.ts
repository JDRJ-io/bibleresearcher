import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import type { Highlight } from '@shared/schema';

export function useVerseHighlights(verseRef: string, translation: string) {
  const { user } = useAuth();

  return useQuery<Highlight[]>({
    queryKey: ['highlights', verseRef, translation, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('highlights')
        .select('id, user_id, verse_ref, translation, start_pos, end_pos, color_hsl, pending')
        .eq('user_id', user.id)
        .eq('verse_ref', verseRef)
        .eq('translation', translation)
        .order('start_pos', { ascending: true });

      if (error) throw error;
      return (data as Highlight[]) || [];
    },
    enabled: !!user && !!verseRef && !!translation,
    staleTime: 30000, // 30 seconds
  });
}