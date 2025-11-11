# ⚠️ LEGACY DOCUMENTATION - OUTDATED

**This document is outdated. For the current authoritative column system documentation, see:**
- **[docs/columns.md](docs/columns.md)** - Column layout understanding and track system
- **[docs/column-system-implementation.md](docs/column-system-implementation.md)** - Implementation details and pseudocode

---

# Biblical Research Platform - Complete Column System Documentation

## Overview
The Biblical Research Platform features a sophisticated 21-slot system (slots 0-20) with adaptive width management, drag-and-drop reordering, responsive design, and intelligent virtual scrolling. This documentation covers every aspect of the column implementation, arrangement logic, and width calculation system.

## 1. Master Column Layout Definition

### File: `client/src/constants/columnLayout.ts`

**Interface Definition:**
```typescript
export interface ColumnSlot {
  id: string;
  name: string;
  type: 'reference' | 'translation' | 'cross-ref' | 'prophecy' | 'notes' | 'context' | 'hybrid';
  width: string; // Tailwind width class
  mobileWidth: string; // Mobile-specific width
  position: number; // Slot position (0-20)
  defaultVisible: boolean;
  guestMode: boolean; // Available to guest users
}
```

**Master Column Layout (COLUMN_LAYOUT array):**

**Slot 0: Reference Column**
- ID: `reference`, Name: `#`, Type: `reference`
- Width: `w-20` (5rem), Mobile: `w-6` (1.5rem - ultra-thin for rotated text)
- Always visible, guest accessible
- Purpose: Shows verse references (Gen.1:1, Matt.5:3, etc.)

**Slot 1: Main Translation**
- ID: `main-translation`, Name: `Main Translation`, Type: `translation`
- Width: `w-80` (20rem), Mobile: `w-52` (13rem - maximum possible width)
- Always visible, guest accessible
- Purpose: Primary Bible translation (KJV by default)

**Slots 2-5: Alternate Translations 1-4**
- IDs: `alt-translation-1` through `alt-translation-4`
- Width: `w-80` (20rem), Mobile: `w-full`
- Default hidden, guest accessible
- Purpose: Additional Bible translations (AMP, CSB, etc.)

**Slot 6: Cross References**
- ID: `cross-refs`, Name: `Cross References`, Type: `cross-ref`
- Width: `w-80` (20rem), Mobile: `w-80` (20rem)
- Default visible, guest accessible
- Purpose: Shows related Bible verses with full text

**Slots 7-9: Prophecy Columns**
- IDs: `prophecy-prediction`, `prophecy-fulfillment`, `prophecy-verification`
- Names: `Predictions`, `Fulfillments`, `Verifications`
- Width: `w-80` (20rem), Mobile: `w-80` (20rem)
- Default hidden, guest accessible
- Purpose: Prophecy tracking system

**Slot 10: Notes Column**
- ID: `notes`, Name: `Notes`, Type: `notes`
- Width: `w-64` (16rem), Mobile: `w-56` (14rem)
- Default hidden, requires login (not guest accessible)
- Purpose: User-created verse notes

**Slot 11: Context Column**
- ID: `context`, Name: `Context`, Type: `context`
- Width: `w-32` (8rem), Mobile: `w-24` (6rem)
- Default hidden, guest accessible
- Purpose: Context boundaries and grouping

**Slots 12-19: Additional Alternate Translations 5-12**
- IDs: `alt-translation-5` through `alt-translation-12`
- Width: `w-80` (20rem), Mobile: `w-full`
- Default hidden, guest accessible
- Purpose: Extended translation support (up to 12 total translations)

**Slot 20: Hybrid Master Column**
- ID: `hybrid`, Name: `Master Column`, Type: `hybrid`
- Width: `w-96` (24rem), Mobile: `w-80` (20rem)
- Default hidden, guest accessible
- Purpose: Shows all data for center anchor verse

## 2. Width Calculation System

### CSS Variable Architecture

