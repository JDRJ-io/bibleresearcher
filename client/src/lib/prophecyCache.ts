// client/src/lib/prophecyCache.ts
import { masterCache } from './supabaseClient';

export interface ProphecyData {
  summary: string;
  prophecy: string[];
  fulfillment: string[];
  verification: string[];
}

// Use master cache instead of local variables
const PROPHECY_VERSE_META_KEY = 'prophecy-verse-meta';
const PROPHECY_ROW_META_KEY = 'prophecy-row-meta';

export async function ensureProphecyLoaded() {
  if (masterCache.has(PROPHECY_VERSE_META_KEY) && masterCache.has(PROPHECY_ROW_META_KEY)) {
    console.log('✅ Prophecy data already loaded from cache');
    return;
  }
  
  try {
    console.log('🔮 Loading prophecy data via BibleDataAPI...');
    // Use BibleDataAPI for consistent data access
    const { getProphecyRows, getProphecyIndex } = await import('@/data/BibleDataAPI');
    
    const [verseResp, rowResp] = await Promise.all([
      getProphecyRows(), // Now returns JSON
      getProphecyIndex() // Now returns text
    ]);
    
    console.log(`📋 Processing prophecy data from JSON and text files`);
    
    // Parse verseMeta from JSON format
    const verseMeta: Record<string, { P: string; F: string; V: string }> = {};
    const rowsData = typeof verseResp === 'string' ? JSON.parse(verseResp) : verseResp;
    
    Object.entries(rowsData).forEach(([verse, data]: [string, any]) => {
      verseMeta[verse] = {
        P: data.P ? (Array.isArray(data.P) ? data.P.join(',') : data.P.toString()) : '',
        F: data.F ? (Array.isArray(data.F) ? data.F.join(',') : data.F.toString()) : '',
        V: data.V ? (Array.isArray(data.V) ? data.V.join(',') : data.V.toString()) : ''
      };
    });
    
    // Store in master cache
    masterCache.set(PROPHECY_VERSE_META_KEY, verseMeta);
    masterCache.set(PROPHECY_ROW_META_KEY, rowResp);
    console.log(`✅ Prophecy data loaded successfully: ${Object.keys(verseMeta).length} verses with prophecy roles`);
  } catch (error) {
    console.error('❌ Failed to load prophecy data from authentic source:', error);
    // Don't fall back to mock data - keep empty
    masterCache.set(PROPHECY_VERSE_META_KEY, {});
    masterCache.set(PROPHECY_ROW_META_KEY, {});
  }
}

export function getProphecyForVerse(id: string) {
  const verseMeta = masterCache.get(PROPHECY_VERSE_META_KEY) || {};
  const rowMeta = masterCache.get(PROPHECY_ROW_META_KEY) || {};
  
  console.log(`🔍 Looking up prophecy data for verse: ${id}`);
  
  if (!verseMeta || !rowMeta) {
    console.log('❌ No prophecy metadata available');
    return { P: [], F: [], V: [] };
  }
  
  // Try multiple formats for the verse lookup
  const possibleKeys = [
    id, // Direct match
    id.replace(/\s/g, '.'), // "Gen 1:1" -> "Gen.1:1"
    id.replace(/\./g, ' '), // "Gen.1:1" -> "Gen 1:1"
  ];
  
  let verse = null;
  let foundKey = null;
  for (const key of possibleKeys) {
    if (verseMeta[key]) {
      verse = verseMeta[key];
      foundKey = key;
      break;
    }
  }
  
  if (!verse) {
    console.log(`❌ No prophecy data found for verse ${id} (tried: ${possibleKeys.join(', ')})`);
    return { P: [], F: [], V: [] };
  }
  
  console.log(`✅ Found prophecy data for ${id} (key: ${foundKey}):`, verse);
  
  // Return role-grouped prophecy data with numeric IDs
  const result = {
    P: verse.P ? verse.P.split(',').filter((id: string) => id.trim()).map(Number) : [],
    F: verse.F ? verse.F.split(',').filter((id: string) => id.trim()).map(Number) : [],
    V: verse.V ? verse.V.split(',').filter((id: string) => id.trim()).map(Number) : []
  };
  
  console.log(`📊 Prophecy data for ${id}:`, result);
  return result;
}