# Mobile Prefetch Diagnostics - RFI Response Summary

## What I've Built

I've created a comprehensive mobile prefetch diagnostic system to help you investigate the "mobile prefetch is ~10 rows + laggy" issue. This system automatically tracks all the metrics requested in your RFI and provides browser console tools to generate detailed reports.

## Files Added

### 1. Core Diagnostic System
- **`client/src/utils/mobilePrefetchDiagnostics.ts`**
  - Tracks all prefetch activity (deltas, batches, velocity)
  - Generates comprehensive diagnostic reports
  - Includes pretty-print console output

### 2. Global Console Helpers
- **`client/src/utils/globalDiagnostics.ts`**
  - Exposes easy-to-use console commands
  - Provides continuous monitoring capability
  - Handles clipboard export

### 3. Documentation
- **`client/public/MOBILE_PREFETCH_DIAGNOSTICS.md`**
  - Complete usage guide
  - Troubleshooting scenarios
  - Report interpretation guide

## Integration Points

The diagnostic tools are automatically integrated into:

### PrefetchManager (`client/src/hooks/prefetch/PrefetchManager.ts`)
- Tracks every batch start/completion/abort
- Records priority (high/low) and range

### Rolling Virtualization (`client/src/hooks/useRollingVirtualization.ts`)
- Records delta computation (safety & background)
- Tracks velocity samples
- Exposes current state globally

### App Initialization (`client/src/App.tsx`)
- Sets up global diagnostic functions on startup
- Makes tools available in browser console

## How to Use

### 🚀 NEW: On-Device Mobile HUD (Easiest!)

**No DevTools connection needed!** We now have a floating debug panel built into the app:

1. **Open the app on your mobile device**
2. **Look for the purple bug icon** in the bottom-right corner
3. **Tap it** to open the Mobile Diagnostics HUD
4. **Use the quick buttons:**
   - **Before Snapshot** → Scroll/flick → **After Snapshot** → **Copy**
   - Or use **Start Monitor** → Scroll → **Stop Monitor**
5. **Share the output** with the team

**See full guide:** `client/public/MOBILE_HUD_QUICK_START.md`

### Alternative: Remote DevTools (Advanced)

**iOS Safari:**
1. iPhone: Settings → Safari → Advanced → Web Inspector
2. Connect to Mac
3. Mac Safari → Develop → [Your iPhone]

**Chrome Mobile:**
1. Enable USB Debugging on device
2. Chrome → `chrome://inspect`

**On-Device Console (Eruda):**
```javascript
// Paste in URL bar to add Eruda console:
javascript:(function(){var script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/eruda';document.body.append(script);script.onload=function(){eruda.init();}})();
```

### Once DevTools/HUD is Open:

```javascript
// Basic diagnostic report
__runMobileDiagnostics__()

// Copy to clipboard
__runMobileDiagnostics__({ copy: true })

// Continuous monitoring during flicks
__startMonitoring__(1000)  // every 1 second
// ... perform fast flicks ...
__stopMonitoring__()
```

## What the Report Shows

The diagnostic report answers ALL 10 questions from your RFI:

### 0️⃣ Device Context (Questions 0)
- Device model, OS, browser versions
- Screen dimensions
- Memory

### 1️⃣ Mobile Policy + Constants (Question 1)
- Runtime values for renderSize (should be 220 mobile)
- Safety pads (top/bot)
- Background pads (top/bot)
- Step size (8 rows)
- Effective row height
- Computed windows [render, safety, background]

**🚨 Key Check:** If render window is only ~10 verses, this is your smoking gun!

### 2️⃣ PrefetchManager State (Question 2)
- Concurrency cap (should be 2 on mobile)
- Currently running batches
- Pending queue size
- AbortController status

### 3️⃣ Velocity & Direction (Question 5)
- Current velocity (rows per second)
- Recent velocity samples (last 5)
- Direction (up/down)
- Threshold for flight path (8 rps mobile)

**🚨 Key Check:** If velocity is always 0, touch events aren't firing!

