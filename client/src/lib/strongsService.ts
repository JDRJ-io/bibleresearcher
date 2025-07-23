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

  // Simplified method: Get verse Strong's data using Range requests
  async getVerseStrongsData(verseKey: string): Promise<StrongsVerseData> {
    try {
      // Check cache first
      if (this.verseCache.has(verseKey)) {
        console.log(`✅ Found ${verseKey} in cache`);
        return this.verseCache.get(verseKey)!;
      }

      console.log(`🔍 Loading Strong's verse data: ${verseKey}`);

      // Use the working Range request system
      const interlinearData = await fetchInterlinearVerse(verseKey);

      if (!interlinearData) {
        console.warn(`❌ No interlinear data found for ${verseKey}`);
        const emptyResult = { reference: verseKey, words: [], interlinearCells: [] };
        this.verseCache.set(verseKey, emptyResult);
        return emptyResult;
      }

      console.log(`📊 Raw interlinear data for ${verseKey}:`, interlinearData.substring(0, 200) + '...');

      // Parse the interlinear data
      const parsed = parseInterlinearVerse(interlinearData);
      console.log(`📋 Parsed ${parsed.cells.length} interlinear cells for ${verseKey}`);

      // Convert to StrongsWord format
      const words: StrongsWord[] = parsed.cells.map(cell => ({
        original: cell.original,
        strongs: cell.strongsKey,
        transliteration: cell.transliteration,
        definition: cell.gloss,
        instances: [], // Will be populated when needed
        morphology: cell.morphology
      }));

      const result: StrongsVerseData = {
        reference: verseKey,
        words,
        interlinearCells: parsed.cells
      };

      // Cache the result
      this.verseCache.set(verseKey, result);
      console.log(`✅ Cached Strong's data for ${verseKey}: ${words.length} words`);
      return result;

    } catch (error) {
      console.error(`❌ Error loading Strong's verse data for ${verseKey}:`, error);
      const errorResult = { reference: verseKey, words: [], interlinearCells: [] };
      this.verseCache.set(verseKey, errorResult);
      return errorResult;
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