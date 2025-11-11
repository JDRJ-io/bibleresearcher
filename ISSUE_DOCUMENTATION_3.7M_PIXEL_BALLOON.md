# 3.7 Million Pixel Balloon Issue - Complete Documentation

## Executive Summary
This document provides exhaustive documentation of the "3.7 million pixel div balloon" issue that occurs in **portrait mode only**. The issue causes a div element to expand to 3,732,240 pixels (31,102 verses × 120px per row), breaking the virtual scrolling system's center anchor verse positioning.

**Status:** According to the codebase, this issue has been partially addressed (CSS comment on line 2807-2809 indicates the problematic rule was removed), but this document catalogs all files involved for comprehensive understanding.

---

## Root Cause Analysis

### The Mathematical Problem
```
31,102 total Bible verses × 120px row height = 3,732,240 pixels (3.7M pixels)
```

### The CSS Rule That Caused It
**Location:** `client/src/index.css` (lines 2807-2809)

The problematic CSS rule (NOW REMOVED according to comment):
```css
.is-portrait .virtual-bible-table {
  min-height: calc(31102 * 120px); /* = 3,732,240px */
}
```

**Purpose (original intent):** To create proper scrollbar proportioning in portrait mode by making the container match the full content height.

**Why it broke things:**
1. Defeats virtualization by forcing the table container to be 3.7M pixels tall
2. Breaks center anchor verse positioning (anchor calculations become inaccurate)
3. Causes massive layout/paint performance issues
4. Makes the DOM balloon to contain all verses instead of just the visible window

---

## Complete File Inventory

### 1. CSS Files

#### A. Main Stylesheet
**File:** `client/src/index.css`
**Total Lines:** 3,229

**Critical Sections:**

**Lines 2662-2824: Portrait Mode Rules**
```css
/* ===== iOS Safari Portrait-Only Fixes ===== */
/* These rules only affect mobile portrait mode (viewport ≤ 900px in portrait) */

/* Make BODY the scroller so iOS Safari can auto-hide the top/bottom bars */
.is-portrait body {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  min-block-size: 100dvh;
  /* ... */
}

/* Line 2722: Virtual table padding for portrait */
.is-portrait .virtual-bible-table {
  padding-inline: var(--safe-left) max(8px, var(--safe-right));
  padding-top: max(0px, var(--safe-top));
  padding-bottom: max(8px, var(--safe-bottom));
}

/* Line 2802-2810: The problematic section (NOW MARKED AS REMOVED) */
.is-portrait body {
  min-height: 100vh !important;
}

/* REMOVED: Problematic min-height that caused 3.7M pixel balloon
   Virtual scrolling now uses an internal spacer div to create scroll space
   without ballooning the table container itself */
```

**Why portrait mode only?**
- Landscape mode uses container scrolling (`.unified-scroll-container`)
- Portrait mode uses window/body scrolling (for iOS Safari URL bar auto-hide)
- The CSS rule only applies when `.is-portrait` class is present

**Lines 636-639: Row height CSS variables**
```css
:root {
  /* --row-height is now set directly by JavaScript (VirtualBibleTable) as single source of truth */
  --row-height: 120px;
  /* Fallback only; JS sets this dynamically based on ROW_HEIGHT * externalSizeMult */
}
```

---

### 2. Core Component Files

#### A. VirtualBibleTable Component
**File:** `client/src/components/bible/VirtualBibleTable.tsx`
**Total Lines:** 1,435

**Critical Code Sections:**

**Lines 1-2: Row height constant import**
```typescript
import { ROW_HEIGHT } from '@/constants/layout';
```

**Lines 147-164: Dynamic row height calculation**
```typescript
// Get dynamic row height from CSS variable (set by CompactSizeController)
const [rowHeightMult, setRowHeightMult] = useState(() => 
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--row-height-mult') || '1.0')
);

// Listen for manual size changes from CompactSizeController
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

const effectiveRowHeight = ROW_HEIGHT * rowHeightMult;
```

