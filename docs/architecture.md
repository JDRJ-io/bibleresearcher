# Anointed.io - Architecture Overview

## 1. Context & Goals
**High-level objective: 10,000-concurrent-user benchmark, React single-path ethos.**

This architecture is designed to scale to 10,000 concurrent users while maintaining smooth performance through React anchor-based architecture with strict layering and facade patterns.

### Offline Layer & PWA Configuration
The platform includes comprehensive offline capabilities through vite-plugin-pwa:
- **Service Worker**: Auto-generated with Workbox caching strategies
- **Translation Caching**: Supabase storage files cached with CacheFirst strategy (30 days)  
- **Background Sync**: Pending notes/bookmarks/highlights sync when connectivity restored
- **PWA Manifest**: Dynamic generation with app metadata and standalone display mode
- **Install Prompts**: Cross-platform PWA installation with iOS Safari guidance

## 2. Top-level Flow Diagram
```mermaid
graph TD
    A[User scrolls] --> B[useAnchorSlice]
    B --> C[anchorIndex,slice] 
    C --> D[VirtualBibleTable]
    D --> E[verseIDs] 
    E --> F[useBibleStore]
    F --> G[BibleDataAPI]
    G --> H[Supabase Storage / PostgreSQL]
    
    %% Client cache
    E --> I[client cache]
    
    %% Facade layer
    F --> J[facade]
    
    %% Download operations
    F --> K[download]
    F --> L[returns Map]
    
    %% Row operations
    D --> M[row props]
    M --> N[VirtualRow + VerseRow]
    
    %% User interactions
    N --> O[mutate]
    O --> P[saveNote / saveHighlight / saveBookmark]
    
    %% Facade operations
    J --> Q[via facade]
    
    %% Anchor preservation
    P --> R[onSuccess]
    R --> S[preserveAnchor]
    S --> T[scrollTop adjust]
    
    %% Final update
    T --> U[C]
```

**No component outside the green facade can talk to Supabase or manipulate the DOM.**

## 3. File-by-File Responsibility Map

| Layer | File / Dir | Purpose / Public Surface |
|-------|-----------|-------------------------|
| **Providers** | `providers/BibleDataProvider.tsx` | Zustand store - translations, actives, setTranslation, setActives |
| **Core hooks** | `hooks/useAnchorSlice.ts`, `hooks/useRowData.ts`, `hooks/useScroll.ts` | Viewport maths, slice-row data, scroll params |
| **Guard hooks** | `hooks/useBodyClass.ts`, `hooks/useHashParams.ts`, `hooks/useTextSelection.ts`, `hooks/usePreserveAnchor.ts` | All remaining DOM touches live here |
| **Facade** | `data/BibleDataAPI.ts` | `loadTranslation`, `loadProphecy`, `loadVerseKeysKJV`, `loadCrossReferences`, `saveNote`, `saveHighlight`, `saveBookmark` |
| **Workers** | `workers/searchWorker.js`, `workers/translationWorker.js` | Parses large text / search off main thread |
| **UI components** | `components/VirtualBibleTable.tsx`, `components/VirtualRow.tsx`, `components/VerseRow.tsx`, `components/TranslationSelector.tsx`, `components/GoToVerse.tsx`, `components/HamburgerMenu.tsx`, `components/ProphecyColumns.tsx`, `components/AuthModal.tsx` | Pure React; only speak to hooks & provider |
| **Integration tests** | `__tests__/anchor.test.ts`, `__tests__/noRawFetch.test.ts` | Guards slice invariants & forbidden fetch |
| **Cypress** | `cypress/e2e/scroll.spec.ts` | Budget test < 20 translation requests in 5s scroll burst |
| **Config / guardrails** | `.eslintrc.json`, `jest.setup.ts` | "No DOM globals", Jest fetch spy |

## 4. Directory Layout

