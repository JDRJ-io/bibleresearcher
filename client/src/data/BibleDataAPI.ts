import { supabase } from '@/lib/supabase';
import { db } from '@/offline/offlineDB';
import { queueSync } from '@/offline/queueSync';

export async function loadTranslation(id: string) {
  const { data, error } = await supabase.storage.from('anointed').download(`translations/${id}.txt`);
  if (error) throw error;
  
  const textData = await data.text();
  const textMap = new Map<string, string>();
  
  // Parse the translation text format: "Gen.1:1 #In the beginning..."
  const lines = textData.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const cleanLine = line.trim().replace(/\r/g, '');
    const match = cleanLine.match(/^([^#]+)\s*#(.+)$/);
    if (match) {
      const [, reference, text] = match;
      const cleanRef = reference.trim();
      const cleanText = text.trim();
      
      // Store multiple key formats for compatibility
      textMap.set(cleanRef, cleanText); // "Gen.1:1"
      textMap.set(cleanRef.replace(".", " "), cleanText); // "Gen 1:1"
    }
  }
  
  return textMap;
}

export async function loadTranslationAsText(id: string) {
  const { data, error } = await supabase.storage.from('anointed').download(`translations/${id}.txt`);
  if (error) throw error;
  return await data.text();
}

export async function loadVerseKeys() {
  const { data, error } = await supabase.storage.from('anointed').download('metadata/verseKeys-canonical.json');
  if (error) throw error;
  return JSON.parse(await data.text());
}

export async function loadVerseKeysAsText() {
  const { data, error } = await supabase.storage.from('anointed').download('metadata/verseKeys-canonical.txt');
  if (error) throw error;
  return await data.text();
}

export async function loadChronologicalVerseKeys() {
  const { data, error } = await supabase.storage.from('anointed').download('metadata/verse-keys-chronological.json');
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

// Parse cross-reference format: Gen.1:1$$John.1:1#John.1:2#John.1:3$Heb.11:3
export function parseCrossReferences(text: string): Map<string, Array<{reference: string, text?: string}>> {
  const crossRefMap = new Map<string, Array<{reference: string, text?: string}>>();
  
  const lines = text.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const cleanLine = line.trim().replace(/\r/g, '');
    const [verseRef, ...refParts] = cleanLine.split('$$');
    
    if (verseRef && refParts.length > 0) {
      const references: Array<{reference: string, text?: string}> = [];
      
      // Split by $ for groups, then by # for individual references
      const refGroups = refParts.join('$$').split('$');
      
      for (const group of refGroups) {
        const individualRefs = group.split('#');
        for (const ref of individualRefs) {
          if (ref.trim()) {
            references.push({
              reference: ref.trim(),
              text: undefined // Will be populated later from main translation
            });
          }
        }
      }
      
      crossRefMap.set(verseRef.trim(), references);
    }
  }
  
  return crossRefMap;
}

// Parse prophecy format: verseID $ id:type , id:type , …
export function parseProphecy(text: string): Map<string, {P: any[], F: any[], V: any[]}> {
  const prophecyMap = new Map<string, {P: any[], F: any[], V: any[]}>();
  
  const lines = text.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const cleanLine = line.trim().replace(/\r/g, '');
    const [verseRef, prophecyData] = cleanLine.split('$');
    
    if (verseRef && prophecyData) {
      const prophecyResult = {P: [], F: [], V: []};
      const items = prophecyData.split(',');
      
      for (const item of items) {
        const trimmedItem = item.trim();
        const [id, type] = trimmedItem.split(':');
        
        if (id && type && ['P', 'F', 'V'].includes(type)) {
          prophecyResult[type as 'P' | 'F' | 'V'].push({
            id: parseInt(id),
            reference: verseRef.trim(),
            type: type
          });
        }
      }
      
      prophecyMap.set(verseRef.trim(), prophecyResult);
    }
  }
  
  return prophecyMap;
}

export async function saveNotes(note: any, preserveAnchor?: (ref: string, index: number) => void) {
  const result = await supabase.from('notes').upsert(note);
  if (preserveAnchor) {
    preserveAnchor(note.verseReference, note.verseIndex);
  }
  return result;
}



// READ - with offline fallback
export async function getNotes(): Promise<any[]> {
  const local = await db.notes.toArray();
  if (!navigator.onLine) return local;

  const { data, error } = await supabase.from('notes').select('*');
  if (error) return local; // Fall back

  await db.notes.clear();
  await db.notes.bulkAdd(data.map((n: any) => ({ ...n, pending: false })));
  return data;
}

// WRITE - with offline queue
export async function saveNote(note: any, preserveAnchor?: (ref: string, index: number) => void) {
  const local = { ...note, updated_at: Date.now(), pending: true };
  await db.notes.add(local);
  await queueSync(); // Triggers BG sync or immediate push
  
  if (preserveAnchor) {
    preserveAnchor(note.verseReference, note.verseIndex);
  }
  return { data: [{ id: local.id }] };
}

export async function saveBookmark(bookmark: any, preserveAnchor?: (ref: string, index: number) => void) {
  const local = { ...bookmark, updated_at: Date.now(), pending: true };
  await db.bookmarks.add(local);
  await queueSync();
  
  if (preserveAnchor) {
    preserveAnchor(bookmark.verseReference, bookmark.verseIndex);
  }
  return { data: [{ id: local.id }] };
}

export async function saveHighlight(highlight: any, preserveAnchor?: (ref: string, index: number) => void) {
  const local = { ...highlight, updated_at: Date.now(), pending: true };
  await db.highlights.add(local);
  await queueSync();
  
  if (preserveAnchor) {
    preserveAnchor(highlight.verseReference, highlight.verseIndex);
  }
  return { data: [{ id: local.id }] };
}