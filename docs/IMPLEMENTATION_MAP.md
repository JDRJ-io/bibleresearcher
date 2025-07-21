
# 📜 Implementation Map (Road to Production)

*Anointed.io PWA Development Roadmap – updated January 2025*

This document provides a **layer-by-layer status overview** and concrete next steps to take the application from its current state to production-ready deployment.

---

## 🏗️ Current Architecture Status

| Layer                | What you already have                                            | Key files                                                                                | Next integration step                                                             |
| -------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Front‑end shell**  | React 18 + Vite + Tailwind, virtualised verse table              | `main.tsx`, `App.tsx`, `VirtualBibleTable.tsx`, `VirtualRow.tsx`                         | keep bundle ≤ 2 MB (gzip) and ship PWA build via `npm run build`                  |
| **State / stores**   | Zustand slices + TanStack Query cache for server state           | `translationSlice.ts`, `useBibleData.ts`, `useAnchorSlice.ts`, `useQueueSync.ts`         | finish migrating legacy imports to the new slices; persist size/column prefs      |
| **Data façade**      | **Single gateway** `BibleDataAPI.ts` (all network I/O)           | façade itself + loaders `translationLoader.ts`, `verseKeysLoader.ts`, `prophecyCache.ts` | forbid raw `fetch` elsewhere (ESLint already configured)                          |
| **Workers**          | Translation, search & cross‑ref parsing off‑thread               | `translationWorker.js`, `searchWorker.js`, `crossReferencesWorker.ts`                    | move heavy parsing (e.g. prophecy) to workers to keep main thread < 50 ms         |
| **Offline layer**    | Workbox SW, Dexie `offlineDB.ts`, queued sync                    | `sw.ts`, `queueSync.ts`, `PWA_IMPLEMENTATION.md`                                         | verify Background Sync queue & translation cache guard rails pass the check‑list  |
| **UI slot grid**     | 20 numbered slots, sticky headers, column drag/resize            | `UI_layout_spec.md`, `ColumnHeaders.tsx`, `VirtualRow.tsx`                               | finish wiring Cross‑Refs (slot 2) & Prophecy P/F/V (slots 17‑19) columns          |
| **Supabase storage** | Immutable texts, offsets & user RPC endpoints                    | `DATA_STORAGE_MAP.md`                                                                    | upload new translations → no SW change; keep bucket map up‑to‑date                |
| **Testing & CI**     | Jest unit invariants, Cypress e2e (anchor, offline, auth)        | `*.test.ts`, `*.cy.js`, GitHub CI script                                                 | add failing test reproducing the `.split()` crash before you fix it               |
| **Docs**             | Architecture one‑pager, file & storage maps, behaviour contracts | `ARCHITECTURE_OVERVIEW.md`, `FILE_CONNECTIONS_MAP.md`, …                                 | keep in `/docs` and ship with repo for new contributors                           |

---

## 🎯 Development Priorities

### 🔴 Critical Path (Week 1-2)

1. **Fix reference parsing crash**
   - **Issue**: `Cannot read properties of undefined (reading 'split')` in `useBibleData.ts`
   - **Status**: ✅ Fixed with robust dot-notation parser
   - **Next**: Verify all verse references load correctly

2. **Complete slot-config architecture**
   - **Issue**: `ColumnHeaders.tsx` & `VirtualRow.tsx` have divergent slot definitions
   - **Goal**: Single source of truth for all 20 column slots
   - **Files**: Create `constants/slotConfig.ts`, update both components

3. **Wire functional data columns**
   - Cross-references (slot 2): Connect `BibleDataAPI.getCrossRefSlice()` to `CrossReferencesCell`
   - Prophecy P/F/V (slots 17-19): Enable prophecy dots using cached TSV data
   - Translation toggles: Ensure UI changes invalidate TanStack Query caches

### 🟡 High Priority (Week 3-4)

4. **User authentication integration**
   - **Status**: Magic link auth modal structure exists
   - **Next**: Wire `AuthContext` to Supabase auth state
   - **Files**: `AuthContext.tsx`, `CombinedAuthModal.tsx`

5. **User data persistence**
   - Notes, highlights, bookmarks with offline sync
   - Connect UI actions to `queueSync.ts` → Supabase RPC
   - Test offline-to-online sync scenarios

6. **PWA validation checklist**
   - Offline load ≤ 2s (Genesis 1:1 from cache)
   - Update toast appears within 20s of new deploy
   - Translation cache respects 20-entry, 75MB limits
   - Background sync queue flushes in ≤ 3s on reconnect

