/**
 * CrossRefWorker.ts - handles cf1 & cf2 loading with Range requests
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Cache for cf2 data and offsets
let cf2Cache: Map<string, string[]> | null = null;
let cf1Offsets: Record<string, [number, number]> | null = null;

export const fetchCrossRefs = async (ids: string[]): Promise<Record<string, string[]>> => {
  if (!cf2Cache) {
    // Load cf2 uses Range() - first pull cf2 matches from in-memory map
    const { data, error } = await supabase.storage
      .from('anointed')
      .download('references/cf2.txt');
    
    if (error) {
      console.error('Error loading cf2:', error);
      return {};
    }
    
    const text = await data.text();
    const map = new Map<string, string[]>();
    
    // Parse cross-reference format: Gen.1:1$$John.1:1#John.1:2$Heb.11:3
    const lines = text.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const parts = line.split('$$');
      if (parts.length >= 2) {
        const verseID = parts[0].trim();
        const refs = parts[1].split(/[#$]/).map(r => r.trim()).filter(r => r);
        map.set(verseID, refs);
      }
    });
    
    cf2Cache = map;
  }
  
  // First pull cf2 matches from in-memory map
  const result: Record<string, string[]> = {};
  
  for (const id of ids) {
    const cf2Refs = cf2Cache.get(id);
    if (cf2Refs) {
      result[id] = cf2Refs;
    }
  }
  
  // For verses not found, pull byte-ranges from cf1
  const notFound = ids.filter(id => !result[id]);
  
  if (notFound.length > 0) {
    if (!cf1Offsets) {
      // Load cf1 offsets
      try {
        const { data: offsetData, error: offsetError } = await supabase.storage
          .from('anointed')
          .download('references/cf1_offsets.json');
        
        if (offsetError) {
          console.warn('cf1 offsets not available, using fallback:', offsetError);
          // Fallback to public demo data
          const response = await fetch('/references/cf1_offsets.json');
          cf1Offsets = await response.json();
        } else {
          cf1Offsets = JSON.parse(await offsetData.text());
        }
      } catch (error) {
        console.error('Error loading cf1 offsets:', error);
        return result;
      }
    }
    
    // Pull byte-ranges from cf1.txt
    const byteRanges = notFound
      .map(id => cf1Offsets![id])
      .filter(Boolean);
    
    if (byteRanges.length > 0) {
      const { data: cf1Data, error: cf1Error } = await supabase.storage
        .from('anointed')
        .download('references/cf1.txt');
      
      if (cf1Error) {
        console.error('Error loading cf1:', cf1Error);
        return result;
      }
      
      const cf1Text = await cf1Data.text();
      
      // Parse ranges and extract cross-references
      for (const id of notFound) {
        const range = cf1Offsets![id];
        if (range) {
          const [start, end] = range;
          const line = cf1Text.substring(start, end);
          const parts = line.split('$$');
          if (parts.length >= 2) {
            const refs = parts[1].split(/[#$]/).map(r => r.trim()).filter(r => r);
            result[id] = refs;
          }
        }
      }
    }
  }
  
  return result;
};

// Worker message handler
self.onmessage = async (e) => {
  const { type, data } = e.data;
  
  if (type === 'FETCH_CROSS_REFS') {
    try {
      const result = await fetchCrossRefs(data.ids);
      self.postMessage({ type: 'CROSS_REFS_RESULT', data: result });
    } catch (error) {
      self.postMessage({ type: 'ERROR', error: error.message });
    }
  }
};