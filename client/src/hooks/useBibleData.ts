import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, masterCache } from "@/lib/supabaseClient";
import { useTranslationMaps } from './useTranslationMaps';
import type { BibleVerse, Translation, AppPreferences } from "@/types/bible";
import {
  loadTranslation,
  loadMultipleTranslations,
  getVerseText,
} from "@/lib/translationLoader";
import { loadTranslationAsText } from "@/data/BibleDataAPI";
import {
  loadTranslationSecure,
} from "@/lib/supabaseClient";
import { log } from '@/utils/logger';

// Global KJV text map for dynamic verse text loading - uses master cache
let globalKjvTextMap: Map<string, string> | null = null;

// Load KJV text map once and store globally - optimized for speed
const loadKJVTextMap = async (): Promise<void> => {
  if (globalKjvTextMap && globalKjvTextMap.size > 0) return; // Already loaded

  try {
    console.log("⚡ INSTANT: Loading KJV text map...");
    const { loadTranslation } = await import('@/data/BibleDataAPI');

    // Start loading but don't block - let it load in background
    const kjvPromise = loadTranslation('KJV');
    globalKjvTextMap = await kjvPromise;

    console.log(`⚡ KJV READY: ${globalKjvTextMap.size} entries`);
  } catch (error) {
    console.error("Failed to load KJV:", error);
    globalKjvTextMap = new Map();
  }
};

// Load complete Bible index from Supabase - respects chronological ordering
const loadFullBibleIndex = async (
  progressCallback?: (progress: any) => void,
  isChronological: boolean = false,
): Promise<BibleVerse[]> => {
  const orderType = isChronological ? "chronological" : "canonical";
  console.log(
    `Loading complete Bible index (${orderType} order) from Supabase...`,
  );

  if (progressCallback) {
    progressCallback({ stage: "structure", percentage: 10 });
  }

  try {
    // Load verse reference list in the correct order from BibleDataAPI
    console.log(`Loading ${orderType} verse references from BibleDataAPI...`);
    const { loadVerseKeys } = await import('@/data/BibleDataAPI');
    const verseKeys = await loadVerseKeys(isChronological);
    console.log(
      `Loaded ${verseKeys.length} ${orderType} verse references from Supabase`,
    );

    if (progressCallback) {
      progressCallback({ stage: "index", percentage: 50 });
    }

    // Load KJV text map for dynamic verse loading
    console.log("📖 Starting KJV text map loading...");
    await loadKJVTextMap();
    console.log("📖 KJV text map loading completed, size:", globalKjvTextMap?.size || 0);

    // Create full Bible index with placeholder text only
    const fullBibleIndex = createFullBibleIndexWithoutText(verseKeys);
    console.log(
      `Created complete Bible index with ${fullBibleIndex.length} verse references (no text loaded yet)`,
    );
    console.log(
      `All verse references loaded for proper height mapping and navigation`,
    );

    if (progressCallback) {
      progressCallback({ stage: "finalizing", percentage: 95 });
    }

    console.log(
      `Complete Bible index ready - text will load dynamically around scroll position`,
    );
    return fullBibleIndex;
  } catch (error) {
    console.error("Error loading from Supabase canonical references:", error);
    throw new Error("Failed to load Bible data from Supabase. Please check your internet connection and Supabase credentials.");
  }
};

// Create full Bible index with EMPTY TEXT for height mapping only
const createFullBibleIndexWithoutText = (verseKeys: string[]): BibleVerse[] => {
  console.log(
    `Creating full Bible index (references only) from ${verseKeys.length} canonical references...`,
  );

  return verseKeys.map((key, index) => {
    // Handle different possible formats of canonical keys
    let book, chapter, verse;

    if (key.includes(".")) {
      // STRAIGHT-LINE: Assume canonical keys are already in dot format
      const parts = key.split(".");
      book = parts[0];
      chapter = parseInt(parts[1]) || 1;
      verse = parseInt(parts[2]) || 1;
    } else if (key.includes(" ")) {
      // Format: "Gen 1:1"
      const [bookPart, versePart] = key.split(" ");
      book = bookPart;
      const verseNumbers = versePart.split(":");
      chapter = parseInt(verseNumbers[0]) || 1;
      verse = parseInt(verseNumbers[1]) || 1;
    } else {
      // Fallback format
      book = key.substring(0, 3);
      chapter = 1;
      verse = index + 1;
    }

    // Create readable reference format
    const reference = `${book} ${chapter}:${verse}`;

    return {
      id: `${book.toLowerCase()}-${chapter}-${verse}-${index}`, // Include index for uniqueness
      index,
      book: book,
      chapter: chapter,
      verse: verse,
      reference: reference,
      text: {}, // Start with empty text object - translations loaded dynamically
      crossReferences: [],
      strongsWords: [],
      labels: [],
      contextGroup: "standard",
    };
  });
};

const loadAdditionalData = async (verses: BibleVerse[]): Promise<void> => {
  // Load cross references from Supabase
  try {
    const { data: crossRefData } = await supabase.storage
      .from("anointed")
      .download("references/cf1.txt");

    if (crossRefData) {
      const crossRefText = await crossRefData.text();
      // Cross references will be loaded separately
      console.log("Cross references found in Supabase");
    }
  } catch (err) {
    console.warn("Could not load cross references");
  }

  // Load prophecy data from Supabase
  try {
    const { data: prophecyData } = await supabase.storage
      .from("anointed")
      .download("references/prophecy-file.txt");

    if (prophecyData) {
      const prophecyText = await prophecyData.text();
      // Prophecy data will be loaded separately
      console.log("Prophecy data found in Supabase");
    }
  } catch (err) {
    console.warn("Could not load prophecy data:", err);
  }
};

