import { useEffect, useState } from 'react';
import { useTranslationMaps } from './useTranslationMaps';
import { useToast } from './use-toast';

/**
 * Boot-time smoke test for Bible initialization
 * Task 2.3: Loop through mainTranslation + alternates; if any empty, 
 * set a global translationWarning flag that renders a badge in TopHeader.tsx
 */
export function useBibleInit() {
  const [translationWarning, setTranslationWarning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { mainTranslation, alternates, getVerseText } = useTranslationMaps();
  const { toast } = useToast();

  useEffect(() => {
    const runSmokeTest = async () => {
      // Wait for initial translation to be loaded
      if (!mainTranslation) return;
      
      console.log('🔍 Running boot-time smoke test...');
      
      const allTranslations = [mainTranslation, ...alternates];
      let hasWarnings = false;
      
      for (const translation of allTranslations) {
        // Test with a few common verses
        const testVerses = ['Gen.1:1', 'John.3:16', 'Ps.23:1'];
        const emptyCount = testVerses.filter(verse => !getVerseText(verse, translation)).length;
        
        if (emptyCount > 0) {
          console.warn(`⚠️ TRANSLATION WARNING: ${translation} missing ${emptyCount}/${testVerses.length} test verses`);
          hasWarnings = true;
        }
      }
      
      setTranslationWarning(hasWarnings);
      setIsInitialized(true);
      
      if (hasWarnings) {
        toast({
          title: "Translation Warning",
          description: "Some translations may be incomplete. Check console for details.",
          variant: "destructive",
        });
      }
    };
    
    runSmokeTest();
  }, [mainTranslation, alternates, getVerseText, toast]);

  return {
    translationWarning,
    isInitialized
  };
}