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
      getProphecyRows(),
      getProphecyIndex()
    ]);
    
    console.log(`📋 Processing prophecy data: ${verseResp.split('\n').length} verse lines`);
    
    // Parse verseMeta
    const verseMeta: Record<string, { P: string; F: string; V: string }> = {};
    verseResp.split('\n').forEach(line => {
      const [verse, data] = line.split('$');
      if (verse && data) {
        const items = data.split(',').map(item => {
          const [id, type] = item.split(':');
          return { id, type };
        });
        
        const blocks = items.reduce((acc, item) => {
          if (!acc[item.type]) acc[item.type] = [];
          acc[item.type].push(item.id);
          return acc;
        }, {} as Record<string, string[]>);
        
        verseMeta[verse] = {
          P: blocks.P ? blocks.P.join(',') : '',
          F: blocks.F ? blocks.F.join(',') : '',
          V: blocks.V ? blocks.V.join(',') : ''
        };
      }
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
    return [];
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
    return [];
  }
  
  console.log(`✅ Found prophecy data for ${id} (key: ${foundKey}):`, verse);
  
  // Return role-grouped prophecy data with numeric IDs
  const result = {
    P: verse.P ? verse.P.split(',').filter((id: string) => id.trim()).map(Number) : [],
    F: verse.F ? verse.F.split(',').filter((id: string) => id.trim()).map(Number) : [],
    V: verse.V ? verse.V.split(',').filter((id: string) => id.trim()).map(Number) : []
  };
  
  console.log(`📊 Prophecy data for ${id}:`, result);
  return [result];
}