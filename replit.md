Project Architecture & Status (Post-Refactor July 2025)

## Recent Changes (July 26, 2025)
✓ Enhanced theme system with advanced animated effects
✓ Added Rainbow Aurora theme with prismatic background animation and text gradient effects
✓ Added Aurora Borealis theme with moving light curtains and star field sparkle
✓ Added three new premium themes:
  - Cyberpunk: Neon grid scan-lines with futuristic glow effects
  - Forest Meadow: Sun-dappled canopy with floating pollen animation
  - Ancient Scroll: Candlelight flicker on parchment texture
✓ Implemented accessibility support with reduced-motion fallbacks
✓ Updated theme optimizer with new premium theme definitions
✓ Fixed white background overlay issue blocking animated effects
✓ Added CSS overrides to make animated backgrounds visible through container elements

## Column Architecture Documentation
User requested understanding of column sizing and placement mechanics. Key files:
- App.tsx: Core ColumnState/ColumnInfo interfaces, slot-based system (0-19)
- ColumnHeaders.tsx: Column width mapping and header rendering
- VirtualBibleTable.tsx: Main table layout implementation
- index.css: Responsive breakpoints and sizing calculations
- mobile-headers.css: Mobile-specific column sizing
- docs/UI_layout_spec.md: Complete architectural specification
# Overview
This is a comprehensive Bible study progressive web app built with React and TypeScript, using Supabase for all backend services (database, authentication, and file storage). The application delivers an Excel-like interface for reading and studying the Bible with multi-translation support, cross-references, Strong’s concordance, prophecy tracking, and community features. The architecture has been significantly refactored to eliminate the previous Express.js/Node backend and rely exclusively on Supabase and client-side logic. All data – from Bible text to user notes – now flows through a unified front-end data layer, ensuring a single source of truth and simplifying maintenance. Key characteristics of the current system include:
## React 18 Frontend: 
A modern React single-page application with TypeScript, styled via Tailwind CSS and Radix UI components (shadcn/ui library). The UI is fully virtualized for performance (only ~150–250 verses are in the DOM at any time) and uses an anchor-centered infinite scroll mechanism for smooth navigation.
## Supabase Backend: 
Supabase serves as the sole backend. It provides:
### Database: 
A PostgreSQL database for user data (notes, bookmarks, highlights, forum posts, etc.). Previously-managed via Drizzle ORM on a custom server, these tables are now accessed through Supabase’s client libraries and API security rules. (The schema includes tables like users, userNotes, bookmarks, highlights, forumPosts, forumVotes, userPreferences mirroring earlier designs.)
### File Storage: 
Large static content (Bible texts, cross-reference files, Strong’s data, etc.) stored in a Supabase Storage bucket (anointed bucket). All Bible content is loaded from these files rather than any local or third-party source.
### Authentication: 
Supabase Auth (magic link email authentication) is being integrated to handle user sign-ups and logins (in progress, see Next Priority below). Guest sessions default to a limited feature set with data saved locally, while authenticated users get full access and cloud sync.
## No Custom Server Calls: 
The previous Express.js REST API has been retired – all data fetching is done on the client through a centralized BibleDataAPI module. This facade is the only code allowed to perform fetch or Supabase queries, enforced by lint rules. The BibleDataAPI has hard-coded paths for Supabase Storage files and provides a small set of methods (e.g. getTranslationText(), getVerseMeta(), getProphecyMeta(), etc.) that the React components use. This ensures that UI code never directly calls fetch or touches Supabase client APIs – maintaining a clean separation of concerns and allowing future backend changes without altering UI code.
## One Main Data Path: 
Thanks to the facade, 100% of runtime data now comes from Supabase Storage or database via BibleDataAPI. A global guard in development mode prevents any stray network calls outside this path. In production, this means the app can be deployed as static files (no custom server needed beyond serving the static bundle). The Replit environment is primarily used for development (Node.js 20 with Vite for hot-reload) and for serving the production build as static content.
## TanStack Query for Data Caching: 
React Query (TanStack Query) manages client-side caching and synchronization of server state. All data operations (e.g., saving a note or retrieving user highlights) go through BibleDataAPI, which internally uses either the Supabase JS client or fetch calls to Supabase endpoints. Query invalidation is used to keep the UI in sync after writes. This, combined with the offline-capable design (described below), enables real-time updates and a resilient UX.

