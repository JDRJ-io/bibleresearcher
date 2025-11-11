# Virtual Bible Table - Code Snapshot (RFI Response)

**Date:** October 11, 2025  
**Purpose:** Complete technical documentation of scrolling, loading, caching, and virtualization behavior for "always-ready" mobile & desktop optimization.

---

## 0) Quick Context

### Branch/Commit
Current working state (production codebase)

### Primary Scroll Container
**Adaptive based on device/orientation:**
- **Desktop landscape / Desktop portrait:** `.unified-scroll-container` (element scroll)
- **Mobile portrait:** `document.documentElement` (window scroll - for iOS URL bar auto-hide)
- **Implementation:** `client/src/hooks/useScrollRoot.ts`
- **Detection logic:**
  ```typescript
  // Lines 5-9
  function defaultSelector(): 'window' | 'container' {
    const isPortrait = window.matchMedia?.('(orientation: portrait)')?.matches ?? false;
    const isNarrow = window.innerWidth < 900;
    return (isPortrait && isNarrow) ? 'window' : 'container';
  }
  ```

### Total Verse Count & Index Mapping
- **Total verses:** 31,102 (entire Bible)
- **Source:** `client/src/lib/verseKeysLoader.ts` - `getVerseKeys()`
- **Format:** Dot notation (e.g., "Gen.1:1", "John.3:16")
- **Index mapping:** Direct array index (0-31,101)
- **Chronological mode:** Reordered verse keys array (same length, different order)

### Known Pain Points
1. **Scrollbar/viewport mismatch at 2× row height** - Scale changes cause ~5-20 row offset between scrollbar position and actual rendered content
2. **Potential blanking during fast scrolls** - High velocity can exceed prefetch buffer on low-memory devices
3. **Layout shifts when adding translations mid-scroll** - Column width recalculation can cause horizontal jump
4. **Mobile touch behavior** - Touch event handling needs investigation for gesture conflicts

---

## 1) Core Files (Full Contents & Key Excerpts)

### VirtualBibleTable.tsx
**Location:** `client/src/components/bible/VirtualBibleTable.tsx` (1,229 lines)

**Key sections:**

**Anchor Tracking (Lines 117-126):**
```typescript
// ANCHOR TRACKING REFS (Single Authority System)
const liveIndexRef = useRef(0);
const lastIndexRef = useRef(0);
const velocityRef = useRef(0);
const directionRef = useRef(0);
const lastTimestampRef = useRef(performance.now());
const anchorIndexRef = useRef(0);
const prefetchAnchorRef = useRef(0);
const stableAnchorRef = useRef(0);
```

**Scroll Root Setup (Lines 110-112):**
```typescript
const containerRef = useRef<HTMLDivElement>(null);
const scrollRoot = useScrollRoot(containerRef); // Adaptive: window or container
```

**Anchor Slice Hook (Line 146):**
```typescript
const { anchorIndex, stableAnchor, slice, metrics } = useOptimizedAnchorSlice(
  scrollRoot, 
  verseKeys, 
  { disabled: isScrollbarDragging }
);
```

**Row Height Calculation (Lines 243-260):**
```typescript
const [rowHeightMult, setRowHeightMult] = useState(() => 
  parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue('--row-height-mult') || '1.0')
);

useEffect(() => {
  const handleSizeChange = (e: CustomEvent) => {
    const newRowHeight = e.detail.rowHeight;
    if (newRowHeight !== undefined) {
      setRowHeightMult(newRowHeight);
    }
  };
  
  window.addEventListener('manualSizeChange', handleSizeChange as EventListener);
  return () => window.removeEventListener('manualSizeChange', handleSizeChange as EventListener);
}, []);

const effectiveRowHeight = ROW_HEIGHT * rowHeightMult; // 120px * mult
```

**Row Height Change Preservation (Lines 265-295):**
```typescript
useEffect(() => {
  const prev = prevRowHeightRef.current;
  if (prev === effectiveRowHeight) return;

  const containerH = scrollRoot.getClientHeight();
  const currentScrollTop = scrollRoot.getScrollTop();
  const stickyHeaderOffset = getStickyHeaderOffset(scrollRoot.kind);

  // Find which verse was centered with OLD row height
  const centerVerseIndex = centerIndexFrom(currentScrollTop, containerH, prev, stickyHeaderOffset);

  // Calculate new scroll position to keep same verse centered with NEW row height
  let newScrollTop = scrollTopForIndex(centerVerseIndex, containerH, effectiveRowHeight, stickyHeaderOffset);

  // Clamp to bounds
  const contentHeight = verseKeys.length * effectiveRowHeight;
  const maxScroll = Math.max(0, contentHeight - containerH);
  newScrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));

  scrollRoot.scrollToTop(newScrollTop, false);
  prevRowHeightRef.current = effectiveRowHeight;
}, [effectiveRowHeight, scrollRoot, verseKeys.length]);
```

**Data Loaders (Lines 298-301):**
```typescript
const { isLoading: isSliceLoading } = useSliceDataLoader(slice.verseIDs, mainTranslation);
useCrossRefLoader(slice.verseIDs); // Prefetch cross-refs for visible verses
```

**Scroll Event Handler (Lines 907-932):**
```typescript
useEffect(() => {
  const onScroll = () => {
    const currentScrollTop = scrollRoot.getScrollTop();
    
    // Track horizontal scroll for header sync
    const container = containerRef.current;
    if (container) {
      setScrollLeft(container.scrollLeft);
    }
    
    // Update scrollTop state if not dragging scrollbar
    if (!isScrollbarDragging) {
      setScrollTop(currentScrollTop);
    }

    // Banner rollup logic for mobile
    if (isMobile && currentScrollTop > 30) {
      window.dispatchEvent(new CustomEvent('virtualTableScroll', { 
        detail: { scrollDirection: 'down', scrollTop: currentScrollTop } 
      }));
    }
  };

  return scrollRoot.addScrollListener(onScroll);
}, [scrollRoot, isScrollbarDragging, isMobile]);
```

### VirtualRow.tsx
**Location:** `client/src/components/bible/VirtualRow.tsx` (1,497 lines)

