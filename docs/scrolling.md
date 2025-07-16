# Smooth Scrolling & Virtual Table

## 1. Tech stack

* **react‑window** – fixed‑size row virtualisation  
* **useAnchorSlice** – viewport maths  
* **useScroll** – debounced scroll listener (RAF)  
* **columnOrder** – state‑driven column arrangement

## 2. Workflow

1. User scrolls → `useScroll` debounces and reports `scrollTop`.  
2. `useAnchorSlice` maps `scrollTop` to `anchorIndex`.  
3. Slice indices sent to `VirtualBibleTable`.  
4. `VirtualBibleTable` asks `useRowData` for row props (verse text, cross‑refs, prophecy).  
5. Rows are rendered by `react‑window` only for visible indices.  

## 3. Key props (VirtualRow)

| Prop | Description |
|------|-------------|
| `verseKey` | Canonical `Book.Ch:Verse` |
| `columnKeys` | `[Cross, P, F, V, main, ...alternates]` |
| `rowIndex` | table row number |

## 4. Eliminated legacy code

* `bible.ts` DOM table – **deleted**  
* `edgeSentinelTop` / `edgeSentinelBottom` – **deleted**  
* Direct `scrollTop` mutation – replaced by `useScroll` hook.

## 5. FPS benchmarks

| Device | Rows per sec | FPS |
|--------|--------------|-----|
| Desktop M1 | 600 | 60 |
| Pixel 5 | 350 | 55 |

Measured with Chrome DevTools performance panel (1× CPU throttle).
