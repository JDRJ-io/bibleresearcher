import { supabase } from '@/lib/supabase';

export async function loadTranslation(id: string) {
  const { data, error } = await supabase.storage.from('anointed').download(`translations/${id}.txt`);
  if (error) throw error;
  return new Map<string, string>(JSON.parse(await data.text()));
}

export async function loadVerseKeys() {
  const { data, error } = await supabase.storage.from('anointed').download('metadata/verseKeys-canonical.json');
  if (error) throw error;
  return JSON.parse(await data.text());
}

export async function loadCrossReferences() {
  const { data, error } = await supabase.storage.from('anointed').download('references/cf1.txt');
  if (error) throw error;
  return await data.text();
}

export async function loadProphecy() {
  const { data, error } = await supabase.storage.from('anointed').download('references/prophecy-file.txt');
  if (error) throw error;
  return await data.text();
}

export async function saveNotes(note: any) {
  return await supabase.from('notes').upsert(note);
}

export async function saveHighlight(highlight: any) {
  return await supabase.from('highlights').upsert(highlight);
}

export async function saveBookmark(bookmark: any) {
  return await supabase.from('bookmarks').upsert(bookmark);
}