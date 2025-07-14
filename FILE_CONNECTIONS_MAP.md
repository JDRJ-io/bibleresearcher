# Anointed.io File Connections & Functions Map

## Overview
This document maps all file connections, functions, and data flow in the Anointed.io Bible study platform.

## Architecture Summary
- **Frontend**: React + TypeScript with Vite
- **Backend**: Express.js with PostgreSQL (Neon) + Drizzle ORM
- **Data Storage**: Supabase Storage for Bible files + IndexedDB for offline
- **State Management**: Zustand stores + TanStack Query
- **Authentication**: Supabase Auth

---

## 🏗️ Core Architecture Files

### `server/index.ts`
**Purpose**: Main Express server entry point
**Functions**:
- `app.listen()` - Starts server on port 80
- Express middleware setup
- Error handling middleware
**Connections**:
- → `server/routes.ts` (API routes)
- → `server/vite.ts` (Vite dev server)
- → `shared/schema.ts` (database types)

### `server/routes.ts`
**Purpose**: API endpoint definitions
**Functions**:
- `registerRoutes()` - Sets up all API routes
- REST endpoints for notes, bookmarks, highlights
**Connections**:
- → `server/storage.ts` (database operations)
- → `shared/schema.ts` (data validation)

### `server/storage.ts`
**Purpose**: Database abstraction layer
**Functions**:
- `IStorage` interface definition
- Database CRUD operations
**Connections**:
- → `shared/schema.ts` (table definitions)
- → `drizzle.config.ts` (database config)

### `shared/schema.ts`
**Purpose**: Database schema & types
**Functions**:
- Table definitions (users, notes, bookmarks, etc.)
- Zod schemas for validation
**Connections**:
- Used by all database operations
- → `server/storage.ts`, `server/routes.ts`

---

## 🎯 Single-Source Data Loading System

### `client/src/lib/translationCache.ts`
**Purpose**: Single source for translation loading
**Functions**:
- `ensureTranslation(lang)` - Loads translation once per session
- `useTranslationStore` - Zustand store for translations
**Connections**:
- → `client/src/lib/supabase.ts` (Supabase client)
- ← `client/src/hooks/useEnsureTranslationLoaded.ts`
- ← `client/src/providers/BibleDataProvider.tsx`

### `client/src/lib/crossRefCache.ts`
**Purpose**: Cross-reference data caching
**Functions**:
- `ensureCrossRefsLoaded()` - Loads cross-references once
- Cross-reference data parsing
**Connections**:
- → `client/src/lib/supabase.ts`
- ← `client/src/hooks/useSliceDataLoader.ts`

### `client/src/lib/prophecyCache.ts`
**Purpose**: Prophecy data caching
**Functions**:
- `ensureProphecyLoaded()` - Loads prophecy data once
- `getProphecyForVerse(verseId)` - Retrieves prophecy data
**Connections**:
- → `client/src/lib/supabase.ts`
- ← `client/src/hooks/useSliceDataLoader.ts`

### `client/src/workers/crossReferencesWorker.ts`
**Purpose**: Background cross-reference processing
**Functions**:
- `ensureCrossRefsLoaded()` - Loads cf1.txt/cf2.txt
- `fetchCrossRefs(ids)` - Returns cross-refs for verse IDs
**Connections**:
- → `client/src/lib/supabase.ts`
- ← `client/src/hooks/useSliceDataLoader.ts`

---

## 🔄 Data Flow & State Management

### `client/src/providers/BibleDataProvider.tsx`
**Purpose**: Central Bible data state management
**Functions**:
- `useBibleStore` - Zustand store for Bible data
- State for verses, translations, cross-refs, prophecies
**Connections**:
- → `client/src/lib/translationCache.ts`
- ← All Bible components consume this store

### `client/src/store/translationSlice.ts`
**Purpose**: Translation selection state
**Functions**:
- `useTranslationMaps` - Translation state management
- `setMain()`, `setAlternates()` - Translation selection
**Connections**:
- → `client/src/lib/translationCache.ts`
- ← `client/src/components/bible/TranslationSelector.tsx`

