import { supabase } from '@/lib/supabase';

export async function loadTranslation(id: string) {
  const { data, error } = await supabase.storage.from('translations').download(`${id}.json.gz`);
  if (error) throw error;
  return new Map<number, string>(JSON.parse(await data.text()));
}

export async function loadProphecy(id: string) { /* ...same pattern... */ }
export async function saveNotes(note) { /* ...supabase.from('notes').upsert(note)... */ }
// etc.