# SMART SCROLLBAR — DISCOVERY CHECKLIST (ENGINEER)
**Analysis Date:** October 23, 2025
**Analyzed by:** Replit Agent

---

## 0) Overview

**Repo / app stack:**
- React 18 + TypeScript
- Vite build system
- Zustand for state management
- TanStack Query v5 for data fetching
- Tailwind CSS + shadcn/ui components
- Supabase for backend (PostgreSQL + Storage)

**Primary scrollbar files:**

**UI track/thumb:**
- `client/src/components/bible/VirtualBibleTable.tsx` (lines 1425-1670)
  - Track: `div[data-smart-scrollbar-track]` at line 1426-1434
  - Thumb: Positioned div at lines 1452-1652
  
**Controller / mapping:**
- `client/src/lib/smartScrollbar.ts` (lines 1-575)
  - Band definitions: lines 60-82
  - Scale builders: lines 105-173
  - SmartScrollbarController class: lines 176-568

**Tooltip / ticks / bands:**
- `client/src/components/ui/ScrollbarTooltip.tsx` - Verse reference tooltip
- `client/src/components/ui/TickRenderer.tsx` - Canvas-based book tick marks
- `client/src/components/ui/BandBackgrounds.tsx` - Testament/section background tints
- `client/src/components/ui/ScrollbarControls.tsx` - Lock and mode cycling buttons (NEW)
- `client/src/components/ui/ScrollbarLabel.tsx` - Vertical scope label (NEW)

**Build target:**
- Desktop-first web application (Vite SPA)
- Mobile web responsive with touch optimization
- PWA capabilities via vite-plugin-pwa

---

## 1) Data & Indexing

**Total verses constant and source:**
- `TOTAL_VERSES = 31102` (smartScrollbar.ts:60)
- Hardcoded constant, canonical Bible verse count

**BOOK_BANDS source file:**
- N/A - No BOOK_BANDS defined yet
- Book tick positions are calculated from `getVerseKeys()` function which returns verse keys in format "Book.Chapter:Verse"
- Book boundaries derived dynamically, not pre-validated

**SECTION_BANDS / TESTAMENT_BANDS:**
- **Hardcoded** in `smartScrollbar.ts` (lines 62-81)
- `TESTAMENT_BANDS`: 2 bands (OT: 0-23144, NT: 23145-31101)
- `SECTION_BANDS_OT`: 5 bands (Pentateuch, History, Wisdom, Major Prophets, Minor Prophets)
- `SECTION_BANDS_NT`: 5 bands (Gospels, Acts, Pauline, General, Revelation)
- **NOT derived** from books - manually defined with start/end indices
- **Validation:** Static structure, no runtime validation against actual verse data

**chapterStarts[] exists?**
- No explicit `chapterStarts[]` array
- Verse keys loaded via `getVerseKeys()` from `client/src/lib/verseKeysLoader.ts`
- Book/chapter boundaries inferred from verse key parsing (e.g., "Gen.1:1")

**Chrono order:**
- Canonical order only (Genesis → Revelation)
- Store has `isChronological` flag (VirtualBibleTable.tsx:175) but not actively used
- Store tracks `currentVerseKeys` for potential order switching

---

## 2) Virtualization & Anchor

**Virtualizer lib / custom:**
- **Custom implementation**: `useRollingVirtualization` hook
- File: `client/src/hooks/useRollingVirtualization.ts` (lines 1-261)
- 3-tier window architecture: render / safety / background buffers
- Desktop: 200 verse render window
- Mobile: Adaptive based on memory/connection detection

**anchorIndex: exact formula & update cadence:**
- **Formula:** `useLiveAnchor()` hook (useRollingVirtualization.ts:79)
- Calculated as: `centerIdx = Math.floor((scrollTop + viewportHeight / 2) / effectiveRowHeight)`
- **Update cadence:** 60 FPS via `requestAnimationFrame` + scroll events
- Fed to controller: `controllerRef.current.onViewportAnchor(anchorIndex, 16)` (VirtualBibleTable.tsx ~line 310)

