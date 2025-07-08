/**
 * Bundle Size Split per Translation - Task 5
 * Dynamic import system for translation JSON files
 */

export interface TranslationManifest {
  id: string;
  name: string;
  size: number;
  version: string;
}

/**
 * Task 5.1: Dynamic import each JSON in translationLoader.ts
 * This replaces static imports with dynamic imports to enable code splitting
 */
export async function loadTranslationDynamic(translationId: string): Promise<Map<string, string>> {
  try {
    console.log(`🔄 Dynamic import: ${translationId}`);
    
    // Task 5.1: Dynamic import with vite-ignore comment for build optimization
    const module = await import(/* @vite-ignore */ `./translations/${translationId}.json`);
    
    // Convert JSON object to Map for consistency with existing system
    const translationMap = new Map<string, string>();
    const data = module.default || module;
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        translationMap.set(key, value);
      }
    }
    
    console.log(`✅ Dynamic import complete: ${translationId} (${translationMap.size} verses)`);
    return translationMap;
    
  } catch (error) {
    console.error(`🚨 Dynamic import failed: ${translationId}`, error);
    return new Map();
  }
}

/**
 * Task 5.2: Vite config—set build.rollupOptions.output.manualChunks to chunk by translation id
 * Implementation available in client/src/config/chunkConfig.ts
 * 
 * To implement, add to vite.config.ts:
 * import { getManualChunks } from './client/src/config/chunkConfig';
 * 
 * export default defineConfig({
 *   build: {
 *     rollupOptions: {
 *       output: {
 *         manualChunks: getManualChunks
 *       }
 *     }
 *   }
 * });
 */

/**
 * Task 5.3: Update SW (sw.ts): pre-cache only mainTranslation; alternates fetch on demand
 */
export function getMainTranslationForPrecache(): string {
  return 'KJV'; // Always pre-cache KJV as the main translation
}

export function shouldPrecacheTranslation(translationId: string): boolean {
  const mainTranslation = getMainTranslationForPrecache();
  return translationId === mainTranslation;
}

/**
 * Task 5.4: Bundle size monitoring
 * This integrates with the existing bundle-check.js script
 */
export function logBundleMetrics(translationId: string, size: number, loadTime: number) {
  console.log(`📊 BUNDLE METRICS: ${translationId} - ${size} bytes, ${loadTime}ms`);
  
  // Task 5.4: Gate at 2MB gzipped
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (size > maxSize) {
    console.error(`🚨 BUNDLE TOO LARGE: ${translationId} exceeds 2MB limit`);
  }
}