### 4️⃣ Delta Computation (Question 4)
- Last 10 delta calculations
- Shows safety vs background deltas
- Range and count for each

**🚨 Key Check:** If all deltas are ~10 verses, window calculation is broken!

### 5️⃣ Cache Metrics (Question 8)
- Total cache size
- High water / target thresholds
- In-flight count
- Ready/loading/error breakdown

### 6️⃣ Batch Activity (Questions 2 & 3)
- Last 10 batches with priority, range, count, status
- Statistics: avg size, high/low counts, aborted count

**🚨 Key Check:** 
- Avg batch size should be 100-500 verses (NOT ~10!)
- Many aborted batches = excessive cancellation

### 7️⃣ Geometry (Question 10)
- Total rows (31,102 verses)
- Center index, stepped index
- Container height, sticky offset

### 8️⃣ Environment Flags (Question 1)
- Shows all VITE_* environment variables

### 9️⃣ Network & Loader (Question 3)
Check DevTools Network tab during scroll:
- Request count
- Payload sizes
- Response times

## Common Issues & What to Look For

### Issue 1: Windows Are Only ~10 Verses

**In Report, Check:**
```
1️⃣  MOBILE POLICY
  Render:     [100, 110] = 10 verses  ⚠️ TOO SMALL!
  Safety:     [100, 110] = 10 verses  ⚠️ TOO SMALL!
  Background: [100, 110] = 10 verses  ⚠️ TOO SMALL!
```

**Should Be (mobile):**
```
  Render:     [X, X+220] ≈ 220 verses ✅
  Safety:     [X-250, X+350] ≈ 600 verses ✅
  Background: [X-400, X+500] ≈ 900 verses ✅
```

**Root Causes:**
1. Direction calculation wrong (always returning 0)
2. Velocity stuck at 0
3. Clamping bug in window calculation
4. Container height miscalculated

### Issue 2: Many Aborted Batches

**In Report, Check:**
```
6️⃣  BATCH ACTIVITY
Batch Stats: avg=10 verses, aborted=15  ⚠️ EXCESSIVE ABORTS!
```

**Root Cause:**
- Background prefetch aborts immediately when windows change
- Windows changing too frequently (every frame vs every 8 rows)

### Issue 3: Velocity Always 0

**In Report, Check:**
```
3️⃣  VELOCITY & DIRECTION
Recent Samples: 0.0, 0.0, 0.0, 0.0, 0.0  ⚠️ NOT UPDATING!
```

**Root Causes:**
1. Touch listeners are passive (not updating state)
2. RAF loop throttled (low power mode)
3. Scroll container mismatch

### Issue 4: Cache Eviction Too Aggressive

**In Report, Check:**
```
5️⃣  CACHE METRICS
Total Cache Size: 150 entries  ⚠️ TOO SMALL!
Utilization: 7.5%  ⚠️ SHOULD BE HIGHER!
```

**Root Cause:**
- Eviction running too often
- TTL too short
- Pinning not working

## Testing Fast Flicks

To capture data during a fast flick:

```javascript
// 1. Start monitoring
__startMonitoring__(500)

// 2. Perform fast flick
// (swipe up/down rapidly)

// 3. Stop and analyze
__stopMonitoring__()
const report = window.__PREFETCH_DIAGNOSTICS__

// 4. Check key metrics
console.log('Velocity peak:', Math.max(...report.velocityMetrics.samples))
console.log('Last 5 batches:', report.recentActivity.lastBatches.slice(-5))
console.log('Windows:', report.mobilePolicy.computedWindows)
```

**What to Look For:**
- Velocity should spike >8 rps
- Should see HIGH priority batch for flight path
- Background window should extend far in scroll direction

## Current Code Analysis

Based on your existing code, here's what I found:

### ✅ Working Correctly

1. **Window Sizing** (`client/src/hooks/useRollingWindows.ts`)
   - Mobile render: 220 verses ✅
   - Mobile safety: 250 top / 350 bottom ✅
   - Mobile background: 150 top / 150 bottom ✅
   - Direction-biased (more in scroll direction) ✅

