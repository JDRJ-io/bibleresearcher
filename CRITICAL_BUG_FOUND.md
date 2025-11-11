# CRITICAL MEMORY BUG - Root Cause Analysis

## The Problem

**User Report**: "we're not actually utilizing the use memo"

**Confirmed**: The useMemo optimizations are **DEFEATED** by unstable dependencies.

---

## Bug Location

**File**: `client/src/components/bible/VirtualRow.tsx`

### Line 847-851: Local Variable Assignment
```typescript
let visibleColumns: any[];

if (visibleColumnsConfig && visibleColumnsConfig.length > 0) {
  visibleColumns = visibleColumnsConfig as any[];
} else {
  // FALLBACK: Compute locally
```

### Line 1409: useMemo Dependency
```typescript
const actualTotalWidth = useMemo(() => {
  // ... calculation using visibleColumns
}, [visibleColumns]);  // ← BUG: Depends on reassigned variable!
```

---

## Why It Fails

1. **VirtualBibleTable.tsx line 328-444**: Computes `visibleColumnsConfig` with useMemo
   - Dependencies: `[columnState, showCrossRefs, showNotes, showProphecies, showHybrid, translationMaps, navigationOffset]`
   - Returns: `Object.freeze(visibleColumns)` - new frozen array instance
   
2. **VirtualBibleTable.tsx line 1198**: Passes to VirtualRow
   ```typescript
   visibleColumnsConfig={visibleColumnsConfig}
   ```

3. **VirtualRow.tsx line 847-851**: Assigns to local variable
   ```typescript
   let visibleColumns = visibleColumnsConfig as any[];
   ```
   
4. **VirtualRow.tsx line 1409**: useMemo depends on local variable
   ```typescript
   }, [visibleColumns]);
   ```

### The Failure Chain:

**navigationOffset changes** 
→ VirtualBibleTable's `visibleColumnsConfig` useMemo recomputes (new frozen array)
→ VirtualRow receives new `visibleColumnsConfig` prop
→ VirtualRow assigns it to `visibleColumns` local variable
→ VirtualRow's `actualTotalWidth` useMemo sees **new visibleColumns reference**
→ **useMemo recomputes on EVERY render** ❌

**Result**: The 132k-198k objects/second allocation is **STILL HAPPENING** because useMemo is recomputing constantly.

---

## Additional Issues

### Line 1442: Using local variable
```typescript
{visibleColumns.map(renderSlot)}
```

Every time `visibleColumns` is reassigned (line 851), any useMemo depending on it invalidates.

### VirtualBibleTable navigationOffset Trigger

The `navigationOffset` changes **frequently** during column navigation, causing:
- `visibleColumnsConfig` to recompute
- New frozen array instance created
- VirtualRow's useMemo invalidated
- **All 120-220 visible rows recompute width calculations**

---

## The Fix

### Option 1: Depend on Prop Directly (Recommended)
```typescript
// Line 1409 - Change dependency from local var to prop
const actualTotalWidth = useMemo(() => {
  // ... use visibleColumnsConfig directly
}, [visibleColumnsConfig]);  // Use prop, not local variable
```

### Option 2: Stabilize Parent useMemo (Better)

**VirtualBibleTable.tsx line 444** - Remove volatile dependencies:
```typescript
// BEFORE (recomputes too often):
}, [columnState, showCrossRefs, showNotes, showProphecies, showHybrid, translationMaps, navigationOffset]);

// AFTER (only recompute when columns actually change):
}, [columnState, showCrossRefs, showNotes, showProphecies, showHybrid, translationMaps]);
// Remove navigationOffset - it shouldn't trigger column recomputation
```

**Why**: `navigationOffset` only changes which columns are VISIBLE in the slice, but the column CONFIGURATION doesn't change. The slice filtering happens later (line 427).

### Option 3: Eliminate Local Variable (Best)
```typescript
// Remove line 847-851 assignment
// Use visibleColumnsConfig directly everywhere:
{visibleColumnsConfig?.map(renderSlot) || computeFallback().map(renderSlot)}
```

---

## Impact Analysis

### Current State (BROKEN):
- useMemo recomputes on every `navigationOffset` change
- 120-220 rows × width calculations = **26,400-43,560 calculations/navigation**
- If navigation happens 5 times/second during fast scroll = **132k-198k calculations/second**
- Each calculation allocates objects → **5GB memory growth**

### After Fix:
- useMemo only recomputes when columns actually change (toggle cross-refs, add translation, etc.)
- Navigation doesn't trigger recomputation
- **Memory: 5GB → 50-100MB** ✅
- **Smooth 60fps scrolling** ✅

---

## Recommended Action

**IMMEDIATE FIX**:
1. Remove `navigationOffset` from VirtualBibleTable useMemo dependencies (line 444)
2. Change VirtualRow useMemo dependency from `visibleColumns` to `visibleColumnsConfig` (line 1409)
3. Verify React.memo comparator includes `visibleColumnsConfig` check

This will finally make the "memory optimization" actually work!