**Lines 167-174: Virtualization hook usage**
```typescript
// Rolling windows virtualization with intelligent prefetching
const { anchorIndex, stableAnchor, slice, metrics } = useVirtualization(
  scrollRoot, 
  verseKeys,
  mainTranslation,
  effectiveRowHeight,
  undefined, // No fallback - rolling windows is the only system
  { disabled: isScrollbarDragging }
);
```

**Lines 266-298: Center verse preservation on row height change**
```typescript
// CRITICAL: Preserve center verse when row height changes (fixes drift at different scales)
const prevRowHeightRef = useRef(effectiveRowHeight);

useEffect(() => {
  const prev = prevRowHeightRef.current;
  if (prev === effectiveRowHeight) return;

  const containerH = scrollRoot.getClientHeight();
  const currentScrollTop = scrollRoot.getScrollTop();
  const stickyHeaderOffset = getStickyHeaderOffset(scrollRoot.kind);

  // Find which verse was centered with the OLD row height
  const centerVerseIndex = centerIndexFrom(currentScrollTop, containerH, prev, stickyHeaderOffset);

  // Calculate new scroll position to keep that same verse centered with NEW row height
  let newScrollTop = scrollTopForIndex(centerVerseIndex, containerH, effectiveRowHeight, stickyHeaderOffset);

  // Clamp to bounds
  const contentHeight = verseKeys.length * effectiveRowHeight;
  const maxScroll = Math.max(0, contentHeight - containerH);
  newScrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));

  console.log('📏 ROW HEIGHT CHANGED - Preserving center verse:', {
    centerVerseIndex,
    prevRowHeight: prev,
    newRowHeight: effectiveRowHeight,
    oldScrollTop: currentScrollTop,
    newScrollTop,
    multiplier: effectiveRowHeight / ROW_HEIGHT
  });

  scrollRoot.scrollToTop(newScrollTop, false);
  prevRowHeightRef.current = effectiveRowHeight;
}, [effectiveRowHeight, scrollRoot, verseKeys.length]);
```

**Lines 1265-1288: Virtual scroll spacer implementation (THE FIX)**
```typescript
{/* Render visible verses */}
{slice.verseIDs.map((id, idx) => (
  <VirtualRow
    key={id}
    verseID={id}
    verse={bibleVerse}
    rowHeight={effectiveRowHeight}
    columnData={columnData}
    // ... props
  />
))}

{/* Virtual scroll spacer (bottom) - creates scroll space without ballooning container */}
<div 
  style={{
    height: (verseKeys.length - slice.end) * effectiveRowHeight,
    pointerEvents: 'none',
    contain: 'strict' // Prevent layout thrashing
  }}
  aria-hidden="true"
/>
```

**Lines 1085: Comment acknowledging the issue**
```typescript
// FIXED: Don't set body height to millions of pixels - causes ballooning!
```

**Lines 1302-1303: Scrollbar calculations use effectiveRowHeight**
```typescript
height: `${Math.max(8, Math.min(40, ((window.innerHeight - 85) / (verseKeys.length * effectiveRowHeight)) * 100))}%`,
top: `${Math.min(94, (scrollTop / Math.max(1, verseKeys.length * effectiveRowHeight - (window.innerHeight - 85))) * (100 - Math.max(8, Math.min(40, ((window.innerHeight - 85) / (verseKeys.length * effectiveRowHeight)) * 100))))}%`,
```

---

### 3. Virtualization System Files

#### A. Rolling Virtualization Hook
**File:** `client/src/hooks/useRollingVirtualization.ts`
**Total Lines:** 236

**Critical Code:**

**Lines 1-4: Purpose and architecture**
```typescript
/**
 * Rolling windows virtualization system
 * 3-tier window architecture with intelligent prefetching
 */
```

