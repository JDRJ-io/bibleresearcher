import { parseVerseReference } from './bibleSearchEngine';

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
  
  // Pattern to match potential verse references
  // Includes various formats: "Gen.1:1", "Genesis 1:1", "1 Sam 2:3", "Jn 3:16", etc.
  const referencePattern = /\b(?:\d?\s*[A-Za-z]{2,}\s*\.?\s*\d+[:\.]\d+(?:[-–]\d+)?)\b/g;
  
  let match;
  while ((match = referencePattern.exec(text)) !== null) {
    const originalText = match[0];
    const parsed = parseVerseReference(originalText);
    
    // Only include if parsing was successful with reasonable confidence
    if (parsed && parsed.confidence > 0.7) {
      // Create standardized reference format (Book.Chapter:Verse)
      const standardFormat = `${parsed.book}.${parsed.chapter}:${parsed.verse}${
        parsed.endVerse ? `-${parsed.endVerse}` : ''
      }`;
      
      matches.push({
        originalText,
        parsedReference: standardFormat,
        startIndex: match.index,
        endIndex: match.index + originalText.length,
        confidence: parsed.confidence
      });
    }
  }
  
  // Sort by position to ensure proper text replacement
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