**During drag: virtualization disabled?**
- **YES** - Controlled via `options?.disabled` flag
- During scrollbar drag: `isScrollbarDragging` state prevents prefetch
- Prefetch check at useRollingVirtualization.ts:98: `if (options?.disabled) return;`
- **Re-enabled:** Automatically when `isScrollbarDragging` becomes false on pointer/touch up

**scrollRoot API:**
- **Container-based**, NOT window-based
- File: Hook usage in VirtualBibleTable.tsx:123
- API methods:
  - `scrollRoot.getScrollTop()` - Read scroll position
  - `scrollRoot.scrollToTop(position, smooth)` - Set scroll position
  - `scrollRoot.getClientHeight()` - Get viewport height
  - `scrollRoot.kind` - Returns 'window' or 'container'

---

## 3) Controller & Mapping

**Controller class/file name:**
- `SmartScrollbarController` class in `client/src/lib/smartScrollbar.ts` (lines 176-568)

**Exposed methods today:**
- `onInteractStart()` - Called on pointer/touch down (line 288)
- `onInteractStep(y01, deltaPx, dtMs, bypass)` - During drag, returns target index (line 380)
- `onInteractEnd(y01, lastVelocity)` - On pointer/touch up (line 525)
- `onViewportAnchor(idx, dtMs)` - Update dwell tracking (line 296)
- `yForIndex(idx)` - Convert verse index to y01 thumb position (line 370)
- `getScale()` - Get current scale for rendering (line 375)
- **NEW Phase A methods:**
  - `setMode(mode)` - Set scroll mode (line 243)
  - `getMode()` - Get current mode (line 247)
  - `setLock(on)` - Set lock state (line 251)
  - `getLock()` - Get lock state (line 255)
  - `getActiveScaleInfo()` - Get current state with human-readable label (line 259)
  - `applyThresholdPreset(platform)` - Apply desktop/mobile thresholds (line 319)

**Scales implemented:**
- ✅ **Global** - `scaleGlobal(model)` (line 107)
- ✅ **Testament** - `scaleTestament(model, testament, cfg)` (line 112)
- ✅ **Section** - `scaleSection(model, testament, sectionId, cfg)` (line 125)
- ⚠️ **Book** - Placeholder only (line 561: falls back to section scale)

**Mapping functions:**
- **Single source of truth:** Each scale object has `toIndex(y01)` and `toY01(idx)` methods
- Built by `buildPiecewise(bands)` function (lines 148-172)
- **toIndex:** Maps track position [0,1] → verse index via band interpolation
- **toY01:** Maps verse index → track position [0,1] via reverse lookup

**On scale change: preserve relative position?**
- **YES** - Implicit preservation through `toIndex(y01)` call
- When scale changes (line 507), new scale is immediately used with same y01 position
- This maps y01 to a verse index within the new scale's active band
- Result: Thumb stays at same y01, but maps to appropriate verse in zoomed region
- **No explicit position adjustment code** - relies on piecewise mapping continuity

---

## 4) Auto-Zoom Heuristics (current)

**Gates:**
- `quickWindowMs = 200` (DEFAULT_AUTOZOOM_CONFIG:49)
  - **Behavior:** Ignore zoom for first 200ms after press, just track motion
  - If `movedAbsPx >= travelBurstPx` during quick window, set `travelLock = true`
- `deadzonePx = 10` (DEFAULT_AUTOZOOM_CONFIG:50)
  - **Behavior:** Don't evaluate zoom until moved at least 10px
- `travelBurstPx = 48` (DEFAULT_AUTOZOOM_CONFIG:51)
  - **Behavior if burst:** Sets `travelLock = true`, stays global for entire drag

**Vel thresholds (desktop):**
- `V_fast = 0.9` px/ms (DEFAULT_AUTOZOOM_CONFIG:41)
- `V_slow = 0.25` px/ms (DEFAULT_AUTOZOOM_CONFIG:42)
- Desktop uses continuous auto-zoom (`calmMode = false`)

