// Web Worker for parallel translation loading
let supabaseUrl = 'https://ecaqvxbbscwcxbjpfrdm.supabase.co';
let supabaseKey = '';

self.onmessage = async function(e) {
  const { type, payload } = e.data;
  
  switch (type) {
    case 'INIT':
      supabaseKey = payload.apiKey;
      self.postMessage({ type: 'INIT_COMPLETE' });
      break;
      
    case 'LOAD_TRANSLATION':
      await loadTranslation(payload.translationId);
      break;
      
    case 'LOAD_MULTIPLE':
      await loadMultipleTranslations(payload.translationIds);
      break;
      
    case 'PARSE_TRANSLATION':
      // Expert guidance: Off-load parsing to worker
      const translationMap = parseTranslationContent(payload.content);
      self.postMessage({
        type: 'TRANSLATION_PARSED',
        payload: {
          code: payload.code,
          map: translationMap
        }
      });
      break;
  }
};

async function loadTranslation(translationId) {
  try {
    console.log(`Worker loading ${translationId}...`);
    
    // Download from PUBLIC bucket - no authentication needed
    const response = await fetch(`${supabaseUrl}/storage/v1/object/public/anointed/translations/${translationId}.txt`);
    
    if (!response.ok) {
      throw new Error(`Failed to load ${translationId}: ${response.status}`);
    }
    
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    // Parse translation data
    const verses = [];
    lines.forEach((line) => {
      const cleanLine = line.trim().replace(/\r/g, '');
      const match = cleanLine.match(/^([^#]+)\s*#(.+)$/);
      if (match) {
        const [, reference, text] = match;
        verses.push({
          ref: reference.trim(),
          text: text.trim()
        });
      }
    });
    
    self.postMessage({
      type: 'TRANSLATION_LOADED',
      payload: {
        translationId,
        verses,
        count: verses.length
      }
    });
    
  } catch (error) {
    self.postMessage({
      type: 'TRANSLATION_ERROR',
      payload: {
        translationId,
        error: error.message
      }
    });
  }
}

async function loadMultipleTranslations(translationIds) {
  const total = translationIds.length;
  let loaded = 0;
  
  // Load in parallel batches
  const batchSize = 3;
  for (let i = 0; i < translationIds.length; i += batchSize) {
    const batch = translationIds.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (id) => {
      await loadTranslation(id);
      loaded++;
      
      self.postMessage({
        type: 'PROGRESS',
        payload: {
          loaded,
          total,
          percentage: Math.round((loaded / total) * 100)
        }
      });
    }));
  }
  
  self.postMessage({
    type: 'ALL_COMPLETE',
    payload: { total }
  });
}

/**
 * Parse translation content into Map<verseID, text>
 * Called from worker thread to keep main thread under 16ms
 */
function parseTranslationContent(content) {
  const lines = content.split('\n');
  const translationMap = new Map();
  
  for (const line of lines) {
    if (line.trim()) {
      const hashIndex = line.indexOf('#');
      if (hashIndex > 0) {
        const verseID = line.substring(0, hashIndex).trim();
        const text = line.substring(hashIndex + 1).trim();
        translationMap.set(verseID, text);
      }
    }
  }
  
  return translationMap;
}