# Frontend Architecture & Anchor-Centered Scrolling
## Anchor-Centered Loading: 
The core of the UI is the Virtual Bible Table – a scrollable table of verses with an “anchor” verse at the vertical center of the viewport. The app uses a pure anchor-centered loading system: on any scroll event, the verse at the viewport center is computed as the new anchor, and the app loads a “slice” of verses around that anchor. This eliminated the old edge-based infinite scroll triggers entirely. Ground rules enforced by this system include:
### A single master list of verse IDs (verseKeys) 
defines the verse order (canonical by default, or chronological if toggled).
### loadChunk(anchorIndex, ±100) 
computes a fixed-size window of verses around the anchor; no requests for data outside this window are made. Adjacent anchor positions have overlapping slices, improving cache hits.
### No sentinel/edge observers: 
The new system does not use "scroll to end" triggers. Scrolling never directly causes network fetches; it only updates the anchor index, and the necessary data for the new verses is loaded if not already cached.
### The DOM contains only ~150–250 verse rows at any time, 
drastically reducing memory usage and improving performance (the previous approach kept much more content mounted).
### The anchor can be easily switched to an alternate ordering. 
For example, toggling Chronological mode replaces the verseKeys array with one loaded from metadata/verseKeys-chronological.json (along with corresponding dates-chronological.txt for timeline data) and resets the anchor to the beginning. Note: The chronological toggle UI exists but currently does not reorder verses yet (this feature is pending implementation).
* This anchor-centered model guarantees a consistent, predictable loading pattern and has been validated with tests (Jest and Cypress) to ensure the anchor verse always stays in the loaded slice and that rapid scrolling stays within acceptable network call limits.
## React-Only DOM Updates: 
All interface rendering is managed through React functional components – there are no direct DOM manipulations outside of React. Legacy code that accessed document or used manual querySelector has been removed or confined to ref-driven utilities within React hooks. This prevents race conditions and keeps the UI state unified. For example, the scrolling mechanism relies on React state (the anchorIndex) and a custom hook useAnchorSlice() that any component can use to get the current verses slice. This ensures every part of the UI (main table, overlays, etc.) shares the same source of truth for which verses are in view. 
## Scroll Preservation: 
Components that alter the list of verses (e.g., toggling a new column that changes row heights) use a controlled callback to preserve scroll position. A utility onPreserveAnchor(ref, savedIndex) is used such that if a re-render would shift the content, the scroll is adjusted exactly once in one place to keep the same verse anchored after changes. This prevents jarring jumps when adding/removing columns or switching Bible versions.
# Data Flow & Caching
## Unified Data Access – BibleDataAPI: 
As mentioned, BibleDataAPI.ts serves as the single entry point for all data operations. This module encapsulates fetching data from Supabase (both the Storage bucket files for Bible content and the Postgres DB for user data). Key points about this data layer:
### It has a single low-level fetch helper 
(internally, e.g. fetchFromStorage(path)) that knows how to retrieve a file from Supabase Storage via a signed URL or public URL. Every file fetch uses this, ensuring consistent handling (and easy logging/monitoring of what’s loaded).
### All high-level methods in BibleDataAPI 
(e.g., to get verses, cross-references, etc.) use the above helper and then parse or transform the data as needed. No UI component or other code calls fetch() or queries Supabase directly, which is enforced by automated lint/AST rules. This facade pattern means that switching to a different backend or adding an intermediate cache (like an Edge worker) could be done by modifying BibleDataAPI alone, with no changes to UI code.
### Main-Thread Orchestration: 
The main thread is responsible for initiating all data loads. Web Workers are used for heavy parsing tasks, but they do not independently fetch remote resources on their own initiative. Instead, the app either sends the raw data to a worker for processing or instructs the worker via messages and shared offsets. This prevents duplicate downloads and keeps caching centralized. In practice, some workers do perform internal range fetches (e.g., the Strong’s lookup workers – more details below) but always as part of a controlled request/response cycle initiated by the main thread (no worker will load a resource that the main thread isn’t aware of). A “ping/pong” round-trip test was implemented to verify that workers communicate properly with the main thread for data flow.

## Resource Cache: 
The application maintains a global in-memory resourceCache (an Map<string, unknown>) to store each fetched dataset exactly once per session. This serves as a unified cache for all types of data – Bible translations, cross-reference data, prophecy mappings, etc. After the refactor, multiple redundant caches were consolidated into this single master cache (an LRU cache with a cap, e.g., limiting to 12 translations loaded at a time). The caching strategy is as follows:
### Translations: 
When a user toggles a Bible translation on, the app checks resourceCache for that translation code. If not present, it fetches the entire translation text file (approximately 4 MB for a typical version), parses it into a Map<verseID, verseText>, and stores it in the cache with the translation code as the key. Subsequent toggles of the same translation reuse the cached data with no re-fetch. Important: To optimize initial load, the main translation (KJV for guests by default) is loaded first. A recent fix ensures that this initial load is not duplicated – previously a race condition caused multiple redundant fetches of KJV, which is now resolved. Now each translation file is fetched only once and remains in memory all session.
### Verse Slices: 
For large reference files (like cross-references or Strong’s concordance), the application uses byte-range requests and offset indexes to load just the needed portions. All source text files remain uncompressed (no GZIP) so that byte offsets remain consistent for direct range fetching. The offset metadata (usually JSON files mapping IDs or verse references to byte positions) is loaded once and kept in memory. When the user’s current verse slice changes, any needed data slices are fetched via BibleDataAPI (which constructs the Range header for the fetch). These slices are also cached to avoid repeat network calls when scrolling back and forth. In effect, the app achieves a file-streaming approach: e.g., scrolling through verses will cause cross-reference or commentary data to stream in chunk by chunk, only when needed, and reuse it if that range is revisited.
### LRU Eviction: 
The master cache evicts least-recently-used translation data if the user loads more translations than the set threshold (e.g., if all 12 available versions are loaded, adding another would drop the oldest). This prevents unbounded memory growth in long sessions. Bible content is quite large (the KJV text alone is ~31k verses), so this ensures we don’t keep dozens of versions in memory unnecessarily. Other resources (cross-ref, prophecy mappings, etc.) are smaller and generally kept as they are needed.
### TanStack Query Integration: 
For user data (notes, highlights, etc.), TanStack Query’s cache is used which works in concert with the resourceCache. The BibleDataAPI will internally call Supabase (SQL or RPC) to get or update user-specific data, then those results are cached via React Query for efficient UI updates. All writes (like adding a note or bookmark) mark the relevant queries as stale so that any component showing that data will refetch if online or queue for sync if offline (discussed below).
# File Structure and Data Sources
All external content is stored in Supabase Storage under the anointed bucket, organized by category. The app knows the exact file paths and how to parse each file. Below is a breakdown of the key data files and how they are used in the system:
## Verse Master List (Index):
### metadata/verseKeys-canonical.json and metadata/verseKeys-chronological.json – 
These JSON files contain the ordered list of all verse IDs (from Genesis 1:1 to Revelation 22:21) in canonical order and an alternate chronological order. On app startup, the canonical list is fetched and parsed into an array verseKeys (the primary index used by the anchor system). If the user switches to chronological, the corresponding JSON is fetched and replaces the list in memory. All data joins (mapping verse IDs to content) rely on these IDs; the verse ID string (e.g., "Gen.1:1") is a universal primary key across every dataset, which simplifies data merging.
### metadata/dates-canonical.txt and metadata/dates-chronological.txt – 
These text files provide a date or timeline metadata for each verse (e.g., traditional dating or chronology data). They use the same ordering and line indexing as the verseKeys files. The dates file is only fetched if the user enables the “Dates” column in the UI. (Currently, the Dates column toggle exists, but it is not yet functional – the file loads but the UI integration is pending, see Feature Status below.)
## Bible Translations (translations/{CODE}.txt):
There are 12 translation files (e.g., KJV.txt, ESV.txt, NIV.txt, etc.) covering the supported versions. Each file is a newline-delimited list of verses in the form:

