// client/src/lib/workers.ts
import { fetchCrossRefs } from '@/workers/crossReferencesWorker';

export const crossRefsWorker = new CrossRefsWorker();