**Props (Lines 27-44):**
```typescript
interface VirtualRowProps {
  verseID: string;
  verse: BibleVerse;
  rowHeight: number; // Dynamic row height (120 * multiplier)
  columnData: any;
  getVerseText: (verseID: string, translationCode: string) => string;
  getMainVerseText: (verseID: string) => string;
  activeTranslations: string[];
  mainTranslation: string;
  onVerseClick: (ref: string) => void;
  onExpandVerse?: (verse: BibleVerse) => void;
  onDoubleClick?: () => void;
  getVerseLabels?: (verseReference: string) => Record<string, string[]>;
  centerVerseRef?: string;
  stickyHeaderOffset?: number;
  onOpenProphecy?: (prophecyId: number) => void;
  onNavigateToVerse?: (ref: string) => void;
}
```

**Row Rendering (Lines 1432-1497):**
```typescript
return (
  <div
    className="verse-row-container"
    style={{
      position: 'absolute',
      top: `${verse.index * rowHeight}px`, // Position calculation
      left: 0,
      right: 0,
      height: `${rowHeight}px`,
      display: 'grid',
      gridTemplateColumns: gridTemplateColumns,
      // ... additional styles
    }}
  >
    {visibleColumns.map((colInfo) => renderColumn(colInfo))}
  </div>
);
```

### scrollToVerse(...) Implementation

**Main Entry Point - BiblePage (Lines 159-162):**
```typescript
const scrollToVerse = useCallback((ref: string) => {
  console.log('📜 BiblePage scrollToVerse called with:', ref);
  tableRef.current?.scrollToVerse(ref);
}, []);
```

**VirtualBibleTable Implementation (Lines 723-825):**
```typescript
const goTo = useCallback((ref: string) => {
  console.log('🎯 goTo called with ref:', ref);
  
  const index = getVerseIndex(ref);
  if (index === -1) {
    console.warn('⚠️ Invalid verse reference:', ref);
    return;
  }

  const containerH = scrollRoot.getClientHeight();
  const stickyHeaderOffset = getStickyHeaderOffset(scrollRoot.kind);
  
  // Calculate target scroll position
  const targetScrollTop = scrollTopForIndex(
    index, 
    containerH, 
    effectiveRowHeight, 
    stickyHeaderOffset
  );

  // Clamp to valid bounds
  const contentHeight = verseKeys.length * effectiveRowHeight;
  const maxScroll = Math.max(0, contentHeight - containerH);
  const clampedScrollTop = Math.max(0, Math.min(targetScrollTop, maxScroll));

  console.log('🎯 Scrolling to:', {
    ref,
    index,
    targetScrollTop,
    clampedScrollTop,
    effectiveRowHeight,
    containerH,
    stickyHeaderOffset
  });

  // Smooth scroll to target position
  scrollRoot.scrollToTop(clampedScrollTop, true);
  
  // Track navigation
  hyperlinkTracker.trackNavigation(ref, index, mainTranslation, 'direct-navigation');
}, [scrollRoot, effectiveRowHeight, verseKeys.length, mainTranslation]);

// Expose scrollToVerse to parent
useImperativeHandle(ref, () => ({
  scrollToVerse: goTo,
  get node() { return containerRef.current; },
  getCurrentVerse
}), [goTo, getCurrentVerse]);
```

### Anchor Logic - useAnchorTracker

**Location:** `client/src/hooks/useAnchorTracker.ts` (Lines 1-89)

```typescript
export function useAnchorTracker(
  getScrollTop: () => number, 
  getContainerHeight: () => number,
  rowHeight: number, 
  hysteresisRows: number, // 80 mobile, 100 desktop
  stickyHeaderOffset: number = 0,
  idleMs = 175 // Fast anchor stabilization
): Anchors {
  const [liveCenterIndex, setLiveCenterIndex] = useState(0);
  const [prefetchAnchor, setPrefetchAnchor] = useState(0);
  const [stableBookmarkAnchor, setStableBookmarkAnchor] = useState(0);

  const lastIdxRef = useRef(0);
  const lastTsRef = useRef(performance.now());
  const velRef = useRef(0);
  const dirRef = useRef<1 | -1>(1);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const top = getScrollTop();
      const containerHeight = getContainerHeight();
      
      // Calculate center index using geometry helper
      let idx = centerIndexFrom(top, containerHeight, rowHeight, stickyHeaderOffset);
      if (idx < 0) idx = 0;

      // Calculate velocity (rows/sec)
      const now = performance.now();
      const dt = (now - lastTsRef.current) / 1000;
      if (dt > 0) {
        velRef.current = (idx - lastIdxRef.current) / dt;
        dirRef.current = velRef.current >= 0 ? 1 : -1;
      }
      lastIdxRef.current = idx;
      lastTsRef.current = now;

      setLiveCenterIndex(idx); // ✅ Updates EVERY FRAME (60 FPS)

      // Hysteresis for prefetchAnchor (only update when moved significant distance)
      if (Math.abs(idx - prefetchAnchor) >= hysteresisRows) {
        setPrefetchAnchor(idx);
      }

      // Idle-based stable anchor (for bookmarks/history)
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setStableBookmarkAnchor(idx), idleMs);

      raf = requestAnimationFrame(loop); // Continue loop
    };
    
    raf = requestAnimationFrame(loop); // Start loop
    
    return () => {
      cancelAnimationFrame(raf);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [getScrollTop, getContainerHeight, rowHeight, hysteresisRows, stickyHeaderOffset, idleMs, prefetchAnchor]);

  return {
    liveCenterIndex,      // UI tracking - updates every frame
    prefetchAnchor,       // Data loading trigger - updates every 80-100 verses
    stableBookmarkAnchor, // Bookmark anchor - updates after 175ms idle
    direction: dirRef.current,
    velocityRps: Math.abs(velRef.current),
  };
}
```

### Virtualization Math - useOptimizedAnchorSlice

**Location:** `client/src/hooks/useOptimizedAnchorSlice.ts` (Lines 104-144)

