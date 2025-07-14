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

// DELETED: loadTranslationSecure - duplicate of public fetch, replaced by translationCache.ts

// DELETED: loadTranslationsParallel - uses deleted loadTranslationSecure, replaced by translationCache.ts
  }

  return results;
}

// Load cross-references from private bucket
export // 2-B. Load only that slice in every fetcher - before calling .select(), filter the in() clause to slice.
async function loadCrossReferences(
  setName: string = "cf1",
  slice?: string[] // NEW - filter to only these verseIDs
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

// DELETED: loadProphecyIndex, loadProphecyRows - duplicate of prophecyCache.ts

// Parse comma-separated verse list into array


// Load chronological verse order from Supabase
export async function loadChronologicalOrder(): Promise<string[]> {
  if (resourceCache.has("chronological-order")) {
    return resourceCache.get("chronological-order");
  }

  try {
    console.log("Loading chronological verse order from Supabase...");

    const { data, error } = await supabase.storage
      .from("anointed")
      .download("metadata/verseKeys-chronological.json");

    if (error) {
      console.error("Error downloading chronological order:", error);
      throw error;
    }

    const text = await data.text();
    const chronologicalOrder = JSON.parse(text);
    resourceCache.set("chronological-order", chronologicalOrder);
    console.log(`Chronological order loaded: ${chronologicalOrder.length} verses from Supabase`);

    return chronologicalOrder;
  } catch (error) {
    console.error("Failed to load chronological order:", error);
    return [];
  }
}

// Load date information for verses
export async function loadChronologicalDates(): Promise<Map<string, string>> {
  if (resourceCache.has("chronological-dates")) {
    return resourceCache.get("chronological-dates");
  }

  try {
    console.log("Loading chronological dates from Supabase...");

    const { data, error } = await supabase.storage
      .from("anointed")
      .download("metadata/dates-chronological.txt");

    if (error) {
      console.error("Error downloading chronological dates:", error);
      throw error;
    }

    const text = await data.text();
    const dateMap = new Map<string, string>();
    
    const lines = text.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const match = line.match(/^([^#]+)\s*#(.+)$/);
      if (match) {
        const [, reference, date] = match;
        dateMap.set(reference.trim(), date.trim());
      }
    });

    resourceCache.set("chronological-dates", dateMap);
    console.log(`Chronological dates loaded: ${dateMap.size} entries from Supabase`);

    return dateMap;
  } catch (error) {
    console.error("Failed to load chronological dates:", error);
    return new Map();
  }
}

// Load canonical dates
export async function loadCanonicalDates(): Promise<Map<string, string>> {
  if (resourceCache.has("canonical-dates")) {
    return resourceCache.get("canonical-dates");
  }

  try {
    console.log("Loading canonical dates from Supabase...");

    const { data, error } = await supabase.storage
      .from("anointed")
      .download("metadata/dates-canonical.txt");

    if (error) {
      console.error("Error downloading canonical dates:", error);
      throw error;
    }

    const text = await data.text();
    const dateMap = new Map<string, string>();
    
    const lines = text.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const match = line.match(/^([^#]+)\s*#(.+)$/);
      if (match) {
        const [, reference, date] = match;
        dateMap.set(reference.trim(), date.trim());
      }
    });

    resourceCache.set("canonical-dates", dateMap);
    console.log(`Canonical dates loaded: ${dateMap.size} entries from Supabase`);

    return dateMap;
  } catch (error) {
    console.error("Failed to load canonical dates:", error);
    return new Map();
  }
}

// Load Strong's concordance data
export async function loadStrongsData(): Promise<any> {
  if (resourceCache.has("strongs")) {
    return resourceCache.get("strongs");
  }

  try {
    console.log("Loading Strong's data from Supabase...");

    const { data, error } = await supabase.storage
      .from("anointed")
      .download("strongs/strongsIndex.json");

    if (error) {
      console.error("Error downloading Strong's data:", error);
      throw error;
    }

    const text = await data.text();
    const strongsData = JSON.parse(text);
    resourceCache.set("strongs", strongsData);
    console.log(`Strong's data loaded from Supabase`);

    return strongsData;
  } catch (error) {
    console.error("Failed to load Strong's data:", error);
    return {};
  }
}

// Load verse labels for specific translation
export async function loadVerseLabels(translationId: string): Promise<any> {
  const cacheKey = `labels-${translationId}`;
  if (resourceCache.has(cacheKey)) {
    return resourceCache.get(cacheKey);
  }

  try {
    console.log(`Loading ${translationId} verse labels from Supabase...`);

    const { data, error } = await supabase.storage
      .from("anointed")
      .download(`labels/${translationId}/ALL.json`);

    if (error) {
      console.error(`Error downloading ${translationId} labels:`, error);
      throw error;
    }

    const text = await data.text();
    const labels = JSON.parse(text);
    resourceCache.set(cacheKey, labels);
    console.log(`${translationId} labels loaded from Supabase`);

    return labels;
  } catch (error) {
    console.error(`Failed to load ${translationId} labels:`, error);
    return {};
  }
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
