import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface DatabaseHighlight {
  id: string;
  user_id: string;
  verse_ref: string;
  translation: string;
  start_pos: number;
  end_pos: number;
  color_hsl: string;
  created_at: string;
}

export function useVerseHighlights(verseRef: string, translation: string) {
  const { user } = useAuth();

  return useQuery<DatabaseHighlight[]>({
    queryKey: ['highlights', verseRef, translation],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('🔍 Loading highlights for:', { 
        verseRef, 
        translation, 
        supabaseUserId: user.id,
        userEmail: user.email 
      });
      
      const { data, error } = await supabase
        .from('highlights')
        .select('id, user_id, verse_ref, translation, start_pos, end_pos, color_hsl, created_at')
        .eq('verse_ref', verseRef)
        .eq('translation', translation)
        .order('start_pos', { ascending: true });

      if (error) {
        console.error('❌ Error loading highlights:', error);
        throw error;
      }
      
      console.log('✅ Loaded highlights:', data);
      return (data as DatabaseHighlight[]) || [];
    },
    enabled: !!user && !!verseRef && !!translation,
    staleTime: 5000, // 5 seconds - shorter for faster updates
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}