**Vel thresholds (mobile):**
- `V_fast = 0.9` px/ms (MOBILE_AUTOZOOM_CONFIG:54-56, inherits from default)
- `V_slow = 0.25` px/ms (inherits from default)
- Mobile uses calm mode (`calmMode = true`) - zoom decision only on release

**Dwell thresholds:**
- `T_dwell_testament = 240ms` (DEFAULT_AUTOZOOM_CONFIG:39)
- `T_dwell_section = 480ms` (DEFAULT_AUTOZOOM_CONFIG:40)
- **Total section dwell:** Must dwell in testament first (240ms), then in same section (480ms more)

**Quiet period:**
- `quiet_ms = 300ms` (DEFAULT_AUTOZOOM_CONFIG:44)
- Enforced at line 382: `if (this.inQuiet()) return this.scale.toIndex(y01);`
- Prevents oscillation after scale changes

**Hysteresis values:**
- `hysteresisPct = 0.06` (6% of total verses = ~1866 verses)
- Applied in `shouldSwitchRegion()` method (lines 327-367)
- **Testament hysteresis:** Must be >1866 verses from OT/NT boundary
- **Section hysteresis:** Must be >1866 verses from section boundary
- Prevents rapid region switching during boundary crossings

**Calm mode:**
- **Present:** Yes (line 414)
- **Default on mobile:** Yes (`MOBILE_AUTOZOOM_CONFIG.calmMode = true`)
- **Enforcement point:** `onInteractStep()` at line 414
  - Tracks dwell during drag but doesn't change scale
  - Zoom decision made in `onInteractEnd()` (lines 526-551)

**Bypass key (Alt):**
- **Wired:** Yes, desktop only
- **Implementation:** VirtualBibleTable.tsx lines 207-225
- Sets `bypassMode` state on Alt keydown during drag
- Passed to `controller.onInteractStep(y01, deltaPx, dtMs, bypassMode)`
- Forces global scale when bypass=true (line 467)

**Snapping:**
- **Currently disabled:** Yes
- No snap helper function calls found
- Smooth scrolling only, no verse-level snapping

---

## 5) Manual Controls (today)

**Manual mode state:**
- **YES** - `mode: ScrollMode` in controller (line 267)
- Type: `'global' | 'testament' | 'section' | 'book' | 'auto'` (smartScrollbar.ts:4)
- Default: `'auto'` (line 267)
- Can be set via `setMode(mode)` method (line 243)

**Lock state:**
- **YES** - `locked: boolean` in controller (line 237)
- Default: `true` (lock ON by default - Phase A requirement)
- UI state in VirtualBibleTable.tsx:139: `scrollbarLocked = true`
- Bypass auto-zoom when locked (lines 386-389)

**Keyboard shortcuts:**
- **Alt key only** (desktop) - Bypass mode during drag
- **NOT implemented yet:** `[`, `]`, `L` shortcuts
- **NOT implemented yet:** Arrow keys for mode cycling

**OT/NT divider:**
- **YES** - Present in DOM
- Location: VirtualBibleTable.tsx lines 1654-1669
- Visual: 0.5px amber line at 74.4% track position
- **Clickable:** Yes - `onClick` handler jumps to Matthew 1:1 (index 23145)
- Positioned dynamically via `controllerRef.current?.yForIndex(23145)`

---

## 6) UI: Track, Thumb, Label, Ticks

**Track placement/dimensions:**
- **File:** VirtualBibleTable.tsx lines 1426-1434
- **Position:** `fixed right-0` (always visible, not scrolls with page)
- **Width:** `w-6 md:w-3` (24px mobile, 12px desktop)
- **Height:** `calc((100vh - 89px) * 0.75)` (75% of viewport below header)
- **Top:** `calc(89px + (100vh - 89px) * 0.125 + 8px)` (12.5% down from header + 8px)
- **Styles:** `bg-black/5 dark:bg-white/5 rounded-l-full`