```
client/
├── components/
│   ├── bible/
│   │   ├── VirtualBibleTable.tsx
│   │   ├── VirtualRow.tsx
│   │   ├── VerseRow.tsx
│   │   ├── TranslationSelector.tsx
│   │   ├── GoToVerse.tsx
│   │   ├── HamburgerMenu.tsx
│   │   ├── ProphecyColumns.tsx
│   │   └── AuthModal.tsx
│   └── ui/ (shadcn components)
├── hooks/
│   ├── useAnchorSlice.ts
│   ├── useRowData.ts
│   ├── useScroll.ts
│   ├── useBodyClass.ts
│   ├── useHashParams.ts
│   ├── useTextSelection.ts
│   └── usePreserveAnchor.ts
├── data/
│   └── BibleDataAPI.ts
├── providers/
│   └── BibleDataProvider.tsx
├── workers/
│   ├── searchWorker.js
│   └── translationWorker.js
├── __tests__/
│   ├── anchor.test.ts
│   └── noRawFetch.test.ts
└── lib/
    ├── supabaseLoader.ts
    ├── verseKeysLoader.ts
    └── utils.ts
```

## 5. State & Data Flow

### Zustand Store Schema
```typescript
interface BibleStore {
  // Core data
  translations: Map<string, Map<string, string>>;
  actives: Set<string>;
  verses: VerseObject[];
  
  // UI state
  anchorIndex: number;
  loadingStage: string;
  
  // Actions
  setTranslation: (code: string, active: boolean) => void;
  setActives: (codes: string[]) => void;
  setAnchorIndex: (index: number) => void;
}
```

### Hook Subscription Pattern
- `useAnchorSlice()` → returns `{anchorIndex, slice}`
- `useRowData()` → transforms slice into display rows
- `useScroll()` → manages scroll position and anchor detection

## 6. Supabase Data Model

| Table | PK | Key columns | RLS summary |
|-------|----|-----------|-----------| 
| `users` | `id` | `email, name, created_at` | Self-access only |
| `userNotes` | `id` | `user_id, verse_id, content` | user_id filter |
| `bookmarks` | `id` | `user_id, verse_id, color, name` | user_id filter |
| `highlights` | `id` | `user_id, verse_id, start_char, end_char, color` | user_id filter |
| `forumPosts` | `id` | `user_id, verse_id, content, votes` | Public read |
| `userPreferences` | `user_id` | `theme, layout, last_verse` | Self-access only |

## 7. Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Development
NODE_ENV=development
```

## 8. Build & CI Pipeline

### Development
```bash
npm run dev          # Start dev server with HMR
npm run build        # Build production bundle
npm run lint         # ESLint validation
npm run test         # Jest unit tests
npm run test:e2e     # Cypress integration tests
```

### CI Pipeline
```bash
npm run lint:architecture  # Custom AST-grep validation
npm run test:anchor       # Slice invariant tests
npm run test:fetch        # No raw fetch validation
npm run test:cypress      # Scroll budget tests
```

## 9. Coding Conventions & Guardrails

### ESLint Rules
- `no-restricted-globals`: Prevents direct DOM access
- `no-restricted-imports`: Blocks direct Supabase imports outside facade
- Custom rule: All fetch calls must go through BibleDataAPI

### Architecture Validation
```bash
# Custom AST-grep rule - fails if non-facade imports Supabase
npm run lint:architecture
```

### Testing Guardrails
- **Anchor Tests**: Validates slice always contains anchor verse
- **Fetch Tests**: Ensures no direct fetch calls bypass facade
- **Scroll Budget**: ≤20 network calls per 5-second scroll burst

## 10. Roadmap / TODO Hooks

### Immediate (Current Sprint)
- [x] BibleDataAPI facade complete
- [x] Anchor-based architecture
- [x] Performance guardrails
- [x] Fetch purging complete

### Next Phase
- [ ] Prophecy loader integration
- [ ] Strong's concordance module
- [ ] Magic link authentication
- [ ] Edge cache layer (Cloudflare R2)

### Future Enhancements
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Offline capability
- [ ] Advanced search features

## 11. Performance Benchmarks

### Current Metrics
- **Memory Usage**: ~200MB for full Bible (31,102 verses)
- **Scroll Performance**: Smooth Genesis 1 → Revelation 22
- **Network Efficiency**: ≤20 requests per 5-second scroll burst
- **Bundle Size**: <2MB gzipped

### Target Metrics (10,000 users)
- **Response Time**: <100ms for verse navigation
- **Concurrent Users**: 10,000 simultaneous
- **Database Queries**: <50ms average
- **CDN Cache Hit**: >95%

## 12. License / Attribution

This project uses various Bible translations under fair use and public domain guidelines. See individual translation files for specific copyright information.

---

**Architecture Maintainers**: Update this document whenever new layers are added or responsibilities change. All PRs must mention which architectural layers they touch.