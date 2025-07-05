import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { BibleVerse } from "@/types/bible";

/**
 * Fast Bible Data Hook - Loads all verse data upfront to eliminate lag
 * 
 * This approach loads the complete Bible with all verse text at startup,
 * eliminating the need for constant fetching during navigation.
 * Memory usage is optimized by using efficient data structures.
 */
export function useFastBibleData() {
  const [allVerses, setAllVerses] = useState<BibleVerse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentCenterVerse, setCurrentCenterVerse] = useState(0);
  const [navigationHistory, setNavigationHistory] = useState<number[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  // Global verse text cache for instant access
  const [verseTextCache, setVerseTextCache] = useState<Map<string, string>>(new Map());
  const [crossReferencesCache, setCrossReferencesCache] = useState<Map<string, any[]>>(new Map());

  // Load complete Bible data once at startup
  useEffect(() => {
    loadCompleteBibleData();
  }, []);

  const loadCompleteBibleData = async () => {
    try {
      console.log("🚀 Starting fast Bible data loading...");
      setLoadingProgress(10);

      // 1. Load verse index first
      console.log("📋 Loading verse keys from Supabase...");
      const verseKeysUrl = "https://ecaqvxbbscwcxbjpfrdm.supabase.co/storage/v1/object/public/anointed/metadata/verseKeys-canonical.json";
      const verseKeysResponse = await fetch(verseKeysUrl);
      
      if (!verseKeysResponse.ok) {
        throw new Error(`Failed to load verse keys: ${verseKeysResponse.status}`);
      }
      
      const verseKeysData = await verseKeysResponse.json();
      const verseKeys = verseKeysData.verseKeys || [];
      
      console.log(`📋 Loaded ${verseKeys.length} verse keys`);
      setLoadingProgress(30);

      // 2. Load complete KJV text
      console.log("📖 Loading KJV text from Supabase...");
      const kjvUrl = "https://ecaqvxbbscwcxbjpfrdm.supabase.co/storage/v1/object/public/anointed/translations/KJV.txt";
      const kjvResponse = await fetch(kjvUrl);
      
      if (!kjvResponse.ok) {
        throw new Error(`Failed to load KJV text: ${kjvResponse.status}`);
      }
      
      const kjvText = await kjvResponse.text();
      
      console.log(`📖 Loaded KJV text (${kjvText.length} characters)`);
      setLoadingProgress(50);

      // 3. Parse all verse texts into cache
      const textCache = new Map<string, string>();
      const lines = kjvText.split('\n');
      
      lines.forEach(line => {
        if (line.includes('#')) {
          const parts = line.split('#');
          if (parts.length >= 2) {
            const reference = parts[0].trim();
            const text = parts[1].trim();
            
            // Store in multiple reference formats for fast lookup
            textCache.set(reference, text);
            textCache.set(reference.replace('.', ' ').replace(':', ':'), text);
            textCache.set(reference.replace(' ', '.'), text);
          }
        }
      });
      
      console.log(`💾 Cached ${textCache.size} verse texts`);
      setLoadingProgress(70);

      // 4. Create complete verse objects
      const verses: BibleVerse[] = verseKeys.map((key: string, index: number) => {
        const match = key.match(/^(\w+)\.(\d+):(\d+)$/);
        if (!match) return null;
        
        const [, book, chapter, verse] = match;
        const reference = `${book} ${chapter}:${verse}`;
        const dotReference = `${book}.${chapter}:${verse}`;
        
        // Get verse text from cache
        const text = textCache.get(dotReference) || 
                    textCache.get(reference) || 
                    textCache.get(key) || 
                    `Loading ${reference}...`;

        return {
          id: `${book.toLowerCase()}-${chapter}-${verse}-${index}`,
          index,
          book,
          chapter: parseInt(chapter),
          verse: parseInt(verse),
          reference,
          text: { KJV: text },
          crossReferences: [],
          strongsWords: [],
          labels: ["kjv-loaded"],
          contextGroup: "standard",
          height: 120, // Fixed height for virtual scrolling
        };
      }).filter(Boolean) as BibleVerse[];

      setAllVerses(verses);
      setVerseTextCache(textCache);
      setLoadingProgress(90);

      // 5. Load cross-references
      await loadCrossReferences();
      
      setLoadingProgress(100);
      setIsLoading(false);
      
      console.log(`✅ Fast Bible loading complete: ${verses.length} verses ready`);
      
    } catch (error) {
      console.error("❌ Failed to load Bible data:", error);
      setIsLoading(false);
    }
  };

  const loadCrossReferences = async () => {
    try {
      // Load cross-references from cf1 set
      const cf1Response = await fetch("/attached_assets/cross-references.txt");
      const cf1Text = await cf1Response.text();
      
      const crossRefMap = new Map<string, any[]>();
      const lines = cf1Text.split('\n');
      
      lines.forEach(line => {
        if (line.includes('$$')) {
          const parts = line.split('$$');
          if (parts.length >= 2) {
            const mainRef = parts[0].trim();
            const references = parts[1].split(/[#$]/).map(ref => ref.trim()).filter(Boolean);
            
            const crossRefs = references.map(ref => ({
              reference: ref,
              text: verseTextCache.get(ref) || `Loading ${ref}...`
            }));
            
            crossRefMap.set(mainRef, crossRefs);
          }
        }
      });
      
      setCrossReferencesCache(crossRefMap);
      console.log(`🔗 Loaded ${crossRefMap.size} cross-reference sets`);
      
    } catch (error) {
      console.warn("Failed to load cross-references:", error);
    }
  };

  // Fast navigation without fetching
  const navigateToVerse = async (reference: string) => {
    console.log(`🎯 Fast navigation to: ${reference}`);
    
    // Normalize reference format
    const normalizedRef = reference.replace(/\s+/g, ' ').trim();
    
    // Find target verse index
    const targetIndex = allVerses.findIndex(verse => 
      verse.reference === normalizedRef || 
      verse.reference.replace(/\s+/g, ' ') === normalizedRef
    );
    
    if (targetIndex === -1) {
      console.warn(`❌ Verse not found: ${reference}`);
      return;
    }
    
    // Add to navigation history
    const newHistory = [...navigationHistory.slice(0, currentHistoryIndex + 1), targetIndex];
    setNavigationHistory(newHistory);
    setCurrentHistoryIndex(newHistory.length - 1);
    
    // Update center verse for virtual scrolling
    setCurrentCenterVerse(targetIndex);
    
    // Scroll to target verse
    setTimeout(() => {
      const targetVerse = allVerses[targetIndex];
      const element = document.getElementById(`verse-${targetVerse.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight effect
        element.classList.add('verse-highlight');
        setTimeout(() => element.classList.remove('verse-highlight'), 2000);
      }
    }, 100);
    
    console.log(`✅ Fast navigation complete to index ${targetIndex}`);
  };

  // Back/forward navigation
  const goBack = () => {
    if (currentHistoryIndex > 0) {
      const previousIndex = navigationHistory[currentHistoryIndex - 1];
      setCurrentHistoryIndex(currentHistoryIndex - 1);
      setCurrentCenterVerse(previousIndex);
      
      // Scroll to previous verse
      const targetVerse = allVerses[previousIndex];
      if (targetVerse) {
        setTimeout(() => {
          const element = document.getElementById(`verse-${targetVerse.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  };

  const goForward = () => {
    if (currentHistoryIndex < navigationHistory.length - 1) {
      const nextIndex = navigationHistory[currentHistoryIndex + 1];
      setCurrentHistoryIndex(currentHistoryIndex + 1);
      setCurrentCenterVerse(nextIndex);
      
      // Scroll to next verse
      const targetVerse = allVerses[nextIndex];
      if (targetVerse) {
        setTimeout(() => {
          const element = document.getElementById(`verse-${targetVerse.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  };

  const canGoBack = currentHistoryIndex > 0;
  const canGoForward = currentHistoryIndex < navigationHistory.length - 1;

  // Get verse text instantly from cache
  const getVerseText = (reference: string): string => {
    return verseTextCache.get(reference) || 
           verseTextCache.get(reference.replace(' ', '.')) || 
           verseTextCache.get(reference.replace('.', ' ')) || 
           `Loading ${reference}...`;
  };

  // Get cross-references instantly from cache
  const getCrossReferences = (reference: string): any[] => {
    return crossReferencesCache.get(reference) || 
           crossReferencesCache.get(reference.replace(' ', '.')) || 
           crossReferencesCache.get(reference.replace('.', ' ')) || 
           [];
  };

  return {
    allVerses,
    isLoading,
    loadingProgress,
    currentCenterVerse,
    navigateToVerse,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    getVerseText,
    getCrossReferences,
    totalRows: allVerses.length,
  };
}