### `client/src/hooks/useSliceDataLoader.ts`
**Purpose**: Loads data for current verse slice
**Functions**:
- `useSliceDataLoader(slice)` - Loads cross-refs + prophecy for slice
- Cross-reference worker integration
- Prophecy data building
**Connections**:
- → `client/src/lib/crossRefCache.ts`
- → `client/src/lib/prophecyCache.ts`
- → `client/src/workers/crossReferencesWorker.ts`
- ← `client/src/components/bible/VirtualBibleTable.tsx`

---

## 🖥️ UI Components

### `client/src/pages/bible.tsx`
**Purpose**: Main Bible page component
**Functions**:
- Main application layout
- State management integration
- Modal management
**Connections**:
- → `client/src/components/bible/VirtualBibleTable.tsx`
- → `client/src/components/bible/HamburgerMenu.tsx`
- → `client/src/components/bible/TopHeader.tsx`
- → `client/src/providers/BibleDataProvider.tsx`

### `client/src/components/bible/VirtualBibleTable.tsx`
**Purpose**: Virtual scrolling Bible table
**Functions**:
- Virtual scrolling implementation
- Row rendering management
- Anchor-centered loading
**Connections**:
- → `client/src/components/bible/VirtualRow.tsx`
- → `client/src/hooks/useSliceDataLoader.ts`
- → `client/src/providers/BibleDataProvider.tsx`

### `client/src/components/bible/VirtualRow.tsx`
**Purpose**: Individual Bible verse row
**Functions**:
- Verse text rendering
- Translation column display
- Cross-reference cell rendering
**Connections**:
- → `client/src/hooks/useTranslationMaps.ts`
- → `client/src/providers/BibleDataProvider.tsx`

### `client/src/components/bible/ProphecyColumns.tsx`
**Purpose**: Prophecy data columns (P/F/V)
**Functions**:
- `ProphecyColumns({ verseIDs })` - Renders prophecy data
- Three columns: Predictions, Fulfillments, Verification
**Connections**:
- → `client/src/providers/BibleDataProvider.tsx` (prophecy data)
- ← `client/src/components/bible/VirtualRow.tsx`

### `client/src/components/bible/TranslationSelector.tsx`
**Purpose**: Translation selection interface
**Functions**:
- Main translation radio buttons
- Alternate translation toggles
- Translation loading triggers
**Connections**:
- → `client/src/store/translationSlice.ts`
- → `client/src/hooks/useEnsureTranslationLoaded.ts`

### `client/src/components/bible/HamburgerMenu.tsx`
**Purpose**: Settings and options menu
**Functions**:
- Settings panel management
- Translation selector modal
- Feature toggles
**Connections**:
- → `client/src/components/bible/TranslationSelector.tsx`
- → Multiple feature components

---

## 🔗 Core Hooks

### `client/src/hooks/useEnsureTranslationLoaded.ts`
**Purpose**: Translation loading hook
**Functions**:
- `useEnsureTranslationLoaded()` - Ensures translation is loaded
**Connections**:
- → `client/src/lib/translationCache.ts`
- ← `client/src/components/bible/TranslationSelector.tsx`

### `client/src/hooks/useTranslationMaps.ts`
**Purpose**: Translation state management
**Functions**:
- `useTranslationMaps()` - Translation state + text retrieval
- `getVerseText(verseId, translation)` - Get verse text
**Connections**:
- → `client/src/store/translationSlice.ts`
- → `client/src/providers/BibleDataProvider.tsx`
- ← Multiple components

### `client/src/hooks/useOnlineStatus.ts`
**Purpose**: Network connectivity monitoring
**Functions**:
- `useOnlineStatus()` - Online/offline state
**Connections**:
- → `client/src/components/ui/connectivity-status.tsx`

### `client/src/hooks/useQueueSync.ts`
**Purpose**: Offline data synchronization
**Functions**:
- `useQueueSync()` - Syncs offline data when online
**Connections**:
- → `client/src/offline/queueSync.ts`
- → `client/src/offline/offlineDB.ts`

---

## 📱 PWA & Offline System

