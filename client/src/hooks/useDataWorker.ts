import { useState, useEffect, useRef } from 'react';

interface WorkerData {
  translations: Record<string, Record<string, string>>;
  crossRefSets: Record<string, Record<string, string[]>>;
  prophecyByVerse: Record<string, {
    pred: string[];
    ful: string[];
    ver: string[];
    titles: string[];
  }>;
}

interface WorkerStats {
  translationsCount: number;
  crossRefsCount: number;
  prophecyCount: number;
}

export function useDataWorker() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<WorkerStats | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  const dataRef = useRef<WorkerData | null>(null);

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker('/dataWorker.js');
    
    workerRef.current.onmessage = (e) => {
      const { type, data, stats: workerStats, error: workerError } = e.data;
      
      switch (type) {
        case 'TRANSLATIONS_LOADED':
          setLoadingStage('Translations loaded');
          setProgress(33);
          break;
          
        case 'CROSS_REFS_LOADED':
          setLoadingStage('Cross-references loaded');
          setProgress(66);
          break;
          
        case 'PROPHECY_LOADED':
          setLoadingStage('Prophecy data loaded');
          setProgress(90);
          break;
          
        case 'DATA_READY':
          // Store data in memory for singleton access
          dataRef.current = data;
          setStats(workerStats);
          
          // Make data globally available as per specification
          if (typeof window !== 'undefined') {
            (window as any).translationData = data.translations;
            (window as any).crossRefSets = data.crossRefSets;
            (window as any).prophecyByVerse = data.prophecyByVerse;
          }
          
          setIsReady(true);
          setIsLoading(false);
          setLoadingStage('Complete');
          setProgress(100);
          break;
          
        case 'ERROR':
          setError(workerError);
          setIsLoading(false);
          break;
      }
    };
    
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const loadData = async () => {
    if (!workerRef.current || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      // Load translations
      setLoadingStage('Loading translations...');
      workerRef.current.postMessage({
        type: 'LOAD_TRANSLATIONS',
        data: [
          { code: 'KJV', url: 'https://cjbtgubygotlxuhlchac.supabase.co/storage/v1/object/public/bibles/KJV.txt' },
          { code: 'ESV', url: 'https://cjbtgubygotlxuhlchac.supabase.co/storage/v1/object/public/bibles/ESV.txt' },
          { code: 'NIV', url: 'https://cjbtgubygotlxuhlchac.supabase.co/storage/v1/object/public/bibles/NIV.txt' }
        ]
      });
      
      // Small delay to allow translations to start loading
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Load cross-references
      setLoadingStage('Loading cross-references...');
      workerRef.current.postMessage({
        type: 'LOAD_CROSS_REFS',
        data: [
          { name: 'default', url: 'https://cjbtgubygotlxuhlchac.supabase.co/storage/v1/object/public/bibles/cross-references.txt' },
          { name: 'cf1', url: 'https://cjbtgubygotlxuhlchac.supabase.co/storage/v1/object/public/bibles/cf1.txt' },
          { name: 'cf2', url: 'https://cjbtgubygotlxuhlchac.supabase.co/storage/v1/object/public/bibles/cf2.txt' }
        ]
      });
      
      // Load prophecy data
      setLoadingStage('Loading prophecy data...');
      workerRef.current.postMessage({
        type: 'LOAD_PROPHECY',
        data: { url: 'https://cjbtgubygotlxuhlchac.supabase.co/storage/v1/object/public/bibles/prophecy.txt' }
      });
      
      // Request final data compilation
      await new Promise(resolve => setTimeout(resolve, 1000));
      workerRef.current.postMessage({ type: 'GET_DATA' });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setIsLoading(false);
    }
  };

  const getData = () => dataRef.current;

  return {
    isReady,
    isLoading,
    loadingStage,
    progress,
    error,
    stats,
    loadData,
    getData
  };
}

// Helper functions for row creation as per specification
export function makeClickableRef(ref: string, onJump: (id: string) => void): string {
  if (/^1?Macc/.test(ref)) return ref; // skip Maccabees
  const id = ref.replace(/[.:]/g, "_");
  return `<a href="#" onclick="window.jumpToVerse('${id}')">${ref}</a>`;
}

export function makeLinkWithPreview(ref: string, activeCode: string, onJump: (id: string) => void): string {
  const html = makeClickableRef(ref, onJump);
  const txt = (window as any).translationData?.[activeCode]?.[ref] || "";
  return txt ? `${html}: ${txt.substring(0, 50)}...` : html;
}

export function buildProphecyHTML(verses: string[], titles: string[]): string {
  if (!verses.length) return '';
  
  const uniqueTitles = Array.from(new Set(titles));
  const titleHTML = uniqueTitles.map(title => `<strong>${title}</strong>`).join('<br>');
  const versesHTML = verses.map(v => `<div>${v}</div>`).join('');
  
  return `${titleHTML}<br>${versesHTML}`;
}

// Global jump function
if (typeof window !== 'undefined') {
  (window as any).jumpToVerse = (id: string) => {
    const ref = id.replace(/_/g, '.');
    const event = new CustomEvent('jumpToVerse', { detail: { reference: ref } });
    window.dispatchEvent(event);
  };
}