```typescript
useLayoutEffect(() => {
  if (options?.disabled) return;

  const allVerseKeys = verseKeys.length > 0 ? verseKeys : getVerseKeys();
  if (!allVerseKeys || allVerseKeys.length === 0) return;

  // Compute render window (smaller than prefetch)
  const renderStart = Math.max(0, liveCenterIndex - policy.renderAbove);
  const renderEnd = Math.min(allVerseKeys.length - 1, liveCenterIndex + policy.renderBelow);

  // Always render full computed window
  const newSlice = allVerseKeys.slice(renderStart, renderEnd + 1);

  // Ensure prefetch coverage
  ensureCacheRange(renderStart, renderEnd, policy.extendChunk);
  
  // Only update if slice changed significantly (>5 verses)
  const currentSlice = renderSlice.verseIDs;
  const hasSignificantChange = 
    currentSlice.length === 0 ||
    Math.abs(renderStart - renderSlice.start) > 5 ||
    Math.abs(renderEnd - renderSlice.end) > 5;

  // Update data-attributes for debugging
  const scrollElement = scrollRoot.node();
  if (scrollElement && 'dataset' in scrollElement) {
    const element = scrollElement as HTMLElement;
    element.dataset.centerIndex = String(liveCenterIndex);
    element.dataset.stableAnchor = String(stableBookmarkAnchor);
  }

  if (hasSignificantChange) {
    setRenderSlice({
      start: renderStart,
      end: renderEnd,
      verseIDs: newSlice
    });
  }
}, [liveCenterIndex, prefetchAnchor, verseKeys, policy, ...]);
```

### Loader - Data Fetching

**Cross-Reference Loader (Lines 5-113):**
```typescript
// client/src/hooks/useCrossRefLoader.ts
export function useCrossRefLoader(verseKeys: string[]) {
  const { crossRefs: crossRefsStore, loadCrossRefsData } = useBibleStore();
  const loadingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadCrossRefs = async () => {
      if (verseKeys.length === 0) return;

      // TWO-STAGE: Only load verses with 'none' status
      const neededVerses = verseKeys.filter(verseId => {
        const crossRefStatus = crossRefsStore[verseId];
        return (!crossRefStatus || 
                crossRefStatus.status === 'none' || 
                !crossRefStatus.data) && 
               !loadingRef.current.has(verseId);
      });

      if (neededVerses.length === 0) return;

      // Mark as loading to prevent duplicate requests
      neededVerses.forEach(verseId => {
        loadingRef.current.add(verseId);
      });

      try {
        // Load top-5 cross-refs (stage 1)
        await loadCrossRefsData(neededVerses);
        
        // Clear loading flags
        neededVerses.forEach(verseId => {
          loadingRef.current.delete(verseId);
        });
      } catch (error) {
        console.error('Cross-ref load failed:', error);
        neededVerses.forEach(verseId => {
          loadingRef.current.delete(verseId);
        });
      }
    };

    loadCrossRefs().catch(console.error);
  }, [verseKeys.join(','), crossRefsStore, loadCrossRefsData]);
}
```

**Notes:** No traditional batch loader - uses direct Supabase queries per translation/column type.

### Prefetch Logic

**Location:** `client/src/hooks/usePrefetchLoader.ts` (inferred from usage)

**Policy Calculation (Lines 90-91 of useOptimizedAnchorSlice):**
```typescript
const fast = velocityRps > 13; // ~800 rows/min = fast scroll
const policy = useMemo(() => choosePolicy(deviceMemory, direction, fast), [deviceMemory, direction, fast]);
```

**Prefetch Hook (Lines 94-101):**
```typescript
usePrefetchLoader(
  prefetchAnchor,       // Trigger anchor (updates every 80-100 verses)
  policy,               // Dynamic policy based on device/speed
  direction,            // Scroll direction (1 or -1)
  velocityRps,          // Rows per second
  ensureCacheRange,     // Cache management function
  evictCacheIfNeeded    // Cache eviction function
);
```

### Cache Store

**Location:** `client/src/hooks/useVerseCache.ts`

```typescript
type CacheEntry = {
  verseKey: string;
  lastAccess: number;
  data: any; // verse text data
};

export function useVerseCache() {
  const cacheRef = useRef<Map<number, CacheEntry>>(new Map());
  const lastCleanupRef = useRef(Date.now());

  const ensureCacheRange = useCallback((start: number, end: number, chunkSize: number) => {
    const cache = cacheRef.current;
    const now = Date.now();
    
    // Check what's missing
    const missing: number[] = [];
    for (let i = start; i <= end; i++) {
      if (!cache.has(i)) {
        missing.push(i);
      } else {
        // Update access time
        cache.get(i)!.lastAccess = now;
      }
    }

    if (missing.length === 0) return;

    // Create placeholder entries (actual loading happens elsewhere)
    missing.forEach(index => {
      cache.set(index, {
        verseKey: `verse-${index}`,
        lastAccess: now,
        data: null
      });
    });
  }, []);

  const evictCacheIfNeeded = useCallback((maxSize: number) => {
    const cache = cacheRef.current;
    if (cache.size <= maxSize) return;

    const now = Date.now();
    // Cleanup throttled to every 5 seconds
    if (now - lastCleanupRef.current < 5000) return;
    
    // LRU eviction - sort by access time
    const entries = Array.from(cache.entries()).sort(
      (a, b) => a[1].lastAccess - b[1].lastAccess
    );
    
    // Remove oldest entries
    const toRemove = cache.size - maxSize;
    for (let i = 0; i < toRemove; i++) {
      cache.delete(entries[i][0]);
    }
    
    lastCleanupRef.current = now;
  }, []);

  return {
    ensureCacheRange,
    evictCacheIfNeeded,
    getFromCache,
    isInCache,
    getCacheStats
  };
}
```

### Cross-refs/Notes Loaders

**Cross-refs:** Two-stage loading (see above)
- Stage 1: Top 5 refs loaded automatically when verse enters prefetch window
- Stage 2: Remainder loaded on-demand via "Load More" button

**Notes:** Batch loading per slice
```typescript
// VirtualBibleTable.tsx lines 423-427
useEffect(() => {
  if (showNotes && user && slice.verseIDs.length > 0) {
    batchLoadNotes(slice.verseIDs);
  }
}, [showNotes, user?.id, slice.verseIDs, batchLoadNotes]);
```

**Bookmarks:** Batch loading per slice
```typescript
// VirtualBibleTable.tsx line 186
const { data: bookmarksData } = useUserBookmarksCompat(visibleVerseKeys, mainTranslation);
```

