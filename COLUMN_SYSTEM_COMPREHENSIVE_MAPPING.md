# Column System Comprehensive Function Mapping
*Complete interconnection analysis of column-related functions and their governance*

---

## Table of Contents
1. [Core Function Registry](#core-function-registry)
2. [Data Flow Architecture](#data-flow-architecture)
3. [Function Interdependency Matrix](#function-interdependency-matrix)
4. [State Management Flows](#state-management-flows)
5. [Integration Points Mapping](#integration-points-mapping)
6. [Execution Chain Analysis](#execution-chain-analysis)
7. [Dependency Graph](#dependency-graph)

---

## Core Function Registry

### 🏗️ **Core Definition Functions**
| Function | Source File | Governs | Returns | Dependencies |
|----------|-------------|---------|---------|--------------|
| `COLUMN_LAYOUT` | `client/src/constants/columnLayout.ts` | Master column definitions (12 slots) | `ColumnSlot[]` | None (static) |
| `getColumnByType(type)` | `client/src/constants/columnLayout.ts` | Column retrieval by type | `ColumnSlot \| undefined` | `COLUMN_LAYOUT` |
| `getColumnById(id)` | `client/src/constants/columnLayout.ts` | Column retrieval by ID | `ColumnSlot \| undefined` | `COLUMN_LAYOUT` |
| `getVisibleColumns(prefs, isGuest)` | `client/src/constants/columnLayout.ts` | Column visibility filtering | `ColumnSlot[]` | `COLUMN_LAYOUT` |
| `getColumnWidth(column, isMobile)` | `client/src/constants/columnLayout.ts` | Tailwind → CSS conversion | `string` | `COLUMN_LAYOUT` |
| `getTranslationSlots(translations)` | `client/src/constants/columnLayout.ts` | Translation mapping to slots | `ColumnSlot[]` | `COLUMN_LAYOUT` |
| `getDataRequirements(columns)` | `client/src/constants/columnLayout.ts` | Data loading requirements | `DataRequirements` | `COLUMN_LAYOUT` |

### 📐 **Width Calculation Functions**
| Function | Source File | Governs | Returns | Dependencies |
|----------|-------------|---------|---------|--------------|
| `useResponsiveColumns()` | `client/src/hooks/useResponsiveColumns.ts` | Screen-aware column config | `ResponsiveColumnConfig` | `window` events |
| `calculateOptimalWidths()` | `client/src/hooks/useResponsiveColumns.ts` | Portrait/landscape width calc | `ColumnPixelWidths` | `windowSize` |
| `useAdaptivePortraitColumns()` | `client/src/hooks/useAdaptivePortraitColumns.ts` | Portrait 3-column layout | `AdaptivePortraitConfig` | `window` events |
| `calculatePrecisionPortraitWidths()` | `client/src/hooks/useAdaptivePortraitColumns.ts` | Exact portrait calculations | `AdaptiveWidths` | viewport dimensions |
| `updateCSSVariables()` | `client/src/hooks/useAdaptivePortraitColumns.ts` | CSS var synchronization | `void` | `adaptiveWidths` |
| `getColumnPixelWidth(rem)` | `client/src/utils/columnWidth.ts` | Rem → pixel conversion | `string` | None |
| `getSlotWidth(state, slot)` | `client/src/utils/columnWidth.ts` | State-based width lookup | `string` | `columnState` |
| `getRemToTailwindClass(rem)` | `client/src/utils/columnWidth.ts` | Rem → Tailwind mapping | `string` | None |

### 🎛️ **State Management Functions**
| Function | Source File | Governs | Returns | Dependencies |
|----------|-------------|---------|---------|--------------|
| `useColumnChangeSignal(callback)` | `client/src/hooks/useColumnChangeSignal.ts` | Change event listening | `void` | `ColumnChangeSignal` |
| `useColumnChangeEmitter()` | `client/src/hooks/useColumnChangeSignal.ts` | Change event emission | `EmitFunction` | `ColumnChangeSignal` |
| `ColumnChangeSignal.emit(type, data)` | `client/src/hooks/useColumnChangeSignal.ts` | Event broadcasting | `void` | `EventTarget` |
| `ColumnChangeSignal.listen(callback)` | `client/src/hooks/useColumnChangeSignal.ts` | Event subscription | `CleanupFunction` | `EventTarget` |
| `useMeasureVisibleColumns(container)` | `client/src/hooks/useMeasureVisibleColumns.ts` | Viewport fitting calculation | `void` | `ResizeObserver`, `useBibleStore` |
| `updateVisibleCount()` | `client/src/hooks/useMeasureVisibleColumns.ts` | Column count calculation | `void` | `fixedColumns`, `navigableColumns` |

### 📱 **Responsive & Monitoring Functions**
| Function | Source File | Governs | Returns | Dependencies |
|----------|-------------|---------|---------|--------------|
| `useReferenceColumnWidth()` | `client/src/hooks/useReferenceColumnWidth.ts` | Reference column styling | `void` | CSS variables |
| `monitorReferenceWidth()` | `client/src/hooks/useReferenceColumnWidth.ts` | Width threshold detection | `void` | `--adaptive-ref-width` |
| `useColumnData()` | `client/src/hooks/useColumnData.ts` | Data loading triggers | `Object` | `useBibleStore` |
| `loadProphecyData()` | `client/src/hooks/useColumnData.ts` | Prophecy data loading | `Promise<void>` | `prophecyCache` |

### 🔄 **Navigation & Scrolling Functions**
| Function | Source File | Governs | Returns | Dependencies |
|----------|-------------|---------|---------|--------------|
| `makeColumnScroller(opts)` | `client/src/utils/scrollNav.ts` | Synchronized scrolling | `ScrollerInstance` | DOM elements |
| `getStickyLeftPx(headerEl)` | `client/src/utils/scrollNav.ts` | Sticky column calculation | `number` | Header DOM |
| `measureLefts(headerEl, keys, sticky)` | `client/src/utils/scrollNav.ts` | Column position mapping | `ColumnMeasurement[]` | DOM measurements |
| `step(direction)` | `client/src/utils/scrollNav.ts` | Column navigation | `void` | `snapshot()` |
| `getVisibleRange()` | `client/src/utils/scrollNav.ts` | Viewport range detection | `VisibleRange` | `snapshot()` |
| `computeVisibleRangeDynamic(params)` | `client/src/utils/columnLayout.ts` | Dynamic range calculation | `LayoutResult` | `LayoutParams` |

### 🎨 **Rendering Functions**
| Function | Source File | Governs | Returns | Dependencies |
|----------|-------------|---------|---------|--------------|
| `NewColumnHeaders()` | `client/src/components/bible/NewColumnHeaders.tsx` | Header rendering | `JSX.Element` | Multiple hooks |
| `VirtualRow()` | `client/src/components/bible/VirtualRow.tsx` | Row rendering | `JSX.Element` | `columnData` |
| `ReferenceCell()` | `client/src/components/bible/VirtualRow.tsx` | Reference cell rendering | `JSX.Element` | `verse` |
| `CrossReferencesCell()` | `client/src/components/bible/VirtualRow.tsx` | Cross-ref cell rendering | `JSX.Element` | `crossRefs` store |
| `TranslationCell()` | `client/src/components/bible/VirtualRow.tsx` | Translation cell rendering | `JSX.Element` | `getVerseText` |
| `renderSlot(column)` | `client/src/components/bible/VirtualRow.tsx` | Dynamic slot rendering | `JSX.Element` | `visibleColumns` |
| `ColumnNavigationArrows()` | `client/src/components/bible/ColumnNavigationArrows.tsx` | Navigation UI | `JSX.Element` | `makeColumnScroller` |

---

## Data Flow Architecture

### 🔄 **Primary Data Flows**

#### **1. Column Definition Flow**
```
COLUMN_LAYOUT (static) 
    ↓
getVisibleColumns(preferences, isGuest)
    ↓
buildActiveColumns() [useBibleStore]
    ↓
VirtualRow.renderSlot() / NewColumnHeaders.render()
```

#### **2. Width Calculation Flow**
```
Window Resize Event
    ↓
useResponsiveColumns() → calculateOptimalWidths()
    ↓
useAdaptivePortraitColumns() → calculatePrecisionPortraitWidths()
    ↓
updateCSSVariables() → CSS Custom Properties
    ↓
getColumnWidth() / getSlotWidth()
    ↓
Component Styling (headers & cells)
```

#### **3. Change Propagation Flow**
```
User Action (resize, toggle, reorder)
    ↓
useColumnChangeEmitter() → ColumnChangeSignal.emit()
    ↓
useColumnChangeSignal() listeners
    ↓
[useReferenceColumnWidth, useMeasureVisibleColumns, etc.]
    ↓
Component Re-renders
```

#### **4. Visibility Calculation Flow**
```
Container Resize
    ↓
useMeasureVisibleColumns() → updateVisibleCount()
    ↓
fixedColumns + navigableColumns calculation
    ↓
setVisibleCount() [useBibleStore]
    ↓
Component visibility updates
```

#### **5. Navigation Flow**
```
Arrow Click
    ↓
ColumnNavigationArrows → makeColumnScroller
    ↓
step(-1 | 1) → snapshot() → measureLefts()
    ↓
scrollTo() → Synchronized header/body scroll
```

---

## Function Interdependency Matrix

### 🔗 **Direct Dependencies**

| Function | Directly Depends On | Used By |
|----------|-------------------|---------|
| `getVisibleColumns()` | `COLUMN_LAYOUT` | `NewColumnHeaders`, `VirtualRow`, `buildActiveColumns` |
| `calculateOptimalWidths()` | `windowSize` | `useResponsiveColumns` |
| `calculatePrecisionPortraitWidths()` | `viewportWidth`, `viewportHeight` | `useAdaptivePortraitColumns` |
| `updateCSSVariables()` | `adaptiveWidths` | `useAdaptivePortraitColumns` |
| `monitorReferenceWidth()` | `--adaptive-ref-width` CSS var | `useReferenceColumnWidth` |
| `updateVisibleCount()` | `fixedColumns`, `navigableColumns`, `columnWidthsPx` | `useMeasureVisibleColumns` |
| `makeColumnScroller()` | `headerEl`, `bodyEl`, `navigableKeys` | `ColumnNavigationArrows` |
| `renderSlot()` | `visibleColumns`, `columnData` | `VirtualRow` |
| `step()` | `snapshot()`, `currentIndex()` | `makeColumnScroller` |
| `loadProphecyData()` | `showProphecies` flag | `useColumnData` |

### 🌐 **Transitive Dependencies**

| Function | Transitively Depends On | Through |
|----------|----------------------|---------|
| `NewColumnHeaders` | `COLUMN_LAYOUT` | `getVisibleColumns` → `buildActiveColumns` |
| `VirtualRow` | `windowSize` | `useResponsiveColumns` → `calculateOptimalWidths` |
| `ColumnNavigationArrows` | `fixedColumns`, `navigableColumns` | `buildActiveColumns` → `useBibleStore` |
| `monitorReferenceWidth` | `viewportWidth`, `viewportHeight` | `useAdaptivePortraitColumns` → `updateCSSVariables` |
| `updateVisibleCount` | `COLUMN_LAYOUT` | `fixedColumns` → `buildActiveColumns` → `getVisibleColumns` |

---

## State Management Flows

### 📊 **Store Integration Points**

#### **useBibleStore Connections**
| Store Property | Connected Functions | Purpose |
|----------------|-------------------|---------|
| `fixedColumns` | `useMeasureVisibleColumns`, `ColumnNavigationArrows` | Column visibility tracking |
| `navigableColumns` | `useMeasureVisibleColumns`, `ColumnNavigationArrows` | Navigation scope |
| `columnWidthsPx` | `useMeasureVisibleColumns`, `getSlotWidth` | Width state management |
| `showCrossRefs` | `useColumnData`, `getVisibleColumns` | Cross-reference visibility |
| `showProphecies` | `useColumnData`, `getVisibleColumns` | Prophecy column visibility |
| `showNotes` | `getVisibleColumns`, `NewColumnHeaders` | Notes column visibility |
| `columnOffset` | `computeVisibleRangeDynamic`, `ColumnNavigationArrows` | Scroll position |
| `visibleCount` | `setVisibleCount`, viewport calculations | Fitted column count |

#### **CSS Variable Synchronization**
| CSS Variable | Source Function | Target Components |
|--------------|-----------------|-------------------|
| `--adaptive-ref-width` | `updateCSSVariables` | `getColumnWidth`, `monitorReferenceWidth` |
| `--adaptive-main-width` | `updateCSSVariables` | `getColumnWidth`, component styling |
| `--adaptive-cross-width` | `updateCSSVariables` | `getColumnWidth`, component styling |
| `--column-width-mult` | User controls | `getColumnWidth`, `NewColumnHeaders` |
| `--w-ref`, `--w-main`, `--w-xref` | CSS media queries | Landscape mode styling |

### 🎯 **Event System Architecture**

#### **ColumnChangeSignal Event Types**
| Event Type | Triggered By | Listeners |
|------------|--------------|-----------|
| `'width'` | User resize, viewport change | `useReferenceColumnWidth` |
| `'visibility'` | Column toggle, preferences | Multiple components |
| `'order'` | Drag-and-drop reorder | `NewColumnHeaders` |
| `'multiplier'` | User width scaling | `useReferenceColumnWidth`, styling |

#### **Event Flow Chain**
```
User Action
    ↓
Component Handler
    ↓
useColumnChangeEmitter() → emit(type, data)
    ↓
ColumnChangeSignal → dispatchEvent()
    ↓
useColumnChangeSignal() → callback()
    ↓
Hook Response (width monitor, visibility update, etc.)
    ↓
Component Re-render
```

---

## Integration Points Mapping

### 🔌 **Component Integration Matrix**

#### **NewColumnHeaders Integrations**
| Integrated Function/Hook | Purpose | Data Flow |
|-------------------------|---------|-----------|
| `useTranslationMaps()` | Translation selection | `main`, `alternates` → visible columns |
| `useBibleStore()` | Store state access | Column visibility, offset, mode |
| `useAdaptivePortraitColumns()` | Width synchronization | `adaptiveWidths` → styling |
| `@dnd-kit` hooks | Drag-and-drop | `useSortable`, `arrayMove` → reordering |
| `getVisibleColumns()` | Column filtering | Preferences → displayed headers |

#### **VirtualRow Integrations**
| Integrated Function/Hook | Purpose | Data Flow |
|-------------------------|---------|-----------|
| `useResponsiveColumns()` | Responsive layout | Screen size → column config |
| `useBibleStore()` | Store access | Cross-refs, labels, notes data |
| `getVisibleColumns()` | Column filtering | Store state → rendered cells |
| `useColumnData()` | Data loading | Column toggles → data fetching |
| `renderSlot()` | Dynamic rendering | Column config → appropriate cell type |

#### **ColumnNavigationArrows Integrations**
| Integrated Function/Hook | Purpose | Data Flow |
|-------------------------|---------|-----------|
| `useBibleStore()` | Navigation scope | `buildActiveColumns` → `navigableKeys` |
| `makeColumnScroller()` | Scroll management | DOM refs → scroller instance |
| `getVisibleRange()` | Range detection | Scroll position → visibility state |

### 🏛️ **Architecture Layers**

#### **Layer 1: Core Definitions**
- `COLUMN_LAYOUT` - Master configuration
- Helper functions (`getColumnById`, `getVisibleColumns`, etc.)
- Static type definitions

#### **Layer 2: Calculation Engine**
- Width calculation hooks (`useResponsiveColumns`, `useAdaptivePortraitColumns`)
- Layout utilities (`computeVisibleRangeDynamic`)
- Conversion functions (`getColumnPixelWidth`, `getSlotWidth`)

#### **Layer 3: State Management**
- Change detection (`useColumnChangeSignal`, `useColumnChangeEmitter`)
- Store integration (`useBibleStore` connections)
- Data loading (`useColumnData`)

#### **Layer 4: Responsive Monitoring**
- Width monitoring (`useReferenceColumnWidth`, `useMeasureVisibleColumns`)
- Viewport tracking (resize observers, orientation changes)

#### **Layer 5: Navigation & Interaction**
- Scroll management (`makeColumnScroller`, navigation utilities)
- User interactions (drag-and-drop, arrow navigation)

#### **Layer 6: Rendering**
- Component rendering (`NewColumnHeaders`, `VirtualRow`)
- Cell rendering (`ReferenceCell`, `CrossReferencesCell`, etc.)
- UI synchronization

---

## Execution Chain Analysis

### ⚡ **Critical Execution Paths**

#### **1. Application Startup**
```
1. COLUMN_LAYOUT loaded (static)
2. useBibleStore() initializes store state
3. useResponsiveColumns() calculates initial config
4. useAdaptivePortraitColumns() sets portrait mode
5. updateCSSVariables() synchronizes CSS
6. useMeasureVisibleColumns() calculates initial fit
7. getVisibleColumns() filters by preferences
8. Components render with calculated dimensions
```

#### **2. Window Resize**
```
1. Window resize event fired
2. useResponsiveColumns() recalculates
3. useAdaptivePortraitColumns() updates portrait mode
4. updateCSSVariables() updates CSS vars
5. useColumnChangeEmitter() emits 'width' event
6. useReferenceColumnWidth() checks threshold
7. useMeasureVisibleColumns() recalculates fit
8. Components re-render with new dimensions
```

#### **3. Column Toggle**
```
1. User toggles column (e.g., cross-references)
2. Store state updated (showCrossRefs = true)
3. useColumnData() triggers data loading
4. getVisibleColumns() includes new column
5. buildActiveColumns() updates active list
6. useMeasureVisibleColumns() recalculates fit
7. useColumnChangeEmitter() emits 'visibility' event
8. Components re-render with new column
```

#### **4. Column Reorder (Drag & Drop)**
```
1. User initiates drag (onDragStart)
2. @dnd-kit captures drag state
3. onDragEnd event with new order
4. arrayMove() reorders columns
5. Store state updated with new order
6. useColumnChangeEmitter() emits 'order' event
7. NewColumnHeaders re-renders with new order
8. VirtualRow updates cell order
```

#### **5. Navigation (Arrow Click)**
```
1. User clicks navigation arrow
2. ColumnNavigationArrows.step() called
3. makeColumnScroller.snapshot() measures positions
4. scrollTo() calculates target position
5. Header and body scroll synchronized
6. getVisibleRange() updates visible state
7. Navigation state updated (canGoLeft/Right)
```

### 🕰️ **Performance Considerations**

#### **Optimized Execution Patterns**
- **Memoization**: `useMemo` in `useResponsiveColumns`, `useAdaptivePortraitColumns`
- **Event Debouncing**: Resize events debounced in monitoring hooks
- **Conditional Execution**: `useEffect` dependencies prevent unnecessary recalculations
- **Selective Re-rendering**: Column change signals target specific listeners

#### **Critical Performance Paths**
1. **Width Calculations**: Must complete before rendering
2. **CSS Variable Updates**: Must sync before style application
3. **Visibility Calculations**: Must complete before navigation
4. **Data Loading**: Triggered only when columns become visible

---

## Dependency Graph

### 📈 **Hierarchical Dependencies**

#### **Level 0 (Foundation)**
```
COLUMN_LAYOUT (static data)
│
├── ColumnSlot interface
├── Column type definitions
└── Static helper functions
```

#### **Level 1 (Core Utilities)**
```
getColumnByType() ←── COLUMN_LAYOUT
getColumnById() ←── COLUMN_LAYOUT
getColumnWidth() ←── COLUMN_LAYOUT
getVisibleColumns() ←── COLUMN_LAYOUT
getTranslationSlots() ←── COLUMN_LAYOUT
getDataRequirements() ←── COLUMN_LAYOUT
```

#### **Level 2 (Calculation Layer)**
```
useResponsiveColumns() ←── window events
useAdaptivePortraitColumns() ←── window events
getColumnPixelWidth() ←── mathematical conversion
getSlotWidth() ←── columnState
computeVisibleRangeDynamic() ←── layout parameters
```

#### **Level 3 (State Management)**
```
ColumnChangeSignal ←── EventTarget API
useColumnChangeSignal() ←── ColumnChangeSignal
useColumnChangeEmitter() ←── ColumnChangeSignal
useBibleStore() ←── Zustand store
```

#### **Level 4 (Monitoring & Data)**
```
useReferenceColumnWidth() ←── CSS variables + change signals
useMeasureVisibleColumns() ←── ResizeObserver + store
useColumnData() ←── store state + data APIs
updateCSSVariables() ←── calculated widths
```

#### **Level 5 (Navigation & Interaction)**
```
makeColumnScroller() ←── DOM elements + navigation keys
ColumnNavigationArrows() ←── scroller + store
measureLefts() ←── DOM measurements
step() / getVisibleRange() ←── scroller utilities
```

#### **Level 6 (Rendering)**
```
NewColumnHeaders() ←── all width/state/navigation hooks
VirtualRow() ←── all layout/data/responsive hooks
Cell components ←── specific data and styling
```

### 🔄 **Circular Dependencies (Resolved)**

#### **Resolved Through**
1. **Dynamic Imports**: `useColumnChangeSignal` imported asynchronously
2. **Event System**: Components communicate through events, not direct calls
3. **Store Mediation**: `useBibleStore` serves as state mediator
4. **CSS Variables**: Width changes propagated through CSS custom properties

#### **Dependency Inversion Points**
1. **Width Calculation**: Components depend on CSS variables, not direct function calls
2. **Change Propagation**: Listeners depend on event interface, not specific emitters
3. **Data Loading**: Hooks depend on store state, not component props
4. **Navigation**: Utilities depend on DOM structure, not specific components

---

## Summary

This column system demonstrates a **sophisticated multi-layered architecture** with:

- **28+ interconnected functions** across 15+ files
- **6 distinct architectural layers** from core definitions to rendering
- **5 primary data flows** handling definition, calculation, change propagation, visibility, and navigation
- **Complex dependency management** resolved through events, stores, and CSS variables
- **Performance optimization** through memoization, debouncing, and selective updates

The system provides **comprehensive column management** including responsive calculations, dynamic visibility, drag-and-drop reordering, synchronized scrolling, and adaptive styling while maintaining clean separation of concerns and avoiding circular dependencies.