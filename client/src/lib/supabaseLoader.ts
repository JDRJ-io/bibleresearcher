import { supabase } from "./supabase";

// Cache for all loaded resources
const resourceCache = new Map<string, any>();

// List of all Bible verse references (Gen.1:1 -> Rev.22:21)
let verseKeysCache: string[] | null = null;

// Load verse keys from Supabase with authentication
export async function loadVerseKeys(): Promise<string[]> {
  if (verseKeysCache) return verseKeysCache;

  try {
    console.log("Loading verse keys from private Supabase bucket...");

    // Use authenticated download from private bucket
    const { data, error } = await supabase.storage
      .from("anointed")
      .download("metadata/verseKeys-canonical.json");

    if (error) {
      console.error("Error downloading verse keys:", error);
      throw error;
    }

    // Convert blob to text
    const text = await data.text();
    const verseKeys = JSON.parse(text);

    verseKeysCache = verseKeys;
    console.log(`Loaded ${verseKeys.length} verse keys from private bucket`);

    return verseKeys;
  } catch (error) {
    console.error("Failed to load verse keys:", error);
    throw error;
  }
}

// Load translation with streaming for performance
export async function loadTranslationSecure(
  translationId: string,
): Promise<Map<string, string>> {
  const cacheKey = `translation-${translationId}`;
  if (resourceCache.has(cacheKey)) {
    return resourceCache.get(cacheKey);
  }

  try {
    console.log(`Loading ${translationId} from private Supabase bucket...`);

    // Download from private bucket with authentication
    const { data, error } = await supabase.storage
      .from("anointed")
      .download(`translations/${translationId}.txt`);

    if (error) {
      console.error(`Error downloading ${translationId}:`, error);
      throw error;
    }

    // Process the translation data
    const text = await data.text();
    const lines = text.split("\n").filter((line) => line.trim());

    const textMap = new Map<string, string>();
    lines.forEach((line) => {
      const cleanLine = line.trim().replace(/\r/g, "");
      const match = cleanLine.match(/^([^#]+)\s*#(.+)$/);
      if (match) {
        const [, reference, text] = match;
        const cleanRef = reference.trim();
        const cleanText = text.trim();

        // Store multiple key formats
        textMap.set(cleanRef, cleanText);
        textMap.set(cleanRef.replace(".", " "), cleanText);

        const refMatch = cleanRef.match(/^(\w+)\.(\d+):(\d+)$/);
        if (refMatch) {
          const [, book, chapter, verse] = refMatch;
          textMap.set(`${book} ${chapter}:${verse}`, cleanText);
        }
      }
    });

    // Cache the result
    resourceCache.set(cacheKey, textMap);
    console.log(
      `${translationId} loaded with ${textMap.size} verses from private bucket`,
    );

    return textMap;
  } catch (error) {
    console.error(`Failed to load ${translationId}:`, error);
    return new Map();
  }
}

// Load multiple translations in parallel using Web Workers
export async function loadTranslationsParallel(
  translationIds: string[],
  onProgress?: (loaded: number, total: number) => void,
): Promise<Map<string, Map<string, string>>> {
  const results = new Map<string, Map<string, string>>();
  let loaded = 0;

  // Load translations in parallel batches to avoid overwhelming the browser
  const batchSize = 3;
  for (let i = 0; i < translationIds.length; i += batchSize) {
    const batch = translationIds.slice(i, i + batchSize);

    const batchPromises = batch.map(async (id) => {
      const textMap = await loadTranslationSecure(id);
      results.set(id, textMap);
      loaded++;
      if (onProgress) {
        onProgress(loaded, translationIds.length);
      }
      return textMap;
    });

    await Promise.all(batchPromises);
  }

  return results;
}

// Load cross-references from private bucket
export async function loadCrossReferences(
  setName: string = "cf1",
): Promise<Map<string, string[]>> {
  const cacheKey = `crossrefs-${setName}`;
  if (resourceCache.has(cacheKey)) {
    return resourceCache.get(cacheKey);
  }

  try {
    console.log(`Loading cross-references ${setName} from private bucket...`);

    const { data, error } = await supabase.storage
      .from("anointed")
      .download(`cross-references/${setName}.txt`);

    if (error) {
      console.error("Error downloading cross-references:", error);
      throw error;
    }

    const text = await data.text();
    const crossRefMap = new Map<string, string[]>();

    // Parse cross-reference format
    const lines = text.split("\n").filter((line) => line.trim());
    lines.forEach((line) => {
      // Format: Gen.1:1$$John.1:1#John.1:2$Heb.11:3
      const [verse, ...refs] = line.split(/\$\$|\$|#/);
      if (verse && refs.length > 0) {
        crossRefMap.set(
          verse.trim(),
          refs.map((r) => r.trim()),
        );
      }
    });

    resourceCache.set(cacheKey, crossRefMap);
    console.log(
      `Loaded ${crossRefMap.size} cross-references from private bucket`,
    );

    return crossRefMap;
  } catch (error) {
    console.error("Failed to load cross-references:", error);
    return new Map();
  }
}

// Load Strong's data from private bucket
export async function loadStrongsData(): Promise<any> {
  if (resourceCache.has("strongs")) {
    return resourceCache.get("strongs");
  }

  try {
    console.log("Loading Strong's data from private bucket...");

    const { data, error } = await supabase.storage
      .from("anointed")
      .download("strongs/strongs-hebrew-greek.json");

    if (error) {
      console.error("Error downloading Strong's data:", error);
      throw error;
    }

    const text = await data.text();
    const strongsData = JSON.parse(text);

    resourceCache.set("strongs", strongsData);
    console.log("Strong's data loaded from private bucket");

    return strongsData;
  } catch (error) {
    console.error("Failed to load Strong's data:", error);
    return null;
  }
}

// Load context groups from private bucket
export async function loadContextGroups(): Promise<Map<string, string>> {
  if (resourceCache.has("context-groups")) {
    return resourceCache.get("context-groups");
  }

  try {
    console.log("Loading context groups from private bucket...");

    const { data, error } = await supabase.storage
      .from("anointed")
      .download("metadata/context_groups.json");

    if (error) {
      console.error("Error downloading context groups:", error);
      throw error;
    }

    const text = await data.text();
    const contextData = JSON.parse(text);

    // Convert to map for efficient lookup
    const contextMap = new Map<string, string>();
    Object.entries(contextData).forEach(([group, verses]) => {
      (verses as string[]).forEach((verse) => {
        contextMap.set(verse, group);
      });
    });

    resourceCache.set("context-groups", contextMap);
    console.log("Context groups loaded from private bucket");

    return contextMap;
  } catch (error) {
    console.error("Failed to load context groups:", error);
    return new Map();
  }
}

// Load prophecy data from private bucket
export async function loadProphecyData(): Promise<any> {
  if (resourceCache.has("prophecy")) {
    return resourceCache.get("prophecy");
  }

  try {
    console.log("Loading prophecy data from private bucket...");

    const { data, error } = await supabase.storage
      .from("anointed")
      .download("prophecy/prophecy.txt");

    if (error) {
      console.error("Error downloading prophecy data:", error);
      throw error;
    }

    const text = await data.text();
    
    // Parse prophecy data into structured format
    const prophecies = parseProphecyFile(text);
    
    resourceCache.set("prophecy", prophecies);
    console.log(`Prophecy data loaded: ${prophecies.length} prophecies from private bucket`);

    return prophecies;
  } catch (error) {
    console.error("Failed to load prophecy data:", error);
    return [];
  }
}

// Parse prophecy file into structured data
function parseProphecyFile(text: string): any[] {
  const prophecies = [];
  const sections = text.split(/(?=^\d+$)/m).filter(section => section.trim());
  
  for (const section of sections) {
    const lines = section.split('\n').filter(line => line.trim());
    if (lines.length < 5) continue;
    
    const prophecyNumber = lines[0].trim();
    const predictions = parseVerseList(lines[1]);
    const fulfillments = parseVerseList(lines[2]);
    const evidence = parseVerseList(lines[3]);
    const summary = lines[4].trim();
    
    prophecies.push({
      number: prophecyNumber,
      title: `${prophecyNumber}: ${summary}`,
      predictions,
      fulfillments,
      evidence,
      summary
    });
  }
  
  console.log(`Parsed ${prophecies.length} prophecies from file`);
  return prophecies;
}

// Parse comma-separated verse list into array
function parseVerseList(line: string): string[] {
  return line.split(',').map(verse => verse.trim()).filter(verse => verse);
}

// Get all available translations from bucket
export async function getAvailableTranslations(): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from("anointed")
      .list("translations", {
        limit: 100,
      });

    if (error) {
      console.error("Error listing translations:", error);
      return ["KJV"]; // Default fallback
    }

    // Extract translation IDs from filenames
    const translations = data
      .filter((file) => file.name.endsWith(".txt"))
      .map((file) => file.name.replace(".txt", ""));

    console.log("Available translations:", translations);
    return translations;
  } catch (error) {
    console.error("Failed to get available translations:", error);
    return ["KJV"];
  }
}