**Lines 34-40: Hook signature with rowHeight parameter**
```typescript
export function useRollingVirtualization(
  scrollRoot: ScrollRoot,
  verseKeys: string[],
  mainTranslation: string,
  rowHeight: number = 120,
  options?: { disabled?: boolean }
): RollingVirtualizationResult {
```

**Lines 45-80: Effective row height measurement (mobile fix)**
```typescript
// FIX #1: Measure effective row height on mobile (fixes 120px bug)
const [effectiveRowHeight, setEffectiveRowHeight] = useState(rowHeight);

useEffect(() => {
  if (!isMobile) {
    setEffectiveRowHeight(rowHeight);
    return;
  }
  
  // Measure after DOM is ready
  const timer = setTimeout(() => {
    const measured = measureEffectiveRowHeight(rowHeight);
    setEffectiveRowHeight(measured);
  }, 100);
  
  return () => clearTimeout(timer);
}, [isMobile, rowHeight]);

// Reset measurement cache on resize/orientation change
useEffect(() => {
  const handleResize = () => {
    resetRowHeightCache();
    if (isMobile) {
      const measured = measureEffectiveRowHeight(rowHeight);
      setEffectiveRowHeight(measured);
    }
  };
  
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
  };
}, [isMobile, rowHeight]);
```

**Lines 84-86: Live anchor tracking**
```typescript
// Live anchor tracking with velocity (60 FPS + scroll events)
const scroller = scrollRoot.node();
const { centerIdx, steppedIdx, velocity } = useLiveAnchor(scroller, effectiveRowHeight);
```

**Lines 174-192: Building the render slice**
```typescript
// Build slice from render window
const slice = useMemo(() => {
  const [start, end] = windows.render;
  const verseIDs = verseKeys.slice(start, end + 1);
  
  logger.info('ROLLING', 'render-slice', {
    device: isDesktop ? 'desktop' : 'mobile',
    start,
    end,
    count: verseIDs.length,
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 0
  });
  
  return {
    start,
    end,
    verseIDs
  };
}, [windows.render[0], windows.render[1], verseKeys, isDesktop]);
```

**Lines 225-235: Main virtualization hook (exports)**
```typescript
/**
 * Main virtualization hook - uses rolling windows system exclusively
 * The disabled flag controls side effects (prefetch), not the core virtualization
 */
export function useVirtualization(
  scrollRoot: ScrollRoot,
  verseKeys: string[],
  mainTranslation: string,
  rowHeight: number,
  _fallbackHook?: any, // Deprecated parameter, kept for compatibility
  options?: { disabled?: boolean }
) {
  // Always use rolling windows - it's the only system now
  return useRollingVirtualization(scrollRoot, verseKeys, mainTranslation, rowHeight, options);
}
```

---

#### B. Scroll Root Hook
**File:** `client/src/hooks/useScrollRoot.ts`
**Total Lines:** 78

**Critical Code:**

**Lines 1-24: Scroll root type definition and mode selection**
```typescript
// Heuristics: mobile portrait uses window scroll (for iOS URL bar auto-hide),
// otherwise use the table container.
function defaultSelector(): 'window' | 'container' {
  const isPortrait = window.matchMedia?.('(orientation: portrait)')?.matches ?? false;
  const isNarrow = window.innerWidth < 900; // tweak as needed
  return (isPortrait && isNarrow) ? 'window' : 'container';
}

export type ScrollRoot = {
  // read
  getScrollTop(): number;
  getScrollHeight(): number;
  getClientHeight(): number;
  // write
  scrollToTop(y: number, smooth?: boolean): void;
  // events
  addScrollListener(fn: () => void): () => void;
  // element (useful for refs / scrollIntoView)
  node(): HTMLElement | Window;
  // id
  kind: 'window' | 'container';
};
```

**Why this matters:**
- **Portrait mode (`kind: 'window'`)**: Uses window scrolling, which is why the CSS needed to set body/container heights
- **Landscape mode (`kind: 'container'`)**: Uses container scrolling, unaffected by the body height issue

