

### **README.md**  (Replace entire file)

``markdown
<h1 align="center">📖 Anointed.io Bible Reader</h1>

A **React 18 + Vite** PWA that streams Bible translations from Supabase Storage,
supports offline study, and scales to 10 k concurrent users.

---

## ✨ Features

- Anchor‑centred infinite scroll (≤ 250 rows in DOM).
- On‑demand loading of 12 translations (LRU cache).
- Cross‑reference & prophecy columns powered by Supabase byte‑offset files.
- Magic‑link authentication (Supabase Auth).
- Full offline support: shell + visited slices, queues bookmarks/highlights.
- Column drag‑and‑drop, dark & light themes, mobile‑first UI.

## 🏗 Tech Stack

| Layer | Library |
|-------|---------|
| UI | React 18, shadcn/ui (Radix), Tailwind |
| State | Zustand + TanStack Query |
| Data | Supabase Storage & Auth |
| Offline | Workbox via vite‑plugin‑pwa, Dexie |
| Build | Vite + **bundle‑check (< 2 MB gzip)** |
| Tests | Jest + Testing Library, Cypress |

## 🚀 Quick Start

``bash
pnpm install
pnpm dev           # localhost:5173

## Production build

pnpm build         # dist/
node scripts/bundle-check.js   # fails if > 2 MB

## Test suites

pnpm test          # unit tests
pnpm cypress run   # e2e scroll & translation tests

## 📂 Key directories

src/
 ├─ components/bible      // Virtual table & UI widgets
 ├─ data/BibleDataAPI.ts  // Single Supabase façade
 ├─ hooks/                // Anchor slice, loaders, PWA hooks
 ├─ store/translationSlice.ts
 ├─ workers/              // Translation, search, cross‑refs
 └─ offline/              // Dexie + queueSync

## 🔐 Environment

### copy .env.example
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
🛡 Architecture Guardrails
ESLint forbids fetch( outside BibleDataAPI.

validate-architecture.sh fails on /api/references strings.

bundle‑check enforces gzipped build ≤ 2 MB.

## 🌐 Deploy
pnpm build

Upload dist/ to your static host (Cloudflare Pages, Vercel, Netlify).

Set allowed CORS origins in Supabase Storage to your domain.

## 🙏 License
Public‑domain Bible translations; other translations used under fair‑use.
See /translations/LICENSES.md for details.