**Portrait Mode Variables (Fixed Pixel Values):**
```css
--adaptive-ref-width: 72px;          /* Reference column */
--adaptive-main-width: 352px;        /* Main translation */
--adaptive-cross-width: 288px;       /* Cross-references */
--adaptive-alt-width: 320px;         /* Alternate translations */
--adaptive-prophecy-width: 352px;    /* Prophecy columns */
--adaptive-notes-width: 320px;       /* Notes */
--adaptive-context-width: 192px;     /* Context/dates */
```

**Landscape Mode Variables (Responsive with clamp()):**
```css
--w-ref: 4.5rem;                              /* Reference column */
--w-main: clamp(14rem, 35vw, 22rem);          /* Main translation */
--w-xref: clamp(10rem, 45vw, 18rem);          /* Cross-references */
--w-alt: clamp(12rem, 30vw, 20rem);           /* Alternate translations */
--w-prophecy: clamp(14rem, 35vw, 22rem);      /* Prophecy columns */
```

**Universal Scaling Multiplier:**
```css
--column-width-mult: 1; /* User-adjustable for presentation mode */
```

### Dynamic Width Calculation Hooks

#### File: `client/src/hooks/useAdaptivePortraitColumns.ts`

**Purpose:** Calculates precise column widths for portrait mode orientation

**Key Algorithm:**
1. Fixed reference column width based on viewport breakpoints:
   - Mobile (≤640px): 32px (ultra-compact)
   - Tablet (640-768px): Dynamic calculation with 6% viewport ratio
   - Tablet portrait (768-1024px): 56px (matches CSS breakpoint)
   - Desktop portrait (>1024px): 60px (comfortable)

2. Standard column width calculation:
   - Remaining space = (viewport width - 20px margin - reference width)
   - Standard width = remaining space ÷ 2 (always divide by 2 for consistency)
   - Additional columns use same width and scroll horizontally

3. Compression logic when base setup doesn't fit:
   - Ensures minimum 80px readability threshold
   - Compresses both reference and main columns proportionally

**Output:** Adaptive widths object with pixel values for all column types

#### File: `client/src/hooks/useResponsiveColumns.ts`

**Purpose:** General responsive configuration for all screen sizes and orientations

**Key Features:**
1. Window size monitoring with resize event listeners
2. Intelligent column width calculation based on screen dimensions
3. Portrait vs landscape optimization
4. Touch device detection for mobile-specific adjustments
5. Horizontal scrolling configuration

**Calculation Strategy:**
- **Portrait Mode:** Maximizes available width utilization (95% small screens, 90% medium)
- **Landscape Mode:** Comfortable spacing with proportional column distribution
- **Mobile Optimization:** Ultra-compact layouts with essential column prioritization

#### File: `client/src/hooks/useAdaptiveWidths.ts`

**Purpose:** CSS-first approach setting global width variables

**Implementation:**
```javascript
const vw = window.innerWidth;
const refW = 72; // Synchronized with CSS --ref-w
root.style.setProperty("--vw-free", `${vw - refW}px`);
```

**Event Handling:** Responds to window resize and orientation change events

#### File: `client/src/hooks/useReferenceColumnWidth.ts`

**Purpose:** Monitors reference column width and applies thin column styling

**Key Functionality:**
1. Reads `--adaptive-ref-width` CSS variable
2. Applies `reference-column-thin` body class when width ≤60px
3. Adds `data-width-thin` attribute to reference cells
4. Uses event-driven updates with polling fallback
5. Automatic cleanup on component unmount

## 3. State Management and Data Flow

### File: `client/src/App.tsx` - Zustand Store

**Column State Interface:**
```typescript
interface ColumnInfo {
  slot: number;
  visible: boolean;
  widthRem: number;
  displayOrder: number;
}

interface ColumnState {
  columns: ColumnInfo[];
  setVisible: (slot: number, visible: boolean) => void;
  reorder: (from: number, to: number) => void;
  resize: (slot: number, deltaRem: number) => void;
}
```

**Store Properties:**
- `columns`: Array of column configuration objects
- `setVisible`: Toggle column visibility
- `reorder`: Drag-and-drop reordering functionality  
- `resize`: Dynamic column resizing
- `fixedColumns` / `navigableColumns`: Column categorization for layout logic

