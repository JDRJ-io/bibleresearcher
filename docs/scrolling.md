# Anchor-Centered Scrolling Architecture

## Overview

The Bible application uses an anchor-centered scrolling system that eliminates all edge-based loading. Instead of detecting when users reach the top or bottom of content, the system maintains a moving anchor at the viewport center and loads data around that anchor.

## Key Concepts

### Anchor Index
- The `anchorIndex` represents the verse at the vertical center of the viewport
- Calculated as: `Math.floor((scrollTop + clientHeight / 2) / ROWHEIGHT)`
- Updates automatically as the user scrolls, debounced at 40ms

### Chunk Loading
- `loadChunk(anchorIndex, buffer)` returns a slice of verses around the anchor
- Typically maintains 150-250 verses in memory (±125 around center)
- Uses `verseKeys.slice(start, end)` to extract the relevant portion

### Virtual Rendering
- Only renders verses in the current chunk
- Uses top/bottom spacers to maintain proper scroll height
- Each row has a fixed height of 120px for consistent calculations

## Implementation

### Core Hooks

1. **useAnchorScroll**: Tracks scroll position and calculates anchor index
2. **useChunk**: Memoized chunk calculation around anchor index
3. **useRowData**: Fetches data only for verses in current chunk

### Data Flow

```
Scroll Event → anchorIndex → loadChunk → verseIDs → renderViewport
```

### Key Files

- `client/src/hooks/useAnchorScroll.ts` - Scroll tracking
- `client/src/hooks/useChunk.ts` - Chunk calculation
- `client/src/components/bible/VirtualRow.tsx` - Row rendering
- `client/src/components/bible/VirtualBibleTable.tsx` - Main table

## Benefits

1. **No Edge Detection**: Eliminates complex boundary detection logic
2. **Consistent Performance**: Memory usage stays constant regardless of scroll position
3. **Smooth Scrolling**: No loading delays when reaching content boundaries
4. **Predictable Behavior**: System behavior is deterministic and testable

## Ground Rules

- `verseKeys-canonical.json` is the single source of truth for verse ordering
- `loadChunk` never requests data outside its calculated slice
- All data fetches key off verse IDs in the current chunk
- Workers (translations, Strong's) remain unchanged
- Edge-loading code has been completely removed

## Mnemonic

*"The table no longer thinks in edges; it keeps a moving anchor in the middle, and every dataset plugs into that anchor's slice."*