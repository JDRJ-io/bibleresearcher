import { getContextGroups } from '@/data/BibleDataAPI';
import { logger } from '@/lib/logger';

// Cache for context groups data
let contextGroupsCache: string[][] | null = null;
let contextBoundariesCache: Set<string> | null = null;

// Convert pipe format (Gen|1|1) to dot format (Gen.1:1)
function pipeToDotFormat(pipeRef: string): string {
  const parts = pipeRef.split('|');
  if (parts.length === 3) {
    const [book, chapter, verse] = parts;
    return `${book}.${chapter}:${verse}`;
  }
  return pipeRef;
}

// Load context groups and build boundary set
export async function loadContextBoundaries(): Promise<Set<string>> {
  if (contextBoundariesCache) {
    return contextBoundariesCache;
  }

  try {
    logger.debug('CTX', 'loading context groups');
    
    // Load context groups from Supabase storage
    const groups = await getContextGroups();
    contextGroupsCache = groups;
    
    // Build a set of verse references that are at the END of each context group
    const boundaries = new Set<string>();
    
    for (const group of groups) {
      if (group.length > 0) {
        // The last verse in each group is a boundary
        const lastVerseInGroup = group[group.length - 1];
        const dotFormat = pipeToDotFormat(lastVerseInGroup);
        boundaries.add(dotFormat);
      }
    }
    
    logger.debug('CTX', 'loaded context boundaries', { 
      groups: groups.length, 
      boundaries: boundaries.size 
    });
    
    contextBoundariesCache = boundaries;
    return boundaries;
    
  } catch (error) {
    logger.error('CTX', 'failed to load context groups', error);
    return new Set();
  }
}

// Check if a verse is at the end of a context group
export function isContextBoundary(verseRef: string, boundaries: Set<string>): boolean {
  return boundaries.has(verseRef);
}

// Reset cache (useful for testing)
export function resetContextCache(): void {
  contextGroupsCache = null;
  contextBoundariesCache = null;
}
