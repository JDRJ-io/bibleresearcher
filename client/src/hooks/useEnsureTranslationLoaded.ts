// Translation loading helper that ensures translations are loaded before switching
import { masterCache } from '@/lib/supabaseClient';
import { loadTranslationOnce } from '@/lib/translationLoader';

export const useEnsureTranslationLoaded = () => {
  return async (id: string) => {
    const translationKey = `translation-${id}`;
    
    // 📡 DATA LOADING LOGGING - Translation Load Request
    const loadStartTime = performance.now();
    console.log(`📡 TRANSLATION LOAD - Request for ${id}:`, {
      translationId: id,
      cacheKey: translationKey,
      isCached: masterCache.has(translationKey),
      timestamp: new Date().toISOString()
    });
    
    if (!masterCache.has(translationKey)) {
      console.log(`🔄 TRANSLATION LOAD - Starting fetch for ${id}...`);
      try {
        // Load the translation using unified loader with deduplication
        const translationMap = await loadTranslationOnce(id);
        const loadEndTime = performance.now();
        const loadDuration = Math.round(loadEndTime - loadStartTime);
        
        console.log(`✅ TRANSLATION LOAD - Success for ${id}:`, {
          translationId: id,
          versesLoaded: translationMap.size,
          loadTimeMs: loadDuration,
          status: translationMap.size > 0 ? 'success' : 'empty',
          timestamp: new Date().toISOString()
        });
        
        // Show toast for loading failures
        if (translationMap.size === 0) {
          console.error(`🚨 TRANSLATION LOAD - Failed: ${id} - translation file may be missing:`, {
            translationId: id,
            versesLoaded: 0,
            loadTimeMs: loadDuration,
            status: 'failed-empty'
          });
        }
      } catch (error) {
        const loadEndTime = performance.now();
        const loadDuration = Math.round(loadEndTime - loadStartTime);
        
        console.error(`❌ TRANSLATION LOAD - Error for ${id}:`, {
          translationId: id,
          error: error instanceof Error ? error.message : String(error),
          loadTimeMs: loadDuration,
          status: 'failed-error',
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    } else {
      console.log(`✅ TRANSLATION LOAD - Cache hit for ${id}:`, {
        translationId: id,
        status: 'cached',
        loadTimeMs: Math.round(performance.now() - loadStartTime),
        timestamp: new Date().toISOString()
      });
    }
  };
};