### Programmatic Navigation

**URL/Fragment Sync:**
```typescript
// useVerseNav.ts lines 178-316 (mobile only)
const goTo = useCallback((ref: string) => {
  // Mobile: Custom history stack
  if (isMobile) {
    const newHistory = [...historyStack, ref];
    setHistoryStack(newHistory);
    setHistoryPosition(newHistory.length - 1);
    
    // Track hyperlink
    hyperlinkTracker.trackNavigation(ref, getVerseIndex(ref), mainTranslation, 'navigation');
  } else {
    // Desktop: Browser history
    const currentState = window.history.state;
    if (!currentState || currentState.ref !== ref) {
      window.history.pushState({ ref, type: 'verse-navigation' }, '', `#${ref}`);
    }
  }
  
  scrollToVerse(ref);
}, [isMobile, historyStack, scrollToVerse, mainTranslation]);
```

**Popstate Handler (Desktop - Lines 296-316):**
```typescript
useEffect(() => {
  if (isMobile) return;
  
  const onPop = (e: PopStateEvent) => {
    if (e.state && e.state.ref && e.state.type === 'verse-navigation') {
      scrollToVerse(e.state.ref);
      lastPushed.current = e.state.ref;
    }
  };
  
  window.addEventListener('popstate', onPop);
  return () => window.removeEventListener('popstate', onPop);
}, [scrollToVerse, isMobile]);
```

### CSS Constraints

**Row Height Variables:**
```css
/* index.css line 629 */
--row-height: 120px; /* Base height, set by JavaScript */
--row-height-mult: 1.0; /* Multiplier (0.5 to 2.0) */
```

**Effective row height calculation:**
```typescript
// Constants: ROW_HEIGHT = 120px
const effectiveRowHeight = ROW_HEIGHT * rowHeightMult; // 60px to 240px
```

**Cell Overflow:**
```css
/* index.css lines 1793-1797 */
.verse-cell {
  min-height: 120px;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
```

**Position Sticky:** Master column uses overlay, not sticky positioning
```typescript
// VirtualBibleTable.tsx - Master column rendered as separate overlay
// Not sticky - uses absolute positioning and JavaScript measurement
```

---

## 2) Constants & Feature Flags

### Effective Row Height
- **Base constant:** `ROW_HEIGHT = 120` (defined in `client/src/constants/layout.ts`)
- **Multiplier variable:** `--row-height-mult` CSS custom property (range: 0.5 to 2.0)
- **Calculation:** `effectiveRowHeight = ROW_HEIGHT * rowHeightMult`
- **Range:** 60px to 240px
- **Set by:** `CompactSizeController` component and `manualSizeChange` event

### Render Window Size

**Mobile (deviceMemory ≤ 4GB):**
- `renderAbove: 50` verses
- `renderBelow: 70` verses
- **Total rendered:** ~120 verses

**Desktop (deviceMemory > 4GB):**
- `renderAbove: 80` verses
- `renderBelow: 120` verses
- **Total rendered:** ~200 verses

**Source:** `client/src/utils/windowPolicy.ts` lines 20-40

### Prefetch Distances

**Mobile Normal Speed:**
- `prefetchBefore: 200` verses
- `prefetchAfter: 300` verses
- **Total prefetch:** ~500 verses

**Mobile Fast Scroll (velocity > 13 rows/sec):**
- `prefetchBefore: 200` verses
- `prefetchAfter: 600` verses (2× multiplier)
- **Total prefetch:** ~800 verses

**Desktop Normal Speed:**
- `prefetchBefore: 300` verses
- `prefetchAfter: 400` verses
- **Total prefetch:** ~700 verses

**Desktop Fast Scroll:**
- `prefetchBefore: 300` verses
- `prefetchAfter: 800` verses (2× multiplier)
- **Total prefetch:** ~1,100 verses

### Velocity Thresholds
- **Fast scroll detection:** `velocityRps > 13` (approximately 800 rows/minute)
- **Calculated:** `velRef.current = (idx - lastIdxRef.current) / dt` where dt is in seconds

### Debounce/Throttle Settings

**Scroll Events:**
- **Method:** `requestAnimationFrame` throttling (no explicit debounce)
- **Implementation:** `useScrollRoot.ts` lines 62-68
  ```typescript
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; fn(); });
  };
  target.addEventListener('scroll', onScroll, { passive: true });
  ```
- **Effective rate:** ~60 FPS max (16.67ms intervals)

**Anchor Updates:**
- **liveCenterIndex:** Every frame (60 FPS)
- **prefetchAnchor:** Every 80-100 verses moved (hysteresis)
- **stableBookmarkAnchor:** 175ms idle timeout

**Render Slice Updates:**
- **Threshold:** Only update when moved >5 verses from current slice boundary
- **Source:** `useOptimizedAnchorSlice.ts` lines 123-126

**Cache Cleanup:**
- **Throttle:** Once every 5 seconds
- **Source:** `useVerseCache.ts` line 52

### Concurrency Caps
- **No explicit concurrency limits** - Supabase handles connection pooling
- **Batch sizes:** Dynamic based on prefetch window (100-800 verses)
- **In-flight tracking:** Via `loadingRef` Set in `useCrossRefLoader`

### Smooth Scroll Flags
- **CSS:** No `scroll-behavior: smooth` set globally
- **JavaScript:** `scrollTo({ behavior: 'smooth' })` for programmatic navigation
- **Implementation:** `useScrollRoot.ts` line 52
  ```typescript
  scrollToTop: (y: number, smooth = true) => {
    window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
  }
  ```

---

## 3) Event Wiring

### Scroll Listeners

**Main Scroll Listener (useScrollRoot):**
```typescript
// client/src/hooks/useScrollRoot.ts lines 59-71
const addScrollListener = useCallback((fn: () => void) => {
  const target: any = kind === 'window' ? window : containerRef.current;
  if (!target) return () => {};
  
  // passive, rAF-throttled
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; fn(); });
  };
  
  target.addEventListener('scroll', onScroll, { passive: true });
  return () => target.removeEventListener('scroll', onScroll);
}, [kind, containerRef]);
```

**Options:** `{ passive: true }` - allows browser to optimize scroll performance

### Wheel/Touch/Pointer Listeners

**Touch Navigation (Column Swipe):**
```typescript
// useColumnSwipeNavigation - No preventDefault for vertical scroll
// Only prevents default on successful horizontal swipe detection
```

**Cross-Reference Clicks:**
```typescript
// VirtualRow.tsx lines 236-241
const handleCrossRefClick = async (ref: string, e: React.MouseEvent | React.TouchEvent) => {
  // Stop all event propagation to prevent scroll interference
  e.stopPropagation();
  e.preventDefault(); // ✅ Prevents default link behavior
  // ... navigation logic
};
```

**Mobile Tap Detection:**
```typescript
// VirtualRow.tsx lines 580-604
const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!isMobile || e.pointerType === 'mouse' || !e.isPrimary) return;
  setTapStart({ x: e.clientX, y: e.clientY, t: Date.now() });
};

