// client/src/workers/crossReferencesWorker.ts
interface MessageRequest { id: string; sliceIDs: string[] }

let crossRefsMap: Record<string, string[]> | null = null;

async function ensureCrossRefsLoaded() {
  if (crossRefsMap) return;
  
  // Fetch from Supabase instead of local file
  const response = await fetch('/api/references/cf1.txt');
  const text = await response.text();
  
  crossRefsMap = {};
  text.split('\n').forEach(line => {
    const [verseID, refsStr] = line.split('\t');
    if (verseID && refsStr) {
      crossRefsMap[verseID] = refsStr.split(';').map(r => r.trim()).filter(Boolean);
    }
  });
}

const crossRefsWorker = {
  postMessage: async (data: MessageRequest) => {
    await ensureCrossRefsLoaded();
    const { id, sliceIDs } = data;
    
    const result: Record<string, string[]> = {};
    for (const verseID of sliceIDs) {
      result[verseID] = crossRefsMap[verseID] || [];
    }
    
    // Return promise for result instead of self.postMessage
    return { id, result };
  }
};

export default crossRefsWorker;