// Translation loading utilities
const TRANSLATION_CACHE = new Map<string, Map<string, string>>();

export async function loadTranslation(translationId: string): Promise<Map<string, string>> {
  // Check cache first
  if (TRANSLATION_CACHE.has(translationId)) {
    return TRANSLATION_CACHE.get(translationId)!;
  }

  try {
    console.log(`Loading ${translationId} translation from Supabase...`);
    const response = await fetch(
      `https://ecaqvxbbscwcxbjpfrdm.supabase.co/storage/v1/object/public/anointed/translations/${translationId}.txt`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to load ${translationId} translation`);
    }

    const textData = await response.text();
    const lines = textData.split('\n').filter(line => line.trim());
    
    const textMap = new Map<string, string>();
    lines.forEach((line) => {
      const cleanLine = line.trim().replace(/\r/g, '');
      const match = cleanLine.match(/^([^#]+)\s*#(.+)$/);
      if (match) {
        const [, reference, text] = match;
        const cleanRef = reference.trim();
        const cleanText = text.trim();
        
        // Store multiple key formats for compatibility
        textMap.set(cleanRef, cleanText); // "Gen.1:1"
        textMap.set(cleanRef.replace('.', ' '), cleanText); // "Gen 1:1"
        
        // Parse for additional format variations
        const refMatch = cleanRef.match(/^(\w+)\.(\d+):(\d+)$/);
        if (refMatch) {
          const [, book, chapter, verse] = refMatch;
          textMap.set(`${book} ${chapter}:${verse}`, cleanText);
          textMap.set(`${book}.${chapter}.${verse}`, cleanText);
        }
      }
    });
    
    // Cache the loaded translation
    TRANSLATION_CACHE.set(translationId, textMap);
    console.log(`${translationId} translation loaded with ${textMap.size} entries`);
    
    return textMap;
  } catch (error) {
    console.error(`Failed to load ${translationId} translation:`, error);
    return new Map();
  }
}

export async function loadMultipleTranslations(translationIds: string[]): Promise<Map<string, Map<string, string>>> {
  const results = new Map<string, Map<string, string>>();
  
  // Load translations in parallel
  const promises = translationIds.map(async (id) => {
    const textMap = await loadTranslation(id);
    results.set(id, textMap);
  });
  
  await Promise.all(promises);
  return results;
}

export function getVerseText(
  translationMap: Map<string, string>, 
  reference: string
): string {
  // Try different reference formats
  const formats = [
    reference,
    reference.replace('.', ' '),
    reference.replace(/\s/g, '.'),
    reference.replace(/\./g, ' ')
  ];
  
  for (const format of formats) {
    if (translationMap.has(format)) {
      return translationMap.get(format)!;
    }
  }
  
  return `[${reference} - Loading...]`;
}