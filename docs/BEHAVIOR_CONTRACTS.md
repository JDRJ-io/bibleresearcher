# Behavior Contracts  
*(Anointed.io runtime guarantees – updated 17 July 2025)*

This file describes the **non‑negotiable run‑time behaviors** the application
must uphold on every device, online or offline.  
Each clause is phrased so it can be verified by unit tests, Cypress, or
instrumentation.

---

## 1. Anchor & Scrolling

| Contract | Rationale | Verification |
|----------|-----------|--------------|
| **A‑1** The row whose top edge is closest to 50 % of the viewport is `anchorIndex`. | Keeps user’s place during pagination. | `__tests__/anchor.test.ts` |
| **A‑2** Programmatic `setAnchorIndex(idx)` scrolls so that row’s top is within ±12 px of viewport center within 300 ms. | Predictable navigation. | Cypress `scroll.spec.ts` |
| **A‑3** At most **250** DOM rows are mounted at any time. | Prevents memory blow‑up on mobile. | `useVirtualRowDebug()` asserts in DEV. |

### Dual‑axis gesture rule

*G‑1* — For a touch or wheel gesture:  
&nbsp;&nbsp;• if `|dx| > |dy| × 1.2` → horizontal scroll (`touch-action: pan-x`).  
&nbsp;&nbsp;• else vertical scroll (`pan-y`).  
&nbsp;&nbsp;• diagonal scrolling is never enabled.

---

## 2. Cross‑Reference interactions

| Contract | Rationale |
|----------|-----------|
| **X‑1** Tapping a reference link triggers `setAnchorIndex(ref)` within 30 ms. |
| **X‑2** Row highlight (`bg-blue-50`) appears for 500 ms fade‑out. |
| **X‑3** Verse preview text must resolve (< “Loading…”) in ≤ 800 ms after the link becomes visible (main translation auto‑pre‑fetch). |

---

## 3. Column visibility & sizing

| Contract | Verification |
|----------|--------------|
| **C‑1** Column order persists in `localStorage.columnOrder`. |
| **C‑2** When visibleColumns ≤ 3, table is horizontally centered. |
| **C‑3** Size presets S/M/L/XL set `--sizeMult` = 0.85 / 1 / 1.35 / 1.7. |
| **C‑4** Unlock‑resize may not shrink a column below **60 px** width. |

---

## 4. Offline Data Handling

| Contract | Verification |
|----------|--------------|
| **O‑1** Any mutation while `!navigator.onLine` creates a Dexie `queued_mutation` row within 100 ms. |
| **O‑2** On `"online"` or SW `sync`, queue is flushed in ≤ 3 s. |
| **O‑3** Queue retention ≤ 48 h; older rows are purged automatically. |
| **O‑4** Conflict resolution: row with greatest `updated_at` wins; client wins ties. |

---

## 5. Service‑Worker & Caching

| Contract | Tool |
|----------|------|
| **P‑1** Shell HTML precache is `NetworkFirst` with fallback; stale age ≤ 24 h. | Lighthouse PWA audit |
| **P‑2** Translation cache (`translations/*.txt`) size guard: `CacheStorage['translations']` ≤ 20 entries, ≤ 75 MB. | `service-worker-validation.sh` |
| **P‑3** SW update triggers “Update available” toast within 20 s of new deploy. | Cypress `sw_update.cy.js` |
| **P‑4** Strong’s files are *never* cached by SW (NetworkOnly route). | script grep |

---

## 6. Performance Budgets

| Metric | Target | Test |
|--------|--------|------|
| Bundle size | < 2 MB (gzip) | `scripts/bundle-check.js` |
| First Meaningful Paint (offline) | < 2 s on mid‑range Android | Lighthouse offline LCP |
| Main thread mem Δ after 10 000 rows scrolled | < 35 MB | `cypress/e2e/scroll.spec.ts` mem collect |

---

## 7. Error States

| Error | UX requirement |
|-------|----------------|
| Translation fetch 404 | Toast “Translation unavailable”; fallback to KJV. |
| Supabase 401 on RPC | Force sign‑out and reopen Auth modal. |
| Dexie quota exceeded | Modal prompt to clear offline data. |
| SW install failure | App still runs; console error but no blank screen. |

---

## 8. QA Checklist (high‑level)

1. **Online, first visit** – FCP < 3 s, table renders Gen 1:1.  
2. **Toggle alt translation** – new column appears, no layout shift > 3 mm.  
3. **Phone portrait** – vertical flick smooth; horizontal drag reveals hidden columns.  
4. **Offline + note** – note icon shows grey (queued); reconnect → turns blue.  
5. **SW update** – build, deploy, toast appears, update confirmed.

---

*Maintain this file whenever you change scrolling logic, offline flows, cache
rules, or performance budgets.  Each contract should be testable via unit,
integration, or e2e tests.*
