# Anchor‑Centred Loading (2025‑07)

The table renders only the verses surrounding the viewport centre (“anchor”) plus a small buffer, keeping DOM nodes ≤ 250 and memory flat on long scrolls.

## 1. Key pieces

| Module | Responsibility |
|--------|----------------|
| `hooks/useAnchorSlice.ts` | Calculates `anchorIndex` + `{ start, end }` slice for current scroll. |
| `hooks/useSliceDataLoader.ts` | For the active slice:<br>• Ensures **main + alternate** verse text is in the master cache.<br>• Requests cross‑ref offsets & prophecy rows, then posts to workers.<br>• Prefetches the next slice if user scroll velocity > 1500 px/s. |
| `store/translationSlice.ts` | Holds `anchorIndex` and triggers re‑render when it changes. |
| `components/VirtualBibleTable.tsx` | Subscribes to slice via `useAnchorSlice`; renders rows with `react‑window`. |

## 2. Data flow

scroll event
└─▶ useAnchorSlice ──▶ {anchorIndex, slice}
└─▶ useSliceDataLoader
⇢ BibleDataAPI.getTranslation()
⇢ BibleDataAPI.getCfOffsets()
⇢ BibleDataAPI.getProphecy()

## 3. No more “edge sentinels”

The old sentinel `<div>` markers were removed. Slice changes are detected by comparing `newAnchorIndex !== prevAnchorIndex` on each `onScroll` tick.

## 4. Performance guardrails

| Metric | Target | Current |
|--------|--------|---------|
| Rows mounted | ≤ 250 | 220 |
| Network calls / 5 s scroll | ≤ 20 | 14 |
| Heap delta after 10 k rows | ≤ 3 MB | 2.1 MB |

All numbers verified in `cypress/e2e/scroll.spec.ts`.
