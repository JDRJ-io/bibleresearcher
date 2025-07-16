# 📂 File Connections & Functions Map
(Anointed.io front‑end PWA — July 2025)

* Legend
• → = depends on / imports   • ⬅ = consumed by   • ⚙︎ = core function(s)

## 1 Runtime Data Facade  
client/src/data/BibleDataAPI.ts ⚙︎
(single gateway to Supabase; holds master LRU verse cache & performs all network fetches)

Method	Purpose	Supabase path
getTranslation(id)	Map<index,text>	translations/${id}.txt
getCrossRefSlice(set,start,end)	byte‑range slice	references/${set}.txt
getCfOffsets(set)	returns offsets JSON	references/${set}_offsets.json
getProphecy(key)	TSV row P/F/V	references/prophecy_rows.txt + prophecy_index.json
getStrongsOffsets()	verse & lemma ranges	references/strongsVerseOffsets.json, strongsIndexOffsets.json
saveNote / saveHighlight / saveBookmark	user mutations	Supabase RPC / INSERT

## 2 Supabase Client  
client/src/lib/supabaseClient.ts
Singleton; used by BibleDataAPI + offline/queueSync.ts.

## 3 State & Stores
File	Type	⚙︎ Exports	Used by
store/translationSlice.ts	Zustand	main, alternates, columnOrder, anchorIndex, setters	TranslationSelector, ColumnHeaders
hooks/useBibleData.ts	Zustand selector layer	verse text via master cache	VirtualRow, VerseRow
hooks/useOnlineStatus.ts	hook	online/offline boolean	Connectivity badge
hooks/useQueueSync.ts	hook	Dexie → Supabase sync	queueSync.ts
store/useBibleData.ts (legacy name)	alias of above	will be removed once imports migrate	

## 4 Internal Loaders (called only by BibleDataAPI)
File	Role
lib/translationLoader.ts	fetch & parse raw translation text
lib/verseKeysLoader.ts	fetch canonical / chronological key lists
lib/prophecyCache.ts	cache prophecy_rows + index in memory

(These modules never touch React code directly.)

## 5 Workers  (registered in lib/workers.ts)
Worker	Purpose	Data in	Data out
translationWorker.js	parse translations/*.txt off‑thread	ArrayBuffer	Map<index,text>
searchWorker.js	fuzzy search index & queries	query string	hits[]
crossReferencesWorker.ts	expand refs via offsets	{key,text}	refs[]
workers.ts	registers the above; keep import list in sync		

* No Worker fetches remote data on its own. All content arrives via postMessage from BibleDataAPI.

## 6 Hooks (runtime data access)
Hook	Purpose
useEnsureTranslationLoaded	lazy‑load translation → master cache
useSliceDataLoader	loads cf offsets + prophecy rows for slice
useTranslationMaps	memoised text selector; wraps master cache
useColumnKeys	returns ordered column key array
plus helper hooks: useAnchorSlice, useScroll, useBodyClass, etc.	

## 7 UI Component Tree (runtime)

App.tsx
 ├─ ThemeProvider
 ├─ AuthContext
 └─ BiblePage
     ├─ TopHeader
     ├─ HamburgerMenu
     │    └─ TranslationSelector
     └─ VirtualBibleTable
          ├─ ColumnHeaders
          ├─ VirtualRow
          │    ├─ VerseRow
          │    └─ ProphecyColumns
          ├─ CrossRefsColumn   (UI pending data hookup)
          └─ ExpandedVerseOverlay
Additional atoms: components/LoadingWheel.tsx, shadcn/ui primitives in components/ui/*.

## 8 Auth Components
File	Role
components/auth/AuthModals.tsx	magic‑link sign‑in / sign‑up
components/auth/UserProfile.tsx	avatar dropdown, sign‑out
pages/auth/callback.tsx	Supabase OAuth callback route

(Auth wiring in progress.)

## 9 Offline / PWA
File	Role
offline/offlineDB.ts	Dexie tables: bookmarks, highlights, queued_mutations
offline/queueSync.ts	flush Dexie queue when online
sw.ts	Workbox service‑worker (CacheFirst 30 days for Bible files)
vite.config.pwa.ts	manifest + precache generation

## 10 Utility / Config
File	Purpose
tailwind.config.ts	theme tokens, purge paths
postcss.config.js	autoprefixer + tailwind
vite.config.ts + bundleSplit.ts / chunkConfig.ts	manualChunks
tsconfig.json	TS paths & React 18 setup
components.json	shadcn/ui generator list
drizzle.config.ts + schema.ts	dev‑only DB migrations

## 11 Tests & CI
Item	Check
__tests__/anchor.test.ts, hooks/__tests__/useAnchorSlice.test.ts	anchor invariants
__tests__/offline.test.ts	Dexie queue replay
Cypress suites (scroll, translation-switching, prophesy)	e2e UX
.eslintrc.js custom rule	forbid raw fetch
validate-architecture.sh	grep for /api/references
scripts/bundle-check.js	gzipped build ≤ 2 MB

## 12 Assets / Public
Path	Notes
public/icon-192.svg, icon-512.svg	PWA icons
public/manifest.json	Web App manifest
No Bible data stored locally – all verse files live in Supabase Storage; duplicate public/verseKeys-canonical.txt has been deleted.	

## Legacy / Deleted
All files under server/

Duplicate client/src/lib/bibleDataAPI.ts, bibleDataOptimized.ts

public/verseKeys-canonical.txt local copy

Any unused shared/types/* modules

These are intentionally removed and should not re‑appear in docs or imports.