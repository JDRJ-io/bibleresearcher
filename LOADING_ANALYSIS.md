# Virtual Bible Table - Loading & Scrolling Analysis

## Executive Summary

Your Virtual Bible Table uses a sophisticated multi-layered loading system with:
- **Real-time anchor tracking** (60 FPS during scrolling)
- **Dynamic prefetch windows** (200-800 verses based on device & speed)
- **Render window** (120-200 verses visible at once)
- **Smart hysteresis** to prevent excessive reloading

---

## 1. Anchor Verse Tracking Frequency

### How Often: **Every Frame (Up to 60 times per second)**

**Location:** `client/src/hooks/useAnchorTracker.ts`

The anchor tracking runs in a `requestAnimationFrame` loop:

```typescript
useEffect(() => {
  let raf = 0;
  const loop = () => {
    const top = getScrollTop();
    const containerHeight = getContainerHeight();
    
    // Calculate center verse index
    let idx = centerIndexFrom(top, containerHeight, rowHeight, stickyHeaderOffset);
    
    // Update velocity and direction
    const now = performance.now();
    const dt = (now - lastTsRef.current) / 1000;
    velRef.current = (idx - lastIdxRef.current) / dt;
    
    setLiveCenterIndex(idx);  // ✅ Updates EVERY FRAME
    
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}, [...]);
```

**Three types of anchors:**
1. **`liveCenterIndex`** - Updates every frame (60 FPS) - used for UI rendering
2. **`prefetchAnchor`** - Updates when moved 80-100 verses from last position (hysteresis)
3. **`stableBookmarkAnchor`** - Updates after 175ms of idle (used for bookmarks/history)

---

## 2. Verse Loading Windows

### Render Window (What You See)

**Mobile:**
- 50 verses above anchor
- 70 verses below anchor
- **Total: ~120 verses rendered**

**Desktop:**
- 80 verses above anchor
- 120 verses below anchor
- **Total: ~200 verses rendered**

### Prefetch Window (What's Loading Ahead)

**Mobile (Normal Speed):**
- 200 verses before anchor
- 300 verses after anchor
- **Total: ~500 verses prefetched**

**Mobile (Fast Scrolling - over 800 rows/min):**
- 200 verses before anchor
- 600 verses after anchor (2x multiplier)
- **Total: ~800 verses prefetched**

**Desktop (Normal Speed):**
- 300 verses before anchor
- 400 verses after anchor
- **Total: ~700 verses prefetched**

**Desktop (Fast Scrolling):**
- 300 verses before anchor
- 800 verses after anchor (2x multiplier)
- **Total: ~1,100 verses prefetched**

---

## 3. Loading Triggers & When Data is Fetched

### A. Initial Load
**When:** Page loads or verse keys change (canonical ↔ chronological toggle)
**What:** First 120 verses loaded immediately

### B. Scroll-Based Loading
**When:** User scrolls and moves 80-100 verses from the last prefetch anchor
**What:** New prefetch window calculated and loaded

**Hysteresis prevents excessive loading:**
```typescript
// Only reload when moved significant distance
if (Math.abs(idx - prefetchAnchor) >= hysteresisRows) {
  setPrefetchAnchor(idx); // Triggers new prefetch
}
```

**Hysteresis values:**
- Mobile: 80 verses
- Desktop: 100 verses

### C. Data Types Loading Per Verse

For each verse in the prefetch window, these are loaded:

1. **Main Translation Text** (immediate)
   - Loaded from Supabase or cache
   - Handler: `useTranslationMaps` + `useBibleData`

2. **Cross-References** (two-stage)
   - **Stage 1:** Top 5 cross-refs loaded immediately
   - **Stage 2:** Remaining refs loaded on-demand ("Load More" button)
   - Handler: `useCrossRefLoader`

3. **Prophecy Data** (if column enabled)
   - Handler: `useSliceDataLoader`

4. **User Notes** (if column enabled)
   - Batch loaded for visible verses
   - Handler: `useNotesCache.batchLoadNotes()`

5. **Bookmarks** (always)
   - Batch loaded for visible verses
   - Handler: `useUserBookmarksCompat`

6. **Labels** (if active labels selected)
   - Loaded for visible verses only
   - Handler: `useViewportLabels`

---

## 4. Scroll Event Handling

### Frequency: **Throttled via `requestAnimationFrame`**

**Primary scroll listener** in `VirtualBibleTable.tsx`:

```typescript
useEffect(() => {
  const onScroll = () => {
    const currentScrollTop = scrollRoot.getScrollTop();
    
    // Update state (throttled by RAF)
    if (!isScrollbarDragging) {
      setScrollTop(currentScrollTop);
    }
    
    // Mobile banner animation
    if (isMobile && currentScrollTop > 30) {
      window.dispatchEvent(new CustomEvent('virtualTableScroll', { 
        detail: { scrollDirection: 'down', scrollTop: currentScrollTop } 
      }));
    }
  };

  return scrollRoot.addScrollListener(onScroll);
}, [scrollRoot, isScrollbarDragging, isMobile]);
```

**No explicit throttle/debounce** - relies on browser's natural RAF batching (~16ms intervals at 60 FPS)

---

## 5. Performance Optimizations

