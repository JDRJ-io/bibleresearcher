import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useBibleStore } from '@/App';
import { getRanges, getWash, isHighlightsV2Enabled, useHighlightsStore, isTombstoned } from '@/stores/highlightsStore';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export type DbRange = {
  id: string;
  verse_key: string;
  start_offset: number;   // 0-based, end-exclusive
  end_offset: number;
  color_hex: string;      // '#rrggbb'
  opacity?: number | null;
  note?: string | null;
};

/**
 * Deduplicate highlights, preferring server data over local optimistic data
 * This prevents React duplicate key warnings when both local and server versions exist
 */
function deduplicateHighlights(ranges: any[]): any[] {
  if (!ranges || ranges.length === 0) return [];
  
  // Group by position (start_offset:end_offset) to find potential duplicates
  const positionGroups = new Map<string, any[]>();
  
  for (const range of ranges) {
    const positionKey = `${range.start_offset}:${range.end_offset}`;
    if (!positionGroups.has(positionKey)) {
      positionGroups.set(positionKey, []);
    }
    positionGroups.get(positionKey)!.push(range);
  }
  
  const deduplicated: any[] = [];
  
  for (const group of Array.from(positionGroups.values())) {
    if (group.length === 1) {
      // No duplicates, use as-is
      deduplicated.push(group[0]);
    } else {
      // Multiple highlights at same position - apply deduplication rules
      const serverHighlights = group.filter((r: any) => r.origin === 'server');
      const localHighlights = group.filter((r: any) => r.origin === 'local');
      const nonTombstones = group.filter((r: any) => !r.tombstone);
      
      if (serverHighlights.length > 0) {
        // Prefer server data over local optimistic data
        deduplicated.push(serverHighlights[0]);
      } else if (nonTombstones.length > 0) {
        // Prefer non-tombstoned highlights
        deduplicated.push(nonTombstones[0]);
      } else if (localHighlights.length > 0) {
        // Use local data if that's all we have
        deduplicated.push(localHighlights[0]);
      }
      // Skip tombstoned highlights unless they're the only option
    }
  }
  
  return deduplicated;
}

/**
 * Normalize ranges: sort by start, merge overlapping/touching of same color
 * Prevents doubled characters and optimizes rendering
 */
function normalizeRanges(ranges: any[]): any[] {
  if (ranges.length === 0) return ranges;
  
  // Sort by start_offset
  const sorted = [...ranges].sort((a, b) => a.start_offset - b.start_offset);
  const normalized: any[] = [];
  
  for (const current of sorted) {
    const last = normalized[normalized.length - 1];
    
    if (!last) {
      normalized.push({ ...current });
      continue;
    }
    
    // Check if ranges touch or overlap and have same color
    const touching = current.start_offset <= last.end_offset;
    const sameColor = current.color_hex === last.color_hex;
    
    if (touching && sameColor) {
      // Merge ranges by extending end_offset
      last.end_offset = Math.max(last.end_offset, current.end_offset);
      // Keep the note from whichever range has one
      if (!last.note && current.note) {
        last.note = current.note;
      }
    } else {
      normalized.push({ ...current });
    }
  }
  
  return normalized;
}

// Ultra-optimized batch manager with intelligent prefetching - minimal logging, maximum performance
class HighlightBatchManager {
  private pendingRequests = new Map<string, Promise<Record<string, DbRange[]>>>();
  private requestCache = new Map<string, { data: Record<string, DbRange[]>; expires: number }>();
  private inFlightVerses = new Map<string, Set<string>>(); // Track which verses are being fetched per translation
  private prefetchQueues = new Map<string, Set<string>>(); // Per-translation prefetch queues
  private prefetchTimeouts = new Map<string, NodeJS.Timeout>(); // Per-translation timeouts
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly PREFETCH_DELAY = 100; // 100ms delay for prefetch batching

