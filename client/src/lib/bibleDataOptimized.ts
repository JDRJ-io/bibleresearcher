import {
  loadTranslationSecure,
  loadCrossReferences,
  loadContextGroups,
} from "./supabaseLoader";
import { getVerseKeys, parseVerseKey } from "./verseKeysLoader";
import type { BibleVerse } from "@/types/bible";

// Pre-loaded verse structure for instant navigation
let globalVerseStructure: BibleVerse[] | null = null;

// Initialize the complete Bible structure with all verse references
export async function initializeBibleStructure(): Promise<BibleVerse[]> {
  if (globalVerseStructure) return globalVerseStructure;

  try {
    console.log(
      "Initializing complete Bible structure with ALL 31,102 verses...",
    );

    // Use embedded verse keys for instant loading
    const verseKeys = getVerseKeys();
    console.log(
      `Loading COMPLETE Bible with ${verseKeys.length} verses for instant navigation...`,
    );

    // Create verse structure with proper metadata
    const verses: BibleVerse[] = verseKeys
      .map((key, index) => {
        // Parse key format: "Gen.1:1"
        const match = key.match(/^(\w+)\.(\d+):(\d+)$/);
        if (!match) return null;

        const [, book, chapter, verse] = match;
        const reference = `${book} ${chapter}:${verse}`;

        return {
          id: `${book.toLowerCase()}-${chapter}-${verse}-${index}`,
          index,
          book,
          chapter: parseInt(chapter),
          verse: parseInt(verse),
          reference,
          text: {}, // Will be populated dynamically
          crossReferences: [],
          strongsWords: [],
          labels: [],
          contextGroup: "standard",
          height: 120, // Fixed height for stable scrolling
        };
      })
      .filter(Boolean) as BibleVerse[];

    globalVerseStructure = verses;
    console.log(`Bible structure initialized with ${verses.length} verses`);

    return verses;
  } catch (error) {
    console.error("Failed to initialize Bible structure:", error);
    throw error;
  }
}

// Load translation data into existing verse structure
export async function populateTranslation(
  verses: BibleVerse[],
  translationId: string,
  startIndex: number = 0,
  endIndex?: number,
): Promise<void> {
  try {
    console.log(
      `Populating ${translationId} for verses ${startIndex}-${endIndex || verses.length}`,
    );

    const translationData = await loadTranslationSecure(translationId);

    const end = endIndex || verses.length;
    for (let i = startIndex; i < end && i < verses.length; i++) {
      const verse = verses[i];
      if (!verse) continue;

      // Try multiple key formats to find the text
      const keys = [
        `${verse.book}.${verse.chapter}:${verse.verse}`,
        verse.reference,
        `${verse.book} ${verse.chapter}:${verse.verse}`,
      ];

      for (const key of keys) {
        const text = translationData.get(key);
        if (text) {
          verse.text[translationId] = text;
          break;
        }
      }

      // Mark if we couldn't find text
      if (!verse.text[translationId]) {
        verse.text[translationId] =
          `[${verse.reference} - ${translationId} not available]`;
      }
    }

    console.log(`${translationId} populated for range`);
  } catch (error) {
    console.error(`Failed to populate ${translationId}:`, error);
  }
}

// Populate cross-references efficiently
export async function populateCrossReferences(
  verses: BibleVerse[],
  setName: string = "cf1",
): Promise<void> {
  try {
    console.log(`Loading cross-references set: ${setName}`);

    const crossRefMap = await loadCrossReferences(setName);

    verses.forEach((verse) => {
      const key = `${verse.book}.${verse.chapter}:${verse.verse}`;
      const refs = crossRefMap.get(key);

      if (refs && refs.length > 0) {
        // Limit to first 6 references for UI performance
        verse.crossReferences = refs.slice(0, 6).map((ref) => ({
          reference: ref,
          text: "", // Text will be populated when needed
        }));
      }
    });

    console.log("Cross-references populated");
  } catch (error) {
    console.error("Failed to populate cross-references:", error);
  }
}

// Populate context groups for visual borders
export async function populateContextGroups(
  verses: BibleVerse[],
): Promise<void> {
  try {
    console.log("Loading context groups...");

    const contextMap = await loadContextGroups();

    verses.forEach((verse) => {
      const key = `${verse.book}.${verse.chapter}:${verse.verse}`;
      const group = contextMap.get(key);

      if (group) {
        verse.contextGroup = group;
      }
    });

    console.log("Context groups populated");
  } catch (error) {
    console.error("Failed to populate context groups:", error);
  }
}

// Get verse by index with efficient bounds checking
export function getVerseByIndex(index: number): BibleVerse | null {
  if (!globalVerseStructure) return null;
  if (index < 0 || index >= globalVerseStructure.length) return null;
  return globalVerseStructure[index];
}

// Find verse index by reference
export function findVerseIndex(reference: string): number {
  if (!globalVerseStructure) return -1;

  // Normalize reference
  const normalizedRef = reference.replace(/\s+/g, " ").trim();

  return globalVerseStructure.findIndex(
    (verse) =>
      verse.reference === normalizedRef ||
      verse.reference.replace(".", " ") === normalizedRef ||
      `${verse.book}.${verse.chapter}:${verse.verse}` === reference,
  );
}

// Get total verse count
export function getTotalVerseCount(): number {
  return globalVerseStructure?.length || 31102;
}
