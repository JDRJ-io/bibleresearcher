import { useState, useEffect } from 'react';
import { getContextGroups } from '@/data/BibleDataAPI';

interface ContextBoundary {
  startVerse: string;
  endVerse: string;
  groupIndex: number;
}

// Convert pipe format to dot format for consistency
function convertToDotFormat(verseId: string): string {
  // Convert "Gen|1|1" to "Gen.1:1"
  const parts = verseId.split('|');
  if (parts.length !== 3) return verseId;
  return `${parts[0]}.${parts[1]}:${parts[2]}`;
}

export function useContextBoundaries() {
  const [contextMap, setContextMap] = useState<Map<string, ContextBoundary>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContextBoundaries();
  }, []);

  const loadContextBoundaries = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const contextGroups = await getContextGroups();
      const newContextMap = new Map<string, ContextBoundary>();
      
      // Process each context group
      contextGroups.forEach((group, groupIndex) => {
        if (group.length === 0) return;
        
        // Convert all verses in the group to dot format
        const dotFormatVerses = group.map(v => convertToDotFormat(v));
        const startVerse = dotFormatVerses[0];
        const endVerse = dotFormatVerses[dotFormatVerses.length - 1];
        
        // Map each verse in the group to its boundary info
        dotFormatVerses.forEach(verse => {
          newContextMap.set(verse, {
            startVerse,
            endVerse,
            groupIndex
          });
        });
      });
      
      setContextMap(newContextMap);
      
    } catch (err) {
      console.error('Failed to load context boundaries:', err);
      setError('Failed to load context boundaries');
    } finally {
      setIsLoading(false);
    }
  };

  // Get the context boundary for a specific verse
  const getContextBoundary = (verseId: string): ContextBoundary | null => {
    return contextMap.get(verseId) || null;
  };

  // Check if a verse is at the start of a context group
  const isContextStart = (verseId: string): boolean => {
    const boundary = contextMap.get(verseId);
    return boundary ? boundary.startVerse === verseId : false;
  };

  // Check if a verse is at the end of a context group
  const isContextEnd = (verseId: string): boolean => {
    const boundary = contextMap.get(verseId);
    return boundary ? boundary.endVerse === verseId : false;
  };

  // Get all verses in the same context group
  const getContextGroup = (verseId: string): string[] => {
    const boundary = contextMap.get(verseId);
    if (!boundary) return [verseId];
    
    // Find all verses with the same groupIndex
    const group: string[] = [];
    contextMap.forEach((b, v) => {
      if (b.groupIndex === boundary.groupIndex) {
        group.push(v);
      }
    });
    
    return group;
  };

  return {
    contextMap,
    isLoading,
    error,
    getContextBoundary,
    isContextStart,
    isContextEnd,
    getContextGroup
  };
}