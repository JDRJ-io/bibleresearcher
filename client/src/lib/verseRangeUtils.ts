/**
 * Utility functions for parsing and expanding verse range notation
 * Examples: "Gen.7:17-23" expands to ["Gen.7:17", "Gen.7:18", ..., "Gen.7:23"]
 *           "1Cor.15:21-22" expands to ["1Cor.15:21", "1Cor.15:22"]
 */

export interface VerseRange {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
}

/**
 * Check if a reference is a verse range (contains a dash)
 */
export function isVerseRange(reference: string): boolean {
  return reference.includes('-');
}

/**
 * Parse a verse range reference into its components
 * Example: "Gen.7:17-23" => { book: "Gen", chapter: 7, startVerse: 17, endVerse: 23 }
 */
export function parseVerseRange(reference: string): VerseRange | null {
  if (!isVerseRange(reference)) {
    return null;
  }

  // Match pattern: "Book.Chapter:StartVerse-EndVerse"
  const match = reference.match(/^(.+?)\.(\d+):(\d+)-(\d+)$/);
  
  if (!match) {
    console.warn(`Failed to parse verse range: ${reference}`);
    return null;
  }

  const [, book, chapterStr, startVerseStr, endVerseStr] = match;
  
  return {
    book: book.trim(),
    chapter: parseInt(chapterStr),
    startVerse: parseInt(startVerseStr),
    endVerse: parseInt(endVerseStr)
  };
}

/**
 * Expand a verse range into individual verse references
 * Example: "Gen.7:17-23" => ["Gen.7:17", "Gen.7:18", "Gen.7:19", "Gen.7:20", "Gen.7:21", "Gen.7:22", "Gen.7:23"]
 */
export function expandVerseRange(reference: string): string[] {
  if (!isVerseRange(reference)) {
    return [reference];
  }

  const range = parseVerseRange(reference);
  if (!range) {
    return [reference];
  }

  const verses: string[] = [];
  for (let verse = range.startVerse; verse <= range.endVerse; verse++) {
    verses.push(`${range.book}.${range.chapter}:${verse}`);
  }

  return verses;
}

/**
 * Get the first verse reference from a range or single verse
 * Example: "Gen.7:17-23" => "Gen.7:17"
 *          "Gen.7:17" => "Gen.7:17"
 */
export function getFirstVerseFromRange(reference: string): string {
  if (!isVerseRange(reference)) {
    return reference;
  }

  const range = parseVerseRange(reference);
  if (!range) {
    return reference;
  }

  return `${range.book}.${range.chapter}:${range.startVerse}`;
}

/**
 * Get the last verse reference from a range or single verse
 * Example: "Gen.7:17-23" => "Gen.7:23"
 *          "Gen.7:17" => "Gen.7:17"
 */
export function getLastVerseFromRange(reference: string): string {
  if (!isVerseRange(reference)) {
    return reference;
  }

  const range = parseVerseRange(reference);
  if (!range) {
    return reference;
  }

  return `${range.book}.${range.chapter}:${range.endVerse}`;
}

/**
 * Get the count of verses in a range
 * Example: "Gen.7:17-23" => 7
 *          "Gen.7:17" => 1
 */
export function getVerseCount(reference: string): number {
  if (!isVerseRange(reference)) {
    return 1;
  }

  const range = parseVerseRange(reference);
  if (!range) {
    return 1;
  }

  return range.endVerse - range.startVerse + 1;
}
