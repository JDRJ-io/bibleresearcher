import { useRef, useState, useLayoutEffect, useCallback } from "react";
import { ROW_HEIGHT } from "@/constants/layout";

// APV Tunables (safe defaults from expert guidance)
const VISIBLE = 40;   // verses roughly on screen
const LEAD_BASE = 60;   // ahead of anchor at low speed
const LAG_BASE = 30;   // behind anchor at low speed
const LEAD_MAX = 200;  // max ahead at high speed
const LAG_MAX = 80;   // max behind at high speed

// Velocity breakpoints (verses/second)
const V1 = 5;   // slow scroll
const V2 = 20;  // fast scroll
const V3 = 80;  // fling/jump-ish

// Update cadence
const MIN_UPDATE_MS = 80;   // rAF-ish throttling
const MAX_UPDATE_MS = 220;  // ensure periodic refresh
const MIN_VERSE_DELTA = 10;   // don't recompute unless anchor moves this much

// Jump/drag handling
const BIG_JUMP_VERSES = 400;    // treat as jump if delta exceeds this
const DRAG_PAUSE_MS = 50;     // pause while dragging scrollbar

// Networking / concurrency
const MAX_CONCURRENCY = 4;   // per translation stream
const MAX_VERSES_PER_MIN = 4000; // global budget to avoid GB use
const PREFETCH_XREF_MARGIN = 10;  // small halo for xrefs/prophecy beyond visible
const CACHE_SOFT_LIMIT_ROWS = 1200; // LRU soft cap per translation

type Range = { start: number; end: number };
type Direction = 1 | -1;

// Global state for APV
const inflight = new Map<string, AbortController>(); // key: `${col}:${start}-${end}`
let lastUpdateTs = 0;
let lastAnchor = 1;
let versesThisMinute = 0;
let isDragging = false;
let dragTimer: any = null;

// Reset budget every minute
setInterval(() => { 
  versesThisMinute = 0; 
  console.log('🔄 APV: Verses budget reset to 0/4000 per minute');
}, 60_000);

// Adaptive window based on velocity
function computeLeadLag(vps: number, direction: Direction) {
  const t = Math.min(1, Math.max(0, (vps - V1) / (V3 - V1))); // 0..1
  const lead = Math.round(LEAD_BASE + t * (LEAD_MAX - LEAD_BASE));
  const lag = Math.round(LAG_BASE + t * (LAG_MAX - LAG_BASE));
  return direction === 1 ? { lead, lag } : { lead: lag, lag: lead }; // bias toward direction
}

function computeWindow(anchor: number, vps: number, dir: Direction, totalVerses: number): Range {
  const { lead, lag } = computeLeadLag(vps, dir);
  const start = Math.max(0, anchor - Math.floor(VISIBLE/2) - lag);
  const end = Math.min(totalVerses - 1, anchor + Math.floor(VISIBLE/2) + lead);
  return { start, end };
}

function shouldUpdate(now: number, anchor: number): boolean {
  const timeSinceLastUpdate = now - lastUpdateTs;
  const timeOk = timeSinceLastUpdate >= MIN_UPDATE_MS || timeSinceLastUpdate >= MAX_UPDATE_MS;
  const deltaOk = Math.abs(anchor - lastAnchor) >= MIN_VERSE_DELTA;
  return timeOk && deltaOk;
}

function cancelInflightOutside(range: Range) {
  let canceledCount = 0;
  // Fix TS error: Use Array.from() for Map iteration
  for (const [key, ctl] of Array.from(inflight.entries())) {
    const match = key.match(/:(\d+)-(\d+)$/);
    if (!match) continue;
    const [, s, e] = match;
    const ks = +s, ke = +e;
    const overlap = !(ke < range.start || ks > range.end);
    if (!overlap) { 
      ctl.abort(); 
      inflight.delete(key); 
      canceledCount++;
    }
  }
  if (canceledCount > 0) {
    console.log(`🚫 APV: Canceled ${canceledCount} inflight requests outside window`);
  }
}

