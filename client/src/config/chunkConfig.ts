/**
 * Manual chunk configuration for dynamic translation loading
 * This configuration would be used in vite.config.ts as:
 * 
 * rollupOptions: {
 *   output: {
 *     manualChunks: getManualChunks
 *   }
 * }
 */

export function getManualChunks(id: string): string | undefined {
  // Dynamic translation chunk splitting
  if (id.includes('translations/')) {
    const match = id.match(/translations\/(\w+)\.json/);
    if (match) {
      return `translation-${match[1].toLowerCase()}`;
    }
  }
  
  // Group vendor dependencies
  if (id.includes('node_modules')) {
    return 'vendor';
  }
  
  // Main chunk for everything else
  return 'main';
}

// Manual chunk rules for specific translations
export const TRANSLATION_CHUNKS = {
  'translation-kjv': ['./src/translations/KJV.json'],
  'translation-esv': ['./src/translations/ESV.json'],
  'translation-niv': ['./src/translations/NIV.json'],
  'translation-amp': ['./src/translations/AMP.json'],
  'translation-nlt': ['./src/translations/NLT.json'],
  'translation-nasb': ['./src/translations/NASB.json'],
  'translation-nkjv': ['./src/translations/NKJV.json'],
  'translation-csb': ['./src/translations/CSB.json'],
  'translation-bsb': ['./src/translations/BSB.json'],
  'translation-nrsv': ['./src/translations/NRSV.json'],
  'translation-web': ['./src/translations/WEB.json'],
  'translation-ylt': ['./src/translations/YLT.json'],
} as const;