**Lines 26-77: ScrollRoot implementation**
```typescript
export function useScrollRoot(containerRef: React.RefObject<HTMLElement>, force?: 'window'|'container'): ScrollRoot {
  const kind = force ?? defaultSelector();

  const getScrollTop = useCallback(() => {
    if (kind === 'window') return window.scrollY || document.documentElement.scrollTop || 0;
    const el = containerRef.current;
    return el?.scrollTop ?? 0;
  }, [kind, containerRef]);

  const getScrollHeight = useCallback(() => {
    if (kind === 'window') return Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
    const el = containerRef.current;
    return el?.scrollHeight ?? 0;
  }, [kind, containerRef]);

  const getClientHeight = useCallback(() => {
    if (kind === 'window') return window.innerHeight;
    const el = containerRef.current;
    return el?.clientHeight ?? 0;
  }, [kind, containerRef]);

  const scrollToTop = useCallback((y: number, smooth = true) => {
    if (kind === 'window') {
      window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
    } else {
      const el = containerRef.current;
      if (el) el.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
    }
  }, [kind, containerRef]);

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

  const node = useCallback(() => (kind === 'window' ? window : (containerRef.current as HTMLElement)), [kind, containerRef]);

  return useMemo(() => ({
    getScrollTop, getScrollHeight, getClientHeight, scrollToTop, addScrollListener, node, kind
  }), [getScrollTop, getScrollHeight, getClientHeight, scrollToTop, addScrollListener, node, kind]);
}
```

---

### 4. Constants and Configuration

#### A. Layout Constants
**File:** `client/src/constants/layout.ts`
**Total Lines:** 8

**Complete File:**
```typescript
/**
 * FIX #1: Base row height for calculation
 * Actual effective row height is measured dynamically via measureEffectiveRowHeight()
 * Mobile typically measures 24-28px, desktop may be higher
 */
export const BASE_ROW_HEIGHT = 120; // Base height, will be measured and corrected
export const ROW_HEIGHT = BASE_ROW_HEIGHT; // Keep for compatibility
```

**Why 120px?**
- This is the base row height used for calculations
- Multiplied by 31,102 verses = 3,732,240px
- The effective row height can differ based on screen size and user settings

---

### 5. Data Layer Files

#### A. Verse Keys Loader
**File:** `client/src/lib/verseKeysLoader.ts`

**Lines 159: Total verse count**
```typescript
return 31102; // Expected total verse count
```

**This number (31,102) is the multiplier in the balloon calculation**

#### B. Prefetch Manager
**File:** `client/src/hooks/prefetch/PrefetchManager.ts`

**Lines 22: Default total verses**
```typescript
private totalVerses = 31102; // Default, will be set dynamically
```

---

### 6. App Root and Store

#### A. Main App Component
**File:** `client/src/App.tsx`
**Total Lines:** 1,395

**Lines 1-38: Imports and setup**
```typescript
import { logger } from "@/lib/logger";
import React from "react";
// ... other imports
import { create } from 'zustand';
import { useTranslationMaps } from '@/store/translationSlice';
// Start preloading KJV immediately when app loads
import '@/lib/preloader';
```

**Lines 94-225: Bible Store definition**
```typescript
export const useBibleStore = create<{
  // ... store interface
  columnState: ColumnState;
  sizeState: SizeState;
  // ... navigation state
  visibleCount: number;
  containerWidthPx: number;
  columnWidthsPx: Record<string, number>;
  // ... methods
}>({
  // ... implementation
});
```

---

### 7. Utility and Helper Files

#### A. Rogue Element Cleaner
**File:** `client/src/hooks/useRogueElementCleaner.ts`
**Total Lines:** 168

**Lines 1-11: Purpose documentation**
```typescript
/**
 * Hook to automatically detect and remove rogue overlay elements from browser extensions.
 * ENABLED BY DEFAULT to prevent extension overlays from covering UI components.
 * 
 * Can be disabled via localStorage flag: localStorage.setItem('disableRogueCleaner', 'true')
 * Only removes elements that have BOTH:
 * - Exact height: 1.86024e+06px 
 * - Extension signature (data-original-* attributes)
 */
```

