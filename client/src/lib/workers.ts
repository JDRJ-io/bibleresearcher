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
    // DEPRECATED: Worker initialization removed - using getCrossRefsBatch instead
    console.warn('getCrossRefWorker is deprecated, use getCrossRefsBatch directly');
    
    return new Promise<Worker>((resolve) => {
      crossRefWorkerInstance!.onmessage = (e) => {
        if (e.data.type === 'initialized') {
          workerInitialized = true;
          resolve(crossRefWorkerInstance!);
        }
      };
      crossRefWorkerInstance!.postMessage({ type: 'init', data: cf1Data });
    });
  }
  
  return crossRefWorkerInstance;
};

// Legacy export for backward compatibility
export const crossRefWorker = new CrossRefWorker();