/**
 * ProphecyAPI.ts - Main thread prophecy load (once at startup)
 */

import { supabase } from '@/lib/supabaseClient';

let prophecyIndex: Record<string, any> | null = null;
let prophecyRows: Record<string, { P: number[], F: number[], V: number[] }> | null = null;

export const loadProphecyData = async () => {
  if (prophecyIndex && prophecyRows) {
    return { prophecyIndex, prophecyRows };
  }

  try {
    // Load prophecy index and rows in parallel
    const [indexData, rowsData] = await Promise.all([
      supabase.storage.from('anointed').download('references/prophecy_index.json').catch(() => ({
        error: 'fallback',
        data: null
      })),
      supabase.storage.from('anointed').download('references/prophecy_rows.txt').catch(() => ({
        error: 'fallback',
        data: null
      }))
    ]);

    if (indexData.error || rowsData.error) {
      console.warn('Prophecy data not available from Supabase, using fallback:', indexData.error || rowsData.error);
      // Fallback to public demo data
      const [indexResponse, rowsResponse] = await Promise.all([
        fetch('/references/prophecy_index.json'),
        fetch('/references/prophecy_rows.txt')
      ]);
      
      prophecyIndex = await indexResponse.json();
      const rowsText = await rowsResponse.text();
      
      // Parse prophecy rows
      const rows: Record<string, { P: number[], F: number[], V: number[] }> = {};
      
      const lines = rowsText.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        // Format: verseID $ id:type , id:type , …
        const parts = line.split('$');
        if (parts.length >= 2) {
          const verseID = parts[0].trim();
          const items = parts[1].split(',').map(item => item.trim());
          
          if (!rows[verseID]) {
            rows[verseID] = { P: [], F: [], V: [] };
          }
          
          items.forEach(item => {
            const [idStr, type] = item.split(':');
            const id = parseInt(idStr);
            if (!isNaN(id) && ['P', 'F', 'V'].includes(type)) {
              rows[verseID][type as 'P' | 'F' | 'V'].push(id);
            }
          });
        }
      });
      
      prophecyRows = rows;
      
      console.log(`✅ Loaded prophecy data from fallback: ${Object.keys(prophecyIndex).length} entries, ${Object.keys(prophecyRows).length} verses`);
      
      return { prophecyIndex, prophecyRows };
    }

    // Parse prophecy index
    prophecyIndex = JSON.parse(await indexData.data.text());

    // Parse prophecy rows
    const rowsText = await rowsData.data.text();
    const rows: Record<string, { P: number[], F: number[], V: number[] }> = {};
    
    const lines = rowsText.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      // Format: verseID $ id:type , id:type , …
      const parts = line.split('$');
      if (parts.length >= 2) {
        const verseID = parts[0].trim();
        const items = parts[1].split(',').map(item => item.trim());
        
        const entry = { P: [], F: [], V: [] };
        
        items.forEach(item => {
          const [idStr, type] = item.split(':');
          const id = parseInt(idStr);
          if (!isNaN(id) && ['P', 'F', 'V'].includes(type)) {
            entry[type as 'P' | 'F' | 'V'].push(id);
          }
        });
        
        rows[verseID] = entry;
      }
    });
    
    prophecyRows = rows;
    
    console.log(`✅ Loaded prophecy data: ${Object.keys(prophecyIndex).length} entries, ${Object.keys(prophecyRows).length} verses`);
    
    return { prophecyIndex, prophecyRows };
    
  } catch (error) {
    console.error('Failed to load prophecy data:', error);
    return { prophecyIndex: {}, prophecyRows: {} };
  }
};

export const buildProphecyMap = (verseIDs: string[]) => {
  if (!prophecyRows) return {};
  
  const result: Record<string, { P: number[], F: number[], V: number[] }> = {};
  
  verseIDs.forEach(verseID => {
    const entry = prophecyRows![verseID];
    if (entry) {
      result[verseID] = entry;
    }
  });
  
  return result;
};