const parseActualSupabaseKJV = (
  content: string,
  verseKeys: string[],
): BibleVerse[] => {
  console.log(`Parsing actual KJV content with ${verseKeys.length} verse keys`);

  const verses: BibleVerse[] = [];
  const lines = content.split("\n").filter((line) => line.trim());

  console.log(`Processing ${lines.length} lines from KJV file`);
  console.log("First 5 lines for parsing test:", lines.slice(0, 5));

  // Test the exact parsing on first line
  if (lines.length > 0) {
    const testLine = lines[0].trim().replace(/\r/g, "");
    console.log(`Testing first line: "${testLine}"`);
    const testMatch = testLine.match(/^([^#]+)\s*#(.+)$/);
    console.log("Test match result:", testMatch ? "SUCCESS" : "FAILED");
    if (testMatch) {
      console.log("  Reference:", `"${testMatch[1].trim()}"`);
      console.log("  Text:", `"${testMatch[2].trim()}"`);
    }
  }

  // Create a map for quick text lookup
  const textMap = new Map<string, string>();

  lines.forEach((line, index) => {
    // Clean the line first
    const cleanLine = line.trim().replace(/\r/g, "");

    // Pattern: "Gen.1:1 #In the beginning God created the heaven and the earth."
    const match = cleanLine.match(/^([^#]+)\s*#(.+)$/);
    if (match) {
      const [, reference, text] = match;
      const cleanRef = reference.trim();
      const cleanText = text.trim();
      textMap.set(cleanRef, cleanText);

      if (index < 10) {
        console.log(
          `✓ Parsed line ${index + 1}: "${cleanRef}" -> "${cleanText.substring(0, 60)}..."`,
        );
      }
    } else if (index < 10) {
      console.log(`✗ Failed to parse line ${index + 1}: "${cleanLine}"`);
    }
  });

  console.log(`Created text map with ${textMap.size} entries from KJV file`);

  if (textMap.size === 0) {
    console.error("❌ No entries parsed from KJV file! Check the format.");
    // Show some sample lines for debugging
    console.log("Sample lines for debugging:", lines.slice(0, 3));
    return verses; // Return empty array, will trigger fallback
  }

  // Show sample entries from the map
  console.log(
    "Sample text map entries:",
    Array.from(textMap.entries()).slice(0, 3),
  );

  // Now create verses using the verse keys and matching text
  let versesWithText = 0;
  let missingCount = 0;

  verseKeys.forEach((key, index) => {
    const match = key.match(/^(\w+)\.(\d+):(\d+)$/);
    if (match) {
      const [, book, chapter, verse] = match;
      const reference = `${book} ${chapter}:${verse}`;
      const verseText = textMap.get(key); // Use exact key match

      if (verseText) {
        verses.push({
          id: `${book.toLowerCase()}-${chapter}-${verse}`,
          index,
          book: book,
          chapter: parseInt(chapter),
          verse: parseInt(verse),
          reference,
          text: { KJV: verseText },
          crossReferences: [],
          strongsWords: [],
          labels: [],
          contextGroup: undefined,
        });
        versesWithText++;

        if (index < 5) {
          console.log(
            `✓ Created verse ${index + 1}: ${reference} -> ${verseText.substring(0, 60)}...`,
          );
        }
      } else {
        missingCount++;
        if (index < 5) {
          console.log(
            `✗ Missing text for verse ${index + 1}: ${key} (looking for "${key}")`,
          );
        }
      }
    }
  });

  console.log(
    `📊 Results: ${versesWithText} verses with text, ${missingCount} missing`,
  );

  console.log(
    `SUCCESS: Generated ${verses.length} verses with actual KJV text from your Supabase files`,
  );
  return verses;
};

// Removed generateFallbackVerses - only use Supabase data

const parseTranslationFileWithKeys = (
  text: string,
  translation: string,
  verseKeys: string[],
): BibleVerse[] => {
  const verses: BibleVerse[] = [];
  const lines = text.split("\n").filter((line) => line.trim());

  // Create a map for quick lookup from available text
  const textMap = new Map<string, string>();
  lines.forEach((line) => {
    // Parse format: "Gen.1:1 #In the beginning God created..."
    const match = line.match(/^([^#]+)#(.+)$/);
    if (match) {
      const [, reference, verseText] = match;
      textMap.set(reference.trim(), verseText.trim());
    }
  });

  // Create all verses from verse keys, with available text or placeholder
  verseKeys.forEach((key) => {
    // Parse key format: "Gen.1:1"
    const match = key.match(/^(\w+)\.(\d+):(\d+)$/);
    if (match) {
      const [, book, chapter, verse] = match;
      const reference = key; // OPTIMIZATION: Use original key format "Gen.1:1"
      const verseText =
        textMap.get(key) || `[${reference} - Text not available in demo]`;

      verses.push({
        id: `${book.toLowerCase()}-${chapter}-${verse}`,
        index: verses.length,
        book: book,
        chapter: parseInt(chapter),
        verse: parseInt(verse),
        reference,
        text: { [translation]: verseText },
        crossReferences: [],
        strongsWords: [],
        labels: [],
        contextGroup: undefined,
      });
    }
  });

  return verses;
};

const mergeTranslationWithKeys = (
  verses: BibleVerse[],
  text: string,
  translation: string,
) => {
  const lines = text.split("\n").filter((line) => line.trim());

  // Create a map for quick lookup
  const textMap = new Map<string, string>();
  lines.forEach((line) => {
    const match = line.match(/^([^#]+)#(.+)$/);
    if (match) {
      const [, reference, verseText] = match;
      textMap.set(reference.trim(), verseText.trim());
    }
  });

  // Merge text into existing verses
  verses.forEach((verse) => {
    const key = `${verse.book}.${verse.chapter}:${verse.verse}`;
    const verseText = textMap.get(key);
    if (verseText) {
      verse.text[translation] = verseText;
    }
  });
};

// Create complete Bible with actual text and concrete heights for stable scrolling
const createFullBibleWithHeights = async (
  verseKeys: string[],
): Promise<BibleVerse[]> => {
  console.log(
    "Creating complete Bible with concrete heights for stable scrolling...",
  );

  const verses: BibleVerse[] = [];

  // FIXED: Use consistent 120px height for all verses to match ROW_HEIGHT constant
  // This eliminates scroll calculation mismatches that cause verse jumping
  const calculateTextHeight = (text: string): number => {
    return 120; // Fixed height matches ROW_HEIGHT constant for accurate scrolling
  };

  // Load complete KJV text from Supabase storage
  let kjvTextData = "";

  try {
    console.log("Fetching complete KJV Bible from Supabase storage...");
    kjvTextData = await loadTranslationAsText('KJV');
    console.log(
      `✓ Successfully loaded KJV text from Supabase (${kjvTextData.length} characters)`,
    );
  } catch (error) {
    console.error("Failed to load KJV from Supabase:", error);
    console.log("Creating Bible with placeholder text and fixed heights");

    return verseKeys.map((key, index) => {
      const match = key.match(/^(\w+)\.(\d+):(\d+)$/);
      let book = "Gen",
        chapter = 1,
        verse = 1;

      if (match) {
        book = match[1];
        chapter = parseInt(match[2]);
        verse = parseInt(match[3]);
      }

      const reference = `${book} ${chapter}:${verse}`;
      return {
        id: `${book.toLowerCase()}-${chapter}-${verse}-${index}`,
        index,
        book: book,
        chapter: chapter,
        verse: verse,
        reference: reference,
        text: {}, // Start with empty text - load translations dynamically
        crossReferences: [],
        strongsWords: [],
        labels: ["placeholder"],
        contextGroup: "loading",
        height: 120, // Fixed height for stable scrolling
      };
    });
  }

  console.log('Parsing KJV text with format: "Gen.1:1 #In the beginning..."');
  const lines = kjvTextData.split("\n").filter((line) => line.trim());
  console.log(`Found ${lines.length} lines in KJV text from Supabase`);

  // Create a map for quick text lookup with comprehensive key formats
  const textMap = new Map<string, string>();

  lines.forEach((line, index) => {
    const cleanLine = line.trim().replace(/\r/g, "");

    // Pattern: "Gen.1:1 #In the beginning God created the heaven and the earth."
    const match = cleanLine.match(/^([^#]+)\s*#(.+)$/);
    if (match) {
      const [, reference, text] = match;
      const cleanRef = reference.trim();
      const cleanText = text.trim();

      // Store multiple key formats for maximum compatibility
      textMap.set(cleanRef, cleanText); // OPTIMIZATION: Keep dot format "Gen.1:1"

      // Parse reference components for additional format variations
      const refMatch = cleanRef.match(/^(\w+)\.(\d+):(\d+)$/);
      if (refMatch) {
        const [, book, chapter, verse] = refMatch;
        textMap.set(`${book} ${chapter}:${verse}`, cleanText); // "Gen 1:1"
        textMap.set(`${book}.${chapter}.${verse}`, cleanText); // "Gen.1.1"
        textMap.set(`${book}${chapter}:${verse}`, cleanText); // "Gen1:1"
      }

      if (index < 5) {
        console.log(
          `✓ Parsed: "${cleanRef}" -> "${cleanText.substring(0, 50)}..."`,
        );
      }
    }
  });

  console.log(
    `✓ Created comprehensive text map with ${textMap.size} entries from Supabase KJV`,
  );

  // Store the text map globally for dynamic loading
  globalKjvTextMap = textMap;

  // Create verses with actual text and calculated heights
  let versesWithText = 0;
  let totalHeight = 0;

  verseKeys.forEach((key, index) => {
    const match = key.match(/^(\w+)\.(\d+):(\d+)$/);
    if (match) {
      const [, book, chapter, verse] = match;
      const reference = `${book} ${chapter}:${verse}`;
      const verseText = textMap.get(key);

      if (verseText) {
        const height = calculateTextHeight(verseText);
        totalHeight += height;

        verses.push({
          id: `${book.toLowerCase()}-${chapter}-${verse}-${index}`,
          index,
          book: book,
          chapter: parseInt(chapter),
          verse: parseInt(verse),
          reference: reference,
          text: {
            KJV: verseText,
          },
          crossReferences: [],
          strongsWords: [],
          labels: ["kjv-loaded"],
          contextGroup: "standard",
          height: height, // Concrete height for stable scrolling
        });
        versesWithText++;
      } else {
        // Skip verses without text instead of creating placeholders
        console.warn(`Missing text for ${reference}, skipping verse`);
      }
    }
  });

  console.log(`Created complete Bible with ${verses.length} verses`);
  console.log(`Statistics: ${versesWithText} verses with KJV text loaded`);
  console.log(`Total calculated height: ${totalHeight}px for stable scrolling`);

  return verses;
};

const mergeCrossReferences = (verses: BibleVerse[], crossRefText: string) => {
  const lines = crossRefText.split("\n").filter((line) => line.trim());

  lines.forEach((line) => {
    // Parse cross reference format from your files
    const parts = line.split("\t");
    if (parts.length >= 2) {
      const [reference, crossRefs] = parts;
      const verse = verses.find(
        (v) => v.reference === reference, // OPTIMIZATION: Direct comparison with dot format
      );
      if (verse) {
        if (!verse.crossReferences) verse.crossReferences = [];

        // Parse multiple cross references separated by semicolons
        const refs = crossRefs
          .split(";")
          .map((ref) => ref.trim())
          .filter((ref) => ref);
        refs.forEach((ref) => {
          verse.crossReferences!.push({
            reference: ref,
            text: `Cross reference to ${ref}`,
          });
        });
      }
    }
  });
};

const mergeStrongsData = (verses: BibleVerse[], strongsText: string) => {
  const lines = strongsText.split("\n").filter((line) => line.trim());

  lines.forEach((line) => {
    // Parse Strong's format from your files
    const parts = line.split("\t");
    if (parts.length >= 4) {
      const [reference, original, strongs, definition] = parts;
      const verse = verses.find(
        (v) => v.reference === reference, // OPTIMIZATION: Direct comparison with dot format
      );
      if (verse) {
        if (!verse.strongsWords) verse.strongsWords = [];
        verse.strongsWords.push({
          original: original.trim(),
          strongs: strongs.trim(),
          transliteration: "", // Would need transliteration file
          definition: definition.trim(),
          instances: [reference],
        });
      }
    }
  });
};

// Global prophecy data caches
let prophecyIndex: Map<string, Array<{id: string, role: string}>> | null = null;
let prophecyRows: Record<string, any> | null = null;

// Load prophecy data on-demand when prophecy columns are enabled
const loadProphecyDataOnDemand = async () => {
  if (prophecyIndex && prophecyRows) {
    return { index: prophecyIndex, rows: prophecyRows };
  }

  try {
    console.log("Loading prophecy data on-demand from Supabase...");

    // Load both prophecy files
    const { loadProphecyData } = await import('@/data/BibleDataAPI');
    const { verseRoles, prophecyIndex: propIndex } = await loadProphecyData();
    const index = new Map();
    const rows = propIndex;

    prophecyIndex = index;
    prophecyRows = typeof rows === 'string' ? JSON.parse(rows) : rows;

    console.log(`Prophecy data loaded: ${index.size} verses indexed, ${Object.keys(rows).length} prophecies`);
    return { index, rows };
  } catch (error) {
    console.error("Failed to load prophecy data:", error);
    return { index: new Map(), rows: {} };
  }
};

// Get prophecy data for a specific verse
const getProphecyDataForVerse = (verseKey: string) => {
  if (!prophecyIndex || !prophecyRows) {
    return [];
  }

  // OPTIMIZATION: verseKey is now in dot format - direct lookup only
  const possibleKeys = [verseKey];

  for (const key of possibleKeys) {
    const prophecyRefs = prophecyIndex.get(key);
    if (prophecyRefs && prophecyRefs.length > 0) {
      return prophecyRefs.map(ref => ({
        ...ref,
        data: prophecyRows![ref.id] || null
      })).filter(p => p.data);
    }
  }

  return [];
};

// Removed addSampleCrossReferences - only use Supabase data

// Removed generateExtendedFallbackVerses - only use Supabase data

// Available translations will be loaded from Supabase
let availableTranslations: Translation[] = [];

export function useBibleData() {
  const [isLoading, setIsLoading] = useState(true);
  const [verses, setVerses] = useState<BibleVerse[]>([]); // Full 31,102 verses - never sliced!
  const [loadedVerseRanges, setLoadedVerseRanges] = useState<Set<number>>(
    new Set(),
  ); // Track loaded verse ranges
  const [centerVerseIndex, setCenterVerseIndex] = useState(0); // Current center position
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([]);
  const [expandedVerse, setExpandedVerse] = useState<BibleVerse | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [loadingProgress, setLoadingProgress] = useState({
    stage: "initializing",
    percentage: 0,
  });
  const [loadingVerses, setLoadingVerses] = useState<Set<number>>(new Set()); // Track verses being loaded
  const [crossRefSet, setCrossRefSet] = useState<"cf1" | "cf2">("cf1");
  const [crossReferencesData, setCrossReferencesData] = useState<{
    cf1: Map<string, string[]>;
    cf2: Map<string, string[]>;
  }>({ cf1: new Map(), cf2: new Map() });
  const [prophecyData, setProphecyData] = useState<Map<string, any>>(new Map());

  // CHRONOLOGICAL ORDER SWITCHING: Ground rule implementation
  const [verseOrder, setVerseOrder] = useState<"canonical" | "chronological">("canonical");

  // Optimized windowed virtualization for smooth scrolling and instant navigation
  // LOAD ALL VERSES - No more virtual scrolling limits!
  const VIEWPORT_BUFFER = 60; // Load ALL verses for instant navigation
  const INSTANT_JUMP_BUFFER = 120; // Full Bible always available
  const SCROLL_THRESHOLD = 30; // Load more verses when within 30 verses of buffer edge

  // Step 2: Translation state (single source of truth)
  const [selectedTranslations, setSelectedTranslations] = useState<string[]>([
    "KJV",
  ]);
  const [multiTranslationMode, setMultiTranslationMode] = useState(false);
  const [mainTranslation, setMainTranslation] = useState("KJV");
  const [activeTranslations, setActiveTranslations] = useState<string[]>(["KJV"]);

  const allTranslations = availableTranslations;
  const displayTranslations = multiTranslationMode
    ? selectedTranslations
    : [mainTranslation];

  const toggleTranslation = (translationId: string) => {
    if (multiTranslationMode) {
      setSelectedTranslations((prev) =>
        prev.includes(translationId)
          ? prev.filter((t) => t !== translationId)
          : [...prev, translationId],
      );
    } else {
      setMainTranslation(translationId);
    }

    // Step 2: Update activeTranslations as single source of truth
    setActiveTranslations((prev) => {
      if (prev.includes(translationId)) {
        return prev.filter((t) => t !== translationId);
      } else {
        return [translationId, ...prev.filter((t) => t !== translationId)]; // Main translation first
      }
    });
  };

  const toggleMultiTranslationMode = () => {
    setMultiTranslationMode(!multiTranslationMode);
  };

  // Cache for loaded verse texts to avoid repeated fetches
  const verseTextCache = new Map<string, string>();
  let kjvTextData: string | null = null;

  // Load KJV text data once and cache it
  const loadKJVData = async (): Promise<string> => {
    if (kjvTextData) return kjvTextData;

    try {
      kjvTextData = await loadTranslationAsText('KJV');
      console.log("✅ KJV text data loaded and cached");
      return kjvTextData;
    } catch (error) {
      console.warn("Failed to load KJV data:", error);
      throw error;
    }
  };

  // Extract actual verse text from KJV data
  const loadActualVerseText = async (verseRef: string): Promise<string> => {
    // Check cache first
    if (verseTextCache.has(verseRef)) {
      return verseTextCache.get(verseRef)!;
    }

    try {
      const kjvText = await loadKJVData();

      // STRAIGHT-LINE: Direct pattern matching with dot format
      const patterns = [
        `${verseRef}\\s*#([^\\n]+)`, // Direct dot format: Gen.1:1 #text
      ];

      for (const pattern of patterns) {
        const regex = new RegExp(pattern, "i");
        const match = kjvText.match(regex);
        if (match && match[1]) {
          const text = match[1].trim();
          verseTextCache.set(verseRef, text);
          return text;
        }
      }

      // If no text found, return loading placeholder
      const placeholder = `Loading ${verseRef}...`;
      verseTextCache.set(verseRef, placeholder);
      return placeholder;
    } catch (error) {
      console.warn(`Failed to load text for ${verseRef}:`, error);
      const errorText = `Error loading ${verseRef}`;
      verseTextCache.set(verseRef, errorText);
      return errorText;
    }
  };

  // Load actual verse text for a specific range of verses
  const loadVerseTextForRange = async (
    verses: BibleVerse[],
  ): Promise<BibleVerse[]> => {
    if (!globalKjvTextMap || globalKjvTextMap.size === 0) {
      console.log("KJV text map not available, keeping placeholder text");
      return verses;
    }

    return verses.map((verse) => {
      // Try multiple reference formats to find the text
      const referenceFormats = [
        verse.reference,
        `${verse.book}.${verse.chapter}:${verse.verse}`,
        `${verse.book}.${verse.chapter}.${verse.verse}`,
        `${verse.book} ${verse.chapter}:${verse.verse}`,
      ];

      let kjvText = null;
      for (const ref of referenceFormats) {
        kjvText = globalKjvTextMap?.get(ref);
        if (kjvText) break;
      }

      if (kjvText) {
        return {
          ...verse,
          text: {
            ...verse.text, // Keep existing translations
            KJV: kjvText,
          },
          labels: ["kjv-loaded"],
          contextGroup: "standard",
          height: Math.max(40, Math.min(120, kjvText.length / 10)), // Dynamic height based on text length
        };
      }

      // Keep placeholder if text not found
      return verse;
    });
  };

  // Current request tracking for seamless loading
  const currentRequestRef = useRef(0);

  // 2-B. Debounce loader calls, not only the anchor sensor
  const lastReqdat = useRef(Date.now());
  const THROTTLE_MS = 300; // 5 calls / second max

  // Load text for verses in place - mutate verses array directly
  const loadVerseRange = async (
    allVerses: BibleVerse[],
    centerIndex: number,
    isInstantJump = false,
  ) => {
    // Apply throttling from expert guidance
    if (Date.now() - lastReqdat.current < THROTTLE_MS && !isInstantJump) return; // skip
    lastReqdat.current = Date.now();
    // ANCHOR-CENTERED LOADING: Use loadChunk(anchorIndex, buffer) pattern  
    const { getVerseKeys } = await import('@/lib/verseKeysLoader');
    const allVerseKeys = getVerseKeys();
    const startIndex = Math.max(0, centerIndex - 100);
    const endIndex = Math.min(allVerseKeys.length - 1, centerIndex + 100);
    const slice = allVerseKeys.slice(startIndex, endIndex + 1);

    console.log(`📍 ANCHOR LOAD: Center=${centerIndex}, Range=${startIndex}-${endIndex}, Slice=${slice.length} verses`);

    // Generate unique request ID to prevent race conditions
    const requestId = ++currentRequestRef.current;

    console.time(`fetch-${requestId}`);
    console.log(
      `🔄 Starting fetch ${requestId}: range ${startIndex}-${endIndex} (center: ${centerIndex}, buffer: 100)`,
    );

    // TRUE CENTER-ANCHORED: Only clear and load verses outside current range
    console.log(
      `⚡ CENTER-ANCHORED: Loading text for verses ${startIndex}-${endIndex} around center anchor`,
    );

    // SMART CLEARING: Only clear text outside the new range to prevent memory bloat
    allVerses.forEach((verse, index) => {
      if (index < startIndex || index > endIndex) {
        // Clear text outside new center range
        if (verse.text && Object.keys(verse.text).length > 0) {
          verse.text = {};
          verse.labels = (verse.labels || []).filter(label => label !== 'kjv-loaded');
        }
      }
    });

    // EFFICIENT LOADING: Only load text for verses that don't already have it
    for (let i = startIndex; i <= endIndex; i++) {
      if (i < allVerses.length && (!allVerses[i].text || !allVerses[i].text.KJV)) {
        const verseKey = `${allVerses[i].book}.${allVerses[i].chapter}:${allVerses[i].verse}`;
        // Try to get actual KJV text from global map
        let kjvText = null;
        if (globalKjvTextMap && globalKjvTextMap.size > 0) {
          kjvText = globalKjvTextMap.get(verseKey) || 
                   globalKjvTextMap.get(allVerses[i].reference);
        }

        if (!kjvText) {
          kjvText = `Loading ${allVerses[i].reference}...`;
        }

        // Only populate text for center-anchored range
        allVerses[i].text = { KJV: kjvText };
        allVerses[i].labels = [...(allVerses[i].labels || []), 'kjv-loaded'];
      }
    }

    // Check if this request is still current (not superseded by newer request)
    if (requestId !== currentRequestRef.current) {
      console.log(
        `🚫 Request ${requestId} cancelled, newer request ${currentRequestRef.current} in progress`,
      );
      return allVerses;
    }

    // Update center but keep full verses array
    setCenterVerseIndex(centerIndex);

    console.timeEnd(`fetch-${requestId}`);
    console.log(
      `✓ Loaded text for range ${startIndex}-${endIndex} in full array`,
    );

    // Force re-render by updating verses reference
    setVerses([...allVerses]);
    return allVerses;
  };

  // Load available translations from Supabase
  const { data: translations = [] } = useQuery({
    queryKey: ["/api/bible/translations"],
    queryFn: async () => {
      try {
        console.log("Loading available translations from Supabase...");
        const { data, error } = await supabase.storage
          .from("anointed")
          .list("translations", { limit: 100 });

        if (error) {
          console.error("Failed to load translations:", error);
          throw new Error("Failed to load translations from Supabase");
        }

        const translationList = data
          .filter((file) => file.name.endsWith(".txt"))
          .map((file) => {
            const id = file.name.replace(".txt", "");
            return {
              id,
              name: id.toUpperCase(), // Use ID as name for now
              abbreviation: id,
              selected: id === "KJV", // Default to KJV selected
            };
          });

        // Update available translations
        availableTranslations = translationList;
        console.log(`Loaded ${translationList.length} translations from Supabase`);
        return translationList;
      } catch (error) {
        console.error("Failed to load translations:", error);
        throw error;
      }
    },
  });

  // Anchor-based viewport tracking for accurate verse loading
  useEffect(() => {
    if (!verses.length) return;

    // REMOVED: All edge-based viewport tracking and scroll handling
    // Replaced with VirtualBibleTable anchor-centered system
  }, [verses.length, verses.length, centerVerseIndex]);



  // Load Bible data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // VERSE KEYS FIRST: Load the master row index foundation
        setLoadingProgress({ stage: "verse-keys", percentage: 10 });
        console.log("🔑 Starting verse keys foundation architecture...");

        // Import store to check chronological state
        const { useBibleStore } = await import('@/App');
        const store = useBibleStore.getState();
        const isChronological = store.isChronological;
        console.log(`📅 INITIAL LOAD: Using ${isChronological ? 'chronological' : 'canonical'} order from store state`);

        const { loadVerseKeys } = await import('@/data/BibleDataAPI');
        const { createVerseObjectsFromKeys } = await import('@/lib/verseKeysLoader');

        const verseKeys = await loadVerseKeys(isChronological);
        const orderType = isChronological ? "chronological" : "canonical";
        console.log(`🔑 Loaded ${verseKeys.length} verse keys in ${orderType} order as master index`);

        setLoadingProgress({ stage: "structure", percentage: 50 });

        // Create verse objects from the master key index
        const verseObjects = createVerseObjectsFromKeys(verseKeys);
        console.log(`🏗️ Created ${verseObjects.length} verse structure from keys`);

        setLoadingProgress({ stage: "complete", percentage: 100 });

        // Set the verses using the verse keys foundation
        setVerses(verseObjects);
        console.log("📦 Bible structure loaded from verse keys foundation - text loading will be on-demand");

        setIsLoading(false);
      } catch (err) {
        console.error("Error in useBibleData:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load Bible data",
        );
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Watch chronological state changes and reload verses accordingly
  useEffect(() => {
    let isReloading = false;
    
    const reloadVersesForOrderChange = async () => {
      if (verses.length === 0 || isReloading) return; // Skip if verses not loaded yet or already reloading
      
      const { useBibleStore } = await import('@/App');
      const store = useBibleStore.getState();
      const currentOrder = store.isChronological ? "chronological" : "canonical";
      
      // Only reload if the order actually changed and we're not already reloading
      if (currentOrder !== verseOrder) {
        console.log(`🔄 Order changed from ${verseOrder} to ${currentOrder}, reloading verses...`);
        isReloading = true;
        
        try {
          setIsLoading(true);
          setLoadingProgress({ stage: "verse-keys", percentage: 10 });

          const { loadVerseKeys } = await import('@/data/BibleDataAPI');
          const { createVerseObjectsFromKeys } = await import('@/lib/verseKeysLoader');

          const verseKeys = await loadVerseKeys(store.isChronological);
          console.log(`🔑 Loaded ${verseKeys.length} verse keys in ${currentOrder} order`);

          setLoadingProgress({ stage: "structure", percentage: 50 });

          // Update store with new verse keys
          store.setCurrentVerseKeys(verseKeys);

          // Recreate verses with new order
          const reorderedVerses = createVerseObjectsFromKeys(verseKeys);
          console.log(`🔄 Reordered ${reorderedVerses.length} verses to ${currentOrder} order`);

          setLoadingProgress({ stage: "complete", percentage: 100 });

          setVerses(reorderedVerses);
          setVerseOrder(currentOrder);
          setCenterVerseIndex(0); // Reset to start of new order
          setIsLoading(false);

          console.log(`✅ Successfully switched to ${currentOrder} order`);
        } catch (error) {
          console.error('❌ Failed to reload verses in new order:', error);
          setIsLoading(false);
        } finally {
          isReloading = false;
        }
      }
    };

    // IMMEDIATE ORDER CHANGE HANDLER: Listen for custom events from toggleChronological
    const handleVerseOrderChanged = (event: CustomEvent) => {
      console.log('🚀 IMMEDIATE: Received verse-order-changed event:', event.detail);
      
      if (event.detail.verses && !isReloading) {
        isReloading = true;
        console.log(`🔄 IMMEDIATE: Applying ${event.detail.verses.length} verses in ${event.detail.newOrder} order`);
        
        setVerses(event.detail.verses);
        setVerseOrder(event.detail.newOrder);
        setCenterVerseIndex(0); // Reset to start of new order
        
        console.log(`✅ IMMEDIATE: Successfully applied ${event.detail.newOrder} order`);
        isReloading = false;
      }
    };

    // Listen for immediate order changes
    window.addEventListener('verse-order-changed', handleVerseOrderChanged as EventListener);

    // Fallback: Check for order changes every 1000ms (reduced frequency)
    const interval = setInterval(reloadVersesForOrderChange, 1000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('verse-order-changed', handleVerseOrderChanged as EventListener);
    };
  }, [verses.length, verseOrder]); // Dependencies: verses loaded and current order

  // DISABLED: Apply cross-references when crossRefSet changes - preventing infinite loading
  // TODO: Re-enable when center-anchored loading is stable
  /*
  useEffect(() => {
    if (verses.length > 0 && crossReferencesData[crossRefSet]) {
      console.log(
        `Applying ${crossRefSet} cross-references to ${verses.length} verses`,
      );
      applyCrossReferences(verses, crossReferencesData[crossRefSet]);
      console.log("✓ Cross-references applied - VirtualBibleTable will handle text loading");
    }
  }, [
    crossRefSet,
    verses.length > 0,
    crossReferencesData.cf1,
    crossReferencesData.cf2,
  ]);
  */

  const expandVerse = (verse: BibleVerse) => {
    setExpandedVerse(verse);
  };

  const closeExpandedVerse = () => {
    setExpandedVerse(null);
  };

  const navigateToVerse = async (reference: string) => {
    console.log("🚀 SMART NAVIGATION to:", reference);

    // STRAIGHT-LINE: Minimal normalization, single conversion for user input
    const normalizedRef = reference.trim();
    const dotFormatRef = normalizedRef.includes(' ') ? normalizedRef.replace(/\s/g, ".") : normalizedRef;
    const targetVerse = verses.find(v => v.reference === dotFormatRef);

    if (targetVerse) {
      const targetIndex = verses.findIndex((v) => v.id === targetVerse.id);
      console.log(
        `🎯 Found target at index ${targetIndex}:`,
        targetVerse.reference,
      );

      // Add to history immediately
      const newHistory = [
        ...navigationHistory.slice(0, currentHistoryIndex + 1),
        reference,
      ];
      setNavigationHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);

      // DISABLED: VirtualBibleTable handles center-anchored loading
      console.log(`🎯 Navigation target: ${targetIndex} - VirtualBibleTable will handle loading`);

      // Precise center positioning for all navigation types
      setTimeout(() => {
        const verseElement = document.getElementById(`verse-${targetVerse.id}`);
        if (verseElement) {
          // Always center the target verse precisely in the viewport
          verseElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });

          // Add highlight animation
          verseElement.classList.add("verse-highlight");
          setTimeout(() => {
            verseElement.classList.remove("verse-highlight");
          }, 2000);
        }
      }, 300);

      console.log(`✅ SMART NAVIGATION COMPLETE: ${targetVerse.reference}`);
    } else {
      console.warn("❌ Verse not found for reference:", normalizedRef);
    }
  };

  const goBack = () => {
    if (currentHistoryIndex > 0) {
      const previousRef = navigationHistory[currentHistoryIndex - 1];
      setCurrentHistoryIndex(currentHistoryIndex - 1);
      navigateToVerse(previousRef);
    }
  };

  const goForward = () => {
    if (currentHistoryIndex < navigationHistory.length - 1) {
      const nextRef = navigationHistory[currentHistoryIndex + 1];
      setCurrentHistoryIndex(currentHistoryIndex + 1);
      navigateToVerse(nextRef);
    }
  };

  const canGoBack = currentHistoryIndex > 0;
  const canGoForward = currentHistoryIndex < navigationHistory.length - 1;

  // Comprehensive search functionality
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    console.log(`Searching for: "${searchTerm}"`);

    // Check if it's a Bible reference (Gen 1:1, John 3:16, etc.)
    const referencePatterns = [
      /^(\w+)\s*(\d+):(\d+)$/i, // "Gen 1:1", "John 3:16"
      /^(\w+)\.(\d+):(\d+)$/i, // "Gen.1:1"
      /^(\w+)\s*(\d+)$/i, // "Gen 1" (chapter)
      /^(\w+)$/i, // "Genesis" (book)
    ];

    for (const pattern of referencePatterns) {
      const match = searchTerm.match(pattern);
      if (match) {
        // It's a reference search - navigate directly
        const [, book, chapter, verse] = match;
        let targetRef = "";

        if (chapter && verse) {
          targetRef = `${book} ${chapter}:${verse}`;
        } else if (chapter) {
          targetRef = `${book} ${chapter}:1`; // Go to first verse of chapter
        } else {
          targetRef = `${book} 1:1`; // Go to first verse of book
        }

        console.log(`Reference search: navigating to ${targetRef}`);
        await navigateToVerse(targetRef);
        return;
      }
    }

    // Text search across all verses
    const results = verses.filter((verse) => {
      const searchableText = [
        verse.reference,
        verse.text.KJV || "",
        verse.text.ESV || "",
        verse.text.NIV || "",
        verse.text.NKJV || "",
        ...(verse.crossReferences?.map((cr) => cr.text) || []),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });

    console.log(
      `Text search found ${results.length} results for "${searchTerm}"`,
    );
    setSearchResults(results.slice(0, 100)); // Limit to first 100 results

    // If we have results, navigate to the first one
    if (results.length > 0) {
      await navigateToVerse(results[0].reference);
    }
  };

  // Handle search query changes with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, verses.length]);

  // REMOVED: loadBothCrossReferenceSets - replaced with anchor-centered loading
  // Cross-references will be loaded on-demand for center-anchored slices only

  // Removed loadCrossReferencesFromAssets - only use Supabase via loadBothCrossReferenceSets

  const parseCrossReferences = (text: string): Map<string, string[]> => {
    const crossRefMap = new Map<string, string[]>();

    console.log("Parsing cross-references with Gen.1:1 format...");
    const lines = text.split("\n").filter((line) => line.trim());
    console.log(`Found ${lines.length} cross-reference lines`);

    lines.forEach((line, index) => {
      if (line.includes("$$")) {
        const [mainRef, crossRefsText] = line.split("$$");
        // Keep the exact Gen.1:1 format - don't convert to spaces
        const cleanMainRef = mainRef.trim();

        if (crossRefsText) {
          // Split by $ to get different reference groups, then by # for sequential verses
          const refGroups = crossRefsText.split("$");
          const crossRefs: string[] = [];

          refGroups.forEach((group) => {
            if (group.trim()) {
              const seqRefs = group.split("#");
              seqRefs.forEach((ref) => {
                if (ref.trim()) {
                  // Keep the exact format: John.1:1, don't convert to spaces
                  const cleanRef = ref.trim();
                  crossRefs.push(cleanRef);
                }
              });
            }
          });

          crossRefMap.set(cleanMainRef, crossRefs);

          if (index < 5) {
            console.log(
              `✓ Parsed cross-ref ${index + 1}: ${cleanMainRef} -> ${crossRefs.length} references`,
            );
          }
        }
      }
    });

    console.log(
      `📊 Cross-reference results: ${crossRefMap.size} verses with cross-references`,
    );
    return crossRefMap;
  };

  const applyCrossReferences = (
    verses: BibleVerse[],
    crossRefMap: Map<string, string[]> | Record<string, any[]>,
  ) => {
    // Helper function to get verse text from the global KJV text map
    const getVerseText = (dotReference: string): string => {
      if (!globalKjvTextMap) return "";

      // OPTIMIZATION: Direct lookup with dot format - no conversion needed
      const text = globalKjvTextMap.get(dotReference);
      if (text) {
        // Truncate long verses for cross-reference display
        return text.length > 100 ? text.substring(0, 100) + "..." : text;
      }

      return "";
    };

    // Apply cross-references to verses with actual text content
    let crossRefCount = 0;
    verses.forEach((verse) => {
      // OPTIMIZATION: verse.reference is now already in dot format - direct use
      const dotFormat = verse.reference;

      let crossRefs: string[] | undefined;
      if (crossRefMap instanceof Map) {
        crossRefs = crossRefMap.get(dotFormat);
      } else {
        crossRefs = crossRefMap[dotFormat];
      }

      if (crossRefs && crossRefs.length > 0) {
        verse.crossReferences = crossRefs.slice(0, 6).map((ref: string) => ({
          // Limit to first 6 for display
          reference: ref,
          text: getVerseText(ref) || `[${ref}]`,
        }));
        crossRefCount++;
      }
    });

    console.log(
      `✓ Applied cross-references to ${crossRefCount} verses using Gen.1:1 format`,
    );
  };

  // Calculate virtual scrolling offsets to prevent page jumping
  const calculateScrollOffset = () => {
    if (verses.length === 0 || verses.length === 0) return 0;

    // Find the starting index of displayed verses in the full verses array
    const firstDisplayedIndex = verses.findIndex(
      (v) => v.id === verses[0]?.id,
    );
    if (firstDisplayedIndex === -1) return 0;

    // Calculate cumulative height from start to the first displayed verse
    let offset = 0;
    for (let i = 0; i < firstDisplayedIndex; i++) {
      offset += verses[i]?.height || 120; // Use verse height or default
    }

    return offset;
  };

  const totalBibleHeight = verses.reduce(
    (total, verse) => total + (verse.height || 120),
    0,
  );
  const scrollOffset = calculateScrollOffset();

  // Load translation when selected from Supabase
  const loadTranslationData = async (translationId: string) => {
    try {
      console.log(`Loading ${translationId} translation from Supabase...`);

      // Import the translation loader
      const { loadTranslationSecure } = await import('../lib/supabaseClient');
      const translationData = await loadTranslationSecure(translationId);

      if (translationData.size > 0) {
        // Update all verses (both display and full set) with the new translation
        const updateVersesWithTranslation = (verses: BibleVerse[]) => {
          return verses.map((verse) => {
            // OPTIMIZATION: Direct lookup with verse.reference (now dot format)
            const text = translationData.get(verse.reference);

            if (text) {
              return {
                ...verse,
                text: {
                  ...verse.text,
                  [translationId]: text,
                },
              };
            }
            return verse;
          });
        };

        // Update both display verses and full verse set
        const updatedDisplayVerses = updateVersesWithTranslation(verses);
        const updatedAllVerses = updateVersesWithTranslation(verses);

        setVerses(updatedDisplayVerses);
        setVerses(updatedAllVerses);

        console.log(`✓ ${translationId} translation loaded with ${translationData.size} verses`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to load ${translationId}:`, error);
      return false;
    }
  };

  // Global verse text lookup function for prophecy column and other components
  const getGlobalVerseText = (reference: string): string => {
    // Use the main translation from the selected translations (first one) or fallback to mainTranslation
    const translationCode = selectedTranslations.length > 0 ? selectedTranslations[0] : mainTranslation;
    const cacheKey = `translation-${translationCode}`;
    const translationMap = masterCache.get(cacheKey) as Map<string, string> | undefined;

    if (!translationMap) {
      log.debug('TranslationCacheMiss', () => ({ translationCode, hasCacheEntries: masterCache.size > 0 }));
      return "";
    }

    log.debug('TranslationCacheHit', () => ({ translationCode, verseCount: translationMap.size }));

    // OPTIMIZATION: Direct lookup with dot format reference  
    const text = translationMap.get(reference);
    if (text) {
      // Truncate long verses for display in cross-references
      return text.length > 100 ? text.substring(0, 100) + "..." : text;
    }

    return "";
  };

  // Verse text retrieval function for VirtualRow components
  const getVerseText = (verseReference: string, translationCode: string): string | undefined => {
    // Check the master cache first
    const cacheKey = `translation-${translationCode}`;
    const translationMap = masterCache.get(cacheKey) as Map<string, string> | undefined;

    if (!translationMap) {
      log.debug('VerseTextCacheMiss', () => ({ translationCode, verseReference }));
      return undefined;
    }

    log.debug('VerseTextCacheHit', () => ({ translationCode, verseReference }));

    // OPTIMIZATION: Direct lookup with dot format reference
    const text = translationMap.get(verseReference);
    if (text) {
      return text;
    }

    // If not found, try with global KJV map as fallback  
    if (translationCode === 'KJV' && globalKjvTextMap) {
      const kjvText = globalKjvTextMap.get(verseReference);
      if (kjvText) {
        return kjvText;
      }
    }

    return undefined;
  };

  return {
    verses: verses, // Return display verses for rendering
    allVerses: verses, // Keep full dataset available
    isLoading,
    error,
    expandedVerse,
    expandVerse,
    closeExpandedVerse,
    navigateToVerse,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    loadingProgress,
    allTranslations,
    loadTranslationData, // Expose translation loading function
    mainTranslation,
    selectedTranslations,
    multiTranslationMode,
    displayTranslations,
    toggleTranslation,
    toggleMultiTranslationMode,
    // Search functionality
    searchQuery,
    setSearchQuery,
    searchResults,
    performSearch,
    // Virtual scrolling properties to prevent page jumping
    totalBibleHeight,
    scrollOffset,
    // Translation management
    setSelectedTranslations,
    setMainTranslation,
    // Cross-reference management
    crossRefSet,
    setCrossRefSet,
    // loadBothCrossReferenceSets, // REMOVED - replaced with anchor-centered loading
    // Prophecy management
    loadProphecyDataOnDemand,
    getProphecyDataForVerse,
    // Global verse text lookup
    getGlobalVerseText,
    // Verse text retrieval for components
    getVerseText,
    // Center-anchored verse loading
    centerVerseIndex,
    loadVerseRange,
    // Chronological order switching
    verseOrder
  };
}