import { useState, useEffect } from 'react';
import { ProphecyDetail } from '@/types/bible';

interface ProphecyVerse {
  P: number[]; // Prediction IDs
  F: number[]; // Fulfillment IDs 
  V: number[]; // Verification IDs
}

export function useProphecy() {
  const [prophecyRows, setProphecyRows] = useState<Map<string, ProphecyVerse>>(new Map());
  const [prophecyIndex, setProphecyIndex] = useState<Map<number, ProphecyDetail>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Load prophecy data on first toggle
  useEffect(() => {
    const loadProphecyData = async () => {
      setIsLoading(true);
      try {
        // Load prophecy_rows.txt
        const rowsResponse = await fetch('/api/prophecy/rows');
        const rowsText = await rowsResponse.text();
        
        const parsedRows = new Map<string, ProphecyVerse>();
        
        rowsText.split('\n').forEach(line => {
          if (!line.trim()) return;
          
          const [verseId, itemsStr] = line.split('$');
          if (!verseId || !itemsStr) return;
          
          const items = itemsStr.split(',');
          const prophecyVerse: ProphecyVerse = { P: [], F: [], V: [] };
          
          items.forEach(item => {
            const [id, type] = item.split(':');
            const numId = parseInt(id);
            
            if (type === 'P') prophecyVerse.P.push(numId);
            else if (type === 'F') prophecyVerse.F.push(numId);
            else if (type === 'V') prophecyVerse.V.push(numId);
          });
          
          parsedRows.set(verseId, prophecyVerse);
        });
        
        setProphecyRows(parsedRows);
        
        // Load prophecy_index.json
        const indexResponse = await fetch('/api/prophecy/index');
        const indexData = await indexResponse.json();
        
        const parsedIndex = new Map<number, ProphecyDetail>();
        Object.entries(indexData).forEach(([id, detail]: [string, any]) => {
          parsedIndex.set(parseInt(id), detail);
        });
        
        setProphecyIndex(parsedIndex);
      } catch (error) {
        console.error('Failed to load prophecy data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProphecyData();
  }, []);

  const getProphecyForVerse = (verseId: string): ProphecyVerse | null => {
    return prophecyRows.get(verseId) || null;
  };

  const openProphecyDetail = (id: number) => {
    const detail = prophecyIndex.get(id);
    if (detail) {
      // Open side drawer with prophecy detail
      console.log('Opening prophecy detail:', detail);
      // TODO: Implement prophecy detail modal/drawer
    }
  };

  return {
    getProphecyForVerse,
    openProphecyDetail,
    isLoading,
    stats: {
      totalProphecies: prophecyIndex.size,
      totalVerses: prophecyRows.size
    }
  };
}