const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!isMobile || e.pointerType === 'mouse' || !e.isPrimary || !tapStart) return;
  
  const dx = Math.abs(e.clientX - tapStart.x);
  const dy = Math.abs(e.clientY - tapStart.y);
  const dt = Date.now() - tapStart.t;
  const isTap = dx < 6 && dy < 6 && dt < 300;

  if (isTap) {
    openHoverVerseBarFromTap({ ... });
    e.preventDefault(); // ✅ Prevent default tap behavior
    e.stopPropagation();
  }
};
```

### preventDefault() Usage

**Where used:**
1. **Cross-reference clicks** - Prevent default link navigation
2. **Mobile taps** - Prevent double-tap zoom and text selection
3. **Search modal keyboard** - Prevent default arrow/tab/enter behavior
4. **Column navigation gestures** - Only on successful swipe detection

**Where NOT used:**
- Vertical scroll events (passive listeners)
- Window resize events
- Orientation change events

### rAF Loops

**Anchor Tracking Loop (useAnchorTracker):**
```typescript
// Lines 30-75
useEffect(() => {
  let raf = 0;
  const loop = () => {
    const top = getScrollTop();
    const containerHeight = getContainerHeight();
    
    let idx = centerIndexFrom(top, containerHeight, rowHeight, stickyHeaderOffset);
    
    // Calculate velocity
    const now = performance.now();
    const dt = (now - lastTsRef.current) / 1000;
    velRef.current = (idx - lastIdxRef.current) / dt;
    
    setLiveCenterIndex(idx);      // Every frame
    
    // Hysteresis-based prefetch anchor
    if (Math.abs(idx - prefetchAnchor) >= hysteresisRows) {
      setPrefetchAnchor(idx);
    }
    
    raf = requestAnimationFrame(loop);
  };
  
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}, [...]);
```

**What runs each frame:**
1. Scroll position read
2. Center index calculation
3. Velocity calculation
4. Direction tracking
5. Live center index update
6. Hysteresis check (prefetch anchor update if needed)
7. Idle timer reset (stable anchor)

**Other rAF usage:**
- Column measurement synchronization
- Master column overlay positioning
- Tutorial tooltip positioning

### Scroll Restoration

**Browser Default:** Disabled for custom control
```typescript
// No scroll restoration interference
// Custom history state management for mobile
// Browser history.pushState for desktop
```

**Custom Restoration:**
```typescript
// useReadingState.ts - TEMPORARILY DISABLED
// Was causing scroll position jumps on page load
```

---

## 4) Virtualization Math (Exact Formulas)

### Index → Pixel Offset

**Formula:**
```typescript
top = index * rowHeight
```

**Used in:** VirtualRow positioning
```typescript
// VirtualRow.tsx line 1437
style={{
  position: 'absolute',
  top: `${verse.index * rowHeight}px`,
  // ...
}}
```

### Pixel → Index (Center/Anchor)

**Formula (Row-Middle Anchor Mode):**
```typescript
// client/src/utils/geometry.ts lines 42-51
export function centerIndexFrom(
  top: number,           // Current scroll position
  H: number,             // Container height
  rowH: number,          // Row height (may be scaled)
  sticky: number         // Sticky header offset
): number {
  // Sticky header occludes top, so visible center is at top + (H + sticky)/2
  const centerY = top + (H + sticky) / 2;
  return Math.round(centerY / rowH - 0.5);
}
```

**Explanation:**
- Verses are conceptually centered at `(k + 0.5) * rowHeight`
- Sticky headers push visible center down by `sticky/2`
- Formula accounts for occlusion and centers on verse middle

### Visible Slice Derivation

**Formula:**
```typescript
// useOptimizedAnchorSlice.ts lines 111-112
const renderStart = Math.max(0, liveCenterIndex - policy.renderAbove);
const renderEnd = Math.min(allVerseKeys.length - 1, liveCenterIndex + policy.renderBelow);
```

**Example (Mobile, centerIndex = 1000):**
```
renderStart = max(0, 1000 - 50) = 950
renderEnd = min(31101, 1000 + 70) = 1070
slice = verses[950:1070] = 121 verses
```

### Transform vs Top Offset

**Current Implementation:** Top offset (absolute positioning)
```typescript
// VirtualRow.tsx
position: 'absolute',
top: `${verse.index * rowHeight}px`,  // ✅ Used
// NOT using transform: translateY()
```

**Reason:** Simpler calculation, no transform compositing issues

### Row Height Change Re-computation

**Formula (Preserve Center Verse):**
```typescript
// VirtualBibleTable.tsx lines 265-295
// 1. Find centered verse at OLD height
const centerVerseIndex = centerIndexFrom(currentScrollTop, containerH, prevRowHeight, stickyHeaderOffset);

// 2. Calculate scroll position for same verse at NEW height
const newScrollTop = scrollTopForIndex(centerVerseIndex, containerH, newRowHeight, stickyHeaderOffset);

// 3. Clamp to bounds
const contentHeight = verseKeys.length * newRowHeight;
const maxScroll = Math.max(0, contentHeight - containerH);
const clampedScrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));

