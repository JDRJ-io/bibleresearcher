
// strongsService.ts - New Strong's data service using Range requests
import { fetchLemma, fetchInterlinearVerse, parseStrongsOccurrence, parseInterlinearVerse, type StrongsOccurrence, type InterlinearCell } from './strongsIndex_fetch';
import { fetchInterlinearVerse as fetchVerse } from './strongsVerses_fetch';

export interface StrongsWord {
  original: string;
  strongs: string;
  transliteration: string;
  definition: string;
  instances: string[];
  morphology?: string;
}

export interface StrongsVerseData {
  reference: string;
  words: StrongsWord[];
  interlinearCells: InterlinearCell[];
}

class StrongsService {
  private cache = new Map<string, StrongsWord>();
  private verseCache = new Map<string, StrongsVerseData>();

  // New method: Get Strong's word data using Range requests
  async getStrongsWord(strongsKey: string): Promise<StrongsWord | null> {
    try {
      // Check cache first
      if (this.cache.has(strongsKey)) {
        return this.cache.get(strongsKey)!;
      }

      console.log(`🔍 Loading Strong's word: ${strongsKey}`);
      
      // Fetch all occurrences for this Strong's number
      const occurrenceLines = await fetchLemma(strongsKey);
      
      if (occurrenceLines.length === 0) {
        console.warn(`❌ No occurrences found for ${strongsKey}`);
        return null;
      }

      // Parse occurrences
      const occurrences: StrongsOccurrence[] = [];
      for (const line of occurrenceLines) {
        const parsed = parseStrongsOccurrence(line);
        if (parsed) {
          occurrences.push(parsed);
        }
      }

      if (occurrences.length === 0) {
        console.warn(`❌ No valid occurrences parsed for ${strongsKey}`);
        return null;
      }

      // Build StrongsWord from first occurrence (they all have same definition)
      const first = occurrences[0];
      const strongsWord: StrongsWord = {
        original: first.original,
        strongs: strongsKey,
        transliteration: first.transliteration,
        definition: first.gloss,
        instances: occurrences.map(occ => occ.reference),
        morphology: first.context // Store additional context as morphology
      };

      // Cache the result
      this.cache.set(strongsKey, strongsWord);
      
      console.log(`✅ Loaded Strong's word ${strongsKey}: ${strongsWord.definition}`);
      return strongsWord;

    } catch (error) {
      console.error(`❌ Error loading Strong's word ${strongsKey}:`, error);
      return null;
    }
  }

  // New method: Get verse interlinear data using Range requests
  async getVerseStrongsData(reference: string): Promise<StrongsVerseData | null> {
    try {
      // Check cache first
      if (this.verseCache.has(reference)) {
        return this.verseCache.get(reference)!;
      }

      console.log(`🔍 Loading Strong's data for verse: ${reference}`);
      
      // Fetch interlinear verse data
      const rawVerseData = await fetchInterlinearVerse(reference);
      
      if (!rawVerseData) {
        console.warn(`❌ No interlinear data found for ${reference}`);
        return null;
      }

      // Parse the interlinear data
      const { reference: parsedRef, cells } = parseInterlinearVerse(rawVerseData);
      
      // Convert cells to StrongsWord format for compatibility
      const words: StrongsWord[] = [];
      for (const cell of cells) {
        const word: StrongsWord = {
          original: cell.original,
          strongs: cell.strongsKey,
          transliteration: cell.transliteration,
          definition: cell.gloss,
          instances: [parsedRef],
          morphology: cell.morphology
        };
        words.push(word);
      }

      const verseData: StrongsVerseData = {
        reference: parsedRef || reference,
        words,
        interlinearCells: cells
      };

      // Cache the result
      this.verseCache.set(reference, verseData);
      
      console.log(`✅ Loaded Strong's data for ${reference}: ${words.length} words`);
      return verseData;

    } catch (error) {
      console.error(`❌ Error loading Strong's data for verse ${reference}:`, error);
      return null;
    }
  }

  // Get all occurrences of a Strong's number across the Bible
  async getStrongsOccurrences(strongsKey: string): Promise<StrongsOccurrence[]> {
    try {
      const occurrenceLines = await fetchLemma(strongsKey);
      const occurrences: StrongsOccurrence[] = [];
      
      for (const line of occurrenceLines) {
        const parsed = parseStrongsOccurrence(line);
        if (parsed) {
          occurrences.push(parsed);
        }
      }
      
      return occurrences;
    } catch (error) {
      console.error(`❌ Error getting occurrences for ${strongsKey}:`, error);
      return [];
    }
  }

  // Clear caches if needed
  clearCache() {
    this.cache.clear();
    this.verseCache.clear();
  }
}

// Export singleton instance
export const strongsService = new StrongsService();

// Export types for use in components
export type { StrongsOccurrence, InterlinearCell };
