// Instrumented API wrapper for BibleDataAPI
// This wraps all BibleDataAPI operations with comprehensive logging

import { globalLogger, logFile, logData, logPerf, logCache, logError, measurePerformanceAsync } from './globalLogger';

// Store reference to original BibleDataAPI functions
let originalAPI: any = null;

// Create instrumented wrapper
export const createInstrumentedAPI = (BibleDataAPI: any) => {
  if (originalAPI) return originalAPI; // Prevent double-wrapping
  
  originalAPI = { ...BibleDataAPI };
  
  // Wrap fetchFromStorage
  const originalFetchFromStorage = BibleDataAPI.fetchFromStorage;
  BibleDataAPI.fetchFromStorage = async function(path: string) {
    return measurePerformanceAsync(`fetchFromStorage:${path}`, async () => {
      try {
        logFile(path, 'read', { type: 'supabase-storage', method: 'fetchFromStorage' });
        const result = await originalFetchFromStorage.call(this, path);
        logData('supabase-storage', 'memory-cache', 'file-content', 'loaded', { 
          path, 
          size: result?.length || 0 
        });
        return result;
      } catch (error) {
        logError(error, 'fetchFromStorage', { path });
        throw error;
      }
    }, { path });
  };

  // Wrap getTranslation
  const originalGetTranslation = BibleDataAPI.getTranslation;
  BibleDataAPI.getTranslation = async function(translationCode: string) {
    return measurePerformanceAsync(`getTranslation:${translationCode}`, async () => {
      try {
        // Check if in cache first
        const cacheKey = `translation:${translationCode}`;
        const cached = BibleDataAPI.translationCache?.get(translationCode);
        
        if (cached) {
          logCache(cacheKey, 'hit', { translationCode, verses: cached.size });
          logData('translation-cache', 'component', 'translation-data', 'cache-hit', {
            translationCode,
            verses: cached.size
          });
          return cached;
        } else {
          logCache(cacheKey, 'miss', { translationCode });
        }

        const result = await originalGetTranslation.call(this, translationCode);
        
        logCache(cacheKey, 'set', { translationCode, verses: result?.size || 0 });
        logData('supabase-storage', 'translation-cache', 'translation-data', 'loaded', {
          translationCode,
          verses: result?.size || 0,
          filePath: `translations/${translationCode}.txt`
        });
        
        return result;
      } catch (error) {
        logError(error, 'getTranslation', { translationCode });
        throw error;
      }
    }, { translationCode });
  };

  // Wrap getCrossReferences
  const originalGetCrossReferences = BibleDataAPI.getCrossReferences;
  BibleDataAPI.getCrossReferences = async function(verseRef: string) {
    return measurePerformanceAsync(`getCrossReferences:${verseRef}`, async () => {
      try {
        const cacheKey = `cross-refs:${verseRef}`;
        
        // Log the request
        logData('component', 'cross-ref-system', 'cross-references', 'requested', { verseRef });
        
        const result = await originalGetCrossReferences.call(this, verseRef);
        
        if (result && result.length > 0) {
          logCache(cacheKey, 'hit', { verseRef, refsCount: result.length });
          logData('cross-ref-cache', 'component', 'cross-references', 'loaded', {
            verseRef,
            refsCount: result.length,
            refs: result.slice(0, 5) // Log first 5 refs for debugging
          });
        } else {
          logCache(cacheKey, 'miss', { verseRef });
          logData('cross-ref-system', 'component', 'cross-references', 'empty', { verseRef });
        }
        
        return result;
      } catch (error) {
        logError(error, 'getCrossReferences', { verseRef });
        throw error;
      }
    }, { verseRef });
  };

  // Wrap getStrongsOffsets
  const originalGetStrongsOffsets = BibleDataAPI.getStrongsOffsets;
  BibleDataAPI.getStrongsOffsets = async function() {
    return measurePerformanceAsync('getStrongsOffsets', async () => {
      try {
        logData('component', 'strongs-system', 'strongs-offsets', 'requested', {});
        
        const result = await originalGetStrongsOffsets.call(this);
        
        logData('strongs-cache', 'component', 'strongs-offsets', 'loaded', {
          verseOffsetsCount: Object.keys(result.strongsVerseOffsets || {}).length,
          indexOffsetsCount: Object.keys(result.strongsIndexOffsets || {}).length
        });
        
        return result;
      } catch (error) {
        logError(error, 'getStrongsOffsets', {});
        throw error;
      }
    });
  };

  // Wrap prophecy functions
  const originalGetProphecyForVerse = BibleDataAPI.getProphecyForVerse;
  if (originalGetProphecyForVerse) {
    BibleDataAPI.getProphecyForVerse = async function(verseRef: string) {
      return measurePerformanceAsync(`getProphecyForVerse:${verseRef}`, async () => {
        try {
          logData('component', 'prophecy-system', 'prophecy-data', 'requested', { verseRef });
          
          const result = await originalGetProphecyForVerse.call(this, verseRef);
          
          logData('prophecy-cache', 'component', 'prophecy-data', 'loaded', {
            verseRef,
            hasData: !!result,
            prophecyTypes: result ? Object.keys(result) : []
          });
          
          return result;
        } catch (error) {
          logError(error, 'getProphecyForVerse', { verseRef });
          throw error;
        }
      }, { verseRef });
    };
  }

  // Wrap verse key functions
  const originalGetVerseKeys = BibleDataAPI.getVerseKeys;
  if (originalGetVerseKeys) {
    BibleDataAPI.getVerseKeys = async function(mode: string = 'canonical') {
      return measurePerformanceAsync(`getVerseKeys:${mode}`, async () => {
        try {
          logData('component', 'verse-keys-system', 'verse-keys', 'requested', { mode });
          
          const result = await originalGetVerseKeys.call(this, mode);
          
          logData('verse-keys-cache', 'component', 'verse-keys', 'loaded', {
            mode,
            keysCount: result?.length || 0
          });
          
          return result;
        } catch (error) {
          logError(error, 'getVerseKeys', { mode });
          throw error;
        }
      }, { mode });
    };
  }

  // Wrap any other API methods dynamically
  Object.keys(BibleDataAPI).forEach(key => {
    const originalMethod = BibleDataAPI[key];
    if (typeof originalMethod === 'function' && !key.startsWith('_') && originalMethod !== BibleDataAPI[key]) {
      // Skip already wrapped methods
      return;
    }
    
    if (typeof originalMethod === 'function' && !key.startsWith('_')) {
      BibleDataAPI[key] = async function(...args: any[]) {
        return measurePerformanceAsync(`${key}:${args[0] || 'no-args'}`, async () => {
          try {
            logData('component', 'bible-data-api', key, 'called', { 
              args: args.map(arg => typeof arg === 'string' ? arg : typeof arg)
            });
            
            const result = await originalMethod.apply(this, args);
            
            logData('bible-data-api', 'component', key, 'completed', {
              resultType: typeof result,
              resultSize: Array.isArray(result) ? result.length : 
                          result instanceof Map ? result.size :
                          result && typeof result === 'object' ? Object.keys(result).length : 0
            });
            
            return result;
          } catch (error) {
            logError(error, key, { args });
            throw error;
          }
        }, { method: key, args });
      };
    }
  });

  return BibleDataAPI;
};

// Track all fetch operations globally
const originalFetch = window.fetch;
window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === 'string' ? input : input.toString();
  const method = init?.method || 'GET';
  
  return measurePerformanceAsync(`fetch:${method}:${url}`, async () => {
    try {
      logData('browser', 'network', 'fetch', 'started', { url, method });
      
      const response = await originalFetch.call(this, input, init);
      
      logData('network', 'browser', 'fetch', response.ok ? 'success' : 'error', {
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      return response;
    } catch (error) {
      logError(error, 'fetch', { url, method });
      throw error;
    }
  }, { url, method });
};

// Initialize on load
export const initializeInstrumentation = () => {
  globalLogger.log('filesystem', 'initialization', 'instrumentation-started', {
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    location: window.location.href
  });
  
  console.log('🔍 Global logging system initialized. Access via:');
  console.log('  - window.globalLogger for full API');
  console.log('  - window.exportSystemLogs() for complete logs');
  console.log('  - window.getSystemSummary() for summary');
  console.log('  - window.getFileSystemMap() for file access map');
  console.log('  - window.getDataFlowMap() for data flow analysis');
};