**Thumb height% & top% calc:**
```typescript
// Height formula (VirtualBibleTable.tsx:1455)
const thumbHeightPct = Math.max(8, Math.min(40, 
  ((window.innerHeight - 85) / (verseKeys.length * effectiveRowHeight)) * 100
));
// Min 8%, Max 40%, proportional to viewport/content ratio

// Top formula (VirtualBibleTable.tsx:1456)
const thumbY01 = controllerRef.current?.yForIndex(anchorIndex) 
  ?? (scrollTop / Math.max(1, verseKeys.length * effectiveRowHeight - (window.innerHeight - 85)));
const thumbTop = `${thumbY01 * (100 - thumbHeightPct)}%`;
// Maps verse position to available track space (minus thumb height)
```

**Vertical scope label:**
- **EXISTS:** Yes (NEW in Phase A)
- **File:** `client/src/components/ui/ScrollbarLabel.tsx`
- **Content:** Shows current mode text (GLOBAL / OLD TESTAMENT / PENTATEUCH / etc.)
- **Position:** `fixed top-16 right-2` (vertical text via `writingMode: 'vertical-rl'`)
- **Updated:** Via `getActiveScaleInfo().label` method

**Tooltip text:**
- **Shows:** Verse reference (e.g., "Genesis 1:1")
- **File:** `client/src/components/ui/ScrollbarTooltip.tsx`
- **Update path:** State-driven via `mousePosition` state in VirtualBibleTable
- Updates on every pointer/touch move during drag (lines 1512, 1610)

**Book ticks (66):**
- **Implementation:** Canvas rendering
- **File:** `client/src/components/ui/TickRenderer.tsx`
- **Redraws:** On scale change (triggered by `controllerRef.current.getScale()` prop change)
- **Calculation:** Derives book boundaries from verse keys, maps via `scale.toY01(bookStartIdx)`

**Section/testament backgrounds:**
- **File:** `client/src/components/ui/BandBackgrounds.tsx`
- **Drawing:** SVG gradient overlays
- **Colors:** Subtle tints for active testament/section (opacity-based)
- **Redraws:** On scale change (triggered by `scale` prop change)

**Hover/active styles:**
- **Desktop hover:** `md:hover:w-3.5 md:hover:bg-blue-600` (thumb expands from 12px to 14px)
- **Active state:** `active:bg-blue-600 dark:active:bg-blue-300`
- **Min touch target:** `minHeight: '32px'` (thumb, line 1462)
- **Track width:** 24px on mobile (adequate touch target)

---

## 7) Hyperlinks & External Jumps

**Current behavior:**
- When a link jumps to verse outside current region:
  - **Mode preservation:** Implicit - controller maintains current `mode` state
  - **Scale remains:** If in testament/section mode, scale doesn't auto-reset to global
  - **Thumb repositions:** Yes, via `yForIndex(newAnchorIndex)` on next frame

**Implementation location:**
- `scrollToVerse(ref)` function in VirtualBibleTable.tsx (lines 849-897)
- Converts reference → index → scrollTop
- Uses `scrollRoot.scrollToTop(targetTop, smooth)` for jump
- **No explicit mode handling** - relies on controller's persistent state

**Thumb re-positioning:**
- **YES** - Automatic via reactive `anchorIndex` state
- After jump, `anchorIndex` updates → thumb style recalculates → `yForIndex(anchorIndex)` called
- Happens on next rAF due to React re-render cycle

**Mode preservation:** 
- ✅ **CONFIRMED** - Mode state lives in controller, not tied to anchor position
- Manual modes (global/testament/section) stay locked regardless of jumps
- Auto mode will re-evaluate region on next drag, but doesn't auto-reset on jump

---

## 8) Device & Theme Handling

**Mobile detection:**
- **Hook:** `useIsMobile()` from `client/src/hooks/use-mobile.tsx`
- **Method:** Viewport width check (`window.innerWidth <= 768`)
- **Reactive:** Yes, updates on resize/orientation change

**Calm mode enforcement:**
- **Where:** Controller initialization (VirtualBibleTable.tsx:202)
  ```typescript
  const config = isMobile ? MOBILE_AUTOZOOM_CONFIG : DEFAULT_AUTOZOOM_CONFIG;
  ```
