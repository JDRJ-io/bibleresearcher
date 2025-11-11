# HoverVerseBar Component Trace Analysis

## Component Architecture

### Desktop Path (Working)
```
HoverCard (Radix)
├── HoverCardTrigger (wraps children)
│   └── onMouseEnter/onMouseLeave handlers
└── HoverCardContent 
    ├── className: "w-auto p-2 bg-background border shadow-lg z-[100]"
    ├── Positioning: side="top", align="start", sideOffset={10}
    └── ToolbarContent component
```

### Mobile Path (ISSUE FOUND)
```
Custom touch handling
├── onTouchStart → handleTouchStart
├── onTouchMove → handleTouchMove  
├── onTouchEnd → handleTouchEnd
└── Conditional render when isMobileToolbarVisible=true
    ├── className: "absolute top-[-50px] left-0 w-auto p-2 bg-background border shadow-lg rounded-md z-[100]"
    └── ToolbarContent component (same as desktop)
```

## Integration Points
- **VirtualRow.tsx**: MainTranslationCell wrapped by HoverVerseBar
- **HybridCell.tsx**: Detailed verse view wrapped by HoverVerseBar  
- **ToolbarContent**: Shared component with Copy, Bookmark, Share, Highlight, Delete actions

## Console Log Analysis (Mobile)
```
🎯 HoverVerseBar render: {
  "verse": "Gen.2:22",
  "isMobile": true, 
  "user": false,
  "toolbarVisible": false  ← KEY ISSUE
}
```

## Root Cause Identified
**The mobile toolbar is not being triggered at all** - `toolbarVisible: false` indicates that `isMobileToolbarVisible` state is never set to `true`. This means:

1. **Not a blank overlay problem** - toolbar simply doesn't appear
2. **Touch detection failing** - `handleTouchEnd` not properly detecting taps
3. **Possible conflicts** with navigation touch handlers (axis lock, swipe navigation)

## Touch Handler Logic
```javascript
handleTouchEnd(e) {
  if (!isMobile || !touchInfo || touchInfo.isScrolling) return;
  
  const duration = Date.now() - touchInfo.startTime;
  
  // Quick tap (< 300ms) = show/hide toolbar
  if (duration < 300) {
    e.preventDefault();
    e.stopPropagation(); 
    setIsMobileToolbarVisible(prev => !prev); ← This is not executing
  }
}
```

## Potential Conflicts
1. **useNaturalAxisLock** - Touch handlers may capture events first
2. **useColumnSwipeNavigation** - Horizontal swipe detection
3. **Event bubbling** - Touch events may be consumed by parent containers
4. **Touch threshold** - 300ms limit might be too strict
5. **Scroll detection** - `touchInfo.isScrolling` flag may be too sensitive

## Next Steps
1. Debug why mobile touch detection is failing
2. Check for event handler conflicts with navigation hooks
3. Test touch threshold and scroll sensitivity
4. Verify touch event propagation chain