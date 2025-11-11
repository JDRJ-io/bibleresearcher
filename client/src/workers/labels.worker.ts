import { logger } from "@/lib/logger";
// Labels Web Worker - handles fetching and parsing label data off main thread
import { LabelBits } from '../lib/labelBits';

// In-worker cache so we never fetch/parse the same translation twice
const fileCache: Record<string, Record<string, any>> = {};  // {KJV:{Gen.1:1:{…}}}

// Helper functions defined outside message handler
const normaliseVerseKey = (v: string): string => v.trim();
const normaliseLabel = (lbl: string): string => lbl.toLowerCase();

self.onmessage = async (e: MessageEvent) => {
  logger.debug('SW', `📨 Worker: Received message:`, e.data);
  const { tCode, active, requiredVerses } = e.data as { 
    tCode: string; 
    active: (keyof typeof LabelBits)[]; 
    requiredVerses?: string[];
  };

  if (!fileCache[tCode]) {
    try {
      // 1) FETCH – Use correct Supabase URL and file path structure for labels
      const supabaseUrl = 'https://ecaqvxbbscwcxbjpfrdm.supabase.co/storage/v1/object/public/anointed';
      const url = `${supabaseUrl}/labels/${tCode}/ALL.json`;
      logger.debug('SW', `📤 Worker: Fetching labels from ${url}`);
      const res = await fetch(url, { cache: 'force-cache' });
      
      if (!res.ok) {
        // If file doesn't exist, return empty data
        logger.warn('SW', `⚠️ Worker: Labels file not found for ${tCode} at ${url} (Status: ${res.status}), returning empty data`);
        fileCache[tCode] = {};
        postMessage({ tCode, filtered: {} });
        return;
      }
      
      const raw = await res.text();

      // 2) PARSE (blocking inside Worker, safe for UI)
      const rawJson = JSON.parse(raw);
      
      const src: any = {};
      for (const [vk, entry] of Object.entries(rawJson)) {
        src[normaliseVerseKey(vk)] = entry;
      }
      fileCache[tCode] = src;
      
      logger.debug('SW', `✅ Worker: Loaded ${Object.keys(fileCache[tCode]).length} verse labels for ${tCode}`);
    } catch (error) {
      logger.error('SW', `Worker: Error loading labels for ${tCode}:`, error);
      fileCache[tCode] = {};
      postMessage({ tCode, filtered: {} });
      return;
    }
  }
  
  const src = fileCache[tCode];

  // 3) FILTER to active labels only -> dramatically smaller object
  const wanted = new Set(active.map(normaliseLabel));
  const filtered: Record<string, Record<string, string[]>> = {};
  
  logger.debug('SW', `🔍 Worker: Filtering for active labels from ${Object.keys(src).length} verses`);
  
  if (requiredVerses && requiredVerses.length > 0) {
    logger.debug('SW', `🎯 Worker: Focusing on specific ${requiredVerses.length} required verses (including cross-refs/prophecies)`);
    
    // Only process required verses for efficiency 
    const requiredSet = new Set(requiredVerses.map(v => v.trim()));
    
    // Process all required verses, even if they have no labels (to avoid perpetual re-loading)
    requiredVerses.forEach(vRef => {
      const vKey = vRef.trim();
      const entry = src[vKey];
      
      const slim: Record<string, string[]> = {};
      if (entry) {
        wanted.forEach(lbl => {
          if (entry[lbl]?.length) {
            slim[lbl] = entry[lbl];
          }
        });
      }
      
      // Always add to filtered, even if empty (marks verse as "checked")
      filtered[vKey] = slim;
    });
  } else {
    // Process all verses (original behavior)
    for (const [vKey, entry] of Object.entries(src)) {
      const slim: Record<string, string[]> = {};
      wanted.forEach(lbl => {
        if (entry[lbl]?.length) {
          slim[lbl] = entry[lbl];
        }
      });
      if (Object.keys(slim).length) {
        filtered[vKey] = slim;
      }
    }
  }

  // Show example of filtered data
  const examples = Object.entries(filtered).slice(0, 3);
  logger.debug('SW', `✅ Worker: Filtered ${Object.keys(filtered).length} verses with active labels for ${tCode}`);
  logger.debug('SW', `🏷️ Worker: Example filtered data:`, examples);

  // 4) POST back to main thread
  postMessage({ tCode, filtered });
};