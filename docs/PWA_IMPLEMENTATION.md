Below is a fully consolidated **PWA\_IMPLEMENTATION.md**.
It merges everything that was in *pwa‑implementation‑complete.md*, *pwa‑checklist‑final‑status.md*, *service‑worker‑validation.md* and *offline‑implementation.md*, while trimming duplication and adding the latest Workbox / Dexie details.

Copy‑paste the content into `/docs/PWA_IMPLEMENTATION.md`.

---

```markdown
# PWA Implementation Guide  
*(Anointed.io – updated 17 July 2025)*

This document explains **how the application works offline**, how we build and
update the service‑worker, and which validation steps keep the PWA reliable.

---

## 1.  High‑level architecture

```

Browser
├── React app  (App.tsx)
│     │
│     └─ workbox-window\.register()
│
└─ Service Worker  (dist/sw\.js, auto‑generated)
│
├─ Precaching  (shell assets via Workbox precache manifest)
├─ Runtime    ▼
│   • CacheFirst  →  translations/*.txt
│   • CacheFirst  →  references/cf*.txt   (byte‑range OK)
│   • StaleWhileRevalidate → prophecy\_rows.json, offsets JSON
│   • NetworkOnly          → Supabase auth / RPC
│
└─ Background Sync
queueSync.ts  ⇆  Dexie  ⇆  Supabase RPC

````

* **vite-plugin‑pwa** emits both the precache manifest and the Workbox
  run‑time routes at build time (`npm run build`).

---

## 2.  Service‑worker details

| Feature | Setting | Rationale |
|---------|---------|-----------|
| Scope   | `/` | Covers every route, incl. `/auth/callback` |
| Strategy – shell HTML | **NetworkFirst** (maxAge 24 h), fallback to precache | Guarantees fresh build after deploy |
| Strategy – `translations/*.txt` | **CacheFirst**, `maxEntries: 20`, `maxAge: 30 days` | 12 translations ≈ 45 MB => fits disk quota |
| Strategy – cf / prophecy / offsets | **StaleWhileRevalidate**, `maxAge 30 days` | small JSON / TSV files; keep them fresh |
| Strategy – strongs slices | **NetworkOnly** (no SW cache) | single‑use, very large corpus |
| Background Sync queue | `anointed_sync_queue`, retention 48 h | offline notes/bookmarks replay |
| SW update flow | `workbox-window` `await SW.register…`, then <br>`SW.addEventListener("waiting", showUpdateToast)` | user sees *“Update available”* toast; hard‑reload calls `SKIP_WAITING` |

---

## 3.  Offline data layer

* **Dexie DB** (`offline/offlineDB.ts`)  
  ```ts
  tables = {
    queued_mutations: '++id, action, payload, created_at',
    bookmarks        : 'id, verseKey, colour, updated_at',
    highlights       : 'id, verseKey, range, colour, updated_at',
    notes            : 'id, verseKey, body, updated_at'
  }
````

* **queueSync.ts**

  1. On `"online"` or when SW fires `sync` event, pull all rows from
     `queued_mutations`.
  2. Group by action; batch RPC call `bulk_sync`.
  3. On success, delete processed rows; on failure leave them for next cycle.

No scripture text is stored in IndexedDB, keeping quota low.

---

## 4.  Build / development integration

| Command           | What happens                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `npm run dev`     | Vite dev server **without** SW (HMR)                                                                  |
| `npm run build`   | vite‑plugin‑pwa generates<br>`dist/sw.js` & precache manifest                                         |
| `npm run preview` | Serves `/dist`, SW active                                                                             |
| GitHub CI         | `npm run lint && npm run bundle-check && npm run test:cypress`<br>Bundle check fails if > 2 MB (gzip) |

---

## 5.  Validation & QA checklist

| Scenario                       | Manual / automated test                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| First load (online)            | Lighthouse PWA score ≥ 92                                                                |
| Hot deploy                     | `curl -I /sw.js` shows new `ETag`; page shows *Update available* toast                   |
| Offline first                  | Enable DevTools *Offline* → reload.<br>App must render Genesis 1:1 within 2 s from cache |
| Add note offline               | DevTools *Offline*, add note → stored in Dexie (`queued_mutations.length +1`)            |
| Re‑connect                     | Toggle online → note flushed to Supabase in ≤ 3 s                                        |
| Translation cache eviction     | Open > 12 translations → oldest LRU removed from SW cache (`CacheStorage` inspector)     |
| Cypress `offline.spec.ts`      | Automates the four user flows above                                                      |
| `service-worker-validation.sh` | Greps bundle for **raw `caches.open`** or **fetch `no-cors`** misuse                     |

---

## 6.  Maintenance guidelines

1. **Adding a new translation**

   * Upload `translations/ABC.txt` to Supabase.
   * No SW change required; route pattern `translations/*.txt` already covers it.
2. **Changing caching rules**

   * Edit `vite.config.pwa.ts` Workbox `runtimeCaching[]`.
   * Bump `CACHE_VERSION` constant to invalidate old entries.
3. **Quota watch**

   * Translation cache ≤ 75 MB after eviction (`maxEntries: 20`).
   * Dexie + IDB quota alert at 90 MB: prompt user to clear offline data.
4. **Background Sync support**

   * If Safari iOS lacks SyncManager, queueSync falls back to “flush at
     startup” – keep dexie retention ≤ 48 h to avoid bloat.

---

## 7.  Quick FAQ

| Question                           | Answer                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| “Why CacheFirst for translations?” | They are immutable; version change triggers new build & new URL.               |
| “Why not cache strongs\*.txt?”     | 70 MB per file; users rarely open interlinear overlay.                         |
| “Do we precache translations?”     | **No** – initial bundle stays < 2 MB; translations load on‑demand.             |
| “How do we force an SW update?”    | Run `npm run build`, deploy; page gets new `sw.js` hash; click *Update* toast. |

---

*Maintainers: update this doc whenever you touch `vite.config.pwa.ts`,
`queueSync.ts`, or change Workbox cache rules.*

```

---