// client/src/lib/workers.ts
// eslint-disable-next-line import/no-webpack-loader-syntax
import CrossRefWorker from '@/workers/crossReferencesWorker?worker';

export const crossRefWorker = new CrossRefWorker();