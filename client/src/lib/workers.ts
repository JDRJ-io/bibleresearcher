// eslint-disable-next-line import/no-webpack-loader-syntax
import CrossRefWorker from '@/workers/crossReferencesWorker?worker';

let crossRefWorkerInstance: Worker | null = null;
let workerInitialized = false;

export const getCrossRefWorker = async () => {
  if (!crossRefWorkerInstance) {
    crossRefWorkerInstance = new CrossRefWorker();
    
    // Step 4: Worker round-trip test (dev only)
    if (import.meta.env.DEV) {
      crossRefWorkerInstance.postMessage({ type: 'ping' });
      crossRefWorkerInstance.onmessage = (e) => {
        if (e.data === 'pong') {
          console.log('✅ Worker protocol test passed');
        } else if (e.data !== 'pong' && e.data.type !== 'initialized') {
          console.error('Worker protocol mismatch:', e.data);
        }
      };
    }
  }
  
  if (!workerInitialized) {
    // MEMORY OPTIMIZED: Initialize worker with offset data only (small JSON files)
    const { loadCrossRefOffsets } = await import('@/data/BibleDataAPI');
    const cf1Offsets = await loadCrossRefOffsets('cf1');
    
    return new Promise<Worker>((resolve) => {
      crossRefWorkerInstance!.onmessage = (e) => {
        if (e.data.type === 'initialized') {
          workerInitialized = true;
          resolve(crossRefWorkerInstance!);
        }
      };
      crossRefWorkerInstance!.postMessage({ type: 'init', offsets: cf1Offsets });
    });
  }
  
  return crossRefWorkerInstance;
};

// Legacy export for backward compatibility
export const crossRefWorker = new CrossRefWorker();