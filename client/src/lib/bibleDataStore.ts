// Step 4.0 - Data model (single source of truth)
interface BibleDataStore {
  mainTranslation: string;           // e.g. "KJV" 
  altTranslations: string[];         // e.g. ["AMP", "ESV"]
  baseTranslations: string[];        // ["Reference", "KJV", "AMP", "CSB", "Cross", "P", "F", "V"]
  headerOrder: string[];             // Dynamic header order for columns
  translationMaps: Map<string, Map<string, string>>;  // already filled by loader
}

const defaultBibleDataStore: BibleDataStore = {
  mainTranslation: "KJV",
  altTranslations: [],
  baseTranslations: ["Reference", "KJV", "AMP", "CSB", "Cross", "P", "F", "V"],
  headerOrder: ["Reference", "KJV", "Cross", "P", "F", "V"],
  translationMaps: new Map(),
};

// Global state for multi-translation system
let bibleDataStore: BibleDataStore = { ...defaultBibleDataStore };

// Getters and setters
export const getBibleDataStore = () => bibleDataStore;

// Step 4.2 - State update rules
export const setMainTranslation = (code: string) => {
  const { altTranslations } = bibleDataStore;
  
  // Remove code from alt list if it were there
  const newAlts = altTranslations.filter(c => c !== code);
  // Add previous main into alt list (only if not present)
  const present = altTranslations.includes(bibleDataStore.mainTranslation);
  if (!present) {
    newAlts.push(bibleDataStore.mainTranslation);
  }
  
  bibleDataStore.mainTranslation = code;
  bibleDataStore.altTranslations = newAlts;
  
  // Update header order (swap columns, keep others intact)
  const order = bibleDataStore.baseTranslations.map(h => h === code ? code : h);
  bibleDataStore.baseTranslations = order;
  
  return { ...bibleDataStore, altTranslations: newAlts, headerOrder: order };
};

export const getMainTranslation = () => bibleDataStore.mainTranslation;

export const toggleAltTranslation = (code: string) => {
  const alts = bibleDataStore.altTranslations;
  const present = alts.includes(code);
  
  if (present) {
    // Remove code from alt list if it were there
    const newAlts = alts.filter(c => c !== code);
    bibleDataStore.altTranslations = newAlts;
  } else {
    // Add code to alt list (only if not present)
    const newAlts = [...alts, code];
    bibleDataStore.altTranslations = newAlts;
  }
  
  return { ...bibleDataStore, altTranslations: bibleDataStore.altTranslations, headerOrder: bibleDataStore.baseTranslations };
};

export const getAltTranslations = () => bibleDataStore.altTranslations;

export const getHeaderOrder = () => bibleDataStore.baseTranslations;

// Update header order (swap columns, keep others intact)
export const updateHeaderOrder = (newOrder: string[]) => {
  bibleDataStore.baseTranslations = newOrder;
  return { ...bibleDataStore, headerOrder: newOrder };
};