// 4. Apply immediately
scrollRoot.scrollToTop(clampedScrollTop, false);
```

**scrollTopForIndex formula:**
```typescript
// geometry.ts lines 61-69
export function scrollTopForIndex(
  k: number,      // Verse index to center
  H: number,      // Container height
  rowH: number,   // Row height
  sticky: number  // Sticky offset
): number {
  // Inverse of centerIndexFrom
  return (k + 0.5) * rowH - (H + sticky) / 2;
}
```

---

## 5) Loader & Batching (Network Behavior)

### Current Loading Architecture

**No traditional `loadVersesByIndex()` function** - Uses distributed loading:

1. **Translation text:** Direct Supabase queries via `useTranslationMaps`
2. **Cross-references:** Batch loader via `useCrossRefLoader`
3. **Notes/Bookmarks:** Batch queries via `useNotesCache` / `useUserBookmarksCompat`
4. **Prophecy data:** On-demand via store

### Batching Rules

**Cross-References (Two-Stage):**
```typescript
// Stage 1: Top 5 refs
// Batch size: All verses in prefetch window that need loading
// Max batch: ~100-800 verses (based on prefetch policy)

const neededVerses = verseKeys.filter(verseId => {
  const status = crossRefsStore[verseId];
  return !status || status.status === 'none';
});

await loadCrossRefsData(neededVerses); // Single batch call
```

**Translation Maps:**
```typescript
// Per-translation batching
// Loads entire translation into memory on first access
// No per-verse batching needed after initial load
```

### Response Shape

**Cross-References:**
```typescript
// Store shape
crossRefs: {
  [verseKey: string]: {
    data: string[],           // Array of verse references
    status: 'none' | 'top5' | 'full'
  }
}
```

**Translation Maps:**
```typescript
// Map structure
translationMaps: {
  [translationCode: string]: {
    [verseKey: string]: string  // Verse text
  }
}
```

### Deduplication

**In-flight tracking:**
```typescript
// useCrossRefLoader.ts
const loadingRef = useRef<Set<string>>(new Set());

// Check before loading
const neededVerses = verseKeys.filter(verseId => 
  !loadingRef.current.has(verseId) && // Not currently loading
  !crossRefsStore[verseId]?.data       // Not already loaded
);

// Mark as loading
neededVerses.forEach(verseId => loadingRef.current.add(verseId));
```

**Cache checking:**
```typescript
// Skip if already in store
if (crossRefsStore[verseId]?.status !== 'none') {
  return; // Already have top-5 or full data
}
```

### Cancellation

**No AbortController currently implemented** - Potential improvement area

**Request tracking:**
```typescript
// useBibleData.ts line 784
const requestId = ++currentRequestRef.current;

// Later: check if request is stale
if (requestId !== currentRequestRef.current) {
  return; // Stale request, ignore results
}
```

### Error Handling

**Cross-ref loader:**
```typescript
try {
  await loadCrossRefsData(neededVerses);
} catch (error) {
  console.error('Cross-ref load failed:', error);
  // Clear loading flags to allow retry
  neededVerses.forEach(verseId => loadingRef.current.delete(verseId));
}
```

**No retry/backoff policy** - User-initiated retry only

---

## 6) Cache Policy

### Data Structure

**Primary cache (useVerseCache):**
```typescript
Map<number, CacheEntry>

type CacheEntry = {
  verseKey: string;
  lastAccess: number;  // Timestamp for LRU
  data: any;           // Verse data (currently placeholder)
};
```

**Cross-reference cache (store):**
```typescript
crossRefs: {
  [verseKey: string]: {
    data: string[],
    status: 'none' | 'top5' | 'full'
  }
}
```

**Translation maps (store):**
```typescript
translationMaps: {
  [translationCode: string]: {
    [verseKey: string]: string
  }
}
```

### Status Marking

**Cache entry states:**
- **Not present:** Not in cache
- **Present with data:** Ready to use
- **Present with null:** Placeholder (loading in progress)

**Cross-ref states:**
- `'none'` - Not loaded
- `'top5'` - Top 5 refs loaded
- `'full'` - All refs loaded

### TTL / Eviction

**Eviction policy:** LRU (Least Recently Used)

**Implementation:**
```typescript
// useVerseCache.ts lines 45-67
const evictCacheIfNeeded = useCallback((maxSize: number) => {
  const cache = cacheRef.current;
  if (cache.size <= maxSize) return;

  const now = Date.now();
  // Only cleanup every 5 seconds
  if (now - lastCleanupRef.current < 5000) return;
  
  // Sort by last access time (oldest first)
  const entries = Array.from(cache.entries()).sort(
    (a, b) => a[1].lastAccess - b[1].lastAccess
  );
  
  // Remove oldest entries
  const toRemove = cache.size - maxSize;
  for (let i = 0; i < toRemove; i++) {
    cache.delete(entries[i][0]);
  }
  
  lastCleanupRef.current = now;
}, []);
```

**Capacity:**
- **Mobile:** 2,000 verses
- **Desktop:** 3,000 verses

### Typical Resident Count

**At rest (not scrolling):**
- Render window: ~120-200 verses
- Prefetch window: ~500-1,100 verses
- **Total resident:** ~500-1,200 verses

**During fast scroll:**
- Prefetch window expands to 800-1,100 verses
- **Total resident:** ~1,000-1,500 verses

### Pinning During Scroll/Jump

**No explicit pinning** - Relies on:
1. Access time updates during render
2. Hysteresis preventing premature eviction
3. Large cache capacity (2,000-3,000)

**Implicit pinning:**
```typescript
// Update access time when accessed
for (let i = start; i <= end; i++) {
  if (cache.has(i)) {
    cache.get(i)!.lastAccess = now; // Keeps in cache
  }
}
```

---

## 7) Programmatic Jumps & Landing

### scrollToVerse(ref) Implementation

**Entry point (VirtualBibleTable):**
```typescript
// Lines 723-760
const goTo = useCallback((ref: string) => {
  const index = getVerseIndex(ref);
  if (index === -1) return; // Invalid reference

  const containerH = scrollRoot.getClientHeight();
  const stickyHeaderOffset = getStickyHeaderOffset(scrollRoot.kind);
  
  // Calculate target scroll position to center verse
  const targetScrollTop = scrollTopForIndex(
    index,
    containerH,
    effectiveRowHeight,
    stickyHeaderOffset
  );

  // Clamp to valid scroll bounds
  const contentHeight = verseKeys.length * effectiveRowHeight;
  const maxScroll = Math.max(0, contentHeight - containerH);
  const clampedScrollTop = Math.max(0, Math.min(targetScrollTop, maxScroll));

  // Smooth scroll to target
  scrollRoot.scrollToTop(clampedScrollTop, true); // smooth=true
  
  // Track navigation
  hyperlinkTracker.trackNavigation(ref, index, mainTranslation, 'direct-navigation');
}, [scrollRoot, effectiveRowHeight, verseKeys.length, mainTranslation]);
```

### Target Pixel Computation

**Step-by-step:**
```typescript
// 1. Get verse index
const index = getVerseIndex(ref); // e.g., "John.3:16" → 23144

