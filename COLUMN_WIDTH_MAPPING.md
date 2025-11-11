# ⚠️ LEGACY DOCUMENTATION - OUTDATED

**This document is outdated. For the current authoritative column system documentation, see:**
- **[docs/columns.md](docs/columns.md)** - Column layout understanding and track system
- **[docs/column-system-implementation.md](docs/column-system-implementation.md)** - Implementation details and pseudocode

---

# Column Width System Mapping

## Overview
The app uses multiple overlapping width systems that vary by screen mode, orientation, and user preferences. This creates complexity where headers and data rows can use different calculations.

## CSS Variable Systems

### 1. Base Responsive Variables
```css
/* index.css - Screen size breakpoints */
@media (max-width: 639px)    { --baseRem: 0.875rem; --baseColW: 420px; }
@media (640px to 1023px)     { --baseRem: 1rem;     --baseColW: 480px; }
@media (min-width: 1024px)   { --baseRem: 1.125rem; --baseColW: 520px; }
```

### 2. Manual User Controls
```css
/* index.css - User adjustable multipliers */
--text-size-mult: 1.0;     /* Text size scaling */
--row-height-mult: 1.0;    /* Row spacing */
--column-width-mult: 1.0;  /* Universal column width expansion */
```

### 3. Legacy Fixed Width System
```css
/* index.css - Portrait mode adaptive widths (pixel-based) */
--adaptive-ref-width: 72px;          /* Reference column */
--adaptive-main-width: 352px;        /* Main translation */
--adaptive-cross-width: 288px;       /* Cross-references */
--adaptive-alt-width: 320px;         /* Alternate translations */
--adaptive-prophecy-width: 352px;    /* Prophecy columns */
--adaptive-notes-width: 320px;       /* Notes */
--adaptive-context-width: 192px;     /* Context/dates */
```

### 4. Expert's Landscape System (rem-based)
```css
/* index.css - Landscape mode with clamp() */
--w-ref: 4.5rem;                              /* Reference column */
--w-main: clamp(14rem, 35vw, 22rem);          /* Main translation */
--w-xref: clamp(10rem, 45vw, 18rem);          /* Cross-references */
--w-alt: clamp(12rem, 30vw, 20rem);           /* Alternate translations */
--w-prophecy: clamp(14rem, 35vw, 22rem);      /* Prophecy columns */

/* Mobile overrides */
@media (max-width: 768px) {
  --w-ref: 3.5rem;
  --w-main: clamp(45vw, 60vw, 80vw);
  --w-xref: clamp(40vw, 55vw, 70vw);
}

@media (max-width: 480px) {
  --w-ref: 3rem;
  --w-main: 18rem;
  --w-xref: 18rem;
}
```

## Width Calculation Logic

### Headers (ColumnHeaders.tsx)
```typescript
// Portrait mode
if (isPortrait) {
  if (slot === 0) return 'var(--adaptive-ref-width)';  // 72px
  // Other columns use --adaptive-*-width variables
}

// Landscape mode  
if (slot === 0) return 'var(--w-ref)';  // 4.5rem -> 3.5rem -> 3rem
// Final calculation: calc(var(--w-ref) * var(--column-width-mult))
```

### Data Rows (VirtualRow.tsx)
```typescript
// Portrait mode
if (isPortrait) {
  if (slotNumber === 0) return 'var(--adaptive-ref-width)';  // 72px
}

// Landscape mode
if (slotNumber === 0) return 'var(--w-ref)';  // 4.5rem -> 3.5rem -> 3rem
// Final calculation: calc(var(--w-ref) * var(--column-width-mult))
```

## Current Problem Analysis

### Reference Column Width Sources:
1. **Portrait Mode**: Both use `--adaptive-ref-width: 72px` (fixed)
2. **Landscape Mode**: Both use `--w-ref` but with potential differences in:
   - CSS cascade order
   - Media query application
   - Element specificity
   - `--column-width-mult` application timing

### Breakpoint Values for Reference Column:
- **Desktop (1024px+)**: `--w-ref: 4.5rem` = 81px (at 1.125rem base)
- **Tablet (640-1023px)**: `--w-ref: 3.5rem` = 56px (at 1rem base) 
- **Mobile (480-639px)**: `--w-ref: 3.5rem` = 49px (at 0.875rem base)
- **Tiny (≤480px)**: `--w-ref: 3rem` = 42px (at 0.875rem base)

## Recommendations

1. **Unified Width System**: Both headers and data should use identical CSS calculations
2. **Debug Current Values**: Need to see actual computed values to identify mismatch
3. **Consolidate Variables**: Reduce overlapping systems
4. **Document Active System**: Clearly mark which width system is authoritative per mode

## Debug Needed
- Actual computed width values for header vs data in current viewport
- Which CSS variables are actually being used
- Media query activation status
- `--column-width-mult` current value