# Mobile Diagnostics HUD - Quick Start

## What Is It?

A floating debug panel that appears directly on your mobile device - no need to connect remote DevTools! Perfect for on-device diagnostics and real-time testing.

## How to Open

### Method 1: Tap the Bug Button
Look for the **purple bug icon** in the bottom-right corner of your screen. Tap it to open the HUD.

### Method 2: Keyboard Shortcut (if you have a keyboard)
Press **Ctrl + Shift + D** (or **Cmd + Shift + D** on Mac/iOS)

## 3-Minute Mobile Triage

### Step 1: Get Baseline (30 seconds)
1. Open the HUD (tap bug icon)
2. Tap **"Before Snapshot"** button
3. See confirmation: "✅ Before snapshot saved"

### Step 2: Reproduce Issue (1 minute)
1. Scroll/flick around the Bible
2. Do some fast flicks (swipe hard up/down)
3. Notice any lag or stuttering

### Step 3: Capture After State (30 seconds)
1. Tap **"After Snapshot"** button
2. See the comparison output showing:
   - Window sizes before/after
   - Velocity samples
   - Batch statistics

### Step 4: Monitor Live (1 minute)
1. Tap **"Start Monitor"** button
2. Do fast flicks for ~10 seconds
3. Tap **"Stop Monitor"** button
4. See detailed diagnostic data

### Step 5: Share Results (30 seconds)
1. Tap the **Copy** button (clipboard icon)
2. Paste into notes/email/message
3. Share with the dev team

## Quick Command Buttons

| Button | What It Does |
|--------|--------------|
| **Full Report** | Generates complete diagnostic report with all metrics |
| **Before Snapshot** | Saves current state before scrolling |
| **After Snapshot** | Compares to before snapshot, shows changes |
| **Start Monitor** | Begins continuous monitoring (500ms intervals) |
| **Stop Monitor** | Stops monitoring and shows collected data |

## Custom Commands

You can also type JavaScript commands directly:

### Common Diagnostics
```javascript
// Check current windows
window.__VIRTUALIZATION_STATE__.windows

// Check velocity
window.__VIRTUALIZATION_STATE__.velocity

// Get full diagnostics
window.__PREFETCH_DIAGNOSTICS__

// Check specific metrics
window.__PREFETCH_DIAGNOSTICS__.batchStats
window.__PREFETCH_DIAGNOSTICS__.cacheMetrics
```

### Environment Check
```javascript
// Check mobile detection
window.innerWidth < 640

// Check device memory
navigator.deviceMemory

// Check environment flags
import.meta.env
```

## What to Look For

### ✅ Good Signs
- Render window: ~220 verses
- Safety window: ~600 verses total
- Background window: ~900 verses total
- Velocity updates during scroll (not stuck at 0)
- Batch sizes: 100-500 verses
- Low abort count

### 🚨 Problem Signs
- Windows only ~10 verses → **Window calculation bug**
- Velocity always 0 → **Touch events not firing**
- Many aborted batches (>10) → **Excessive cancellation**
- Small cache size (<100) → **Aggressive eviction**
- Batch avg size ~10 verses → **Follows from window bug**

## Output Buttons

### Copy Button (📋)
- Copies all output to clipboard
- Great for sharing with team
- Works on mobile browsers

### Clear Button (🗑️)
- Clears the output area
- Start fresh for new test

### Execute Button (▶️)
- Runs the command you typed
- Shows result in output area

## Example Workflow

**Problem:** Scrolling is laggy and only loads ~10 verses at a time

**Triage Steps:**

1. **Open HUD** → Tap bug icon
2. **Before Snapshot** → Tap button
3. **Scroll/Flick** → Do some scrolling
4. **After Snapshot** → Tap button
5. **Check Output:**
   ```
   Before Windows: { render: [0, 10], safety: [0, 10], background: [0, 10] }
   After Windows: { render: [100, 110], safety: [100, 110], background: [100, 110] }
   ```
   ⚠️ **All windows only 10 verses!** → Window calculation bug confirmed!

6. **Copy Output** → Tap copy button
7. **Share with Team** → Paste into issue tracker

## Tips

### Battery Optimization
- Close HUD when not in use (tap X)
- Stop monitoring after collecting data
- Clear output periodically to save memory

### Touch Targets
- All buttons are touch-friendly (large tap areas)
- Output area scrolls if content overflows
- Command input auto-focuses on mobile keyboard

### Keyboard Input (Mobile)
- Command input opens mobile keyboard
- Type JavaScript directly
- Press execute button to run

## Troubleshooting

### HUD Won't Open
- Make sure the bug button is visible (bottom-right)
- Try the keyboard shortcut: Ctrl+Shift+D
- Refresh the page

### Commands Don't Work
- Check for typos in command
- Use autocomplete: `window.__`
- Try preset buttons first

### Can't Copy Output
- Some mobile browsers block clipboard
- Screenshot the output instead
- Or manually select and copy text

## Advanced: Custom Monitoring

For specific metrics during scroll:

```javascript
// Custom velocity tracking
setInterval(() => {
  console.log('Velocity:', window.__VIRTUALIZATION_STATE__.velocity);
}, 100);

// Watch window changes
setInterval(() => {
  const w = window.__VIRTUALIZATION_STATE__.windows;
  console.log('Render:', w.render, 'Safety:', w.safety);
}, 500);

// Track batch activity
window.__PREFETCH_DIAGNOSTICS__.recentActivity.lastBatches
```

## Summary

The Mobile Diagnostics HUD gives you:
- ✅ On-device debugging (no remote DevTools needed)
- ✅ One-tap diagnostic reports
- ✅ Before/after comparison
- ✅ Live monitoring during scroll
- ✅ Copy-paste results for sharing
- ✅ Custom command execution

**Quick 3-Minute Triage:**
1. Before Snapshot → Scroll → After Snapshot → Copy → Share

That's it! The HUD will show exactly what's wrong with the mobile prefetch system. 🎯