// 2. Calculate position to center verse
const targetScrollTop = scrollTopForIndex(index, containerH, rowHeight, stickyOffset);
// = (23144 + 0.5) * 120 - (800 + 138) / 2
// = 2777340 - 469 = 2776871px

// 3. Clamp to valid range
const maxScroll = (31102 * 120) - 800 = 3731440px
const clampedScrollTop = clamp(2776871, 0, 3731440) = 2776871px
```

### Buffer Widening

**No temporary buffer widening** - relies on:
1. Prefetch anchor update (via hysteresis)
2. Render slice update (when centerIndex changes)
3. Normal prefetch policy (300-800 verses ahead)

**Sequence:**
1. Smooth scroll starts → `scrollToTop(target, true)`
2. Scroll position changes → anchor tracker detects
3. `liveCenterIndex` updates every frame
4. When moved >80-100 verses → `prefetchAnchor` updates
5. Prefetch loader loads new window
6. Render slice updates when >5 verses from boundary

### Post-Scroll Adjustment

**No explicit measurement/correction** - relies on:
1. Geometry formulas being accurate
2. Sticky header offset being correct
3. Row height being consistent

**Potential issue:** If row height changes during scroll animation, landing may be off by a few rows.

### Animation Type

**Smooth animation (default):**
```typescript
scrollRoot.scrollToTop(clampedScrollTop, true); // behavior: 'smooth'
```

**Instant jump (row height changes):**
```typescript
scrollRoot.scrollToTop(newScrollTop, false); // behavior: 'auto'
```

---

## 8) Cross-refs / Notes Hydration

### Loading Strategy

**Cross-references:**
- **Independent of verse text** - parallel loading
- **Two-stage approach:**
  - Stage 1 (automatic): Top 5 refs when verse enters prefetch window
  - Stage 2 (on-demand): Remaining refs when user clicks "Load More"

**Notes:**
- **Independent of verse text** - parallel loading
- **Batch loaded:** All notes for visible verses in one query
- **Trigger:** When notes column enabled + slice changes

**Bookmarks:**
- **Independent of verse text** - parallel loading
- **Batch loaded:** All bookmarks for visible verses
- **Always loaded** (not gated behind column toggle)

### Row Height Impact

**Cross-references:**
- **Fixed row height** - inner scroll for overflow
- **CSS:** `overflow-y: auto` on cell content
- **Does not change row height**

**Notes:**
- **Fixed row height** - inner scroll for overflow
- **Textarea with fixed height**
- **Does not change row height**

**Prophecy:**
- **Fixed row height** - tabs + inner scroll
- **Does not change row height**

### Prioritization

**Cross-references (two-stage):**
1. **Top 5 immediate** - loaded when verse enters prefetch window
2. **Rest deferred** - loaded only when user requests

**Notes:**
- **All immediate** - loaded when notes column toggled on
- **Batch size:** Current visible slice (~120-200 verses)

**Translation text:**
- **Highest priority** - entire translation loaded on first access
- **Cached indefinitely** - no eviction

---

## 9) Logging/Telemetry

### Debug Toggles

**Environment flags:**
```typescript
// client/src/lib/logger.ts
const IS_DEV = import.meta.env.DEV;
const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || 'info';
```

**Per-tag filtering:**
```typescript
const DEBUG_TAGS = (import.meta.env.VITE_DEBUG_TAGS || '').split(',').filter(Boolean);
```

### What Gets Logged

**Anchor tracking (occasional):**
```typescript
// useAnchorTracker.ts lines 40-50
if (Math.abs(idx - lastIdxRef.current) >= 5) {
  console.log('🎯 ANCHOR TRACKER:', {
    idx,
    top,
    containerHeight,
    stickyHeaderOffset,
    rowHeight,
    rowHeightMultiplier: rowHeight / 120
  });
}
```

**Cross-ref loading (always in dev):**
```typescript
console.log('📡 CROSS-REF LOAD - Request analysis:', {
  totalRequested: verseKeys.length,
  alreadyLoaded: verseKeys.filter(k => crossRefsStore[k]?.data).length,
  currentlyLoading: verseKeys.filter(k => loadingRef.current.has(k)).length,
  timestamp: new Date().toISOString()
});
```

**Navigation:**
```typescript
console.log('🎯 goTo called with ref:', ref);
console.log('🎯 Scrolling to:', {
  ref, index, targetScrollTop, effectiveRowHeight, ...
});
```

**Row height changes:**
```typescript
console.log('📏 ROW HEIGHT CHANGED - Preserving center verse:', {
  centerVerseIndex,
  prevRowHeight,
  newRowHeight,
  oldScrollTop,
  newScrollTop,
  multiplier
});
```

### Enable/Disable

**Development mode:**
```bash
# Enable debug logging
VITE_LOG_LEVEL=debug

# Enable specific tags
VITE_DEBUG_TAGS=WIN,TX,ANCHOR

# Disable all debug logs
VITE_LOG_LEVEL=warn
```

**Production:**
- Most debug logs disabled via `IS_DEV` check
- Critical errors always logged
- Performance-critical logs removed

---

## 10) Known Edge Cases

### ✅ Scrollbar/URL Mismatch at 2× Row Height

**Confirmed:** YES

**Reproduction:**
1. Set row height to 2.0× (240px per verse)
2. Navigate to verse via URL (e.g., `#John.3:16`)
3. Browser scrollbar shows correct position
4. Viewport renders verses 5-20 rows behind expected

**Root cause:** Sticky header offset calculation may not account for scaled row heights correctly