**Lines 47-73: Detection patterns**
```typescript
// PATTERN 1: Original problematic height with extension signature
const hasExactHeight = style.includes('height: 1.86024e+06px');
const hasExtensionSignature = el.hasAttribute('data-original-style') || 
                             el.hasAttribute('data-original-text') ||
                             el.hasAttribute('data-extension-id');

// PATTERN 2: Canvas overlay with fixed position and high z-index (NEW TARGET)
// Exclude legitimate confetti canvas by checking for whitelist attribute
const isCanvasOverlay = el.tagName === 'CANVAS' &&
                       computedStyle.position === 'fixed' &&
                       style.includes('inset: 0px') &&
                       computedStyle.zIndex === '10000' &&
                       style.includes('pointer-events: none') &&
                       !el.hasAttribute('data-confetti-canvas'); // Whitelist confetti

if (hasExactHeight && hasExtensionSignature) {
  console.log('🎯 PATTERN 1 MATCH: Found element with exact height AND extension signature');
  return true;
}

if (isCanvasOverlay) {
  console.log('🎯 PATTERN 2 MATCH: Found canvas overlay with fixed position and z-index 10000');
  return true;
}
```

**Note:** This detects similar balloon issues from browser extensions (1.86M pixels vs 3.7M pixels)

---

## Technical Analysis

### How Virtual Scrolling Works

1. **Virtualization System** (`useRollingVirtualization.ts`):
   - Only renders visible verses (the "render window")
   - Maintains safety and background buffers for smooth scrolling
   - Uses anchor index to track center verse position

2. **Scroll Root Abstraction** (`useScrollRoot.ts`):
   - **Landscape mode:** Container-based scrolling (`.unified-scroll-container`)
   - **Portrait mode:** Window-based scrolling (body/window element)
   - Provides unified API regardless of mode

3. **Row Height Calculations**:
   - Base: `ROW_HEIGHT = 120px` (from `constants/layout.ts`)
   - Effective: `ROW_HEIGHT * rowHeightMult` (dynamic multiplier)
   - Used to calculate scroll positions and content heights

### The Balloon Effect Mechanism

**WITHOUT the CSS min-height fix:**
```
1. Portrait mode activates (.is-portrait class added to body)
2. CSS rule applies: .is-portrait .virtual-bible-table { min-height: calc(31102 * 120px) }
3. Container forced to 3,732,240px tall
4. Defeats virtualization - browser tries to layout all 31,102 verses
5. Anchor calculations break because scrollHeight is now 3.7M instead of virtual height
6. Center verse positioning fails
7. Performance degrades massively
```

**WITH the spacer div fix (current approach):**
```
1. Portrait mode activates
2. Container height stays natural (only visible content)
3. Top spacer: (slice.start * effectiveRowHeight)px
4. Rendered verses: (slice.verseIDs.length * effectiveRowHeight)px
5. Bottom spacer: ((verseKeys.length - slice.end) * effectiveRowHeight)px
6. Total scrollable height = spacer heights create virtual scroll space
7. Virtualization intact - only visible verses in DOM
8. Anchor calculations accurate
```

---

## Why Portrait Mode Only?

### Landscape Mode Flow
```
useScrollRoot → detects landscape → kind: 'container'
                                  ↓
                    Container (.unified-scroll-container) handles scroll
                                  ↓
                    No CSS .is-portrait rules apply
                                  ↓
                    Works correctly (no balloon)
```

### Portrait Mode Flow
```
useScrollRoot → detects portrait (height > width) AND narrow (width < 900px)
                                  ↓
                            kind: 'window'
                                  ↓
                    Body/window handles scroll (for iOS URL bar auto-hide)
                                  ↓
                    CSS .is-portrait rules apply
                                  ↓
              PROBLEMATIC RULE (if present): min-height: 3.7M pixels
                                  ↓
                    Container balloons to 3.7M pixels
                                  ↓
                    Virtualization broken
```

