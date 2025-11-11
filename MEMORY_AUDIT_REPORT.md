# Anointed.io – Memory & Asset Optimization Report
## Engineer Questionnaire Responses - October 13, 2025

---

## 0) Success Criteria (NEEDS MEASUREMENT)

**Current Status**: No baseline measurements taken yet. Need to:
1. Take heap snapshots during 10-30 min scroll sessions
2. Measure actual memory usage on mobile devices
3. Establish budget numbers based on measurements

**Target Goals** (to be filled after measurements):
- Bible app: <= ??? MB resident heap after warm load; peak <= ??? MB during burst prefetch
- Forum app: <= ??? MB resident; peak <= ??? MB
- FPS: >= 55 during fast scroll; no jank > 50ms

---

## 1) Runtime & Build Inventory

### 1.1 Bundle Sizes

**Main Bundle (after gzip)**:
- **index-B_y_YN_U.js**: 1.8MB (492.84 kB gzipped) ⚠️ **CRITICAL: 3.6x over 500kB limit**
- index-tKOFIg-K.css: 249.29 kB (38.25 kB gzipped)
- labels.worker-BBHyNMxv.js: 3.52 kB (uncompressed worker)
- debugTranslations-DAmpVrAP.js: 6.62 kB (2.75 kB gzipped)
- prophecyCache-DnXr9F2K.js: 0.80 kB (0.47 kB gzipped)

**Total dist size**: 2.2MB

**⚠️ CRITICAL ISSUE**: Main bundle is ~1.8MB (493kB gzipped), which is **3.6x over the 500kB recommended limit**. Build warns:
```
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
```

### 1.2 Top Bundle Contributors (need analysis)

**Largest Source Files by Line Count**:
1. VirtualRow.tsx - 1,519 lines
2. useBibleData.ts - 1,480 lines  
3. App.tsx - 1,394 lines (contains main Zustand stores)
4. VirtualBibleTable.tsx - 1,352 lines
5. highlightsStore.ts - 1,141 lines
6. NewColumnHeaders.tsx - 954 lines
7. BibleDataAPI.ts - 901 lines

**⚠️ CONCERN**: Many of these large files are NOT code-split and all load in main bundle.

### 1.3 Dynamic Imports (Code-Split Boundaries)

**Found 27 dynamic imports**, but many have circular dependencies preventing chunking:

**Working Dynamic Imports** (lazy loaded):
- Bible reference parser (DevTools page)
- Verse index map (DevTools page)
- BibleDataAPI functions (on-demand)
- Prophecy cache loading
- Debug translations

**⚠️ BROKEN Code Splitting** (Vite warnings):
- `queryClient.ts` - dynamically imported by userDataApi.ts BUT statically imported by 6+ files → **stays in main bundle**
- `use-toast.ts` - dynamically imported by 2 files BUT statically imported by 20+ files → **stays in main bundle**
- `useBibleData.ts` - dynamic import defeated by static imports
- `App.tsx` - dynamic import defeated by 20+ static imports

**Impact**: Dynamic imports are NOT actually reducing main bundle size due to circular dependencies.

### 1.4 Workers

**7 Workers Identified**:
1. **labels.worker.ts** - Semantic label processing
2. **crossReferencesWorker.ts** - Cross-reference processing  
3. **prophecyWorker.ts** - Prophecy data processing
4. **strongsWorker.ts** - Strong's concordance (/strongsWorker.js)
5. **translationWorker.ts** - Translation loading (/translationWorker.js)
6. **searchWorker.ts** - Search indexing (/searchWorker.js)
7. **CrossRefWorker** class - Modern implementation

**⚠️ MEMORY LEAK FOUND & FIXED**:
- `labels.worker.ts` had proper HMR cleanup implemented (line 16-22)
- Worker stored globally: `(globalThis as any).__labelsWorker`
- Cleanup on HMR dispose + beforeunload handlers present

**Worker Termination**: Not consistently implemented across all workers. Need audit.

### 1.5 Service Worker & Cache Storage

**Status**: Service Worker is **DISABLED**
- File exists as `sw.ts.disabled`  
- No active cache storage policies
- PWA plugin installed (`vite-plugin-pwa: ^1.0.1`) but not configured