export function useAdaptivePredictiveVirtualizer(
  containerRef: React.RefObject<HTMLDivElement>, 
  verseKeys: string[] = [], 
  options?: { disabled?: boolean }
) {
  const anchorIndexRef = useRef(0);
  const [anchorIndex, setAnchorIndex] = useState(0);
  const [window, setWindow] = useState<Range>({ start: 0, end: VISIBLE });
  const velocityRef = useRef(0);
  const lastScrollTimeRef = useRef(0);
  const lastScrollPosRef = useRef(0);

  // Initialize window when verse keys change
  useLayoutEffect(() => {
    const initialWindow = computeWindow(anchorIndexRef.current, 0, 1, verseKeys.length);
    setWindow(initialWindow);
    console.log(`🔄 APV: Initialized window [${initialWindow.start}..${initialWindow.end}] for ${verseKeys.length} verses`);
  }, [verseKeys]);

  const onScrollOrAnchorChange = useCallback((anchor: number, vps: number, dir: Direction) => {
    const now = performance.now();
    if (!shouldUpdate(now, anchor)) return;

    const bigJump = Math.abs(anchor - lastAnchor) >= BIG_JUMP_VERSES || isDragging;
    const newWindow = computeWindow(anchor, vps, dir, verseKeys.length);
    
    lastUpdateTs = now;
    lastAnchor = anchor;

    if (bigJump) {
      // Hard reset to avoid stale work
      console.log(`🚀 APV jump: from=${lastAnchor} to=${anchor} Δ=${Math.abs(anchor - lastAnchor)} ${isDragging ? '(drag end)' : ''}`);
      console.log(`🚫 APV: Aborting ${inflight.size} inflight requests`);
      
      // Fix TS error: Use Array.from() for Map iteration
      for (const [, ctl] of Array.from(inflight.values())) ctl.abort();
      inflight.clear();
      
      setWindow(newWindow);
      console.log(`🎯 APV: New window after jump [${newWindow.start}..${newWindow.end}] visible=${newWindow.end - newWindow.start + 1}`);
      return;
    }

    // Normal scroll path
    cancelInflightOutside(newWindow);
    setWindow(newWindow);
    
    console.log(`📊 APV tick: anchor=${anchor} dir=${dir === 1 ? '→' : '←'} vps=${vps.toFixed(1)} window=[${newWindow.start}..${newWindow.end}] visible=${VISIBLE} budget=${versesThisMinute}/${MAX_VERSES_PER_MIN}`);
  }, [verseKeys.length]);

  useLayoutEffect(() => {
    if (!containerRef.current || options?.disabled) return;

    const el = containerRef.current;
    
    const onScroll = () => {
      if (isDragging) return; // Pause during drag
      
      const now = performance.now();
      const scrollTop = el.scrollTop;
      const scrollCenter = scrollTop + el.clientHeight / 2;
      const anchor = Math.round(scrollCenter / ROW_HEIGHT);
      const clampedAnchor = Math.max(0, Math.min(anchor, verseKeys.length - 1));
      
      // Calculate velocity (verses per second)
      const timeDelta = now - lastScrollTimeRef.current;
      const posDelta = scrollTop - lastScrollPosRef.current;
      const vps = timeDelta > 0 ? Math.abs(posDelta / ROW_HEIGHT) / (timeDelta / 1000) : 0;
      const direction: Direction = posDelta >= 0 ? 1 : -1;
      
      lastScrollTimeRef.current = now;
      lastScrollPosRef.current = scrollTop;
      velocityRef.current = vps;
      
      anchorIndexRef.current = clampedAnchor;
      setAnchorIndex(clampedAnchor);
      
      onScrollOrAnchorChange(clampedAnchor, vps, direction);
    };

    const onScrollStart = () => {
      isDragging = true;
      console.log('🎯 APV: Scrollbar drag started - pausing updates');
    };

    const onScrollEnd = () => {
      if (dragTimer) clearTimeout(dragTimer);
      dragTimer = setTimeout(() => { 
        isDragging = false;
        console.log('🎯 APV: Scrollbar drag ended - resuming updates');
        // Force immediate recompute to final position
        const finalAnchor = anchorIndexRef.current;
        onScrollOrAnchorChange(finalAnchor, V3, 1); // treat as very fast to bias lead
      }, DRAG_PAUSE_MS);
    };

    el.addEventListener("scroll", onScroll);
    el.addEventListener("scrollstart", onScrollStart);
    el.addEventListener("scrollend", onScrollEnd);
    
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollstart", onScrollStart);
      el.removeEventListener("scrollend", onScrollEnd);
      if (dragTimer) clearTimeout(dragTimer);
    };
  }, [containerRef, verseKeys, options, onScrollOrAnchorChange]);

  // Extract verse slice from window
  const slice = verseKeys.slice(window.start, window.end + 1);

  return {
    anchorIndex,
    slice: {
      start: window.start,
      end: window.end,
      verseIDs: slice,
      data: new Map() // Legacy compatibility
    },
    velocity: velocityRef.current,
    isDragging,
    window
  };
}