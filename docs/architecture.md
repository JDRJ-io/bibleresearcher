Corrected Architecture

## 2. Corrected **File Connections & Functions Map**  (2025‑07‑16)

### 2.1 Single Supabase façade

| Module                 | Key exports                                                                                                                           | Reads from                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `data/BibleDataAPI.ts` | `getTranslation`, `getCfOffsets`, `getCrossRefSlice`, `getProphecy`, `getStrongsOffsets`, `saveNote`, `saveHighlight`, `saveBookmark` | Supabase storage `anointed/*` |

*Holds the **master LRU verse cache**, size‑limited to 12 translations.*

### 2.2 Active Workers

* `translationWorker.js` – parse translation buffer
* `searchWorker.js` – fuzzy search
* `crossReferencesWorker.ts` – postMessage in/out; no fetch

### 2.3 State Stores

* `store/translationSlice.ts` – `main`, `alternates`, `columnOrder`, `anchorIndex`
* `hooks/useBibleData.ts` – slice‑indexed verse selectors (reads master cache)
* Dexie (`offline/offlineDB.ts`) – only user data (bookmarks, highlights, queued\_mutations)

### 2.4 UI Flow

```
App → BiblePage
    → VirtualBibleTable → VirtualRow / ProphecyColumns
    → HamburgerMenu → TranslationSelector
    → ExpandedVerseOverlay (portal)
```

### 2.5 Guardrails

* ESLint custom rule: **no `fetch(` outside BibleDataAPI**
* `validate-architecture.sh`: fails on `/api/references` strings
* `bundle-check.js`: gzipped build < 2 MB

---

## 3. Updated **Directory Layout**

```
client/
├── components/
│   └── bible/
│       ├── VirtualBibleTable.tsx
│       ├── VirtualRow.tsx
│       ├── VerseRow.tsx
│       ├── ProphecyColumns.tsx
│       ├── TranslationSelector.tsx
│       ├── HamburgerMenu.tsx
│       └── ExpandedVerseOverlay.tsx
├── hooks/
│   ├── useAnchorSlice.ts
│   ├── useRowData.ts
│   ├── useEnsureTranslationLoaded.ts
│   ├── useTranslationMaps.ts
│   └── … (scroll, onlineStatus, queueSync)
├── store/
│   └── translationSlice.ts
├── data/
│   └── BibleDataAPI.ts
├── workers/
│   ├── translationWorker.js
│   ├── searchWorker.js
│   └── crossReferencesWorker.ts
├── offline/
│   ├── offlineDB.ts
│   └── queueSync.ts
└── lib/
    ├── supabaseClient.ts
    ├── queryClient.ts
    └── utils.ts
```

*(No `server/` directory, no `supabaseLoader.ts`, no `BibleDataProvider.tsx`)*

---

## 4. State & Data Flow (final)

```mermaid
graph TD
    Scroll[useAnchorSlice] --> Table[VirtualBibleTable]
    Table -->|slice| Loader[useSliceDataLoader]
    Loader -->|verses| VerseCache[BibleDataAPI master cache]
    Loader -->|postMessage| Worker[crossReferencesWorker]
    Worker -->|refs array| Table

    subgraph User Data (Dexie)
        Bookmarks-->QueueSync[useQueueSync]
        Highlights-->QueueSync
    end

    QueueSync -->|Supabase RPC| BibleDataAPI
```

---

## 5. What’s still missing / optional

1. **Strong’s Overlay** – UI not hooked up to new `getStrongsOffsets()`.
2. **Sentry / LogRocket** – no runtime error telemetry.
3. **Keyboard a11y for draggable headers**.
4. **Prefetch next slice** to hide skeletons on fast scroll jumps.

---

### Conclusions

* All mandatory runtime data now loads exclusively from Supabase Storage.
* Redundant caches, Express server references, and legacy components have been removed.
* Memory and bundle size meet the architecture targets.

If the Strong’s module and telemetry are lower‑priority, the current setup is production‑ready for fast, correct loading.