### Smart Caching
- **Cache capacity:** 2,000 verses (mobile) or 3,000 verses (desktop)
- **Eviction policy:** LRU (Least Recently Used)
- **Cache managed by:** `useVerseCache` hook

### Fast Scroll Detection
```typescript
const fast = velocityRps > 13; // ~800 rows/min
const policy = choosePolicy(deviceMemory, direction, fast);
```

When fast scrolling detected:
- Prefetch window **doubles** in scroll direction
- Prevents "white space" during rapid movement

### Directional Prefetching
```typescript
// More verses loaded in scroll direction
if (direction === 1) {
  // Scrolling down: load more below
  prefetchAfter: 400 * fastFactor
} else {
  // Scrolling up: load more above
  prefetchBefore: 300
}
```

### Render Slice Hysteresis
```typescript
// Only update render slice if moved significantly
const hasSignificantChange = 
  currentSlice.length === 0 ||
  Math.abs(renderStart - renderSlice.start) > 5 ||
  Math.abs(renderEnd - renderSlice.end) > 5;

if (hasSignificantChange) {
  setRenderSlice({ start, end, verseIDs });
}
```

Prevents re-rendering for tiny scroll adjustments.

---

## 6. Navigation & Scrolling Flow

### User Scrolls Down

1. **Frame 1:** Scroll event fires → RAF scheduled
2. **Frame 2:** `useAnchorTracker` calculates new center index
3. **Frame 3:** If moved 5+ verses, logs anchor change
4. **Frames 4-60:** Continues tracking every frame
5. **When moved 80-100 verses:** 
   - `prefetchAnchor` updates
   - New prefetch window calculated
   - `usePrefetchLoader` loads missing verses
6. **When moved 5+ verses from render boundary:**
   - Render slice updates
   - UI re-renders with new verse rows

### User Clicks Verse Link

1. Navigation requested via `onVerseClick(ref)`
2. Verse index calculated from reference
3. Scroll position computed: `scrollTopForIndex(index, ...)`
4. Smooth scroll to position
5. Anchor tracker detects new position
6. Prefetch window adjusts to new location

### User Drags Scrollbar

1. `isScrollbarDragging` set to `true`
2. Anchor slice updates **disabled** during drag
3. Position updates on drag
4. On release: `isScrollbarDragging` = `false`
5. Anchor recalculated immediately
6. Prefetch window loads for new position

---

## 7. Cross-Reference Loading Strategy

**Two-Stage Loading System** (optimized for performance):

### Stage 1: Top 5 (Automatic)
- Loads when verse enters prefetch window
- Shows first 5 most relevant cross-refs
- Status: `'top5'`

### Stage 2: Remainder (On-Demand)
- User clicks "Load More" button
- Fetches remaining cross-refs from server
- Merges with top 5
- Status: `'full'`

**Benefits:**
- Faster initial load
- Reduced bandwidth
- Better UX (instant first results)

---

## 8. Memory Management

### Cache Limits
- Mobile: 2,000 verses cached
- Desktop: 3,000 verses cached

### Eviction Strategy
When cache exceeds capacity:
1. Find oldest accessed verses
2. Remove until under limit
3. Keep prefetch window always in cache

### Data Structure
```typescript
// Verse cache entry
{
  verseID: string,
  data: BibleVerse,
  lastAccess: timestamp,
  translationData: Record<string, string>
}
```

---

## 9. Key Performance Metrics

### Update Frequencies

| Component | Frequency | Trigger |
|-----------|-----------|---------|
| Anchor tracking | 60 FPS | `requestAnimationFrame` loop |
| Prefetch anchor | Every 80-100 verses | Hysteresis threshold |
| Stable anchor | After 175ms idle | Timeout |
| Render slice | Every 5+ verses | Position change |
| Cross-refs | On prefetch update | Verse enters window |
| Notes/Bookmarks | On slice change | Batch load |

### Loading Volumes

| Device | Normal Scroll | Fast Scroll |
|--------|--------------|-------------|
| Mobile | ~500 verses | ~800 verses |
| Desktop | ~700 verses | ~1,100 verses |

### Render Volumes

| Device | Verses on Screen |
|--------|-----------------|
| Mobile | ~120 verses |
| Desktop | ~200 verses |

---

## 10. Diagnostic Commands

To debug loading in browser console:

```javascript
// View current metrics
document.querySelector('[data-center-index]').dataset

// Force cache stats
window.__verseCache?.getCacheStats()

// Monitor anchor changes
console.log('Anchor:', document.querySelector('.unified-scroll-container')?.dataset.centerIndex)

// Track prefetch window
// Check console for: "📡 CROSS-REF LOAD" messages
```

---

## Summary

Your system uses a **highly optimized multi-layer approach**:

1. **Real-time tracking** (60 FPS) for smooth scrolling
2. **Smart prefetching** (200-1,100 verses) based on device & speed
3. **Hysteresis** (80-100 verses) to prevent excessive loads
4. **Directional loading** - more verses in scroll direction
5. **Two-stage cross-refs** - fast initial load, full on-demand
6. **Batch operations** - notes, bookmarks, labels loaded together
7. **LRU cache** - 2,000-3,000 verse capacity with smart eviction

This ensures **buttery-smooth scrolling** while keeping memory and bandwidth usage reasonable.
