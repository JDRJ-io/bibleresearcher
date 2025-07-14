// client/src/lib/crossRefCache.ts

let crossRefMap: Record<string, string[]> | null = null;

export async function ensureCrossRefsLoaded() {
  if (crossRefMap) return;
  
  try {
    // Import Supabase client for authenticated access
    const { supabase } = await import('./supabase');
    
    // Use authenticated Supabase client for private bucket access
    const { data, error } = await supabase.storage
      .from("anointed")
      .download("references/cf1.txt");
    
    if (error) {
      console.error("Error downloading cross-references:", error);
      throw error;
    }
    
    const text = await data.text();
    
    crossRefMap = {};
    text.split('\n').forEach(line => {
      const [verseID, refsStr] = line.split('$$');
      if (verseID && refsStr) {
        // Parse cross-references with $ and # delimiters
        const groups = refsStr.split('$');
        const allRefs: string[] = [];
        
        groups.forEach(group => {
          if (group.includes('#')) {
            allRefs.push(...group.split('#'));
          } else {
            allRefs.push(group);
          }
        });
        
        crossRefMap[verseID] = allRefs.filter(ref => ref.trim()).map(ref => ref.trim());
      }
    });
    
    console.log('✅ Cross-references loaded successfully');
  } catch (error) {
    console.error('Failed to load cross-references:', error);
    crossRefMap = {};
  }
}

export function getCrossReferencesForVerse(verseID: string): string[] {
  if (!crossRefMap) return [];
  return crossRefMap[verseID] || [];
}