  async getBatch(verseRefs: string[], translation?: string | null): Promise<Record<string, DbRange[]>> {
    if (verseRefs.length === 0) return {};

    const tr = translation ?? 'null';
    const uniqueRefs = Array.from(new Set(verseRefs)); // Remove duplicates
    const sortedRefs = uniqueRefs.sort(); // Sort for consistent caching
    const cacheKey = `${tr}:${sortedRefs.join(',')}`;
    
    // Return cached result if available and not expired
    const cached = this.requestCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Return existing promise if batch is already pending
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    // Track which verses are in flight for this translation
    if (!this.inFlightVerses.has(tr)) {
      this.inFlightVerses.set(tr, new Set());
    }
    const inFlight = this.inFlightVerses.get(tr)!;
    sortedRefs.forEach(ref => inFlight.add(ref));

    const promise = this.executeBatch(sortedRefs, translation ?? null, cacheKey, tr);
    this.pendingRequests.set(cacheKey, promise);
    
    return promise;
  }

  private async executeBatch(verseRefs: string[], translation: string | null, cacheKey: string, tr: string): Promise<Record<string, DbRange[]>> {
    // DEFENSIVE GUARD: Return empty data when V2 is ON (graceful degradation)
    if (isHighlightsV2Enabled()) {
      logger.error('HL', 'V2 enabled but legacy fn_get_highlight_ranges called', { verses: verseRefs.length });
      // Return empty results instead of throwing to prevent UI crashes
      const emptyResult: Record<string, DbRange[]> = {};
      verseRefs.forEach(ref => {
        emptyResult[ref] = [];
      });
      return emptyResult;
    }
    
    try {
      logger.debug('HL', 'legacy batch fetch', { verses: verseRefs.length });
      
      const { data, error } = await supabase().rpc('fn_get_highlight_ranges', {
        p_verse_keys: verseRefs,
        p_translation: translation
      });
      
      if (error) throw error;
      
      // Group results by verse_key
      const grouped: Record<string, DbRange[]> = {};
      verseRefs.forEach(ref => {
        grouped[ref] = [];
      });
      
      (data ?? []).forEach((range: DbRange) => {
        if (grouped[range.verse_key]) {
          grouped[range.verse_key].push(range);
        }
      });
      
      // Cache individual verse results for better granular access
      verseRefs.forEach(ref => {
        const individualCacheKey = `${tr}:${ref}`;
        this.requestCache.set(individualCacheKey, {
          data: { [ref]: grouped[ref] || [] },
          expires: Date.now() + this.CACHE_TTL
        });
      });

      // Cache the full batch result
      this.requestCache.set(cacheKey, {
        data: grouped,
        expires: Date.now() + this.CACHE_TTL
      });
      
      return grouped;
    } finally {
      this.pendingRequests.delete(cacheKey);
      
      // Clear in-flight tracking for these verses
      const inFlight = this.inFlightVerses.get(tr);
      if (inFlight) {
        verseRefs.forEach(ref => inFlight.delete(ref));
        if (inFlight.size === 0) {
          this.inFlightVerses.delete(tr);
        }
      }
    }
  }

  // Intelligent prefetch method that works with viewport system
  async prefetchHighlights(verseRefs: string[], translation?: string | null, priority: 'high' | 'low' = 'low'): Promise<void> {
    if (verseRefs.length === 0) return;

    const tr = translation ?? 'null';
    const uniqueRefs = Array.from(new Set(verseRefs));
    
    // Filter out verses that are already cached or being fetched
    const inFlight = this.inFlightVerses.get(tr) || new Set();
    const uncachedRefs = uniqueRefs.filter(ref => {
      const individualCacheKey = `${tr}:${ref}`;
      const cached = this.requestCache.get(individualCacheKey);
      const isCached = cached && cached.expires > Date.now();
      const isInFlight = inFlight.has(ref);
      return !isCached && !isInFlight;
    });

    if (uncachedRefs.length === 0) return;

    // For high priority (user-requested), fetch immediately
    if (priority === 'high') {
      await this.getBatch(uncachedRefs, translation);
      return;
    }

    // For low priority (background prefetch), batch and delay per translation
    if (!this.prefetchQueues.has(tr)) {
      this.prefetchQueues.set(tr, new Set());
    }
    const queue = this.prefetchQueues.get(tr)!;
    uncachedRefs.forEach(ref => queue.add(ref));
    
    // Debounced prefetch execution per translation
    const existingTimeout = this.prefetchTimeouts.get(tr);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    const timeout = setTimeout(() => this.executePrefetchBatch(translation ?? null, tr), this.PREFETCH_DELAY);
    this.prefetchTimeouts.set(tr, timeout);
  }

