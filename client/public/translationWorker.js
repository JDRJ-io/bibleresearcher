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
  }
};

async function loadTranslation(translationId) {
  try {
    console.log(`Worker loading ${translationId}...`);
    
    // Download from private bucket with authentication
    const response = await fetch(`${supabaseUrl}/storage/v1/object/authenticated/anointed/translations/${translationId}.txt`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });
    
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