### iOS Safari URL Bar Behavior
The reason portrait mode uses window scrolling instead of container scrolling:
- iOS Safari auto-hides the URL bar when scrolling down
- This only works with window/body scroll, not container scroll
- Provides more screen real estate for content
- Better user experience on mobile devices

---

## Current State Assessment

### Evidence of Fix Implementation

1. **CSS Comment (line 2807-2809):**
   ```css
   /* REMOVED: Problematic min-height that caused 3.7M pixel balloon
      Virtual scrolling now uses an internal spacer div to create scroll space
      without ballooning the table container itself */
   ```

2. **VirtualBibleTable Comment (line 1085):**
   ```typescript
   // FIXED: Don't set body height to millions of pixels - causes ballooning!
   ```

3. **Spacer Implementation (lines 1277-1284):**
   ```typescript
   {/* Virtual scroll spacer (bottom) - creates scroll space without ballooning container */}
   <div 
     style={{
       height: (verseKeys.length - slice.end) * effectiveRowHeight,
       pointerEvents: 'none',
       contain: 'strict' // Prevent layout thrashing
     }}
     aria-hidden="true"
   />
   ```

### Remaining Questions

1. **Is there a top spacer?** 
   - Need to verify if there's also a spacer before the rendered verses
   - Should be: `(slice.start * effectiveRowHeight)px`

2. **Body min-height still present?**
   - Line 2804: `.is-portrait body { min-height: 100vh !important; }`
   - This is 100vh (viewport height), NOT 3.7M pixels - this is safe

3. **Complete removal verification:**
   - Need to grep for any remaining `calc(31102` patterns
   - Check for any dynamic height setting in JavaScript

---

## Testing Checklist

To verify the fix is complete:

### Portrait Mode Tests
1. ✓ Open app in portrait mode (mobile or narrow desktop)
2. ✓ Inspect `.virtual-bible-table` element height
3. ✓ Should be: ~viewport height (hundreds of pixels)
4. ✓ Should NOT be: millions of pixels
5. ✓ Scroll to different verses - anchor should stay centered
6. ✓ Check scrollbar proportions are accurate

### Landscape Mode Tests
1. ✓ Open app in landscape mode
2. ✓ Verify no balloon (should already work)
3. ✓ Ensure no regressions from portrait fixes

### Browser DevTools Checks
```javascript
// In console while in portrait mode:
const table = document.querySelector('.virtual-bible-table');
console.log('Table height:', table.offsetHeight);
console.log('Body scrollHeight:', document.body.scrollHeight);
console.log('Window innerHeight:', window.innerHeight);

// Expected results:
// - Table height: < 10,000px (reasonable viewport-based height)
// - Body scrollHeight: Should match virtual content (spacers create this)
// - Should NOT see 3,732,240 anywhere
```

---

## File Summary Table

| File Path | Purpose | Key Lines | Critical for Issue |
|-----------|---------|-----------|-------------------|
| `client/src/index.css` | CSS styles, portrait mode rules | 2662-2824, 2807-2809 | ⚠️ PRIMARY |
| `client/src/components/bible/VirtualBibleTable.tsx` | Main table component, spacer implementation | 1-1435, 164, 1277-1284 | ⚠️ PRIMARY |
| `client/src/hooks/useRollingVirtualization.ts` | Virtualization logic, row height handling | 1-236, 34-40, 45-80 | 🔴 CRITICAL |
| `client/src/hooks/useScrollRoot.ts` | Scroll mode selection (window vs container) | 1-78, 5-9 | 🔴 CRITICAL |
| `client/src/constants/layout.ts` | ROW_HEIGHT constant (120px) | 1-8 | 🟡 IMPORTANT |
| `client/src/lib/verseKeysLoader.ts` | Total verse count (31,102) | Line 159 | 🟡 IMPORTANT |
| `client/src/hooks/prefetch/PrefetchManager.ts` | Prefetch configuration | Line 22 | 🟢 REFERENCE |
| `client/src/App.tsx` | App root, store definition | 1-1395 | 🟢 REFERENCE |
| `client/src/hooks/useRogueElementCleaner.ts` | Extension overlay cleaner | 1-168 | 🟢 RELATED |