  private async executePrefetchBatch(translation: string | null, tr: string): Promise<void> {
    const queue = this.prefetchQueues.get(tr);
    if (!queue || queue.size === 0) return;

    const verseRefs = Array.from(queue);
    queue.clear();
    this.prefetchTimeouts.delete(tr);

    if (verseRefs.length > 0) {
      // Execute prefetch without waiting for result (fire-and-forget)
      this.getBatch(verseRefs, translation).catch(() => {
        // Silently ignore prefetch errors to avoid disrupting user experience
      });
    }
  }

  // Invalidate cache for specific verses (used when highlights are created/updated)
  invalidateVerse(verseRef: string, translation?: string | null): void {
    const tr = translation ?? 'null';
    const pattern = `${tr}:`;
    
    // Remove all cache entries that include this verse
    Array.from(this.requestCache.entries()).forEach(([key]) => {
      if (key.startsWith(pattern) && key.includes(verseRef)) {
        this.requestCache.delete(key);
      }
    });
  }
}

const batchManager = new HighlightBatchManager();

export function useVerseHighlights(verseRef: string, translation?: string | null) {
  const tr = translation ?? null;
  const { getVisibleSlice } = useBibleStore();

  // Feature flag check - route to V2 or V1
  if (isHighlightsV2Enabled()) {
    return useVerseHighlightsV2(verseRef, tr);
  }

  // V1: Original batch-based network approach
  return useQuery<DbRange[], Error>({
    queryKey: ['hl:ranges', verseRef, tr],
    queryFn: async () => {
      // Get current viewport to batch with nearby verses
      const slice = getVisibleSlice();
      const viewportVerses = slice?.visibleKeys || [verseRef];
      
      // Always include the requested verse even if not in viewport
      const versesToBatch = Array.from(new Set([verseRef, ...viewportVerses]));
      
      const batchResult = await batchManager.getBatch(versesToBatch, translation);
      
      // Intelligent prefetching: Load highlights for verses likely to be scrolled to soon
      if (viewportVerses.length > 0) {
        const currentIndex = viewportVerses.indexOf(verseRef);
        if (currentIndex !== -1) {
          // Prefetch highlights for verses 20-40 positions ahead in scroll direction
          const prefetchStart = Math.max(0, currentIndex + 20);
          const prefetchEnd = Math.min(viewportVerses.length - 1, currentIndex + 40);
          const prefetchVerses = viewportVerses.slice(prefetchStart, prefetchEnd + 1);
          
          if (prefetchVerses.length > 0) {
            // Fire-and-forget prefetch for performance
            batchManager.prefetchHighlights(prefetchVerses, translation, 'low');
          }
        }
      }
      
      // Return highlights for this specific verse (maintaining original API)
      return batchResult[verseRef] || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - excellent caching for better performance
    gcTime: 10 * 60 * 1000,   // Keep cached for 10 minutes
  });
}

/**
 * V2: Memory-first highlights (zero network requests during scroll)
 */
function useVerseHighlightsV2(verseRef: string, translation: string | null) {
  const bibleStore = useBibleStore();
  const updateCounter = useHighlightsStore(state => state.updateCounter);
  
  // Get current translation from store if translation is null (exactly like V1 behavior)
  const effectiveTranslation = translation || bibleStore?.actives?.[0];
  
  const [ranges, setRanges] = useState<DbRange[]>([]);

  useEffect(() => {
    // Skip if no translation available yet (store not initialized)
    if (!effectiveTranslation) {
      setRanges([]);
      return;
    }
    
    // Read from memory store (O(1) lookup, instant)
    const memoryRanges = getRanges(effectiveTranslation, verseRef);
    
    // Filter out tombstoned items
    const liveRanges = memoryRanges.filter(range => !isTombstoned(range.id));
    
    // DEDUPLICATION: Remove duplicates, prefer server over local data
    const deduplicatedRanges = deduplicateHighlights(liveRanges);
    
    // NORMALIZATION: Sort, merge overlaps/touching of same color  
    const normalizedRanges = normalizeRanges(deduplicatedRanges);
    
    // Convert from internal Range type to DbRange type for API compatibility
    const dbRanges: DbRange[] = normalizedRanges.map(range => ({
      id: range.id,
      verse_key: range.verse_key,
      start_offset: range.start_offset,
      end_offset: range.end_offset,
      color_hex: range.color_hex,
      opacity: range.opacity,
      note: range.note,
    }));

    setRanges(dbRanges);
  }, [verseRef, effectiveTranslation, updateCounter]); // React to store updates

  // Return in React Query format for API compatibility
  return {
    data: ranges,
    isLoading: false, // Always instant since reading from memory
    error: null,
    refetch: () => {
      // Force re-read from memory
      if (!effectiveTranslation) {
        setRanges([]);
        return Promise.resolve({ data: [] });
      }
      
      const memoryRanges = getRanges(effectiveTranslation, verseRef);
      const deduplicatedRanges = deduplicateHighlights(memoryRanges);
      const dbRanges: DbRange[] = deduplicatedRanges.map(range => ({
        id: range.id,
        verse_key: range.verse_key,
        start_offset: range.start_offset,
        end_offset: range.end_offset,
        color_hex: range.color_hex,
        opacity: range.opacity,
        note: range.note,
      }));
      setRanges(dbRanges);
      return Promise.resolve({ data: dbRanges });
    },
  };
}

// Hook for prefetching highlights based on viewport changes (integration with scroll system)
export function useHighlightPrefetching() {
  const { getVisibleSlice } = useBibleStore();
  
  return {
    prefetchForViewport: (translation?: string | null) => {
      const slice = getVisibleSlice();
      if (slice?.visibleKeys && slice.visibleKeys.length > 0) {
        // Prefetch highlights for all visible verses
        batchManager.prefetchHighlights(slice.visibleKeys, translation, 'high');
      }
    },
    
    prefetchForRange: (verseRefs: string[], translation?: string | null) => {
      batchManager.prefetchHighlights(verseRefs, translation, 'low');
    },
    
    invalidateVerse: (verseRef: string, translation?: string | null) => {
      batchManager.invalidateVerse(verseRef, translation);
    }
  };
}

// For future auto-highlighting of full verses
export type VerseLevel = { 
  verse_key: string; 
  color_hex: string; 
  opacity?: number | null; 
  note?: string | null 
};

export function useVerseLevelHighlight(verseRef: string) {
  // Feature flag check - route to V2 or V1
  if (isHighlightsV2Enabled()) {
    return useVerseLevelHighlightV2(verseRef);
  }

  // V1: Original network-based approach
  return useQuery<VerseLevel | null, Error>({
    queryKey: ['hl:verse', verseRef],
    queryFn: async () => {
      // DEFENSIVE GUARD: Hard-disable old endpoints when V2 is ON
      if (isHighlightsV2Enabled()) {
        logger.error('HL', 'V2 enabled but legacy fn_get_verse_highlights called');
        throw new Error('V2 active: per-verse fetch disabled - fn_get_verse_highlights should not be called');
      }
      
      logger.debug('HL', 'legacy verse fetch', { verse: verseRef });
      
      const { data, error } = await supabase().rpc('fn_get_verse_highlights', { 
        p_verse_keys: [verseRef] 
      });
      if (error) throw error;
      const row = (data ?? []).find((v: VerseLevel) => v.verse_key === verseRef);
      return row ?? null;
    },
    staleTime: 15_000
  });
}

/**
 * V2: Memory-first verse-level highlights (wash)
 */
function useVerseLevelHighlightV2(verseRef: string) {
  const updateCounter = useHighlightsStore(state => state.updateCounter);
  const [wash, setWash] = useState<VerseLevel | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    // Read wash highlight from memory store (O(1) lookup, instant)
    const memoryWash = getWash(verseRef);
    
    // Filter out tombstoned wash
    const filteredWash = memoryWash && !isTombstoned(memoryWash.id) ? memoryWash : null;
    
    if (filteredWash) {
      // Convert from internal Wash type to VerseLevel type for API compatibility
      const verseLevel: VerseLevel = {
        verse_key: filteredWash.verse_key,
        color_hex: filteredWash.color_hex,
        opacity: filteredWash.opacity,
        note: filteredWash.note,
      };
      setWash(verseLevel);
    } else {
      setWash(null);
    }
  }, [verseRef, updateCounter]); // React to store updates

  // Return in React Query format for API compatibility
  return {
    data: wash,
    isLoading: false, // Always instant since reading from memory
    error: null,
    refetch: () => {
      setForceUpdate((prev: number) => prev + 1);
      return Promise.resolve({ data: wash });
    },
  };
}