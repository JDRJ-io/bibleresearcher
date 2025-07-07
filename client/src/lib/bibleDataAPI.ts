
/**
 * Data-layer facade for Bible data access.
 * UI components import only this API, never Supabase or raw fetch.
 */

export interface VerseMeta {
  reference: string;
  book: string;
  chapter: number;
  verse: number;
}

export interface ProphecyMeta {
  id: string;
  role: string;
  data: any;
}

export function getVerseMeta(verseId: string): VerseMeta | null {
  // Parse verse ID to extract metadata
  const parts = verseId.split('-');
  if (parts.length >= 4) {
    const book = parts[0];
    const chapter = parseInt(parts[1]);
    const verse = parseInt(parts[2]);
    return {
      reference: `${book.charAt(0).toUpperCase() + book.slice(1)} ${chapter}:${verse}`,
      book: book.charAt(0).toUpperCase() + book.slice(1),
      chapter,
      verse
    };
  }
  return null;
}

export function getTranslationText(verseId: string, translation: string): string {
  // This will be implemented to use the translation maps
  return `Loading ${verseId} in ${translation}...`;
}

export function getProphecyMeta(verseId: string): ProphecyMeta[] {
  // This will be implemented to use prophecy data
  return [];
}