**Legend:**
- ⚠️ PRIMARY: Direct cause or fix of the issue
- 🔴 CRITICAL: Core system that depends on correct heights
- 🟡 IMPORTANT: Constants and calculations used
- 🟢 REFERENCE: Related but not directly involved

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER OPENS APP IN PORTRAIT                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  useScrollRoot.ts: defaultSelector()                         │
│  → Detects: portrait + narrow → kind: 'window'              │
│  → Body/window becomes scroll container                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  CSS: .is-portrait class applied to body                     │
│  ⚠️  PROBLEMATIC RULE (if present):                          │
│     .is-portrait .virtual-bible-table {                      │
│       min-height: calc(31102 * 120px) = 3,732,240px         │
│     }                                                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  WITHOUT FIX: Container balloons → Breaks virtualization     │
│  WITH FIX: Spacer divs create scroll space instead          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  VirtualBibleTable.tsx                                       │
│  → Calculates: effectiveRowHeight = ROW_HEIGHT * mult       │
│  → Calls: useVirtualization(scrollRoot, ..., rowHeight)     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  useRollingVirtualization.ts                                 │
│  → useLiveAnchor(scroller, effectiveRowHeight)              │
│  → Calculates which verses to render                         │
│  → Returns: { slice: { start, end, verseIDs }, ... }        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  VirtualBibleTable.tsx: Render                               │
│  → Top spacer: (slice.start * effectiveRowHeight)px         │
│  → Visible verses: map slice.verseIDs                        │
│  → Bottom spacer: (total - slice.end) * effectiveRowHeight  │
│                                                               │
│  Total scroll height = spacers create virtual content        │
│  WITHOUT ballooning the DOM to 3.7M pixels                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Numbers Reference

| Constant | Value | Source | Usage |
|----------|-------|--------|-------|
| Total verses | 31,102 | `verseKeysLoader.ts:159` | Multiplier for height calculations |
| Base row height | 120px | `constants/layout.ts:6-7` | Base unit for row calculations |
| Balloon height | 3,732,240px | 31,102 × 120 | The problematic CSS min-height |
| Safe body height | 100vh | `index.css:2804` | Current (safe) portrait body height |

---

## Resolution Strategy

Based on code analysis, the fix appears to involve:

1. **Remove CSS rule:**
   ```css
   /* DELETE THIS */
   .is-portrait .virtual-bible-table {
     min-height: calc(31102 * 120px);
   }
   ```

2. **Use spacer divs instead:**
   ```typescript
   {/* Top spacer */}
   <div style={{ height: slice.start * effectiveRowHeight }} />
   
   {/* Rendered verses */}
   {slice.verseIDs.map(...)}
   
   {/* Bottom spacer */}
   <div style={{ 
     height: (verseKeys.length - slice.end) * effectiveRowHeight,
     pointerEvents: 'none',
     contain: 'strict'
   }} />
   ```

3. **Keep body height natural:**
   ```css
   .is-portrait body {
     min-height: 100vh; /* Safe - viewport height only */
   }
   ```

---

## Conclusion

This issue is caused by a CSS rule that defeats virtualization by forcing the container to match the full content height (3.7M pixels) in portrait mode. The codebase shows evidence that this has been addressed by:

1. Removing the problematic CSS min-height rule
2. Implementing virtual scroll spacers that create scrollable space without DOM ballooning
3. Preserving the body scroll approach for iOS Safari URL bar behavior

All files involved have been documented above for complete understanding and future reference.

---

**Generated:** October 13, 2025  
**Status:** Documentation of existing issue and fix implementation  
**No changes made to code** as requested
