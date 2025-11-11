# Mobile Prefetch Diagnostics Guide

## Overview
This guide explains how to use the comprehensive mobile prefetch diagnostic tools to investigate and resolve scrolling performance issues on mobile devices.

## Quick Start

### 1. Access Your Mobile Device
Open your Bible app on the mobile device experiencing issues.

### 2. Open Browser DevTools

**iOS Safari:**
1. Enable Web Inspector on your iPhone: Settings → Safari → Advanced → Web Inspector
2. Connect iPhone to Mac via USB
3. On Mac: Safari → Develop → [Your iPhone] → [Your App]

**Chrome Mobile (Android):**
1. Enable Developer Options on Android
2. Enable USB Debugging
3. Connect to computer
4. Open Chrome → `chrome://inspect`
5. Click "Inspect" on your device

**Chrome iOS (Remote Debugging):**
Use Eruda for on-device console:
```javascript
// Paste this in URL bar:
javascript:(function(){var script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/eruda';document.body.append(script);script.onload=function(){eruda.init();}})();
```

### 3. Run Diagnostics

Once you have console access, scroll a bit to activate the virtualization system, then run:

```javascript
__runMobileDiagnostics__()
```

This will print a comprehensive report to the console.

## Available Commands

### Basic Diagnostics
```javascript
// Run and print report
__runMobileDiagnostics__()

// Run and copy to clipboard
__runMobileDiagnostics__({ copy: true })

// Run without printing (just store)
__runMobileDiagnostics__({ print: false })
```

### Continuous Monitoring
```javascript
// Start monitoring (every 1 second)
__startMonitoring__(1000)

// Stop monitoring
__stopMonitoring__()
```

### Access Report Data
```javascript
// Get last report object
window.__PREFETCH_DIAGNOSTICS__

// Get current virtualization state
window.__VIRTUALIZATION_STATE__
```

## Understanding the Report

### 0️⃣ Device Context
- **Device & OS**: iPhone/iPad/Android + version
- **Browser**: Chrome/Safari + version  
- **Screen Size**: Width × Height
- **Device Memory**: RAM available
- **Mobile Detection**: Confirms if detected as mobile

### 1️⃣ Mobile Policy + Constants
- **Render Size**: Number of verses visible on screen (should be ~220 for mobile)
- **Safety Pads**: Buffer above/below render window (top/bot in verses)
- **Background Pads**: Deep prefetch buffer (top/bot in verses)
- **Step Size**: How often anchor updates (8 rows)
- **Row Height**: Pixel height per verse row
- **Computed Windows**: 
  - Render: What's visible (~220 verses)
  - Safety: Buffer to prevent blanking (~300-500 verses)
  - Background: Deep prefetch for flicks (~500-800 verses)

**⚠️ What to Look For:**
- Render window should be ~220 verses on mobile
- Safety window should NOT be tiny (e.g., not just 10 verses)
- Background window should extend significantly in scroll direction

### 2️⃣ Prefetch Manager State
- **Concurrency Cap**: Max simultaneous fetches (should be 2 for mobile)
- **Currently Running**: Active fetches (0-2)
- **Pending Queue**: Batches waiting to run
- **BG AbortController**: Whether background fetches can be cancelled

**⚠️ What to Look For:**
- Concurrency cap should be 2 on mobile
- If "Currently Running" is always at cap, network might be slow
- Large pending queue suggests batching issues

### 3️⃣ Velocity & Direction
- **Current Velocity**: Scroll speed in rows per second (rps)
- **Direction**: up or down
- **Recent Samples**: Last 5 velocity measurements
- **Threshold**: Speed needed to trigger flight path (8 rps mobile, 20 rps desktop)
- **Multiplier**: How far ahead to prefetch during fast scrolls (2.0× mobile)

**⚠️ What to Look For:**
- Velocity should update during scroll (not stuck at 0)
- During fast flicks, velocity should spike (>8 rps)
- If velocity is always near 0, touch/scroll events might not be firing