### File: `client/src/hooks/useColumnChangeSignal.ts`

**Purpose:** Event system for column layout changes

**Event Types:**
- `width`: Column width modifications
- `visibility`: Show/hide columns
- `order`: Drag-and-drop reordering
- `multiplier`: Presentation mode scaling

**Implementation:**
- Singleton pattern with EventTarget
- Custom event dispatching with timestamps
- Cleanup function for memory management
- Decoupled communication between components

### File: `client/src/hooks/useMeasureVisibleColumns.ts`

**Purpose:** Dynamic calculation of visible columns based on container width

**Key Logic:**
1. ResizeObserver monitors container dimensions
2. Mobile portrait optimization (limit to essential columns on ≤480px)
3. Desktop/landscape mode shows all columns with horizontal scroll
4. Filters columns by minimum width thresholds (30px fixed, 100px navigable)
5. Updates `visibleCount` state for virtual scrolling optimization

## 4. Column Header Rendering and Interaction

### File: `client/src/components/bible/NewColumnHeaders.tsx`

**Key Features:**

**Drag-and-Drop System:**
- Uses `@dnd-kit/core` and `@dnd-kit/sortable`
- Horizontal list sorting strategy
- Touch and keyboard accessibility support
- Visual drag overlay with opacity effects

**Width Calculation Function:**
```typescript
const getResponsiveWidth = (column: SimpleColumn): string => {
  const adaptiveVar = `--adaptive-${column.type.replace('-', '-')}-width`;
  return `calc(var(${adaptiveVar}) * var(--column-width-mult, 1))`;
}
```

**Sticky Positioning:**
- Reference column always sticky left (z-index: 30)
- Scrollable header container for overflow columns
- Synchronized horizontal scroll with table body
- Centering logic for content that fits in viewport

**Presentation Mode Toggle:**
- Column width multiplier controls (1x, 1.5x, 2x)
- CSS variable updates for real-time scaling
- Visual preset buttons with user feedback

**Column Visibility Controls:**
- Translation selection dropdowns
- Toggle switches for feature columns (notes, prophecy, cross-refs)
- Guest mode restrictions enforcement

## 5. Virtual Row Rendering System

### File: `client/src/components/bible/VirtualRow.tsx`

**Column Cell Generation:**
```typescript
// Dynamic column creation based on visible configuration
{visibleColumns.map((config) => (
  <div
    key={config.id}
    style={{
      width: getResponsiveColumnPixelWidth(config.id, config.type),
      minWidth: getResponsiveColumnPixelWidth(config.id, config.type),
      maxWidth: getResponsiveColumnPixelWidth(config.id, config.type)
    }}
    className="flex-shrink-0 border-r"
    data-col-key={config.id}
  >
    <ColumnCell verse={verse} config={config} />
  </div>
))}
```

**Width Synchronization:**
- Uses same `getResponsiveColumnPixelWidth` function as headers
- CSS calc() expressions with adaptive variables
- Consistent application of `--column-width-mult` scaling

**Column Types and Content:**
- **Reference:** Verse reference with click navigation
- **Translation:** Bible text with Strong's concordance integration
- **Cross-Reference:** Related verses with full text display
- **Prophecy:** Three-column P/F/V (Prediction/Fulfillment/Verification)
- **Notes:** User-created annotations with rich text
- **Context:** Boundary markers and grouping indicators
- **Hybrid:** All-in-one comprehensive verse data

## 6. Specialized Column Components

### File: `client/src/components/bible/ProphecyColumns.tsx`

**Three-Column Layout:**
```typescript
// Separate P, F, V columns with responsive widths
<div style={{ width: 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))' }} 
     className="flex-shrink-0 border-r p-2 overflow-y-auto">
  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">Prediction</div>
  {/* Prophecy content */}
</div>
```

**Data Loading:**
- Dynamic prophecy data fetching based on verse keys
- Prophecy index lookup for comprehensive data
- Loading states with Holy Book spinners
- Error handling and fallback content

### File: `client/src/components/bible/MasterColumnPanel.tsx`

**Floating Panel Design:**
- Fixed positioning (top-right corner)
- Comprehensive verse context display
- Integration with HybridCell component
- Responsive height with scroll overflow