### 🟢 Polish & Optimization (Week 5-6)

7. **Performance tuning**
   - Bundle size guard: maintain < 2MB gzip
   - Main thread work < 50ms during scroll
   - Memory usage ≤ 35MB delta after 10k rows scrolled

8. **UI/UX enhancements**
   - Size selector (S/M/L/XL) persistence
   - Column drag/resize unlock modes
   - Mobile portrait optimizations
   - Theme switching (light/dark)

9. **Search & Strong's integration**
   - Global verse search using `searchWorker.js`
   - Strong's concordance overlay
   - Interlinear Hebrew/Greek text display

---

## 🔧 Immediate Implementation Tasks

### Task 1: Slot Config Single Source of Truth
```typescript
// Create: client/src/constants/slotConfig.ts
export interface SlotConfig {
  slot: number;
  type: 'reference' | 'main-translation' | 'alt-translation' | 'cross-refs' | 'prophecy-p' | 'prophecy-f' | 'prophecy-v' | 'notes' | 'context';
  header: string;
  translationCode?: string;
  defaultVisible: boolean;
  defaultWidthRem: number;
}

export const SLOT_CONFIG: Record<number, SlotConfig> = {
  0: { slot: 0, type: 'reference', header: 'Ref', defaultVisible: true, defaultWidthRem: 5 },
  1: { slot: 1, type: 'main-translation', header: 'KJV', defaultVisible: true, defaultWidthRem: 20 },
  2: { slot: 2, type: 'cross-refs', header: 'Cross Refs', defaultVisible: true, defaultWidthRem: 15 },
  // ... continue for all 20 slots
};
```

### Task 2: Cross-Reference Integration
- Connect `BibleDataAPI.getCrossRefSlice()` to `CrossReferencesCell`
- Implement verse navigation on reference click
- Add loading states for cross-reference text

### Task 3: Translation Toggle Reactivity
- Ensure `translationSlice` mutations trigger TanStack Query cache invalidation
- Test rapid translation switching doesn't break verse loading
- Verify main/alternate translation persistence

---

## 📋 QA Validation Matrix

| Feature Area | Test Scenario | Expected Result | Validation Method |
|--------------|---------------|-----------------|-------------------|
| **Core Loading** | First visit, online | Genesis 1:1 renders < 3s | Lighthouse, manual |
| **Reference Navigation** | Click cross-ref link | Target verse highlights, scrolls into view | Cypress e2e |
| **Offline Sync** | Add note offline → reconnect | Note syncs to Supabase ≤ 3s | Manual + Dexie inspection |
| **Translation Switching** | Toggle KJV → ESV | New text loads without layout shift | Visual regression |
| **Mobile UX** | Portrait phone scroll | Smooth vertical, horizontal reveals columns | Device testing |
| **PWA Update** | Deploy new build | Update toast appears ≤ 20s | CI/CD pipeline |

---

## 🚀 Production Readiness Checklist

### Technical Requirements
- [ ] Bundle size ≤ 2MB (gzip) - `npm run bundle-check`
- [ ] Lighthouse PWA score ≥ 92
- [ ] All Cypress e2e tests passing
- [ ] ESLint architectural rules enforced
- [ ] Service Worker cache limits respected

### Feature Completeness
- [ ] All 12 translations loading correctly
- [ ] Cross-references navigable and cached
- [ ] Prophecy P/F/V columns functional
- [ ] User auth flow (magic link)
- [ ] Notes/highlights/bookmarks with offline sync
- [ ] Global search working
- [ ] Mobile-responsive design

### Documentation
- [ ] All `/docs/*.md` files current
- [ ] `DATA_STORAGE_MAP.md` reflects Supabase bucket
- [ ] `FILE_CONNECTIONS_MAP.md` updated for new imports
- [ ] Deployment instructions in `README.md`

---

## 🔮 Future Enhancements (Post-Production)

### Short-term (Next 2-3 months)
- Strong's concordance full integration
- Forum/community features
- Advanced study tools (compare translations side-by-side)
- Export/share functionality

### Long-term (6+ months)
- React Server Components migration
- Mobile app wrapper (React Native/Expo)
- Edge caching for global performance
- Multi-language UI support

---

*Maintainers: Update this roadmap after each major milestone completion. Keep priorities and timelines realistic based on development velocity.*
