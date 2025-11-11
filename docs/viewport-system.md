# Bible App Viewport System Documentation

*Current state as of analysis - September 2025*

## System Architecture

The viewport system uses a **slot-based architecture** with 20 predefined column positions (0-19) defined in `client/src/constants/columnLayout.ts`.

### Core Components

- **Column Layout**: `COLUMN_LAYOUT` array defines all possible columns with fixed positions
- **State Management**: `useBibleStore` in `App.tsx` manages visibility and navigation
- **Rendering**: `VirtualRow.tsx` and `NewColumnHeaders.tsx` handle display logic
- **User Controls**: Navigation arrows and drag-and-drop reordering

## Column Visibility System

### Fixed Columns
- **Slot 0**: Reference column (`#`) - Always visible, sticky positioned
- **Slot 2**: Main translation (e.g., KJV) - Always visible

### Dynamic Columns
```typescript
// Visibility controlled by store state
slotConfig[1] = { type: 'notes', visible: showNotes };
slotConfig[15] = { type: 'cross-refs', visible: showCrossRefs };
slotConfig[16-18] = { type: 'prophecy-*', visible: showProphecies };

// Alternate translations fill slots 3-14 dynamically
alternates.forEach((code, index) => {
  const slotNumber = 3 + index; // Max 12 alternates
  slotConfig[slotNumber] = { type: 'alt-translation', visible: true };
});
```

## Width Adaptation System

### Responsive Width Calculation
- Uses CSS custom properties with `calc()` expressions
- Base widths multiplied by `--column-width-mult` variable
- Column-specific variables: `--adaptive-ref-width`, `--adaptive-main-width`, etc.

### Portrait Mode Optimization
- Calculates optimal widths for exactly 2 navigable columns in portrait
- Reference column gets fixed width (32px mobile, 56px tablet)
- Remaining columns share available space equally
- Context columns hidden in mobile portrait mode

## Horizontal Navigation System

### Navigation State
```typescript
// Store properties
navigationOffset: 0,           // Current scroll position
maxVisibleNavigableColumns: 3, // Max columns shown simultaneously
navigableColumns: [],          // List of scrollable columns (excludes reference)
```

### Navigation Functions
```typescript
// Movement controls
shiftColumnsLeft()    // Decrements navigationOffset
shiftColumnsRight()   // Increments navigationOffset
canShiftLeft()        // Returns navigationOffset > 0
canShiftRight()       // Returns offset < max possible offset

// Visibility calculation
getVisibleSlice()     // Returns { start, end, canGoLeft, canGoRight }
```

### Column Filtering
1. **Fixed columns** (reference) always shown
2. **Navigable columns** filtered by `navigationOffset` and `maxVisibleNavigableColumns`
3. Final visible set: `[...fixedColumns, ...navigableColumns.slice(start, end)]`

## User Interaction

### Navigation Controls
- **Arrow buttons**: `ColumnNavigationArrows` component calls shift functions
- **Pivot controls**: `ColumnPivotControls` for presentation mode navigation
- **Touch-friendly**: Blue-styled buttons with proper touch targets

### Drag & Drop Reordering
- Uses `@dnd-kit` library in `NewColumnHeaders.tsx`
- Updates `displayOrder` property in column state
- Broadcasts changes via `ColumnChangeSignal` system

### Width Adjustment
- Manual size controls update `--column-width-mult` CSS variable
- Unified or split sizing modes available
- Persisted to localStorage

## Inter-Component Communication

### Signal System
```typescript
// useColumnChangeSignal.ts
class ColumnChangeSignal {
  emit(changeType: 'width' | 'visibility' | 'order' | 'multiplier')
  listen(callback) // Subscribe to changes
}
```

Change types:
- `'width'` - Column width adjustments
- `'visibility'` - Show/hide columns
- `'order'` - Drag & drop reordering
- `'multiplier'` - Global size changes

## Key Files

| File | Purpose |
|------|---------|
| `constants/columnLayout.ts` | Master column definitions and slot positions |
| `App.tsx` | Store with navigation and visibility logic |
| `components/bible/VirtualRow.tsx` | Cell rendering and column filtering |
| `components/bible/NewColumnHeaders.tsx` | Header rendering and drag & drop |
| `hooks/useColumnChangeSignal.ts` | Inter-component communication |
| `hooks/useAdaptivePortraitColumns.ts` | Portrait mode width calculations |

## Current Limitations

1. Maximum 12 alternate translations (slots 3-14)
2. Fixed navigation increment of 1 column at a time
3. Portrait mode optimized for exactly 2 visible navigable columns
4. Reference column position cannot be customized

---

*This documentation reflects the current implementation and may change as the system evolves.*