- **When:** On component mount only (not reactive to resize)
- **Behavior:** Mobile gets `calmMode: true`, desktop gets `calmMode: false`

**Theme system:**
- **Dark/light switching:** Yes, via Tailwind dark mode classes
- **Scrollbar state semantics:** None - uses standard blue thumb color in both themes
- **No color coding** for zoom levels/modes (as desired)
- Track: `bg-black/5 dark:bg-white/5`
- Thumb: `bg-blue-500 dark:bg-blue-400`

**Safe-area insets (iOS):**
- **NOT explicitly handled** for right rail
- Track uses `fixed right-0` which may overlap safe area on notched devices
- **Recommendation:** Add `right: env(safe-area-inset-right)` for iOS

---

## 9) Accessibility

**aria-labels on controls:**
- ✅ **YES** - Implemented in ScrollbarControls.tsx:
  - Previous mode button: `aria-label="Previous scrollbar mode"`
  - Lock toggle: `aria-label={locked ? "Unlock auto-zoom" : "Lock auto-zoom"}`
  - Next mode button: `aria-label="Next scrollbar mode"`

**Mode change announcements:**
- ❌ **NOT implemented** - No `aria-live` regions for zoom state changes
- **Infra:** Could use shadcn's Toast system with `role="status"`

**Keyboard focus order & key bindings:**
- **Focus order:** Natural DOM order (controls in header → scrollbar → content)
- **Planned bindings:** None implemented yet
- **Missing:** Tab navigation to thumb, keyboard scrollbar control

---

## 10) Performance

**rAF throttling in pointer move loop:**
- ❌ **NOT explicitly throttled** via rAF
- Pointer move handlers are raw DOM events (VirtualBibleTable.tsx:1485, 1574)
- **Implicit throttling:** Controller's quiet period (300ms) prevents rapid scale changes
- **Recommendation:** Add rAF wrapper for mousemove/touchmove handlers

**Known devices with frame drops:**
- **None documented** in code
- Mobile diagnostics present (`mobileDiagnostics.recordVelocity`) but no device-specific notes

**Event listeners: passive vs active:**
- **Touch listeners:** `{ passive: false }` (line 1649) - Required for `preventDefault()`
- **Mouse listeners:** Default (active) - Could be passive for move, active for down/up
- **Correct usage:** Touch needs active for preventDefault, could optimize mouse

**Memory usage / retained listeners:**
- **Cleanup:** ✅ Proper cleanup in useEffect returns
- **Unmount:** Event listeners removed via `document.removeEventListener` in handlers
- **No leaks detected** in code review

**Telemetry:**
- **Console logs:** ✅ Present for zoom changes (line 509: `console.log('🔍 ZOOM CHANGE')`)
- **Debug helpers:** Mobile diagnostics, velocity tracking
- **Production:** Logs should be conditionally disabled

---

## 11) Feature Flags (to stage safely)

**Flag system:**
- ❌ **NO formal flag system** present
- **Environment vars:** Vite's `import.meta.env` available but unused for features
- **State-based:** Could use Zustand store for feature toggles

**Proposed flag locations:**
- **Environment:** `.env` file with `VITE_FEATURE_*` prefix
- **Runtime:** Zustand store `useFeatureFlagsStore()`
- **Config:** `client/src/config/features.ts`

**Recommended flags:**
```typescript
interface FeatureFlags {
  BOOK_ZOOM_ENABLED: boolean;        // default: false (Phase B)
  DIVIDER_TAP_ENABLED: boolean;      // default: false (OT/NT tap to jump)
  A11Y_ANNOUNCE_ENABLED: boolean;    // default: true (aria-live announcements)
  KEYBOARD_NAV_ENABLED: boolean;     // default: false (arrow keys, [, ], L)
}
```

---

## 12) Book-level Zoom (pre-impl questions)