2. **Concurrency** (`client/src/hooks/prefetch/PrefetchManager.ts`)
   - Mobile cap: 2 concurrent ✅
   - Desktop cap: 4 concurrent ✅

3. **Velocity Tracking** (`client/src/hooks/useLiveAnchor.ts`)
   - 60 FPS updates via RAF ✅
   - Calculates rows per second ✅

4. **Delta Computation** (`client/src/hooks/usePrefetchRolling.ts`)
   - Only fetches new slivers ✅
   - Tracks previous ranges ✅

### ❓ Potential Issues to Investigate

1. **Velocity Detection on Mobile**
   - Need to verify touch/scroll events fire properly
   - Check if passive listeners prevent velocity updates
   - Verify RAF isn't throttled on mobile

2. **Window Sizing Edge Cases**
   - Check behavior at document start (index 0)
   - Check behavior at document end
   - Verify direction calculation

3. **Abort Frequency**
   - Check if background aborts too aggressively
   - Verify high-priority batches complete

## Next Steps

### Immediate: Run Diagnostics on Mobile

1. Open your app on the problematic mobile device
2. Open DevTools
3. Run: `__runMobileDiagnostics__()`
4. Scroll around and fast flick
5. Run again: `__runMobileDiagnostics__({ copy: true })`
6. Share the JSON report

### Analysis Workflow

1. **Check Window Sizes**
   - Are they ~10 verses? → Window calculation bug
   - Are they correct? → Look elsewhere

2. **Check Velocity**
   - Is it stuck at 0? → Event listener issue
   - Is it updating? → Look at batches

3. **Check Batches**
   - Are they ~10 verses? → Follows from window bug
   - Are they 100-500 verses? → System working, check network

4. **Check Cache**
   - Is it growing during scroll? → Good
   - Is it staying small? → Eviction too aggressive

## Supporting Evidence Required

To fully diagnose, please provide:

1. **Device Info** (from report Section 0)
   - Exact device model
   - OS version
   - Browser version

2. **Before/After Scroll Report**
   ```javascript
   __runMobileDiagnostics__({ print: false })
   const before = window.__PREFETCH_DIAGNOSTICS__
   // ... scroll ...
   __runMobileDiagnostics__({ print: false })
   const after = window.__PREFETCH_DIAGNOSTICS__
   ```

3. **Network Tab Evidence**
   - Screenshot during fast flick
   - Number of requests
   - Size of each request

4. **Console Logs**
   Enable verbose logging (add to .env):
   ```
   VITE_LOG_LEVEL=debug
   VITE_DEBUG_TAGS=PREFETCH,ROLLING
   ```

## Code Locations for Fixes

Once you identify the issue from the diagnostic report:

### If Windows Are Too Small:
- **Check:** `client/src/hooks/useRollingWindows.ts` lines 21-47
- **Fix:** Window calculation clamp logic

### If Velocity Is 0:
- **Check:** `client/src/hooks/useLiveAnchor.ts` lines 26-42
- **Fix:** Event listener configuration

### If Batches Abort Too Much:
- **Check:** `client/src/hooks/prefetch/PrefetchManager.ts` lines 46-50
- **Fix:** Abort controller logic

### If Cache Evicts Too Aggressively:
- **Check:** `client/src/hooks/useRollingVirtualization.ts` lines 106-113
- **Fix:** High water / target values

## Summary

You now have:

✅ Comprehensive diagnostic tools automatically tracking all metrics
✅ Browser console commands for easy report generation
✅ Detailed guide for interpreting results
✅ Clear mapping from symptoms → root causes
✅ Code locations for targeted fixes

The tools will tell you EXACTLY where the mobile prefetch pipeline is breaking. Run the diagnostics on your mobile device and the report will point you directly to the problem.

---

**Quick Start Command:**
```javascript
__runMobileDiagnostics__()
```

Good luck! The diagnostic tools should make the root cause obvious. 🎯
