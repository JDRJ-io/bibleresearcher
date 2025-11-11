import { parseVerseReference, canonicalToReference } from './bibleSearchEngine';

export interface VerseReferenceMatch {
  originalText: string;
  parsedReference: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

/**
 * Finds all verse references in a text string and returns their positions
 * Uses the existing parseVerseReference function for accurate parsing
 */
export function findVerseReferencesInText(text: string): VerseReferenceMatch[] {
  const matches: VerseReferenceMatch[] = [];
  
  // More permissive pattern for verse references
  // Matches: John.1:1, Jn.1:1, Ps.1:1, 1Sam.3:16, Gen.1:1-3, etc.
  const referencePattern = /\b([1-3]?\s*[A-Za-z]+)\.(\d+):(\d+)(?:-(\d+))?\b/g;
  
  let match;
  while ((match = referencePattern.exec(text)) !== null) {
    const originalText = match[0];
    const bookPart = match[1];
    const chapter = match[2];
    const verse = match[3];
    const endVerse = match[4];
    
    // Try to parse with the existing parser
    const parsed = parseVerseReference(originalText);
    
    // If parsing succeeds with good confidence, use it
    if (parsed && parsed.confidence > 0.5 && parsed.book) {
      const bookRef = canonicalToReference(parsed.book);
      const standardFormat = `${bookRef || parsed.book}.${parsed.chapter}:${parsed.verse}${
        parsed.endVerse ? `-${parsed.endVerse}` : ''
      }`;
      
      matches.push({
        originalText,
        parsedReference: standardFormat,
        startIndex: match.index,
        endIndex: match.index + originalText.length,
        confidence: parsed.confidence
      });
    } else {
      // Fallback: create a basic reference from the regex match
      const standardFormat = endVerse 
        ? `${bookPart}.${chapter}:${verse}-${endVerse}`
        : `${bookPart}.${chapter}:${verse}`;
      
      matches.push({
        originalText,
        parsedReference: standardFormat,
        startIndex: match.index,
        endIndex: match.index + originalText.length,
        confidence: 0.8
      });
    }
  }
  
  return matches.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Splits text into segments, identifying which parts are verse references
 */
export function segmentTextWithReferences(text: string): Array<{
  text: string;
  isReference: boolean;
  parsedReference?: string;
  confidence?: number;
}> {
  const references = findVerseReferencesInText(text);
  const segments = [];
  
  let currentIndex = 0;
  
  for (const ref of references) {
    // Add text before the reference (if any)
    if (ref.startIndex > currentIndex) {
      segments.push({
        text: text.slice(currentIndex, ref.startIndex),
        isReference: false
      });
    }
    
    // Add the reference segment
    segments.push({
      text: ref.originalText,
      isReference: true,
      parsedReference: ref.parsedReference,
      confidence: ref.confidence
    });
    
    currentIndex = ref.endIndex;
  }
  
  // Add remaining text after the last reference (if any)
  if (currentIndex < text.length) {
    segments.push({
      text: text.slice(currentIndex),
      isReference: false
    });
  }
  
  return segments;
}