Gen.1:1#In the beginning God created the heaven and the earth.  
Gen.1:2#And the earth was without form, and void…  
(Here # is used as a delimiter between the verse reference and the text). When a translation is toggled on, the entire file is fetched (via Supabase Storage) through the BibleDataAPI, parsed (split by lines and the # delimiter) into a Map of {verseID -> verseText}, and stored in resourceCache. The first translation added becomes the “main” Bible column; additional ones appear as parallel columns. Thanks to caching, each translation is loaded at most once per session. The system also avoids redundant parsing – a bug that caused multiple loads of the same translation has been fixed, so the app only downloads a given version one time.

## Cross-References (references/cf1.txt and cf2.txt with offsets):
The cross-reference dataset is split into two files for manageability (cf1.txt and cf2.txt), each with a corresponding offsets index (cf1_offsets.json, cf2_offsets.json). Each line in cf*.txt represents a verse’s cross-references in a compact format. For example:

Gen.1:1$$John.1:1#John.1:2#John.1:3$Heb.11:3  
Gen.1:2$$Jer.4:23$Ps.104:30  
In this syntax: the verse before $$ is the base verse, then each reference group is separated by $, and individual verse references within a group are separated by #. In the above example, Genesis 1:1 has two reference groups – one group containing John 1:1–3 (perhaps indicating multiple related verses in John) and another containing Hebrews 11:3. Genesis 1:2 has a group with Jeremiah 4:23 and Psalms 104:30. This grouping corresponds to how traditional cross-reference systems categorize references (often by theme or source). The application initially loads cf1.txt by default (which covers the first portion of the Bible) – indicated by “cf1 toggled on from beginning” – and will load cf2.txt data as needed when verses in its range come into view. The offset JSONs map each verse to a byte range in the cf*.txt files, enabling the app to fetch just that verse’s line. On toggling the Cross-References column, the app will fetch the offsets file (if not already cached), then for each verse in the current viewport slice, retrieve the cross-ref line via a range request and parse it. The parsed cross-references for each verse are stored (e.g., as an array of groups, each containing verse IDs). Status: The cross-reference backend integration is operational (the data can load), but the UI display is pending final hookup. As of now, the Cross-References column may render in the UI but not show actual data until the remaining UI logic is completed (recent backend fixes have made the data available via BibleDataAPI and worker parsing).

## Prophecy Fulfillment System (references/prophecy_rows.txt & prophecy_index.json):
This system tracks biblical prophecies – predictions, their fulfillments, and extra verification verses. It uses a two-file approach:

### prophecy_rows.txt – 
a line for each verse that is involved in a prophecy. Format:

[VerseID]$[id:type, id:type, …]
For example:
1Chr.10:13$127:V,128:V
1Chr.11:1$128:P
1Chr.11:3$129:F
This means verse 1 Chronicles 10:13 has two prophecy references (IDs 127 and 128) both as V(erifications), 1 Chronicles 11:1 is a P(rediction) with ID 128, and 1 Chronicles 11:3 is an F(ulfillment) of prophecy ID 129. The parser will convert this into a structure like:
json
Copy
"1Chr.10:13": { P: [], F: [], V: [127,128] },
"1Chr.11:1":  { P: [128], F: [], V: [] },
"1Chr.11:3":  { P: [], F: [129], V: [] },
mapping each verse to lists of prophecy IDs categorized by role.

### prophecy_index.json – 
a detailed index keyed by prophecy ID, giving the full details of each prophecy. For each prophecy ID, it provides a short summary and lists of verses under keys prophecy (the prediction verses), fulfillment, and verification. For example (abbreviated):
json
Copy
"128": {
  "summary": "David’s descendants will become kings",
  "prophecy": ["1Chr.11:1", "..."],
  "fulfillment": ["1Chr.11:3", "..."],
  "verification": ["1Chr.10:13", "1Chr.10:14", "..."]
}
the way that we implement this is

## Labels (Semantic Highlights) (labels/{CODE}/ALL.json):
The app includes a feature for toggling semantic labels on the verse text – for example, highlighting “who/what/when/where” elements of verses in different styles. The data for this lives in JSON files per translation (or a default set). Each file (for instance, labels/KJV/ALL.json) maps verses to an object of label categories. For example:
json
Copy
"Gen.1:1": {
  "who": ["God"],
  "what": ["the heavens", "the earth"],
  "when": ["In the beginning"],
  "where": [],
  "command": [],
  "action": ["created"],
  "why": [],
  "seed": [],
  "harvest": [],
  "prediction": []
}
This indicates in Genesis 1:1, the “who” is "God", the “what” are "the heavens" and "the earth", the “when” is "In the beginning", and so on. When a user toggles a particular label (via a legend in the menu), the app will fetch the corresponding labels JSON if not already loaded, and then apply a text styling to all occurrences of those phrases in the visible verses. For instance, toggling "who" would bold all words identified as the “who” in each verse, toggling "what" might outline those words, "when" underlines, "where" adds curly braces around the phrase, etc. The mapping of label to visual style is as follows (all theme-able): who → bold text, what → outline, when → underline, where → curly braces around text, command → drop shadow behind text, action → italic, why → a cursive/"handwritten" font, seed → a superscript * before the word, harvest → a superscript = before the word, prediction → a superscript ~ before the word. These label effects are not separate columns but inline enhancements on the verse text. Status: The Label legend UI exists and lists all these categories, but the feature is not yet hooked up – toggling the checkboxes does not currently fetch or apply the label data (no event handlers wired). The implementation is planned: the data format is defined and ready as above, and the UI infrastructure to toggle styles per label is in place, so connecting them is a next step.

## Context Groups (metadata/context_groups.json):
This is intended for an optional context boundary feature, where certain ranges of verses (like narrative sections or parallel passages) are highlighted with a subtle background box. The context_groups.json likely contains an array of groups of verse IDs that form a context unit. The app has a toggle for "Context Boundaries" which, when on, would draw light-blue bounding boxes around verses in the same context group. The color would adapt to the current theme for visibility. Status: The context_groups file exists, but the feature is not yet implemented in the UI. The toggle control is present (in the menu), but at the moment it doesn’t trigger fetching the file or rendering any special styling (not wired up, as noted in the pending features list). This remains a to-do item.

## Strong’s Concordance (Original Language Tools):
For word-level study, the app integrates Strong’s Concordance data, which is quite large. There are two massive text files in storage, each about ~70 MB:
### strongs/strongsVerses.txt – 
a verse-centric list of original language tokens. Essentially, for every verse, it likely lists each word with annotations including the Strong’s number. (It may contain interlinear info like the Hebrew/Greek word, its transliteration, Strong’s ID, etc. per verse.)
### strongs/strongsIndex.txt – 
a Strong’s number centric index. For each Strong’s ID (e.g., G430), it lists all verse references where that lemma occurs.
These files are far too large to load entirely in the browser, so the app uses offset mapping and workers for on-demand access:
### strongsVerseOffsets.json (≈1 MB) – 
maps each verse (by verseID) to a byte range [start, end] in strongsVerses.txt.
### strongsIndexOffsets.json (≈1 MB) – 
maps each Strong’s ID (like "H1234" or "G0567") to a [start, end] byte range in strongsIndex.txt.

* The app spawns dedicated web workers for Strong’s lookups:

## VerseWorker: 
When a user double-clicks a verse (or taps an “interlinear” button on a verse), the app will initiate a loading of the original language for that verse. The VerseWorker receives a message containing the verse ID (and a type "VERSE"). It uses the preloaded strongsVerseOffsets map to find that verse’s byte range in the large text file, then performs a Range Fetch via Supabase (this is one case where the worker itself does a fetch, pulling only a 2–4 KB slice). The worker then parses the token data for that verse (splitting out each word, its Strong’s number, etc.) and returns an interlinear data structure to the main thread. The UI then displays an Interlinear Overlay – a grid showing the verse with original language words, pronunciations, and definitions. (This overlay opens successfully, but currently the content boxes may be empty as integration of the parsed data is in progress – see Strong’s Overlay status below.)

## LemmaWorker: 
If within that interlinear overlay (or elsewhere) the user clicks on a specific Greek/Hebrew word (usually identified by a Strong’s number), the app will trigger a lemma search. The LemmaWorker is sent a message with the Strong’s ID (e.g., "G430") and type "LEMMA". It then uses the strongsIndexOffsets map to get the byte range for that ID in strongsIndex.txt, fetches that 2–5 KB segment, and parses it to get the list of all verses containing that word. The results (a list of verse references) are returned to the main thread, which then can display them in a side panel (a search results drawer showing all verses that contain that original word). From there, the user can click any verse to navigate.

* The design keeps the Strong’s data "cold" until needed – meaning the large text files are not downloaded at all unless the user specifically engages the original language features. Only the small offset maps (~1 MB each) might be fetched upfront or on first use to enable instant random access. Those offsets allow near-instant lookups of tiny slices, making the experience of fetching a verse’s original words or searching a lemma very fast (just a couple KB transferred). Status: The Strong’s lookup pipeline is partially implemented. The offset files and workers exist, and double-clicking a verse does open an overlay (indicating the VerseWorker is invoked). However, currently the overlay UI is not populated with the interlinear word grid – the integration of the parsed data into the display is incomplete. Similarly, the Lemma search drawer logic is present but not yet fully wired to the UI (clicking a word may not trigger the search in the current build). These are noted as pending tasks (Strong’s overlay UI and search worker hookup). Once finished, this will provide a powerful concordance tool without overwhelming the app’s initial load.
  
* In summary, the app’s data loading strategy is file-oriented and batch-optimized. It fetches entire files where feasible (translations), or uses index-guided partial fetches for large reference files, always caching results to minimize duplicate calls. Parsing heavy content is delegated to Web Workers (especially anything ~8 MB or larger, per performance guidelines). This allows the main thread (and UI) to remain responsive – as a mental model: “React knows the verse IDs; Workers cut 2–4 KB slices out of 70 MB scrolls on Supabase, parse them off-thread, and the UI paints instantly.”.
  
# Offline Support and PWA Features
The application is designed as a Progressive Web App (PWA) with full offline-first functionality. Users can install it on their device, and it will continue to work without an internet connection, syncing data when connectivity is restored. 
* Key aspects of the offline architecture:

## IndexedDB (Dexie) for Local Storage: 
The app uses Dexie (a wrapper around IndexedDB) to maintain a local database for user-created content while offline. The schema includes tables for notes, bookmarks, highlights, etc., each augmented with a pending boolean flag. Whenever the user adds/edits a note, highlight, or bookmark while offline, the change is saved locally with pending: true. Each row also carries an updated_at timestamp. This allows a conflict-free sync strategy: when back online, the server (Supabase Postgres) can merge changes by considering timestamps or simply overwriting with the latest.
## BibleDataAPI Offline Wrapper: 
The BibleDataAPI functions are aware of offline state. Reads (fetching verses or references) will serve from cached data or fall back to previously fetched content if offline (and thanks to Workbox caching of translation files, even a cold start offline can still show the last viewed Bible content). Writes (notes, etc.) are funneled into the local Dexie store if offline. The design follows a facade pattern so that whether online or offline, components call the same API – the implementation handles queuing and fallback transparently.
## Sync Queue and Background Sync: 
A service worker (registered via Vite’s PWA plugin) is set up to handle a background sync event. When connectivity is regained, the service worker will wake and invoke a queueSync routine. This routine (in offline/queueSync.ts) goes through all Dexie records marked pending and attempts to push them to Supabase (via BibleDataAPI or directly using the Supabase client). If the sync succeeds, those local records are marked as not pending (or removed if they were just temporary IDs). In case the service worker sync fails or isn’t supported, the app also triggers sync on its own (for example, when the user opens the app after being offline, it checks for connectivity and then processes the queue). This ensures no data loss – any action taken offline will be saved locally and then sent to the server when possible.
## Workbox Caching & PWA Shell: 
The app uses Workbox (via vite-plugin-pwa) to precache static assets (HTML, CSS, JS, and core data files) and to implement runtime caching for dynamic content. The service worker script (client/src/sw.ts) was created to handle caching strategies. For example, the Bible translation text files from Supabase might be configured with a cache-first strategy so that once downloaded, they are served from cache on subsequent loads (even offline). The service worker also cleans up old caches on update to avoid storage bloat. Importantly, the PWA is configured to only register in production builds (to avoid interfering with the dev environment). In production, the web app can be installed to the home screen on mobile or desktop and will function as a standalone app with offline capabilities.
## Connectivity Indicator: 
The UI includes a real-time connectivity status indicator (e.g., a green dot for online, amber/orange for offline) located at the bottom-right corner. This is managed by a React hook useOnlineStatus() which listens to the navigator.onLine browser API and updates state accordingly. The indicator provides immediate visual feedback so the user knows if they are offline (and thus that changes will be stored locally). It complements the behind-the-scenes sync mechanism by making the app’s status transparent. The goal is a seamless user experience: the user should not feel any difference between online and offline usage in terms of using the app to read or take notes.
## No Data Loss Guarantee: 
Through the above measures, the app ensures that any user-generated data is safely retained. If a user highlights verses on a plane with no internet, those highlights are saved in IndexedDB. When a connection is re-established, the background sync will push them to the server and the UI state will merge appropriately. This approach also allows optimistic UI updates – e.g., the moment you highlight a verse, it appears highlighted in the UI (written to local DB), without waiting for a server round-trip. The next time the app syncs, the server copy will update. Conversely, if the user logs in on another device, TanStack Query will fetch the latest server state and the local pending items will reconcile (merging by updated_at to avoid clobbering newer changes).
## Testing & Validation: 
The offline system has been tested with unit tests (simulating offline mode, ensuring local writes happen and pending flags set) and integration tests (using Cypress to simulate going offline, making changes, coming back online to see if sync occurs and UI updates). Architectural rules like “all data access through BibleDataAPI” are enforced (AST grep validations) to ensure no part of the code accidentally bypasses the offline system. Performance has been measured to confirm reduced network calls and quick UI responses when offline actions are taken (reads hit cache, writes don’t block UI).
## PWA Install & Manifest: 
The app provides a Web App Manifest (public/manifest.json) with appropriate metadata so that it can be installed on devices (icons, theme color, offline start URL, etc.). During production build, the PWA plugin ensures the service worker and manifest are correctly generated and registered. The team validated that the PWA install prompt appears and that the app runs in standalone mode without issues. iOS Safari behavior (which doesn’t show prompts) is handled by providing manual instructions for adding to home screen, etc. All these steps make the app ready for mobile usage with an app-like experience.
* Overall, the offline-first PWA implementation is complete and production-ready. Users can read the Bible and create notes/highlights without internet access, with confidence that everything will sync to their account when reconnected. This robust offline capability is crucial for a Bible study app, ensuring usability anywhere and anytime.
  
# Current Feature Status (UI Integration as of July 2025)
Many core features of the application are implemented at the data level, but not all are fully wired into the user interface yet. The recent refactor focused on consolidating data sources and performance optimizations; now the attention is on hooking up remaining UI elements and interactive features. Below is a summary of major features with their current status in the UI:
## Verse Text & Scrolling – Visible & Functional: 
All 31,102 verses of the Bible are loaded from Supabase and can be scrolled seamlessly in the main table. The multi-column layout (for multiple translations side-by-side) works, and the scrolling/anchor system performs smoothly (no blank gaps or excessive memory use). The primary translation (KJV for guests) loads by default and additional translations can be added via the menu. Verse text rendering and the anchor-centered virtual scroll are fully operational. Performance note: After fixes, there is no more lag even on mobile devices – e.g., iPhone performance issues were resolved by removing an old heavy loading screen and preventing duplicate loads.
## Multi-Translation Columns – Visible & Functional: 
Users (guests and logged-in) can toggle on a selection of Bible versions to compare. In guest mode, only a limited set (KJV plus a few others like BSB, WEB, YLT) are enabled; the rest appear greyed out (feature gating). Logged-in users will have access to all supported translations. Currently, the UI allows adding columns and the text populates correctly from the cached Map for each version. Removing a column also works. The alignment of verses across columns is handled by the anchor system (all columns share the same verse list). This feature is largely complete, though future optimization will parse each translation off the main thread to improve initial load speed (a noted enhancement).
## Hamburger Menu & Settings – Visible & Functional: 
The main menu (accessible via the “hamburger” button) opens a settings panel. This panel contains toggles and options for various features (theme switcher, font size, columns selection, etc.), as well as links to Sign In/Sign Up (when logged out) or user profile options (when logged in, in future). The menu UI renders properly and all buttons are present. However, many toggles inside are not yet wired to actions (see below for each feature).
## Online/Offline Indicator – Visible & Functional: 
As mentioned, a small indicator shows the connectivity status. This is working – e.g., turning off network will change the icon color, and a tooltip may indicate offline mode. The feature is fully implemented.
Footer and UI Layout – Visible & Polished: The footer (if any, with info or links) is present and styled well. The overall UI layout with a fixed header, scrollable verse area, and resizable columns is looking good on desktop and tablet.
## Intro Tour/Loading Screen – Removed/Optimized: 
The initial “loading” splash screen or tutorial that previously existed has been removed to speed up first paint. Now the app loads directly into the main interface, since the new loading system is fast enough and a heavy introductory loader was causing performance issues. The blue circular loading wheel component still exists for possible use during data fetches, but the blocking fake-progress bar was dropped.

* Now, for features that exist but are not yet functional (pending UI hookup or further development):

## Cross-References Column: 
Not yet connected (UI pending). A toggle for Cross-References exists (likely in the menu), and a blank column can appear for cross-reference data. The backend is ready (the app can load cross-reference lines via BibleDataAPI), but currently the UI does not display the fetched references. This means when you toggle it on, you might see an empty column or no change. Wiring the data to actually populate that column (each verse’s references, grouped and formatted perhaps as superscript letters or clickable links) is in progress. The core loading was recently fixed in code, so this should be a matter of front-end work now.
## Prophecy Columns (P/F/V): 
Not yet connected (UI pending). Similarly, a toggle for Prophecy is present, intended to show three small columns. At the moment, toggling it may not visibly do anything (or shows empty P|F|V columns). The logic to load prophecy data is implemented and was tested (prophecy data fetch was marked fixed). What remains is updating the UI to display the counts or indicators in those columns for verses that have prophecy links, and to open the prophecy detail drawer when those indicators are clicked. Until that is done, the Prophecy feature appears non-functional from a user perspective.
## Labels Legend (Who/What/When/etc.): 
Not connected. The menu includes a “Labels” or “Legend” section with checkboxes for Who, What, When, Where, Command, Action, Why, Seed, Harvest, Prediction (as described in data section). These checkboxes currently do nothing when toggled. The underlying mechanism (fetching labels/ALL.json and applying text styles) is not yet implemented. This is a planned enhancement – to let users highlight different facets of verses – but for now it’s just an inert part of the UI.
## Global Search Bar: 
UI present but not functional. There is a search icon (and in some layouts a search input) intended for a global verse text search. Currently, clicking the search or pressing enter does not bring up any results. Only a very basic search of the currently loaded translation is implemented internally, but the UI is not wired to display those results in a modal as intended. The design calls for a search results overlay listing verses matching the query (and possibly a random verse feature with a '%' query). This whole search overlay is still to be done. As of now, the user will not get any feedback from using the search bar.
## Theme Switching: 
Not working. Multiple themes (Dark, Light, Sepia, Fireworks, Aurora, etc.) are defined in the design, but the theme toggle in the UI currently does not actually change the theme. The app likely defaults to Light theme; selecting another theme in the menu might not apply the new styles (the underlying CSS or context provider for theming is probably not fully implemented). This is on the to-do list to implement, including adaptive highlight colors for each theme.
## Text Size Adjustment: 
Not working. A control for content size (small/medium/large text) exists in the UI, but changing it does not currently resize the text. The intention is to allow scaling of text (and possibly column width adjustments) for accessibility. This will require hooking the UI control up to a global style or context that alters CSS classes or Tailwind variables for font sizes. It’s not yet done, so toggling it has no effect.
## Highlights (User Text Highlighting): 
Not yet functional. The ability to select text in a verse and highlight it with a color is planned. The UI workflow sketched out: when a logged-in user selects text, a highlight color wheel should appear, allowing them to pick a color, and the text is then highlighted and saved. At present, selecting text does not trigger any highlight UI. This feature is awaiting the completion of the authentication system (since highlights are saved per user) and the implementation of the selection tooling. So, highlighting is effectively absent for now.
## Notes Column: 
Not visible/working yet. There is a concept of a “Notes” column (where a user’s personal note for each verse would show). In the UI design, this might be a toggleable column just like translations or cross-references. Currently, the Notes column is not exposed to the user – likely hidden until login is available. The infrastructure in the database exists (userNotes table) and the plan is to show an icon or placeholder where users can add a note for a verse. This feature will come once user accounts are working; at the moment, there’s no UI for adding/viewing notes in the verse table.
## Bookmarks:
Parts pending. The user can presumably bookmark verses (in design, by right-clicking a verse or clicking a bookmark icon). The bookmark UI involves choosing a color and maybe a name. It saves the bookmark to the database and would show a small colored indicator on a global scroll track. Right now, because login is not functional, bookmark actions are not testable in the UI (guests might not have the option, or if they do it would only persist locally). The described bookmark selector modal (triggered by right-click) is likely not implemented yet. Additionally, deleting bookmarks or editing them is not implemented (it’s noted as a missing feature that bookmarks can be added but not removed yet).
## Global Scrollbar with Bookmarks: 
Not yet implemented. The design calls for an enhanced scrollbar on the side of the page that shows markers for bookmarked verses (color-coded dots) and allows clicking to jump to those verses. This has not been built yet. Currently, the app likely uses a regular scrollbar with no special markers. Improving this (perhaps a custom scroll track component) is a future improvement.
## Responsive Layout (Mobile Adaptation): 
Needs improvement. On very small screens (mobile phones), the current UI isn’t fully optimized. Issues include:
### The top header has shortcuts (like Genesis 1:1, Psalm 23, John 3:16 suggestions) that take up space; on mobile these should be removed to save room.
###  The Sign In / Sign Up buttons currently both show in the header on mobile, crowding it – the plan is to condense to a single icon or button (possibly a user avatar icon) (on mobile and for desktop view for simplicity.
### The search bar on mobile should perhaps be just an icon (magnifying glass) until tapped, to avoid a large input field.
### Horizontal scrolling for multiple columns is tricky on mobile; currently one can scroll the columns left-right, but it’s easy to accidentally scroll the whole page vertically at the same time. The team intends to possibly lock one scroll direction at a time or provide a toggle to switch between vertical and horizontal scroll modes on mobile. This is still an open UX problem. As of now, using multiple columns on a phone is cumbersome (and not officially supported yet).
* In short, the app looks good on desktop and tablet, but on phones some UI elements overlap or aren’t as usable. A responsive redesign or adjustments are planned. Currently, mobile users may find the interface clunky – this is acknowledged as an area to refine.
  
## User Authentication (Sign Up/Sign In): 
UI in place, backend pending. The header and menu include “Sign Up” and “Sign In” buttons. Clicking them opens a modal dialog for entering credentials. However, since the Magic Link authentication system is not yet implemented, these modals likely do not actually create or log in a user. The next development priority is to implement Supabase Magic Link auth. Once that’s done, these buttons will trigger sending a magic link to the provided email and on success, the app will have an authenticated session. For now, the modals appear (so that part is working visually), but you cannot actually register or login – effectively everyone is in guest mode at the moment. Consequently, all user-specific features (notes, saving highlights, cloud sync, forum posts) cannot be tested yet by a user. This is the top priority feature to complete next, as it will unlock and tie together many of the other features.
## Forum and Community Features: 
Part of the vision is a forum where users can discuss verses, and vote on posts (with safeguards against duplicate voting). It’s unclear how much of this is currently present in the UI. The database has tables for forumPosts and forumVotes, and earlier versions of the project mention a Forum integration. However, in the current refactor, focus has been on core Bible reading features. The forum interface might not be surfaced yet in the app, or if it is, it’s in an early state. A noted missing piece is the vote guard to prevent multiple votes by the same user. This suggests the forum might exist basically, but polishing is needed. Given the authentication isn’t done, the forum (which requires login) is probably not usable right now. We can consider forum features as present in code but not active in UI until user accounts are live.
## Drag-and-Drop Column Reordering: 
Not implemented. A UI feature was planned to let users reorder the columns by dragging the column headers (and possibly lock column widths by dragging the edges). The design notes indicate a “lock” button or mode for customizing column order and width. As of now, this interactive behavior is not in place – columns appear in the order toggled, and there’s no drag handle. The “lock” flag in code exists but isn’t utilized. This is a future enhancement. Additionally, when this is implemented, attention will be given to keyboard accessibility (ensuring that the reordering and resizing can be done via keyboard for a11y) – which is noted as a to-do (ensuring drag-drop is not mouse-only).
## Keyboard Navigation & Accessibility: 
Beyond drag a11y, the app will need general accessibility review. Currently, one can scroll and click, but features like focusing verses or using arrow keys to move the anchor are not documented. It’s an area to work on once core features stabilize.

* In summary, the foundation of the application is solid and most heavy-lifting behind the scenes is done – the Bible content loads efficiently, the caching and performance optimizations are in place, and the app is scalable and offline-capable. The focus now is on finishing the remaining feature integrations and UI polish:

### Implementing Magic Link Auth (which is underway as the next priority).
### Hooking up UI for cross-references, prophecy, labels, search, etc., so that these powerful data sets become visible to the end user.
### Enabling user-specific actions: highlights, notes, and bookmarks in a fully functional way (with proper syncing once auth is ready).
### UI/UX improvements for mobile, theming, and overall polish.
### Final touches like Strong’s interlinear overlay content, global search results, and forum enhancements.

* The development team and the Replit AI agent are working in tandem (“one mind”) to achieve these. All recent changes (like data source lockdown, cache unification, removing legacy code) have paved the way for a cleaner, more maintainable codebase. With the remaining feature work and refinements, the application is on track to deliver a comprehensive Bible study tool that is fast, offline-ready, and user-friendly.
  
# Recent Major Changes (for reference)
(This section highlights recent refactor milestones for context and verification of completeness.)

## Header Layout Clean-up (July 26, 2025):
Successfully eliminated all spacing gaps and positioning issues between headers and content:
- **Mobile Gap Elimination**: Removed unnecessary gap above column headers on mobile by setting `top: 0` for column headers within scroll area
- **Desktop Spacing Fix**: Removed negative margin hack and eliminated gap below column headers on desktop
- **Unified CSS Architecture**: Implemented clean media query system where mobile uses `top: 0` and desktop uses `top: var(--top-header-height-desktop)`
- **Consistent Content Positioning**: Verses now start immediately under column headers on both platforms without overlap
- **Dates Column Display**: Fixed dates column header visibility and removed reference marker icons, showing only clean date text
- **Header Height Optimization**: Standardized header bar height increase from 40px to 48px mobile, 52px desktop for better visual hierarchy
- **CSS Class Standardization**: Updated ColumnHeaders to use `column-headers-container` class for proper media query targeting

## Chronological Toggle Implementation (July 23, 2025):
Successfully completed chronological verse ordering functionality:
- **Root Cause Fixed**: Resolved issue where verse loading system bypassed chronological toggle state from store
- **Data Flow Integration**: Modified useBibleData.ts to check chronological state from store on initialization 
- **Event-Driven Architecture**: Implemented custom event system for chronological state changes to trigger verse reordering
- **Verse Reloading**: Created reloadVersesInNewOrder function that loads appropriate verse keys file (canonical vs chronological) from Supabase
- **UI Responsiveness**: Connected store's toggleChronological function to actually trigger verse sequence changes in reference column
- **User Experience**: Toggle now properly reorders all 31,102 verses between canonical Bible book order and chronological historical timeline
- **Performance**: Maintains translation text caching while reordering verse sequence, ensuring smooth transitions

## Cross-References & Prophecy Data Loading (July 21, 2025):
Successfully implemented data loading infrastructure for cross-references and prophecies through BibleDataAPI facade:
- **Cross-References Loading**: Implemented getCrossReferences() function that loads data from Supabase Storage cf1.txt with offset-based parsing
- **Store Integration**: Updated store to trigger cross-reference data loading when toggle is activated, with test loading for Gen.1:1 showing 76 references
- **UI Wiring**: Connected VirtualRow components to display loaded cross-reference data from store state
- **Debugging Added**: Comprehensive logging to track data loading progress and verify store updates
- **Performance**: Data loads on-demand only when Cross References column is toggled, avoiding unnecessary network calls

## Comprehensive File Structure Implementation (July 21, 2025):
Successfully completed systematic implementation of ALL file structure features through unified BibleDataAPI facade:
- **Cross-References System**: Full UI integration with clickable references, group display, and verse navigation
- **Prophecy Columns (P/F/V)**: Complete implementation with interactive ProphecyDetailDrawer showing predictions, fulfillments, and verifications
- **Labels System**: Semantic highlighting toggles for who/what/when/where/command/action/why/seed/harvest/prediction
- **Dates Column**: Timeline data loading with canonical/chronological support
- **Context Groups**: Boundary highlighting system with data loading infrastructure
- **Search Modal**: Global verse search with navigation integration
- **ProphecyDetailDrawer**: Rich tabbed interface for exploring prophecy connections
- **Unified Data Loading**: All features load data on-demand through BibleDataAPI ensuring consistent performance
- **Column Layout**: Proper slot-based positioning (Ref=0, Notes=1, Main=2, Cross=7, P/F/V=8-10, Dates=11)
- **Store Integration**: Complete state management through useBibleStore with toggle functions for all features

## Modern UI Design Overhaul (July 19, 2025):
Comprehensive UI modernization with focus on visual appeal and professional appearance:
- **Hamburger Menu Redesign**: Complete overhaul with desktop-friendly floating card design and enhanced mobile prominence
- **Color-Coded Sections**: Implemented gradient backgrounds for different feature groups (blue for translations, green for tools, orange for display, purple for labels, yellow for bookmarks)
- **Top Header Modernization**: Increased header height to 64px (48px mobile) with larger, more prominent elements
- **Enhanced Logo & Branding**: Added gradient logo icon and "Bible Study" title for better brand recognition
- **Improved Button Sizing**: Larger navigation buttons, enhanced search bar, and more prominent Sign In button with gradient styling
- **Professional Visual Hierarchy**: Better typography, consistent spacing, and modern card-based layouts throughout
- **Responsive Enhancements**: Different animations for mobile (slide-in) vs desktop (scale + fade) interactions

## Mobile-First UI Improvements (July 18, 2025):
Enhanced mobile experience with responsive design improvements:
- Fixed column header positioning to eliminate gap between top header and sticky column headers
- Implemented directional scrolling that prevents diagonal scrolling on mobile (only vertical or horizontal at a time)
- Added scroll synchronization between main content and column headers during horizontal scrolling
- Enhanced font size scaling system to affect entire view (row heights, column widths) not just text
- Improved touch handling with better scroll direction detection and prevention of accidental dual-axis scrolling
- Added responsive CSS rules for better mobile column width optimization
- Implemented expandable search bar (magnifying glass icon) and combined "Sign In/Up" button for mobile
- **Column Layout System**: Implemented slot-based column positioning architecture with predefined slots 0-19 for consistent feature placement and data loading gateway. This ensures when features are toggled, they appear in predetermined positions and trigger appropriate data loading.

## Column Layout & Mobile Dual-Column Fix (July 20, 2025):
Comprehensive layout architecture overhaul for optimal responsive behavior:
- **Single-Step CSS Centering**: Replaced complex JavaScript flex-centering with pure CSS `margin-inline: auto` solution that automatically centers content when ≤3 columns and switches to left-aligned scrolling when more columns exceed viewport width
- **Mobile Dual-Column Mode**: Implemented mobile-specific dual-column layout (portrait mode <640px) with sticky reference column and horizontal scroll snapping for optimal phone experience  
- **Always-Visible Scrollbars**: Added persistent horizontal scrollbar visibility (8px height) to provide visual cue when additional columns are available
- **Vertical Reference Text**: Mobile reference column text rotates vertically (writing-mode: vertical-rl) to maximize space efficiency on narrow screens
- **Removed Dual-Column Desktop Mode**: Eliminated incompatible dual-column logic for desktop to prevent conflicts with center-to-left layout switching

## Comprehensive Data Integrity Lockdown (July 14, 2025): 
Ensured that all data comes from Supabase. Hard-coded all Supabase Storage paths in one place, added a dev-only guard to catch any unwanted API calls, and verified no other data sources are used. After this, 100% of content is loaded via the BibleDataAPI facade from Supabase, with no calls to the old Express endpoints. Web workers were adjusted to request data through main thread messaging to avoid independent network calls. This change unified data access and closed potential inconsistency issues.
## Memory Optimizations & Cache Consolidation (July 15–16, 2025): 
Removed duplicate loading of translations – fixed a bug where the same translation could load multiple times, notably KJV on startup, by refining the caching checks. Also removed an unnecessary heavy loading screen that was consuming memory on mobile. Consolidated multiple verse caches into a single master cache with LRU eviction, as mentioned, thereby reducing memory footprint and complexity. These optimizations resolved performance issues on mobile (particularly iPhone) and made the app more efficient.
## Removal of Legacy Code (PR-A & PR-B refactors): 
Deleted outdated modules such as an old BibleSlice provider, old fetch utilities, and inlined the BibleDataProvider (merging it into the main app flow). Combined Supabase helper code into one file and ensured all components use the new unified approach. This cleanup was essential to implement the one-path data flow and to simplify future maintenance.
## PWA and Offline Implementation Completion (July 2025): 
Finalized the switch to automated service worker registration using vite-plugin-pwa, and thoroughly tested offline functionality (caching strategies, background sync, etc.). Resolved earlier service worker registration issues and confirmed that offline mode works as expected (including on mobile PWA installs). The app meets its offline-first design goals, which was a major milestone for going to production.

* These changes collectively brought the project to its current state: an anchor-driven, React-only, offline-enabled Bible app with Supabase as the backbone. The groundwork is in place; the remaining effort is to refine and expose all features in the user interface. With the system architecture now streamlined, each new feature can be integrated cleanly following the established patterns (using BibleDataAPI, utilizing workers for heavy tasks, and keeping everything in sync with the anchor model and TanStack Query).