**Book band calculations:**
- ❌ **NOT derived** from BOOK_BANDS (doesn't exist)
- ✅ **Tick positions** calculated dynamically from verse keys
- TickRenderer.tsx derives book boundaries, could be extracted for band building

**Per-book metadata:**
- **Chapter counts:** Not currently tracked
- **Available data:** Book names, start/end indices (from verse keys)
- **Recommendation:** Extract book metadata for tooltip enhancement

**Book zoom dilation + label:**
- **Proposal:** ✅ Both visual dilation (0.80 allocation) AND label step ("GENESIS", etc.)
- **Behind flag:** ✅ Agree - `BOOK_ZOOM_ENABLED = false` until tested
- **Scale builder:** Needs `scaleBook(model, testament, sectionId, bookId, cfg)` function
- **Band structure:** Single book band + two symmetrical remainder bands

**Current status:**
- Placeholder in controller rebuild() (line 561)
- `activeBookId` field exists but unused (line 240)
- Mode type includes 'book' but falls back to section scale

---

## 13) QA Hooks

**Console logging:**
- ✅ **CAN log zoom changes** - Already implemented (line 509)
- **Current format:** `{ level, bands, velocity, dwellInTestamentMs, dwellInSectionMs, fast, slow, quietStarted }`
- **Enhanced format needed:** Add `fromMode`, `toMode`, `reason` fields

**window.__sb debug exposure:**
- ❌ **NOT implemented**
- **Proposed API:**
```typescript
window.__sb = {
  getMode: () => controller.getMode(),
  getLock: () => controller.getLock(),
  getDwell: () => ({ testament: dwellInTestamentMs, section: dwellInSectionMs }),
  getScale: () => controller.getScale(),
  setMode: (mode) => controller.setMode(mode),
  setLock: (on) => controller.setLock(on),
};
```

**Cypress/Playwright setup:**
- ❌ **NO automated tests** for scrollbar
- **Package installed:** Cypress (`package.json`)
- **Test files:** None found for smart scrollbar
- **Recommendation:** Add E2E drag/zoom scenarios

---

## 14) Final Wiring Targets (confirm)

**Manual mode cycle order:**
- ✅ **CONFIRMED:** Global → Testament → Section → Book → (wrap)
- Implementation: VirtualBibleTable.tsx lines 275-287
- Array: `['global', 'testament', 'section', 'book']`

**Lock default ON:**
- ✅ **CONFIRMED:** Lock defaults to ON
- Controller: `locked = true` (smartScrollbar.ts:237)
- UI state: `scrollbarLocked = true` (VirtualBibleTable.tsx:139)
- **Blocks auto-zoom:** Yes (lines 386-389)
- **Manual cycling works:** Yes (mode changes bypass lock check)

**Hyperlinks keep mode:**
- ✅ **CONFIRMED:** Mode persists across jumps
- Controller mode is independent of anchor position
- No auto-reset to global on external navigation

**Vertical label text only:**
- ✅ **CONFIRMED:** Text only, no color coding
- File: ScrollbarLabel.tsx
- Styling: `text-muted-foreground/60` (neutral gray)

**OT/NT divider:**
- ✅ **Visible:** 0.5px amber line (`bg-amber-500/40`)
- ✅ **Accurate:** Positioned via `yForIndex(23145)` (Matthew 1:1)
- ⚠️ **Click action:** Currently ENABLED (not behind flag)
- **Recommendation:** Gate with `DIVIDER_TAP_ENABLED` flag

---

## 15) Code Snippets

### onPointerMove handler (current)
```typescript
// VirtualBibleTable.tsx lines 1485-1513
const handleMouseMove = (e: MouseEvent) => {
  // Calculate velocity
  const dtMs = performance.now() - lastDragTime;
  const deltaPx = e.clientY - lastDragY;
  
  // Get track element and calculate y01
  const trackElement = document.querySelector('[data-smart-scrollbar-track]');
  if (!trackElement || !controllerRef.current) return;
  
  const trackRect = trackElement.getBoundingClientRect();
  const y01 = (e.clientY - trackRect.top) / trackRect.height;
  
  // Use controller to map to verse index (with bypass mode)
  const targetIndex = controllerRef.current.onInteractStep(y01, deltaPx, dtMs, bypassMode);
  
  // Convert index to scrollTop (center the target verse)
  const newScrollTop = targetIndex * effectiveRowHeight - viewportHeight / 2;
  const clampedScrollTop = Math.max(0, Math.min(maxScroll, newScrollTop));
  
  scrollRoot.scrollToTop(clampedScrollTop, false);
  setScrollTop(clampedScrollTop);
  
  // Update velocity tracking
  setLastDragY(e.clientY);
  setLastDragTime(performance.now());
  
  // Update mouse position for tooltip
  setMousePosition({ x: e.clientX, y: e.clientY });
};
```

### Controller velocity/dwell gate logic (current)
```typescript
// smartScrollbar.ts lines 380-437
onInteractStep(y01: number, deltaPx: number, dtMs: number, bypass: boolean): number {
  // QUIET PERIOD - early return to keep current scale unchanged
  if (this.inQuiet()) {
    return this.scale.toIndex(y01);
  }
  
  // If locked, skip all auto-zoom logic
  if (this.locked && this.mode === 'auto') {
    return this.scale.toIndex(y01);
  }
  
  // Track movement
  this.movedAbsPx += Math.abs(deltaPx);
  const sincePress = Date.now() - this.pressT0;

  // Quick window: ignore zoom for first 200ms
  if (sincePress < this.cfg.quickWindowMs) {
    if (this.movedAbsPx >= this.cfg.travelBurstPx) {
      this.travelLock = true;
    }
    return this.scale.toIndex(y01);
  }

  // Deadzone: don't judge intent until moved enough
  if (this.movedAbsPx < this.cfg.deadzonePx) {
    return this.scale.toIndex(y01);
  }

  // Travel lock: stay global if fast initial movement
  if (this.travelLock) {
    return this.scale.toIndex(y01);
  }
  
  // CALM MODE - skip all zoom evaluation during drag
  if (this.cfg.calmMode) {
    // Still track dwell for calm mode end logic
    const currentIdx = this.scale.toIndex(y01);
    const { testament, sectionId } = this.model.locateRegion(currentIdx);
    // ... dwell tracking ...
    return this.scale.toIndex(y01);
  }
  // ... rest of auto-zoom logic ...
}
```

### Scale change block (relative position preserved)
```typescript
// smartScrollbar.ts lines 467-521
// Calculate velocity
const v = Math.abs(deltaPx) / Math.max(1, dtMs);
const fast = v > this.cfg.V_fast_px_ms;
const slow = v < this.cfg.V_slow_px_ms;

const oldBandCount = this.scale.bands.length;

if (bypass) {
  this.scale = scaleGlobal(this.model);
} else if (this.mode === 'auto') {
  if (fast) {
    this.scale = scaleGlobal(this.model);
  } else {
    // Two-step zoom: Testament first, then Section
    if (this.dwellInTestamentMs >= this.cfg.T_dwell_testament && v < this.cfg.V_fast_px_ms) {
      if (this.dwellInSectionMs >= this.cfg.T_dwell_section && v < this.cfg.V_slow_px_ms) {
        this.scale = scaleSection(this.model, this.activeTestament, this.activeSectionId, this.cfg);
      } else {
        this.scale = scaleTestament(this.model, this.activeTestament, this.cfg);
      }
    } else {
      this.scale = scaleGlobal(this.model);
    }
  }
} else {
  // Manual mode pinned by user
  if (this.mode === 'global') this.scale = scaleGlobal(this.model);
  if (this.mode === 'testament') this.scale = scaleTestament(this.model, this.activeTestament, this.cfg);
  if (this.mode === 'section') this.scale = scaleSection(this.model, this.activeTestament, this.activeSectionId, this.cfg);
}

// Start quiet period when scale changes
if (this.scale.bands.length !== oldBandCount) {
  this.startQuiet(); // Prevents oscillation
}

return this.scale.toIndex(y01); // Same y01 maps to new verse in new scale
```

### Thumb height/top calc formulas
```typescript
// VirtualBibleTable.tsx lines 1454-1464
const thumbHeightPct = Math.max(8, Math.min(40, 
  ((window.innerHeight - 85) / (verseKeys.length * effectiveRowHeight)) * 100
));

const thumbY01 = controllerRef.current?.yForIndex(anchorIndex) 
  ?? (scrollTop / Math.max(1, verseKeys.length * effectiveRowHeight - (window.innerHeight - 85)));

return {
  height: `${thumbHeightPct}%`,
  top: `${thumbY01 * (100 - thumbHeightPct)}%`,
  cursor: 'pointer',
  touchAction: 'none',
  minHeight: '32px'
};
```

### Hyperlink jump handler
```typescript
// VirtualBibleTable.tsx lines 849-897
const scrollToVerse = useCallback((ref: string) => {
  // Find target index
  const targetIndex = getVerseIndex(ref);
  if (targetIndex === null) {
    console.warn('Verse not found:', ref);
    return;
  }

  // Calculate scroll position to center the verse
  const viewportHeight = scrollRoot.getClientHeight();
  const targetTop = scrollTopForIndex(targetIndex, effectiveRowHeight, viewportHeight, stickyOffset);
  const maxScroll = Math.max(0, verseKeys.length * effectiveRowHeight - viewportHeight);
  const clampedTop = Math.max(0, Math.min(maxScroll, targetTop));

  // Smooth scroll to position
  scrollRoot.scrollToTop(clampedTop, true);

  // Micro-correction after scroll settles
  setTimeout(() => {
    const measured = centerIndexFrom(
      scrollRoot.getScrollTop(), 
      viewportHeight, 
      effectiveRowHeight,
      stickyHeaderOffset
    );
    const delta = targetIndex - measured;
    
    if (Math.abs(delta) >= 1) {
      const correctedTop = scrollRoot.getScrollTop() + delta * effectiveRowHeight;
      const clampedTop = Math.max(0, Math.min(correctedTop, maxScroll));
      scrollRoot.scrollToTop(clampedTop, false);
    }
  });

  // Flash highlight
  setTimeout(() => {
    const el = document.querySelector(`[data-verse-ref="${ref.replace(/\s/g, '.')}"]`);
    if (el) {
      el.classList.add('verse-highlight-flash');
      setTimeout(() => el.classList.remove('verse-highlight-flash'), 400);
    }
  }, 25);
}, [scrollRoot, verseKeys.length, effectiveRowHeight]);
```

---

## Summary & Recommendations

### ✅ Implemented & Working
- Smart scrollbar with piecewise mapping (Global/Testament/Section scales)
- Auto-zoom heuristics with velocity/dwell detection
- Manual controls with lock toggle (Phase A complete)
- Mobile calm mode with touch optimization
- Bypass mode (Alt key on desktop, long-press on mobile)
- OT/NT divider with tap-to-jump
- Book tick marks and section backgrounds
- Tooltip with verse reference
- Hysteresis for boundary stability

### ⚠️ Partially Implemented
- Book-level zoom (placeholder only, needs implementation)
- Accessibility (labels present, but no announcements)
- Performance (no rAF throttling on pointer move)

### ❌ Missing / Recommended
- Feature flag system for safe staging
- Keyboard shortcuts beyond Alt (`, ], L, arrows)
- QA debug helpers (window.__sb)
- Automated tests (Cypress/Playwright)
- Safe-area insets for iOS
- Book metadata extraction
- ARIA-live announcements
- rAF throttling for pointer events

### 🎯 Next Phase Priorities
1. **Phase B:** Implement book-level zoom with 0.80 allocation
2. **Phase C:** Add keyboard navigation (`, ], L, arrows)
3. **Phase D:** Fine-tune velocity/dwell thresholds per platform
4. **Phase E:** Accessibility enhancements (ARIA-live, keyboard focus)
5. **Phase F:** Performance optimization (rAF throttling, memory profiling)

---

**Document Version:** 1.0  
**Last Updated:** October 23, 2025  
**Status:** Complete - Ready for fine-tuning discussion
