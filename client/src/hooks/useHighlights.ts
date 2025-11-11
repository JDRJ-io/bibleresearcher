import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import type { Highlight, InsertHighlight } from '@shared/schema';

export function useHighlights(verseRef?: string) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !verseRef) {
      setHighlights([]);
      return;
    }

    loadHighlights();
  }, [user, verseRef]);

  const loadHighlights = async () => {
    if (!user || !verseRef) return;

    setLoading(true);
    try {
      const { data, error } = await supabase()
        .from('highlights')
        .select('id, user_id, verse_ref, translation, start_pos, end_pos, color_hsl, pending')
        .eq('user_id', user.id)
        .eq('verse_ref', verseRef)
        .order('start_pos', { ascending: true });

      if (error) throw error;
      setHighlights((data as Highlight[]) || []);
    } catch (error) {
      console.error('Error loading highlights:', error);
    } finally {
      setLoading(false);
    }
  };

  const addHighlight = async (translation: string, startPos: number, endPos: number, colorHsl: string) => {
    if (!user || !verseRef) return;

    try {
      const newHighlight = {
        user_id: user.id,
        verse_ref: verseRef,
        translation,
        start_pos: startPos,
        end_pos: endPos,
        color_hsl: colorHsl,
        pending: false
      };

      const { data, error } = await supabase()
        .from('highlights')
        .insert(newHighlight)
        .select('id, user_id, verse_ref, translation, start_pos, end_pos, color_hsl, pending')
        .single();

      if (error) throw error;

      setHighlights(prev => [...prev, data as Highlight].sort((a, b) => a.start_pos - b.start_pos));
      return data;
    } catch (error) {
      console.error('Error adding highlight:', error);
      throw error;
    }
  };

  const deleteHighlight = async (id: number) => {
    if (!user) return;

    try {
      const { error } = await supabase()
        .from('highlights')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHighlights(prev => prev.filter(h => h.id !== id));
    } catch (error) {
      console.error('Error deleting highlight:', error);
      throw error;
    }
  };

  const updateHighlightColor = async (id: number, colorHsl: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase()
        .from('highlights')
        .update({ color_hsl: colorHsl })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, user_id, verse_ref, translation, start_pos, end_pos, color_hsl, pending')
        .single();

      if (error) throw error;

      setHighlights(prev => prev.map(h => h.id === id ? data as Highlight : h));
      return data;
    } catch (error) {
      console.error('Error updating highlight color:', error);
      throw error;
    }
  };

  return {
    highlights,
    loading,
    addHighlight,
    deleteHighlight,
    updateHighlightColor,
    refresh: loadHighlights
  };
}

// Helper function to adapt colors for theme changes
export function adaptColorForTheme(hslColor: string, theme: 'light' | 'dark'): string {
  // Parse HSL string like "210 80% 60%"
  const matches = hslColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!matches) return hslColor;

  const h = parseInt(matches[1]);
  const s = parseInt(matches[2]);
  const l = parseInt(matches[3]);

  // Adjust lightness for theme
  const adjustedL = theme === 'dark' 
    ? Math.min(l + 30, 90)  // Lighter for dark theme
    : Math.max(l - 30, 20); // Darker for light theme

  return `${h} ${s}% ${adjustedL}%`;
}