
---

````markdown
# Architecture Overview  
*(Anointed.io – rev. 17 July 2025)*

This document gives a **one‑page “big picture”** of the application—what runs
where, which major technologies are in use, and how control flows from the
user’s scroll gesture down to Supabase Storage and back.

> For deep dives see:  
> • `FILE_CONNECTIONS_MAP.md` – source‑file call graph  
> • `DATA_STORAGE_MAP.md` – Supabase bucket & RPC inventory  
> • `UI_LAYOUT_SPEC.md` – slot‑based column grid  
> • `BEHAVIOR_CONTRACTS.md` – runtime guarantees & budgets  
> • `PWA_IMPLEMENTATION.md` – SW, offline cache, background sync

---

## 1  Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Front‑end | **React 18 + Vite + TypeScript** | Virtualised table (`react‑window`) |
| Styling | **Tailwind CSS** + shadcn/ui | CSS variables power dynamic sizing |
| State | **Zustand** + TanStack Query | Persist middleware keeps anchor |
| Background | **Web Workers** (translation, search, cross‑refs) | no network inside workers |
| Offline | **Workbox Service Worker**, **Dexie (IDB)** | CacheFirst translations, queued mutations |
| Backend | **Supabase** (Postgres + Storage + Auth) | Row‑level security; no custom Express |

---

## 2  Runtime Flow Diagram

```mermaid
graph TD
  S[User scrolls] -->|detect| A[useAnchorSlice]
  A --> B[VirtualBibleTable]
  B --> C{visible columns}
  C --> D[ColumnCells]
  D -->|main + alt| T[getVerseText()]
  D -->|cross refs| X[getCrossRefSlice()]
  D -->|prophecy| P[getProphecy()]
  T & X & P --> API[BibleDataAPI ⬅ master LRU cache]
  API -->|signed URL| Store[Supabase Storage]
````

---

## 3  Key Architectural Decisions

1. **Single façade** – all network I/O passes through `BibleDataAPI.ts`; ESLint
   forbids raw `fetch` elsewhere.
2. **Slot‑based UI grid** – columns occupy pre‑numbered slots (0–19) so new
   data types can be enabled without refactor; layout rules live in
   `UI_LAYOUT_SPEC.md`.
3. **Dual‑axis scroll guard** – custom touch handler forces either horizontal
   *or* vertical scroll per gesture (see *Behavior Contracts* A‑1 … A‑3).
4. **Immutable scripture files** – translation texts never change; SW caches
   them for 30 days with size eviction.
5. **Offline‑first user data** – Dexie stores queued mutations; Workbox
   Background Sync flushes on reconnect.

---

## 4  Directory Skeleton (top‑level)

```
src/
 ├─ components/          # UI (bible table, menus, overlays)
 ├─ hooks/               # viewport maths, data loaders
 ├─ data/                # BibleDataAPI façade
 ├─ workers/             # .js/.ts off‑thread processors
 ├─ providers/           # Zustand & context providers
 ├─ offline/             # Dexie + queueSync
 └─ lib/                 # supabaseClient, loaders, utils
docs/
 ├─ ARCHITECTURE_OVERVIEW.md  (this file)
 ├─ FILE_CONNECTIONS_MAP.md
 ├─ DATA_STORAGE_MAP.md
 ├─ UI_LAYOUT_SPEC.md
 ├─ BEHAVIOR_CONTRACTS.md
 └─ PWA_IMPLEMENTATION.md
```

---

## 5  Deployment & CI

| Stage             | Action                                                       |
| ----------------- | ------------------------------------------------------------ |
| **Build**         | `npm run build` – Vite + vite-plugin‑pwa emits `dist/`       |
| **Bundle guard**  | `scripts/bundle-check.js` fails if gzip > 2 MB               |
| **Unit tests**    | Jest (`npm run test`) – slice invariants & fetch spies       |
| **E2E tests**     | Cypress headless – anchor scroll, offline flows              |
| **Hosting**       | Supabase Static Hosting or Cloudflare Pages; SW auto‑updates |
| **Observability** | Sentry for uncaught exceptions; Logflare for RPC latency     |

---

## 6  Future‑facing Hooks

* **Edge cache (Cloudflare R2)** – translations already immutable; drop‑in TTL.
* **React Server Components** – once Vite plugin stable; zero change to
  BibleDataAPI contract.
* **Mobile RN wrapper** – the slot model & Service‑Worker will carry across
  using `expo-router` + WebView.

---
