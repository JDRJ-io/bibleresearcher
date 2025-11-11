# Rolling Windows System

## Overview

The Rolling Windows system is the core virtualization engine for the Virtual Bible Table, providing professional-grade, always-ready scrolling. It implements a 3-tier prefetch strategy with direction-biased caching to eliminate blanking during fast scrolls.

**Status:** This is now the only virtualization system. The old 2-tier fallback system has been deprecated.

## Architecture

### Three-Tier Windows

1. **Render Window** (120-200 verses)
   - What's actually visible on screen
   - Updates every 8 verses for smooth transitions
   - Direction-biased: 20 verses extra in scroll direction

2. **Safety Buffer** (150-400 verses)
   - Prevents blanking during normal scroll
   - High-priority prefetch
   - Larger buffer in scroll direction

3. **Background Window** (200-900 verses)
   - Deep prefetch for fast flicks
   - Low-priority with cancellation
   - Heavy bias in scroll direction (2-3× larger)

### Components

#### Core Hooks

- **`useLiveAnchor.ts`** - 60 FPS anchor tracking with stepped index for planning
- **`useRollingWindows.ts`** - Calculates 3-tier windows based on direction/velocity
- **`usePrefetchRolling.ts`** - Only enqueues NEW slivers (no redundant fetches)

#### Infrastructure

- **`prefetch/PrefetchManager.ts`** - Centralized queue with:
  - Automatic range merging/deduplication
  - Concurrency caps (2 mobile, 4 desktop)
  - Priority queues (high=safety, low=background)
  - AbortController for stale fetches

- **`data/verseCache.ts`** - Smart cache with:
  - Direction-biased LRU eviction
  - In-flight request tracking
  - Pin/unpin for programmatic jumps
  - 2,000-3,000 verse capacity

- **`data/ensureRangeLoaded.ts`** - Batched loader:
  - Integrates with existing Supabase/translation system
  - Deduplication via in-flight guards
  - Error handling with retry capability

#### Utilities

- **`utils/flightPath.ts`** - Fast flick prediction:
  - Predicts landing spot: `center + dir × (velocity × 1.8)`
  - Pre-warms landing zone with high priority
  - Prevents blanking on extreme velocity scrolls

- **`utils/geometry.ts`** - Enhanced with:
  - `effectiveRowHeightPx()` - Always returns integer
  - `pixelForIndex()` - Direct pixel calculation
  - `indexForPixel()` - Reverse lookup

## Configuration

### Logging

Enable detailed logging via `.env`:

```bash
# Enable ROLLING and PREFETCH log tags for debugging
VITE_DEBUG_TAGS=ROLLING,PREFETCH
```

### Feature Status

All rolling windows features are now **always enabled** (no feature flags):
- ✅ 3-tier rolling windows (render/safety/background)
- ✅ Centralized PrefetchManager with queue deduplication
- ✅ AbortController for background fetch cancellation
- ✅ Device-specific optimizations (desktop vs mobile)

**Removed flags** (now always on):
- `VITE_ROLLING_WINDOWS` - removed, always enabled
- `VITE_PREFETCH_MGR` - removed, always enabled  
- `VITE_ABORT_BG` - removed, always enabled

## Usage

The system is automatically integrated via `useVirtualization`:

```typescript
import { useVirtualization } from '@/hooks/useRollingVirtualization';

const { anchorIndex, stableAnchor, slice, metrics } = useVirtualization(
  scrollRoot,
  verseKeys,
  mainTranslation,
  rowHeight,
  undefined, // No fallback needed
  { disabled: isScrollbarDragging }
);
```

### Option 3: Hybrid (Best of Both)

Use the wrapper hook:

```typescript
import { useVirtualization } from '@/hooks/useRollingVirtualization';
import { useOptimizedAnchorSlice } from '@/hooks/useOptimizedAnchorSlice';

const { anchorIndex, stableAnchor, slice, metrics } = useVirtualization(
  scrollRoot,
  verseKeys,
  mainTranslation,
  useOptimizedAnchorSlice, // Fallback
  { disabled: isScrollbarDragging }
);
```

This automatically uses rolling windows if `VITE_ROLLING_WINDOWS=on`, otherwise falls back.

## Performance Characteristics

### Current System (2-Tier)

| Metric | Mobile | Desktop |
|--------|--------|---------|
| Render window | 120 verses | 200 verses |
| Prefetch window | 500-800 verses | 700-1,100 verses |
| Fast scroll multiplier | 2× | 2× |
| Blanking risk | Medium | Low |
| Cache eviction | Simple LRU | Simple LRU |