**Formula check needed:**
```typescript
// Does this handle scaled heights?
const centerY = top + (H + sticky) / 2;
const idx = Math.round(centerY / rowH - 0.5);
```

**Potential fix:** Verify sticky offset remains constant regardless of row scale

### ✅ Blanking During High-Velocity Flicks

**Confirmed:** Possible on low-memory devices

**Conditions:**
- Mobile device with ≤4GB RAM
- Velocity > 13 rows/sec (~800 rows/min)
- Prefetch buffer (600 verses) exceeded by scroll speed

**Mitigation in place:**
- Fast scroll detection doubles prefetch window
- But even 600 verses may not be enough for extreme flicks

**Potential improvement:**
- Increase fast scroll multiplier from 2× to 3×
- Add velocity-based rendering (show placeholders during extreme speeds)

### ❓ Layout Shifts When Adding Translations Mid-Scroll

**Needs verification**

**Potential cause:**
```typescript
// VirtualBibleTable.tsx line 822
// Width calculation happens synchronously
const actualTotalWidth = useMemo(() => {
  // ... calculates total width based on active columns
}, [adaptiveConfig, translationMaps, showCrossRefs, ...]);
```

**Expected behavior:**
1. User adds translation column
2. Width recalculates
3. If centered: content shifts to maintain center
4. If left-aligned: horizontal scroll position jumps

**Test needed:**
1. Scroll to middle of Bible
2. Add translation column
3. Observe horizontal position shift

### Other Edge Cases

**Mobile orientation change during scroll:**
- Switches between window scroll and container scroll
- May cause brief position jump
- Sticky header offset changes (138px → 160px)

**Rapid row height changes:**
- Preservation logic runs on every change
- But browser may not finish scroll before next change
- Could accumulate error

**Scrollbar drag + rapid column toggle:**
- Anchor updates disabled during drag
- Column changes may not reflect immediately
- Render slice may show stale columns

---

## 11) Grep Checklist Results

### scrollToVerse
**Locations found:**
- `client/src/pages/bible.tsx:159-162` - Main entry point
- `client/src/pages/bible.tsx:698` - HamburgerMenu callback
- `client/src/components/bible/VirtualBibleTable.tsx:49` - Interface definition
- `client/src/hooks/useVerseNav.ts:178-316` - Navigation implementation

### anchorIndex / getAnchor
**Locations found:**
- `client/src/hooks/useAnchorTracker.ts:1-89` - Anchor tracking implementation
- `client/src/hooks/useOptimizedAnchorSlice.ts:161` - Return value
- `client/src/components/bible/VirtualBibleTable.tsx:146` - Usage
- `client/src/components/bible/TopHeader.tsx:168-179` - Fallback reading

### requestAnimationFrame
**Locations found:**
- `client/src/hooks/useAnchorTracker.ts:73-75` - Main anchor loop
- `client/src/hooks/useScrollRoot.ts:67` - Scroll throttling
- `client/src/components/bible/MasterColumnOverlay.tsx:148-170` - Position sync
- `client/src/hooks/useMeasuredColumnViewport.ts:183-197` - Layout measurement

### scrollTop / clientHeight
**Locations found:**
- `client/src/hooks/useScrollRoot.ts:30-48` - Scroll root abstraction
- `client/src/hooks/useAnchorTracker.ts:33-34` - Position tracking
- `client/src/utils/geometry.ts:42-69` - Index calculations

### visibleSlice / renderStart / renderEnd
**Locations found:**
- `client/src/hooks/useOptimizedAnchorSlice.ts:111-140` - Slice calculation
- `client/src/utils/windowPolicy.ts:44-49` - Window computation
- `client/src/components/bible/VirtualRow.tsx:934` - Column filtering
- `client/src/components/bible/NewColumnHeaders.tsx:551-575` - Header sync

### rowHeight / effectiveRowHeight
**Locations found:**
- `client/src/constants/layout.ts:2` - Base constant (120px)
- `client/src/components/bible/VirtualBibleTable.tsx:260` - Effective calculation
- `client/src/hooks/useOptimizedAnchorSlice.ts:48` - ROW_HEIGHT × multiplier
- `client/src/index.css:629` - CSS variable

### translateY / position: sticky
**Locations found:**
- `client/src/index.css:21-23` - Vertical text rotation
- `client/src/components/bible/ColumnHeaders.tsx.backup:578` - Header sync (backup file)
- **No position: sticky on main table** - Master column uses overlay

### prefetch / queue
**Locations found:**
- `client/src/hooks/usePrefetchLoader.ts` - Prefetch management (referenced, not shown)
- `client/src/hooks/useOptimizedAnchorSlice.ts:94-101` - Prefetch hook usage
- `client/src/utils/windowPolicy.ts:24-36` - Prefetch distances

### inFlight / AbortController
**Locations found:**
- `client/src/hooks/useCrossRefLoader.ts:7` - In-flight tracking via Set
- **No AbortController usage** - Potential improvement area

### loadVersesByIndex
**Not found** - No centralized loader function
- Translation text: `useTranslationMaps`
- Cross-refs: `useCrossRefLoader`
- Notes: `useNotesCache`
- Bookmarks: `useUserBookmarksCompat`

---

## Summary

This codebase implements a sophisticated virtualized Bible table with:

✅ **Strengths:**
- Adaptive scroll root (window vs container) for optimal mobile UX
- Multi-tier anchor system (live, prefetch, stable)
- Device-aware prefetch policies (200-1,100 verses)
- LRU cache with 2,000-3,000 verse capacity
- Two-stage cross-reference loading
- Accurate row-middle anchor geometry
- Row height preservation during scale changes

⚠️ **Known Issues:**
1. Scrollbar/viewport mismatch at 2× row height
2. Potential blanking during extreme velocity flicks
3. No AbortController for request cancellation
4. No retry/backoff for failed requests

🎯 **Optimization Opportunities:**
1. Increase fast scroll prefetch multiplier (2× → 3×)
2. Add velocity-based placeholder rendering
3. Implement AbortController for stale request cancellation
4. Add exponential backoff for failed loads
5. Verify sticky offset calculation at all row scales

---

**Next Steps:**
Use this snapshot to design targeted improvements for "always-ready" scrolling behavior on mobile and desktop.
