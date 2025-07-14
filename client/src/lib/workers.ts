// client/src/lib/workers.ts
import { fetchCrossRefs } from '@/workers/crossReferencesWorker';

// CrossReferencesWorker wrapper class for consistency
class CrossRefsWorker {
  async getCrossRefs(sliceIDs: string[]): Promise<Record<string, string[]>> {
    return await fetchCrossRefs(sliceIDs);
  }
}

export const crossRefsWorker = new CrossRefsWorker();