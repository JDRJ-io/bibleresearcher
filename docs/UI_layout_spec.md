Here is a ready‑to‑drop **UI Architecture document** for your repository.
Save it as `docs/UI_LAYOUT_SPEC.md` (or any location you prefer).

---

# UI Layout & Sizing Architecture

**Note**: For the authoritative column track system, see [columns.md](./columns.md) and [column-system-implementation.md](./column-system-implementation.md) for concepts and implementation details.

*(Anointed.io virtual Bible table – July 2025)*

## 1  Purpose

This document defines the **column‑based layout model** that drives every page
of the application across phone, tablet and desktop environments.
It specifies slot positions, sizing logic, scrolling rules, and the user
controls that modify the view.

---

## 2  Column slots (“game‑board”)

**⚠️ LEGACY TABLE** - The slot mapping below is outdated. For current slot assignments and the authoritative track system, see [columns.md](./columns.md).


|  Slot # | Column               | Data source                 | Sticky header text | Default visible |
| ------: | -------------------- | --------------------------- | ------------------ | --------------- |
|       0 | **Reference**        | `verse.reference`           | `Ref`              | ✔               |
|       1 | **Notes**            | `userNotes[ref]`            | `Notes`            | ✖               |
|       2 | **Main translation** | `getVerseText(ref, main)`   | user’s main code   | ✔               |
|       3 | **Cross References** | `crossRefs[ref][]`          | `Cross References` | ✔               |
|       4 | **Context**            | `verse.context[]`             | `Context`             | ✖               |
|  5 – 16 | **Alt T₁ … T₁₂**     | `getVerseText(ref, altTid)` | alt code           | ✖               |
|      17 | **Prediction P**     | `prophecies[ref].P[]`       | **P**              | ✖               |
|      18 | **Fulfilment F**     | `prophecies[ref].F[]`       | **F**              | ✖               |
|      19 | **Verification V**   | `prophecies[ref].V[]`       | **V**              | ✖               |

All run‑time actions (toggle, drag, resize) mutate a Zustand store:

```ts
interface ColumnState {
  columns: { slot: number; visible: boolean; widthRem: number }[];
  setVisible(slot: number, v: boolean): void;
  reorder(from: number, to: number): void;      // drag‑and‑drop
  resize(slot: number, deltaRem: number): void; // unlock‑resize
}
```

---

## 3  Sizing model

### 3.1 Device base (CSS)

```css
@media (max-width: 639px)  { :root { --baseRem: .875rem; --baseColW: 420px; } }
@media (min-width: 640px) and (max-width: 1023px)
                            { :root { --baseRem: 1rem;   --baseColW: 480px; } }
@media (min-width: 1024px) { :root { --baseRem: 1.125rem; --baseColW: 520px; } }
:root { --sizeMult: 1; }              /* M = 1.00 by default */

html { font-size: calc(var(--baseRem) * var(--sizeMult)); }
.w-col { width:  calc(var(--baseColW) * var(--sizeMult)); }
```

### 3.2 User size presets

| Preset | `--sizeMult` |
| ------ | ------------ |
| **S**  | 0.85         |
| **M**  | 1.00         |
| **L**  | 1.35         |
| **XL** | 1.70         |

The Size menu sets the variable and persists it in `localStorage`.

---

## 4  Layout & scrolling behaviour

* **One global scroll container** (`.bible-table-wrapper overflow-auto`).
* Gesture logic (touch / wheel):

  * Horizontal scroll is enabled only when |dx| > |dy| × 1.2.
  * Otherwise vertical scroll (`touch-action: pan-y`).
* **Centering rule**
  If `visibleColumns ≤ 3` ➜ wrap table in `.center-wrapper { display:flex; justify-content:center }`.
* **Sticky headers**
  Every `<th>` uses `position: sticky; top: 0;` and `class="w-col"`.
* **No row stacking** – rows are virtualised but remain single‑line items.

---

## 5  User controls

| Control                  | Effect                                   | Persistence                |
| ------------------------ | ---------------------------------------- | -------------------------- |
| **Size S/M/L/XL**        | sets `--sizeMult`                        | `localStorage`             |
| **Column visibility**    | toggles `visible` in `ColumnState`       | Supabase `userPreferences` |
| **Unlock drag**          | enables `react-beautiful-dnd` on headers | session                    |
| **Unlock resize**        | shows resize handle; calls `resize()`    | session                    |
| **Text align (L/C/R)**   | toggles Tailwind alignment class         | `userPreferences`          |
| **Canon / Chrono order** | swaps verse key array                    | URL hash + store           |

---

## 6  Rendering snippets

### 6.1 Column loop in `VirtualRow`

```tsx
columnState.columns
  .filter(c => c.visible)
  .sort((a,b) => a.slot - b.slot)
  .map(c => renderCell(slotConfig[c.slot]));
```

### 6.2 Cross‑reference cell

```tsx
<button
   onClick={e => { e.stopPropagation(); setAnchorByRef(ref); }}
   className="flex gap-1 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-1">
   <span className="w-14 font-mono text-xs text-blue-600">{ref}</span>
   <span className="flex-1 text-xs">
      {(getVerseText(ref, main) ?? "").slice(0, 40)}…
   </span>
</button>
```

### 6.3 Prophecy P/F/V dot

```tsx
const dotColor = { P:'bg-blue-500', F:'bg-green-500', V:'bg-purple-500' };
{ list.length>0 && (
   <span title={`${list.length} ${type} refs`}
         className={`h-2.5 w-2.5 rounded-full ${dotColor[type]}`} />
)}
```

---

## 7  Implementation roadmap

1. **Add CSS bases & `.w-col`**.
2. Introduce `ColumnState` with default visibility/config.
3. Update `VirtualBibleTable` & `VirtualRow` to use store for width/order.
4. Implement Size menu + column toggles in HamburgerMenu.
5. Optional unlocks: drag, resize.
6. Integrate Prophecy columns & Strong’s overlay.

---