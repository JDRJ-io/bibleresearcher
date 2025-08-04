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
      
      console.log('🔍 Loading highlights for:', { verseRef, translation, userId: user.id });
      
      const { data, error } = await supabase
        .from('highlights')
        .select('id, user_id, verse_ref, translation, start_pos, end_pos, color_hsl, pending')
        .eq('user_id', user.id)
        .eq('verse_ref', verseRef)
        .eq('translation', translation)
        .order('start_pos', { ascending: true });

      if (error) {
        console.error('❌ Error loading highlights:', error);
        throw error;
      }
      
      console.log('✅ Loaded highlights:', data);
      return (data as Highlight[]) || [];
    },
    enabled: !!user && !!verseRef && !!translation,
    staleTime: 5000, // 5 seconds - shorter for faster updates
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}