## 7. CSS Styling and Responsive Design

### File: `client/src/styles/column-headers-scrollbar-fix.css`

**Scrollbar Management:**
```css
.column-headers-wrapper,
.column-headers-inner,
.column-headers-container {
  overflow-x: auto !important;
  overflow-y: hidden !important;
  scrollbar-width: none !important; /* Firefox */
  -ms-overflow-style: none !important; /* IE/Edge */
}
```

**Purpose:** Clean header appearance without visible scrollbars while maintaining scroll functionality

### Breakpoint-Responsive Variables

**Mobile Overrides:**
```css
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

## 8. Column Width Change Detection and Adaptation

### Width Monitoring System

**Reference Column Thin Mode:**
- Threshold: ≤60px triggers thin styling
- Body class application: `reference-column-thin`
- Cell data attributes: `data-width-thin="true"`
- Text rotation and compact layout adjustments

**Event-Driven Updates:**
- Column change signal system prevents polling overhead
- Resize event handling with debounced updates
- Orientation change detection for mobile devices
- Fallback polling (2-second interval) for reliability

### Presentation Mode Integration

**Scaling Multiplier System:**
- User-controlled scaling via `--column-width-mult`
- Real-time CSS variable updates
- Consistent application across headers and cells
- Preset scaling options (1x, 1.5x, 2x)

## 9. Helper Functions and Utilities

### Column Layout Management

**`getColumnByType(type: string)`:** Retrieves column configuration by type
**`getColumnById(id: string)`:** Retrieves column configuration by ID
**`getVisibleColumns(preferences, isGuest)`:** Filters columns based on user preferences and access level
**`getColumnWidth(column, isMobile)`:** Converts Tailwind classes to CSS calc() expressions
**`getTranslationSlots(activeTranslations)`:** Maps translation codes to column slots
**`getDataRequirements(visibleColumns)`:** Determines data loading requirements

### Width Conversion System

**Tailwind to CSS Mapping:**
```typescript
const widthMap: Record<string, string> = {
  'w-6': '1.5rem',
  'w-20': '5rem', 
  'w-52': '13rem',
  'w-80': '20rem',
  'w-64': '16rem',
  'w-72': '18rem',
  'w-full': '100%'
};
```

**Scaling Application:**
```typescript
if (remValue.includes('rem')) {
  return `calc(${remValue} * var(--column-width-mult))`;
}
```

## 10. Performance Optimizations

### Virtual Scrolling Integration
- Column visibility affects virtual scrolling buffer calculations
- Mobile-specific column limiting for performance
- Essential column filtering on small screens (≤480px)
- Dynamic column count adjustments based on container width

### Memory Management
- Event listener cleanup in all hooks
- CSS variable cleanup on component unmount
- Efficient re-rendering with memoization
- Optimized width calculation caching

### Loading Performance
- Progressive column data loading
- Lazy loading for hidden columns
- Efficient cross-reference and prophecy data fetching
- Batch processing for multiple column updates

## 11. Accessibility and User Experience

### Keyboard Navigation
- Sortable keyboard coordinates for drag-and-drop
- Focus management during column reordering
- Accessible column visibility controls

### Touch Device Support
- Touch-optimized drag handles
- Mobile-specific width calculations
- Gesture-friendly column interactions
- Responsive scaling for touch targets

### Visual Feedback
- Loading states for all column types
- Clear visual hierarchy with appropriate spacing
- Consistent color coding for column types
- Professional typography with proper contrast

## Summary

The Biblical Research Platform's column system represents a sophisticated implementation of responsive, interactive data presentation. With 20 configurable column slots, intelligent width calculation, drag-and-drop reordering, and comprehensive mobile optimization, it provides users with a flexible and powerful interface for biblical research. The system's architecture emphasizes performance, accessibility, and user experience while maintaining the ability to scale from mobile devices to large desktop displays.

The combination of CSS variables, adaptive width calculations, virtual scrolling integration, and state management creates a robust foundation that can handle complex data visualization requirements while remaining responsive and user-friendly across all device types and orientations.