### Rolling Windows (3-Tier)

| Metric | Mobile | Desktop |
|--------|--------|---------|
| Render window | 120 verses | 200 verses |
| Safety buffer | 350-450 verses | 450-700 verses |
| Background window | 600-1,000 verses | 750-1,400 verses |
| Fast scroll multiplier | 3× (via flight path) | 3× (via flight path) |
| Blanking risk | Very Low | Very Low |
| Cache eviction | Direction-biased | Direction-biased |

### Key Improvements

1. **Eliminates blanking** - 3-tier system with flight path warming
2. **Reduces network load** - Smart merging eliminates redundant requests
3. **Better cache utilization** - Direction-biased eviction keeps relevant data
4. **Cleaner dev logs** - Sampled logging (1 per 300ms) vs continuous

## Troubleshooting

### Issue: Verses not loading

**Symptom:** Blank rows during scroll

**Check:**
1. Enable debug logs: `VITE_DEBUG_TAGS=PREFETCH,ROLLING`
2. Look for "fetch:range" logs
3. Check browser network tab for failed requests
4. Verify translation is loaded: `masterCache.get('translation-KJV')`

**Solution:**
- Increase safety buffer in `useRollingWindows.ts`
- Reduce velocity threshold for flight path activation

### Issue: Too many network requests

**Symptom:** Network tab shows redundant fetches

**Check:**
1. Look for "batch:done" logs with overlapping ranges
2. Check if PrefetchManager is merging correctly

**Solution:**
- Ensure `VITE_PREFETCH_MGR=on`
- Verify `merge()` function in PrefetchManager.ts

### Issue: Cache thrashing

**Symptom:** Same verses loaded repeatedly

**Check:**
1. Cache size: `verseCache.size()`
2. Eviction logs in direction-biased eviction

**Solution:**
- Increase cache capacity (highWater/target)
- Verify forward/backward background ranges are correct

## Performance Monitoring

### Console Commands

```javascript
// Check cache status
verseCache.size() // Current cache size
verseCache.inFlight.size // In-flight requests

// Monitor prefetch queue
// (Add this to PrefetchManager for debugging)
prefetch.pending.length // Queued ranges
prefetch.running // Active requests

// Test flight path prediction
import { predictLanding } from '@/utils/flightPath';
predictLanding(1000, 50) // center=1000, velocity=50 rps
```

### Metrics to Track

1. **Cache hit rate** - Verses loaded from cache vs network
2. **Blanking events** - Scroll events with missing verses
3. **Network efficiency** - Unique verses loaded / total requests
4. **Flight path accuracy** - Landing predictions vs actual landings

## Migration Checklist

- [ ] Add environment flags to `.env`
- [ ] Test rolling windows in development
- [ ] Verify no blanking during fast scrolls
- [ ] Check network tab for request efficiency
- [ ] Test all scroll scenarios (normal, fast, jump)
- [ ] Compare cache memory usage (before/after)
- [ ] Enable ROLLING/PREFETCH logging
- [ ] Monitor for 1-2 days in development
- [ ] A/B test with users (50/50 split)
- [ ] Roll out to 100% when stable

## Technical Decisions

### Why 3 tiers instead of 2?

The safety buffer acts as a guaranteed no-blanking zone, while background prefetch can be aggressive without risking visible gaps.

### Why direction-biased eviction?

During fast scrolls, verses behind the user are unlikely to be revisited. Keeping verses in the scroll direction maximizes cache utility.

### Why stepped index (every 8 rows)?

Reduces prefetch churn - windows only update every 8 verses instead of every single verse, while still feeling instant to users.

### Why flight path warming?

Even with large buffers, extreme velocity flicks (>50 rows/sec) can exceed prefetch. Predicting landing and pre-warming prevents blanking.

## Future Enhancements

1. **Adaptive buffer sizing** - Adjust based on device memory and connection speed
2. **Predictive caching** - Learn user reading patterns (e.g., always reads chapters sequentially)
3. **Cross-reference prefetch** - Load cross-refs for predicted verses
4. **Service Worker caching** - Offline support for frequently accessed ranges
5. **WebSocket streaming** - Push new verses before user requests them

## Support

For questions or issues with rolling windows integration:

1. Check console logs with `VITE_DEBUG_TAGS=ROLLING,PREFETCH`
2. Review `RFI_RESPONSE_SCROLLING_LOADING.md` for current system details
3. Compare behavior with flags on/off
4. Report issues with full console logs and network traces
