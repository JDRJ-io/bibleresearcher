import { useState, useEffect } from 'react';
import { loadProphecy, parseProphecy } from '@/data/BibleDataAPI';

export function useProphecyLoader() {
  const [prophecyData, setProphecyData] = useState<Map<string, {P: any[], F: any[], V: any[]}>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadProphecyData = async () => {
    if (isLoaded || isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('🔄 Loading prophecy data from Supabase...');
      const prophecyText = await loadProphecy();
      const parsedProphecy = parseProphecy(prophecyText);
      
      setProphecyData(parsedProphecy);
      setIsLoaded(true);
      
      console.log(`✅ Loaded ${parsedProphecy.size} prophecy entries`);
      
    } catch (error) {
      console.error('Failed to load prophecy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProphecyData();
  }, []);

  return { prophecyData, isLoading, isLoaded };
}