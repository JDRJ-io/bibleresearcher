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

// Global hook to check if user has any highlights at all
export function useHasHighlights() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['has-highlights', user?.id],
    queryFn: async () => {
      if (!user) return false;

      // Use RPC to check if user has any highlights
      const { data, error } = await supabase().rpc('fn_get_highlight_ranges', {
        p_verse_keys: [],  // Empty array to get all highlights
        p_translation: null
      });

      if (error) {
        console.warn('Error checking highlights:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - highlights don't change often
    gcTime: 10 * 60 * 1000,   // Keep cached for 10 minutes
  });
}

// Note: useVerseHighlights has been moved to /hooks/useVerseHighlights.ts
// This file now only contains the useHasHighlights function