/**
 * Centralized prefetch manager with merge/dedupe/cancel/concurrency
 * Handles high-priority safety buffer and low-priority background fetches
 */

import { ensureRangeLoaded } from '../data/ensureRangeLoaded';
import { logger } from '@/lib/logger';
import { mobileDiagnostics } from '@/utils/mobilePrefetchDiagnostics';

export type Prio = 'high' | 'low';
export type Range = [number, number];

class PrefetchManager {
  private pending: Array<{ r: Range; p: Prio }> = [];
  
  // PERF FIX: Split queues for priority isolation
  private runningHigh = 0;
  private runningLow = 0;
  private maxHigh = 4; // Reserved slots for high-priority (viewport)
  private maxLow = 4;  // Reserved slots for low-priority (runway)
  private max = 8;     // Total concurrency (legacy compatibility)
  
  private bgAbort?: AbortController;
  private bgAbortDebounce?: ReturnType<typeof setTimeout>;
  private sched = false;
  private translationCode = 'KJV'; // Default, will be set dynamically
  private totalVerses = 31102; // Default, will be set dynamically
  private totalProcessed = 0;
  private recentlyLoaded: string[] = [];
  
  // PERF FIX: Throttle enqueue to prevent excessive calls during scroll
  private lastPumpTime = 0;
  private throttleMs = 100; // Minimum 100ms between pump operations

  setTranslation(code: string) {
    this.translationCode = code;
  }

  setTotalVerses(total: number) {
    this.totalVerses = total;
  }

  getState() {
    return {
      queueSize: this.pending.length,
      isProcessing: this.runningHigh > 0 || this.runningLow > 0,
      totalProcessed: this.totalProcessed,
      recentlyLoaded: this.recentlyLoaded,
      runningHigh: this.runningHigh,
      runningLow: this.runningLow,
      maxHigh: this.maxHigh,
      maxLow: this.maxLow,
      maxConcurrency: this.max
    };
  }

  enqueue(range: Range, p: Prio) {
    this.pending.push({ r: range, p });
    
    if (!this.sched) {
      this.sched = true;
      
      // PERF FIX: Throttle pump to run at most once every 100ms
      const now = Date.now();
      const timeSinceLastPump = now - this.lastPumpTime;
      
      if (timeSinceLastPump >= this.throttleMs) {
        // Enough time has passed, pump immediately
        queueMicrotask(() => this.pump());
      } else {
        // Too soon, schedule for later
        const delay = this.throttleMs - timeSinceLastPump;
        setTimeout(() => this.pump(), delay);
      }
    }
  }

  private pump() {
    this.sched = false;
    this.lastPumpTime = Date.now();
    
    if (!this.pending.length) return;
    
    const highs = this.merge(this.pending.filter(x => x.p === 'high').map(x => x.r));
    const lows = this.merge(this.pending.filter(x => x.p === 'low').map(x => x.r));
    this.pending = [];

    // DESKTOP PERF FIX: Match mobile's efficient 300-verse batch size (was 400 for desktop)
    // Smaller batches reduce parsing overhead and keep main thread responsive
    const MIN_BATCH = 300; // Both desktop and mobile use same efficient batch size
    const expandIfNeeded = (ranges: Range[]): Range[] => {
      return ranges.map(([a, b]) => {
        const size = b - a + 1;
        if (size >= MIN_BATCH) return [a, b];
        // Expand forward to meet minimum, clamped to actual verse count
        const expanded: Range = [a, Math.min(this.totalVerses - 1, a + MIN_BATCH - 1)];
        return expanded;
      });
    };

    const expandedHighs = expandIfNeeded(highs);
    const expandedLows = expandIfNeeded(lows);
    
    // Calculate backlog AFTER merge/expand for accurate burst detection
    const backlog = expandedHighs.length + expandedLows.length;

    // High priority: fire immediately, no cancel, pass backlog for burst detection
    for (const r of expandedHighs) this.start(r, undefined, backlog);

    // FIX #5: Debounce background aborts (250ms) to avoid thrash
    if (lows.length) {
      clearTimeout(this.bgAbortDebounce);
      this.bgAbortDebounce = setTimeout(() => {
        this.bgAbort?.abort();
        this.bgAbort = new AbortController();
        const sig = this.bgAbort.signal;
        for (const r of expandedLows) this.start(r, sig, backlog);
      }, 250);
    }
  }

  private start([a, b]: Range, signal?: AbortSignal, backlog = 0) {
    const isHighPriority = !signal;
    
    const kick = () => {
      // PERF FIX: Split queue system with reserved slots
      if (isHighPriority) {
        // High-priority: reserve 4 slots, never blocked by low-priority
        if (this.runningHigh >= this.maxHigh) {
          setTimeout(kick, 16);
          return;
        }
      } else {
        // Low-priority: use remaining capacity, don't block high-priority
        const totalRunning = this.runningHigh + this.runningLow;
        if (this.runningLow >= this.maxLow || totalRunning >= this.max) {
          setTimeout(kick, 16);
          return;
        }
      }
      
      // Increment appropriate counter
      if (isHighPriority) {
        this.runningHigh++;
      } else {
        this.runningLow++;
      }
      
      const priority = isHighPriority ? 'high' : 'low';
      const range = `${a}-${b}`;
      const count = b - a + 1;
      
      logger.info('PREFETCH', 'fetch:range', { 
        a, 
        b, 
        count,
        translation: this.translationCode,
        priority,
        runningHigh: this.runningHigh,
        runningLow: this.runningLow
      });
      
      mobileDiagnostics.recordBatch(priority, range, count, 'started');
      
      ensureRangeLoaded(a, b, this.translationCode, signal)
        .then(() => {
          mobileDiagnostics.recordBatch(priority, range, count, 'completed');
          this.totalProcessed += count;
          this.recentlyLoaded = [...this.recentlyLoaded.slice(-19), range];
        })
        .catch((err) => {
          if (err?.name === 'AbortError') {
            mobileDiagnostics.recordBatch(priority, range, count, 'aborted');
          }
        })
        .finally(() => {
          // Decrement appropriate counter
          if (isHighPriority) {
            this.runningHigh--;
          } else {
            this.runningLow--;
          }
        });
    };
    kick();
  }

  private merge(ranges: Range[]): Range[] {
    if (!ranges.length) return ranges;
    
    const s = ranges.sort((x, y) => x[0] - y[0]);
    const out: Range[] = [s[0].slice() as Range];
    
    for (let i = 1; i < s.length; i++) {
      const last = out[out.length - 1];
      const cur = s[i];
      
      // Merge overlapping or adjacent ranges
      if (cur[0] <= last[1] + 1) {
        last[1] = Math.max(last[1], cur[1]);
      } else {
        out.push(cur.slice() as Range);
      }
    }
    
    return out;
  }

  private isDesktop(): boolean {
    if (typeof window === 'undefined') return false;
    if (!window.matchMedia) return false;
    return window.matchMedia('(pointer:fine)').matches;
  }
}

export const prefetch = new PrefetchManager();
