import { useState, useEffect } from 'react';
import { initializeBibleStructure, populateTranslation, populateCrossReferences, populateContextGroups } from '@/lib/bibleDataOptimized';
import { loadVerseKeys } from '@/lib/supabaseLoader';
import type { BibleVerse } from '@/types/bible';

interface BibleInitState {
  verses: BibleVerse[];
  isLoading: boolean;
  loadingStage: string;
  loadingPercentage: number;
  error: string | null;
}

export function useBibleInit() {
  const [state, setState] = useState<BibleInitState>({
    verses: [],
    isLoading: true,
    loadingStage: 'initializing',
    loadingPercentage: 0,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    const initializeBible = async () => {
      try {
        // Stage 1: Load verse structure (20%)
        setState(prev => ({ ...prev, loadingStage: 'structure', loadingPercentage: 10 }));
        
        const verses = await initializeBibleStructure();
        
        if (!mounted) return;
        setState(prev => ({ 
          ...prev, 
          verses,
          loadingPercentage: 20 
        }));

        // Stage 2: Load KJV text (40%)
        setState(prev => ({ ...prev, loadingStage: 'kjv-text', loadingPercentage: 25 }));
        
        await populateTranslation(verses, 'KJV', 0, verses.length);
        
        if (!mounted) return;
        setState(prev => ({ ...prev, loadingPercentage: 40 }));

        // Stage 3: Load cross-references (60%)
        setState(prev => ({ ...prev, loadingStage: 'cross-refs', loadingPercentage: 50 }));
        
        await populateCrossReferences(verses, 'cf1');
        
        if (!mounted) return;
        setState(prev => ({ ...prev, loadingPercentage: 60 }));

        // Stage 4: Load context groups (80%)
        setState(prev => ({ ...prev, loadingStage: 'context', loadingPercentage: 70 }));
        
        await populateContextGroups(verses);
        
        if (!mounted) return;
        setState(prev => ({ ...prev, loadingPercentage: 80 }));

        // Stage 5: Finalize (100%)
        setState(prev => ({ ...prev, loadingStage: 'finalizing', loadingPercentage: 90 }));
        
        // Final state
        if (!mounted) return;
        setState({
          verses,
          isLoading: false,
          loadingStage: 'complete',
          loadingPercentage: 100,
          error: null
        });

        console.log('Bible initialization complete!');

      } catch (error) {
        console.error('Bible initialization error:', error);
        if (!mounted) return;
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize Bible data'
        }));
      }
    };

    initializeBible();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}