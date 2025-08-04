import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import type { Note } from '@shared/schema';

export function useNotes(verseRef?: string) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  /* fetch on mount / verse change */
  useEffect(() => {
    if (!user || !verseRef) return;
    setLoading(true);
    supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('verse_ref', verseRef)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setNotes((data as Note[]) ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.id, verseRef]);

  /* helpers */
  const addNote = useCallback(async (text: string) => {
    if (!user || !verseRef) return;
    const { data, error } = await supabase.from('notes').insert({
      user_id: user.id,
      verse_ref: verseRef,
      text,
    }).select().single();
    if (!error && data) setNotes((n) => [data as Note, ...n]);
  }, [user?.id, verseRef]);

  const updateNote = useCallback(async (id: number, text: string) => {
    const { data, error } = await supabase
      .from('notes')
      .update({ text, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (!error && data) setNotes((n) => n.map((x) => (x.id === id ? data as Note : x)));
  }, []);

  const deleteNote = useCallback(async (id: number) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (!error) setNotes((n) => n.filter((x) => x.id !== id));
  }, []);

  return { notes, loading, addNote, updateNote, deleteNote };
}