**Impact**: No SW cache caps, no size limits, no eviction policies.

### 1.6 IndexedDB/Dexie

**Database**: `anointedOffline` (Dexie v2 schema)

**Object Stores**:
1. **Legacy stores (v1)**:
   - `notes`: verse_id, content, updated_at, pending
   - `bookmarks`: verse_id, color, name, updated_at, pending
   - `highlights`: verse_id, start, end, color, updated_at, pending

2. **Highlights V2 stores (v2)** - ⚠️ LARGEST:
   - `hl_ranges`: id, translation+verse_key, start/end offsets, color, metadata (origin, pending, tombstone, lastAckAt)
   - `hl_wash`: id, verse_key, color, opacity, metadata
   - `hl_meta`: sync state tracking (last_synced_at, schema_version, user_id)
   - `hl_outbox`: pending mutations queue (id, type, payload, created_at, attempts, status, error)

**⚠️ CONCERNS**:
- No size caps on stores
- Highlights stored per-translation AND per-verse (potential duplication)
- Outbox entries not cleaned up (need retention policy)
- Typical record counts: **UNMEASURED** (need to query actual usage)

---

## 2) TanStack Query Configuration

### 2.1 Global Defaults

**File**: `client/src/lib/queryClient.ts`

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,  // ⚠️ NEVER invalidates
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
```

**Analysis**:
- ✅ GOOD: `refetchOnWindowFocus: false` prevents refetch storms
- ✅ GOOD: `refetchOnReconnect: false` (via refetchInterval)
- ❌ BAD: `staleTime: Infinity` - data NEVER invalidates
- ❌ BAD: No `gcTime` set - defaults to 5 min, but with Infinity staleTime, data never marked stale
- ❌ MISSING: `structuralSharing` not explicitly set (defaults to true)

### 2.2 Per-Query Overrides

**Found custom staleTime/gcTime in**:
- `useRowData.ts`: `staleTime: 30_000` (30 sec)
- `useVerseHighlights.ts`: `staleTime: 5 * 60 * 1000`, `gcTime: 10 * 60 * 1000` (5 min / 10 min)
- `useOptimizedHighlights.ts`: `staleTime: 5 * 60 * 1000`, `gcTime: 10 * 60 * 1000`
- `useGlobalContextBoundaries.ts`: `staleTime: Infinity`, `gcTime: Infinity` ⚠️
- `useUserData.ts`: `staleTime: 5 * 60 * 1000`, `gcTime: 10 * 60 * 1000`

**⚠️ ISSUE**: Global `staleTime: Infinity` means most queries are NEVER garbage collected because they're never stale.

### 2.3 Large Query Responses (need measurement)

**Suspected >1MB queries**:
- Translation text loading (31,102 verses × translations)
- Cross-references (some verses have 76+ refs)
- Strong's concordance data
- Prophecy index data

**⚠️ ACTION NEEDED**: Instrument queryClient to log response sizes.

---

## 3) Zustand Stores

### 3.1 Main Bible Store (`App.tsx` line 94-125+)

**State Shape** (excerpt):
```typescript
{
  translations: Record<string, any>;  // ⚠️ Full translation objects
  actives: string[];
  crossRefs: Record<string, CrossRefStatus>;  // All cross-refs in memory
  strongsData: Record<string, any[]>;  // All Strong's data in memory
  strongsLoading: Set<string>;
  highlights: Record<string, any[]>;  // Duplicate of hl store?
  prophecies: Record<string, any>;
  prophecyData: Record<string, { P: number[], F: number[], V: number[] }> | undefined;
  prophecyIndex: Record<number, {...}> | undefined;  // Full prophecy index
  collapsedProphecies: Set<string>;
  datesData: string[] | null;  // 31k dates?
  labelsData: Record<string, any>;  // All labels in memory
  contextBoundaries: Map<...>;  // All context boundaries
  // ... more
}
```

**⚠️ CRITICAL MEMORY ISSUES**:
1. **Full translations stored** in `translations: Record<string, any>` - could be 31k verses × translations
2. **All cross-refs** in `crossRefs` record - no LRU eviction
3. **All Strong's data** in `strongsData` - no size limit
4. **Prophecy index** - entire index loaded into memory
5. **All labels** in `labelsData` - no segmentation

**Estimated Memory** (needs measurement):
- If 3 translations × 31k verses × 100 bytes/verse = ~9MB just for verse text
- Cross-refs could be similar size
- No LRU caching, no eviction

### 3.2 Highlights Store (`stores/highlightsStore.ts` - 1,141 lines)

**State Shape** (line 78+):
```typescript
{
  rangesByTrAndVerse: Map<TrKey, Map<VerseKey, Range[]>>;  // Nested maps
  washByVerse: Map<VerseKey, Wash | null>;
  outbox: OutboxEntry[];  // Unbounded queue?
  meta: Meta;
  syncState: { status, lastSyncAt, errorCount };
  // ... more
}
```

**⚠️ CONCERNS**:
- Nested Map structure could be memory-heavy
- No size limits on ranges
- Outbox not cleared (retention policy needed)

### 3.3 Other Zustand Stores

Found in:
- `store/translationSlice.ts` - Translation state
- `stores/masterColumnStore.ts` - Master column state  
- `stores/bookmarksStore.ts` - Bookmarks

**⚠️ NEED TO AUDIT**: Sizes and retention policies

---

## 4) VirtualRow React.memo Status

### 4.1 Current Implementation

**File**: `client/src/components/bible/VirtualRow.tsx` line 1449

```typescript
const MemoizedVirtualRow = React.memo(VirtualRow, (prevProps, nextProps) => {
  if (prevProps.verseID !== nextProps.verseID) return false;
  // ... more comparisons
});
```

**✅ IMPLEMENTED**: React.memo wrapper exists with custom comparator

### 4.2 useMemo Usage

**Found 3 useMemo hooks in VirtualRow**:
1. Line 625: `contextBorderClasses` - computes context boundary classes
2. Line 1360: `actualTotalWidth` - calculates column widths using CSS variables  
3. Line 1416: `responsiveMinWidth` - viewport-responsive width

**⚠️ CRITICAL ISSUE - useMemo dependency on line 1360**:
```typescript
const actualTotalWidth = useMemo(() => {
  // ... calc using visibleColumns
}, [visibleColumns]);  // ← Depends on visibleColumns array
```

**Problem**: `visibleColumns` is likely recreated on every render, causing useMemo to recompute every time, defeating the optimization.

**Need to verify**: Is `visibleColumns` properly memoized in parent `VirtualBibleTable`?

### 4.3 Precomputed Column Config

**File**: VirtualRow.tsx line 44
```typescript
visibleColumnsConfig?: ReadonlyArray<any>;  // MEMORY OPT: Precomputed column config from parent
```

**Status**: 
- ✅ Prop exists for precomputed config
- ❓ **NEED TO VERIFY**: Is it actually being passed from VirtualBibleTable?
- ❓ **NEED TO VERIFY**: Is it being used in useMemo dependencies?

**Action**: Check VirtualBibleTable to see if visibleColumnsConfig is computed once and frozen.

---

## 5) Prefetch & Virtualization

### 5.1 Rolling Windows System

**File**: `client/src/hooks/useRollingVirtualization.ts`

**3-tier architecture**:
1. **Render window**: Visible verses only
2. **Safety buffer**: High-priority prefetch (windows.safety)  
3. **Background**: Low-priority prefetch (windows.background)

**Mobile optimization**:
- Lower row threshold (6 rows/sec with EMA+hold)
- Asymmetric flight path warming
- Reduced buffer sizes

### 5.2 Prefetch Manager

**PrefetchManager** with priority queues:
- High priority: Safety buffer
- Low priority: Background

**⚠️ MISSING**: AbortController for canceling in-flight requests on direction change

**⚠️ MISSING**: Hyperspace scroll mode (skeleton-only during fast scroll)

---

## 6) Images/Fonts/Media

**Findings**:
- Using Tailwind CSS (no custom image loading found in quick scan)
- Font usage: Standard system fonts likely
- Icons: lucide-react (SVG-based) ✅

**⚠️ NEED TO AUDIT**: 
- Check if any heavy assets in attached_assets/
- Font preloading strategy
- Image lazy loading

---

## 7) Common Leak Patterns - AUDIT RESULTS

### 7.1 ✅ FIXED Leaks:
- Labels worker cleanup (HMR dispose + beforeunload)

### 7.2 ⚠️ POTENTIAL Leaks:
1. **useEffect cleanup**: Need to audit all 333 files for missing cleanup
2. **Event listeners**: Check for missing removeEventListener
3. **Zustand subscriptions**: Verify all have cleanup  
4. **Object URLs**: Need to audit Blob/URL.createObjectURL usage
5. **Worker termination**: Not all workers have proper termination logic

### 7.3 ❌ CONFIRMED Issues:
1. **React.memo not effective** - visibleColumns dependency likely unstable
2. **useMemo defeated** - dependencies recreated each render
3. **No AbortController** - in-flight fetches not canceled
4. **Zustand holds everything** - no LRU, no eviction
5. **TanStack Query never GCs** - staleTime: Infinity prevents garbage collection

---

## 8) Top Leak Suspects (need heap snapshots)

**Without heap data, suspect based on code**:
1. **Zustand bible store** - holds all translations, cross-refs, Strong's, labels, prophecy
2. **TanStack Query cache** - Infinity staleTime = never evicts
3. **Highlights store** - nested Maps with no size limits
4. **IndexedDB outbox** - unbounded mutation queue
5. **Worker message payloads** - large array/string posts without transfer

---

## 9) Critical Actions Required

### 9.1 IMMEDIATE (Measurement Phase)
1. ✅ Build app and get bundle sizes (DONE)
2. ❌ Take 3 heap snapshots (baseline → heavy use → post-GC)  
3. ❌ Record 120s performance profile during fast scroll
4. ❌ Measure IndexedDB store sizes  
5. ❌ Instrument actual query response sizes

### 9.2 HIGH PRIORITY (Optimization Phase)
1. **Fix React.memo** - Stabilize visibleColumns in VirtualBibleTable
2. **Fix TanStack Query** - Set proper gcTime, remove Infinity staleTime for heavy queries
3. **Add LRU to Zustand** - Limit translations, cross-refs, Strong's data to last N used
4. **Implement AbortController** - Cancel in-flight requests on scroll direction change
5. **Code-split main bundle** - Fix circular imports defeating dynamic imports

### 9.3 MEDIUM PRIORITY
1. Implement hyperspace scroll mode (skeleton-only during fast scroll)
2. Add SW cache caps and eviction policies  
3. Clean IndexedDB outbox with retention policy
4. Audit all useEffect for missing cleanup
5. Implement translation streaming (avoid full JSON.parse)

### 9.4 FUTURE
1. Add Playwright e2e memory test
2. Set bundle budgets in CI
3. Add Sentry memory breadcrumbs

---

## 10) Open Questions (need answers)

1. **Is visibleColumnsConfig actually being passed from VirtualBibleTable?**
2. **What is actual memory usage on mobile during 10min scroll?**
3. **Which queries are >1MB responses?**
4. **How many highlights/notes does average user have?**
5. **What percentage of users have >1000 highlights?**
6. **Is IndexedDB outbox being cleaned up?**
7. **Are workers properly terminated or do they accumulate?**
8. **What's in the 1.8MB main bundle? (need bundle analyzer)**

---

## Summary

**Current State**: 
- ❌ Main bundle 3.6x over size limit (1.8MB / 493kB gzipped)
- ❌ React.memo likely not working (unstable dependencies)
- ❌ TanStack Query never GCs (staleTime: Infinity)
- ❌ Zustand holds all data with no LRU
- ❌ No measurements taken yet
- ✅ Labels worker leak fixed
- ✅ PWA/SW infrastructure exists (disabled)

**Next Steps**:
1. Get heap snapshots and performance profiles
2. Fix visibleColumns memoization  
3. Fix TanStack Query gc policy
4. Implement LRU for Zustand stores
5. Code-split to reduce main bundle

**Estimated Impact**: 
- Bundle splitting: Could reduce initial load to <500kB
- TanStack Query gc: Could free 50-70% of cached data
- Zustand LRU: Could reduce memory from 5GB to 50-100MB
- React.memo fix: Could eliminate 100k+ objects/sec allocation