### `client/src/sw.ts`
**Purpose**: Service worker registration
**Functions**:
- Service worker setup
- Cache management
**Connections**:
- → `vite.config.pwa.ts` (PWA config)

### `client/src/offline/offlineDB.ts`
**Purpose**: IndexedDB offline storage
**Functions**:
- `OfflineDB` class for local storage
- Note/bookmark/highlight offline storage
**Connections**:
- → `client/src/offline/queueSync.ts`
- ← `client/src/hooks/useQueueSync.ts`

### `client/src/offline/queueSync.ts`
**Purpose**: Offline→Online data sync
**Functions**:
- `QueueSync` class for sync management
- Conflict resolution
**Connections**:
- → `client/src/offline/offlineDB.ts`
- → `client/src/lib/supabase.ts`

---

## 🔧 Utility & Configuration

### `client/src/lib/supabase.ts`
**Purpose**: Supabase client configuration
**Functions**:
- `supabase` client instance
- Authentication integration
**Connections**:
- Used by all data loading functions
- → `client/src/contexts/AuthContext.tsx`

### `client/src/lib/utils.ts`
**Purpose**: Utility functions
**Functions**:
- `cn()` - Tailwind class merging
- Various helper functions
**Connections**:
- Used throughout components

### `client/src/lib/queryClient.ts`
**Purpose**: TanStack Query configuration
**Functions**:
- Query client setup
- `apiRequest()` - API request helper
**Connections**:
- → `client/src/main.tsx`
- Used by components with queries

---

## 🧪 Testing & Validation

### `client/src/__tests__/anchor.test.ts`
**Purpose**: Anchor-centered loading tests
**Functions**:
- Tests for slice loading behavior
**Connections**:
- → Core hooks and components

### `client/src/__tests__/noRawFetch.test.ts`
**Purpose**: Architecture validation
**Functions**:
- Ensures no direct fetch calls outside facade
**Connections**:
- → `client/src/data/BibleDataAPI.ts`

### `cypress/e2e/scroll.spec.ts`
**Purpose**: End-to-end scrolling tests
**Functions**:
- Virtual scrolling behavior tests
- Performance validation
**Connections**:
- → Main application

### `scripts/lint-architecture.js`
**Purpose**: Architecture enforcement
**Functions**:
- `validateArchitecture()` - Checks for violations
- Direct DOM/fetch call detection
**Connections**:
- Analyzes all TypeScript files

---

## 📊 Data Flow Summary

1. **Translation Loading**: `TranslationSelector` → `useEnsureTranslationLoaded` → `translationCache.ts` → Supabase
2. **Verse Display**: `VirtualBibleTable` → `VirtualRow` → `useTranslationMaps` → `BibleDataProvider`
3. **Cross-References**: `useSliceDataLoader` → `crossReferencesWorker` → `crossRefCache.ts` → Supabase
4. **Prophecy Data**: `useSliceDataLoader` → `prophecyCache.ts` → `ProphecyColumns` → Display
5. **Offline Sync**: `useQueueSync` → `offlineDB.ts` → `queueSync.ts` → Supabase

---

## 🚦 Architecture Guardrails

### Single-Source Loading
- **Translations**: Only `translationCache.ts` loads translation files
- **Cross-References**: Only `crossRefCache.ts` + `crossReferencesWorker.ts`
- **Prophecy**: Only `prophecyCache.ts`

### Data Access Patterns
- **Facade Pattern**: `BibleDataAPI.ts` for all Supabase operations
- **No Direct Fetch**: All network calls through authorized sources
- **React-Only DOM**: No direct DOM manipulation outside hooks

### Performance Guarantees
- **Virtual Scrolling**: Only 150-250 rows in DOM
- **Anchor-Centered**: All loading based on viewport center
- **Single Load**: Each file loaded exactly once per session

---

## 📝 Current Status

### ✅ Completed
- Single-source translation loading system
- Cross-reference worker implementation
- Prophecy cache system
- PWA offline capabilities
- Virtual scrolling optimization

### 🔄 In Progress
- Full application integration
- Error handling improvements
- Performance optimization

### 📋 Next Steps
- Complete UI component integration
- Finalize data synchronization
- Enhanced error handling
- Performance monitoring