### 4️⃣ Delta Computation
Shows the last 10 window changes (what's being prefetched):
- **SAFETY**: High-priority buffer updates
- **BACKGROUND**: Low-priority deep prefetch

**⚠️ What to Look For:**
- Delta counts should NOT always be ~10 verses
- Should see varied delta sizes (100-500 verses typical)
- Frequent deltas during scroll indicates proper tracking

### 5️⃣ Cache Metrics
- **Total Cache Size**: Verses currently cached
- **High Water / Target**: Eviction thresholds
- **In-Flight**: Currently loading
- **Status Breakdown**: ready/loading/error counts
- **Utilization**: Cache fullness percentage

**⚠️ What to Look For:**
- Cache should grow during scrolling
- High "error" count indicates loading failures
- Utilization >90% might trigger aggressive eviction

### 6️⃣ Batch Activity
Shows recent fetch batches with:
- **Priority**: HIGH or LOW
- **Range**: Index range fetched
- **Count**: Number of verses
- **Status**: started/completed/aborted

**Stats:**
- **Avg Size**: Average verses per batch
- **High/Low Count**: Number of high vs low priority batches
- **Aborted Count**: How many batches were cancelled

**⚠️ What to Look For:**
- Avg batch size should be 100-500 verses (NOT ~10)
- Many aborted batches suggests excessive cancellation
- All batches with count=10 indicates window sizing problem

### 7️⃣ Geometry
- **Total Rows**: Total verses in Bible
- **Center Index**: Current centered verse
- **Stepped Index**: Anchor index (steps by 8)
- **Container Height**: Viewport height
- **Sticky Header Offset**: Fixed header height
- **Scroll Top**: Current scroll position

**⚠️ What to Look For:**
- Center index should update during scroll
- Container height should match viewport
- Sticky offset should be ~138px on mobile

### 8️⃣ Environment Flags
Shows Vite environment variables:
- `VITE_LOG_LEVEL`: Logging verbosity
- `VITE_DEBUG_TAGS`: Enabled debug tags
- `VITE_LOG_SAMPLE_HOTPATH`: Log sampling rate
- `VITE_LOG_THROTTLE_MS`: Log throttle interval

## Common Issues & Solutions

### Issue: Windows Are Only ~10 Verses

**Symptoms:**
- Render window: [100, 110] (only 10 verses)
- Delta counts always ~10
- Stuttering during scroll

**Likely Causes:**
1. **Clamping Bug**: Code is limiting range to 10 somewhere
2. **Direction Calculation Wrong**: Not detecting scroll direction
3. **Velocity Stuck at 0**: Touch events not updating velocity

**Debug Steps:**
```javascript
// Check current windows
const state = window.__VIRTUALIZATION_STATE__
console.log(state.windows)

// Check velocity
console.log(state.velocity)

// Monitor continuously during scroll
__startMonitoring__(500)
// Scroll fast, then check results
__stopMonitoring__()
```

### Issue: Many Aborted Batches

**Symptoms:**
- High "aborted" count in batch stats
- Only ~10 verses ever load before abort

**Likely Causes:**
1. **Too Aggressive Cancellation**: Background fetches abort immediately
2. **Rapid Window Changes**: Windows update faster than fetches complete
3. **Delta Calculation Bug**: Sending tiny deltas that complete before next cancel

**Debug Steps:**
```javascript
// Check batch history
window.__PREFETCH_DIAGNOSTICS__.recentActivity.lastBatches
```

### Issue: Velocity Always 0

**Symptoms:**
- Velocity never changes from 0
- Flight path never triggers
- Windows don't bias in scroll direction

**Likely Causes:**
1. **Passive Listeners**: Touch events marked passive, not updating velocity
2. **RAF Throttled**: requestAnimationFrame not running (low power mode)
3. **Scroll Root Mismatch**: Reading scrollTop from wrong element

**Debug Steps:**
```javascript
// Check if velocity updates
__startMonitoring__(100)
// Scroll aggressively
__stopMonitoring__()

// Check velocity samples
window.__PREFETCH_DIAGNOSTICS__.velocityMetrics.samples
```

### Issue: Cache Eviction Too Aggressive

**Symptoms:**
- Cache size drops during scroll
- Re-fetching same verses
- Stuttering as verses re-load

**Likely Causes:**
1. **Low High Water Mark**: 2000 too low for mobile
2. **TTL Too Short**: 60s eviction too aggressive
3. **Pinning Not Working**: Render/safety windows not pinned

**Debug Steps:**
```javascript
// Check cache metrics
const report = window.__PREFETCH_DIAGNOSTICS__
console.log({
  size: report.cacheMetrics.totalSize,
  highWater: report.cacheMetrics.highWater,
  utilization: (report.cacheMetrics.totalSize / report.cacheMetrics.highWater * 100).toFixed(1) + '%'
})
```

## Testing Fast Flicks on Mobile

To test fast scroll/flick behavior:

1. **Start Monitoring:**
   ```javascript
   __startMonitoring__(500)
   ```

2. **Perform Fast Flicks:**
   - Swipe up/down rapidly
   - Let it coast
   - Observe console output

3. **Check Results:**
   ```javascript
   __stopMonitoring__()
   const report = window.__PREFETCH_DIAGNOSTICS__
   
   // Check velocity during flick
   console.log('Velocity samples:', report.velocityMetrics.samples)
   
   // Check if flight path triggered
   console.log('Last batches:', report.recentActivity.lastBatches.slice(-5))
   ```

4. **What to Look For:**
   - Velocity should spike >8 rps during flick
   - Should see a HIGH priority batch for flight path range
   - Background window should extend far in scroll direction

## Reporting Results

When sharing diagnostic results with developers:

### 1. Copy Full Report
```javascript
__runMobileDiagnostics__({ copy: true })
```
Then paste the JSON into a file or message.

### 2. Include Device Info
From Section 0 of the report:
- Device model
- OS version
- Browser + version
- Screen dimensions

### 3. Describe the Issue
- What you were doing (scrolling, flicking, etc.)
- Expected behavior
- Actual behavior

### 4. Include Before/After
```javascript
// Before scroll
__runMobileDiagnostics__({ print: false })
const before = window.__PREFETCH_DIAGNOSTICS__

// Scroll/flick
// ...

// After scroll
__runMobileDiagnostics__({ print: false })
const after = window.__PREFETCH_DIAGNOSTICS__

// Compare
console.log('Before:', before.mobilePolicy.computedWindows)
console.log('After:', after.mobilePolicy.computedWindows)
```

## Advanced Debugging

### Check Network Requests
In DevTools Network tab:
1. Filter by "fetch" or "XHR"
2. During scroll, observe:
   - Number of requests
   - Request payload size
   - Response time
   - Any failures (red)

### Check Console Logs
Enable verbose logging:
```javascript
// In .env file, add:
VITE_LOG_LEVEL=debug
VITE_DEBUG_TAGS=PREFETCH,ROLLING
```

Look for:
- `[INFO:PREFETCH] fetch:range` - Shows batch requests
- `[INFO:ROLLING] flight-path:warm` - Shows fast scroll detection
- `🪟 WINDOWS[mobile]` - Shows window calculations

### Check Touch Event Listeners
```javascript
// Check if touch listeners are passive
const listeners = getEventListeners(window)
console.log('Touch listeners:', listeners.touchstart)
console.log('Scroll listeners:', listeners.scroll)
```

## Summary

The diagnostic tools provide comprehensive visibility into:
1. **Window sizing** - Are we calculating correct buffer sizes?
2. **Prefetch behavior** - Are we fetching the right amount?
3. **Velocity tracking** - Are we detecting scroll speed?
4. **Cache management** - Are we keeping verses in memory?
5. **Network activity** - Are requests sized appropriately?

Use these tools to identify exactly where the mobile prefetch pipeline is breaking down, then apply targeted fixes based on the evidence.
