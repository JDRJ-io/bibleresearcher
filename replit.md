# Overview

This is a full-stack Bible study application built with React, TypeScript, Express.js, and PostgreSQL. The application provides an interactive Bible reading experience with features like note-taking, highlighting, bookmarking, cross-references, and a community forum. It uses Drizzle ORM for database management and shadcn/ui for the user interface components.

# System Architecture

The application follows a modern full-stack architecture with clear separation between client and server:

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful API endpoints
- **Development**: Hot module replacement via Vite middleware

# Key Components

## Database Schema
The application uses a comprehensive PostgreSQL schema with the following main tables:
- **users**: User account management with UUID primary keys
- **userNotes**: Personal verse notes linked to users and verse references
- **bookmarks**: User bookmarks with color coding and indexing
- **highlights**: Text highlighting with character-level precision
- **forumPosts**: Community discussion posts
- **forumVotes**: Voting system for forum posts
- **userPreferences**: Individual user settings and preferences

## Authentication System
- authentication system that uses Supabase Auth
- User session management via localStorage
- Login/signup functionality with email-based authentication
- User state management throughout the application

## Bible Data Management
- Bible verse data with multi-translation support (KJV, AMP, BSB, CSB, ESV, NKJV, NASB, NLT, NRSV, WEB, YLT, NIV)
- Cross-reference system linking related verses
- Strong's concordance integration for original language study
- Prophecy tracking and fulfillment verification

## User Interface Components
- **BibleTable**: Main verse display with column-based layout
- **ExpandedVerseOverlay**: Detailed verse study modal
- **HamburgerMenu**: Application settings and preferences
- **AuthModal**: User authentication interface
- Comprehensive form components and UI primitives

# “One-main-path” directive for Anointed.io (concise)

Our production architecture must be React-centred, anchor-driven, single-path:

## Anchor is king – the debounced mid-viewport sensor emits anchorIndex; every verse-slice (loadChunk(anchorIndex)) and every fetch derives only from that value. No other code may interpret scrollTop or the window edges.

## React owns the DOM – UI work happens inside functional components like AuthModal, BibleTable, etc.; they already manage state declaratively.
All direct document. or querySelector calls must be removed or wrapped in a single ref-based helper inside a hook.

## Canonical hook – export useAnchorSlice() which returns {anchorIndex, slice}. VirtualBibleTable, overlays, and any future views consume this hook instead of rolling their own maths.

## Data-layer facade – expose a tiny BibleDataAPI (getVerseMeta, getTranslationText, getProphecyMeta). UI code imports only this API, never Supabase or raw fetch; the implementation can later be swapped for an edge cache without touching components.

## Scroll preservation – if a component mutates rows, it calls onPreserveAnchor(ref, savedIndex) once. That callback is the only place allowed to set scrollTop.

## Guardrails – jest tests feed synthetic scroll values into useAnchorSlice() to guarantee the slice always contains the anchor verse; Cypress scroll tests ensure ≤ 4 network calls /s under rapid scrolling.

## This unification removes parallel DOM/React code paths, shrinks the bundle, and scales cleanly to 10 000 concurrent users while retaining the smooth anchor-based infinite scroll experience

# Data Flow

1. **Client Initialization**: React app loads and checks authentication status
2. **Data Fetching**: TanStack Query manages API calls and caching
3. **Bible Content**: Verses loaded from data with translation selection
4. **User Interactions**: Notes, highlights, and bookmarks saved to PostgreSQL
5. **Real-time Updates**: Query invalidation ensures UI stays synchronized
6. **Forum Integration**: Community features with voting and discussion

# External Dependencies

## Core Technologies
- **React Query**: Server state management and caching
- **Drizzle ORM**: Type-safe database operations
- **Zod**: Runtime type validation and schema parsing
- **Radix UI**: Accessible component primitives
- **date-fns**: Date manipulation utilities

## Development Tools
- **Vite**: Fast build tool with HMR support
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundling for production
- **PostCSS**: CSS processing with Tailwind

## External Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Integration**: Development environment optimizations

# Deployment Strategy

## Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Port Configuration**: Local port 5000 mapped to external port 80
- **Hot Reload**: Vite dev server with Express middleware

## Production Build Process
1. **Frontend Build**: Vite compiles React app to static assets
2. **Backend Build**: ESBuild bundles Express server
3. **Database Migration**: Drizzle Kit handles schema updates
4. **Asset Serving**: Express serves static files in production

## Environment Configuration
- **Development**: `npm run dev` - starts dev server with HMR
- **Production**: `npm run build && npm run start` - builds and serves optimized app
- **Database**: Drizzle migrations via `npm run db:push`

# Master List of Functions from Author
## Vocabulary & Conventions
-verseID Exact key string Book.Chapter:Verse (e.g. Gen.1:1). Universal primary key across every dataset.
-file code three‑ or four‑letter translation code (KJV, ESV, AMP, NKJV…).
-resourceCache In‑memory Map<string, unknown> that stores each fetched resource exactly once per session.
-worker Web Worker handling any parse or download job ≥ 8 MB (translations, Strong’s blobs, etc.).

## Master Index (must load first)
Toggle files
Canonical metadata/verseKeys‑canonical.json and metadata/dates‑canonical.txt
Chronological metadata/verseKeys‑chronological.json and metadata/dates‑chronological.txt

Steps
Fetch chosen verseKeys‑*.json, parse into const verseKeys: string[].
All later look‑ups are O(1) via verseKeys[index].
The paired dates‑*.txt is fetched only when the Dates column becomes visible.

## Core Data Files

### Translations translations/{CODE}.txt

Gen.1:1 #In the beginning God created the heaven and the earth.
Gen.1:2 #And the earth was without form, and void …
Delimiter # splits verseID from text.


// when user toggles a translation ON
if (!resourceCache.has(code)) {
  const blob = await fetchOnce(`translations/${code}.txt`);
  const map  = parseTranslation(blob);  // Map<verseID,string>
  resourceCache.set(code, map);
}
activeTranslations.add(code);
renderViewport();        // first entry becomes main column

### Cross‑references references/cf1.txt, references/cf2.txt
cf1 toggled on from beginning

example of cross reference actual text:
Gen.1:1$$John.1:1#John.1:2#John.1:3$Heb.11:3
Gen.1:2$$Jer.4:23$Ps.104:30

$$ separates the main verse from the first reference group.
$ separates groups.
# separates verses within a group.

### Prophecy subsystem — new file pair
Files in Supabase

references/prophecy_rows.txt (one line per verse)

references/prophecy_index.json (detail dictionary keyed by ID)

#### Row file grammar prophecy_rows.txt

verseID $ id:type , id:type , …
Example lines
1Chr.10:13$127:V,128:V
1Chr.11:1 $128:P
1Chr.11:3 $129:F
$ separates the verse from the list

, separates multiple items

id is an integer key into prophecy_index.json

type is P (prediction) F (fulfilment) V (verification)

Result after parse (per verse):

Example lines:
{
  "1Chr.10:13": { P:[], F:[], V:[127,128] },
  "1Chr.11:1" : { P:[128], F:[], V:[]  },
  …
}
#### Index file prophecy_index.json

{
  "1": {
    "summary": "Death will become the normal lot of man",
    "prophecy":   ["Gen.2:17","Gen.3:19"],
    "fulfillment":["Rom.5:12"],
    "verification":["Eccl.3:2","Heb.9:27","Jas.1:15","1Cor.15:21","1Cor.15:22"]
  },
  "2": {
    "summary": "After a twice‑stated interval, the flood will destroy all life",
    "prophecy":   ["Gen.6:3","Gen.6:7","Gen.6:13","Gen.6:17","Gen.7:4","Heb.11:7"],
    "fulfillment":["Gen.7:17","Gen.7:18","Gen.7:19","Gen.7:20","Gen.7:21","Gen.7:22","Gen.7:23"],
    "verification":["Gen.6:5","Gen.6:6","Gen.7:1","Matt.24:37","Matt.24:38","Matt.24:39","2Pet.2:5"]
  }
}

#### Load flow
First time the Prophecy columns are toggled
• fetch prophecy_rows.txt, parse into Map<verseID,{P[],F[],V[]}>, cache in resourceCache.
• UI renders counts or coloured dots in three new columns P | F | V.

User clicks a prophecy‑ID chip
• if not already cached, fetch prophecy_index.json inside ProphecyWorker.
• look up the ID, return {summary, prophecy[], fulfillment[], verification[]}.
• UI opens a side drawer with the summary and three verse lists; clicking any verse jumps to it.

### Label files labels/{CODE}/ALL.json

Label = Effect in Verse Text


{
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
}

when a chosen label from the label legend is toggled in
every selected chosen label element, for the verses in the viewport is loaded, for example; if the why is chosen, every verse in viewport with information in their "why": brackets [] will be displayed in handwritten font.

Labels are extra metadata—not a table column—used for illustrative descriptions around verse text to help differentiate elements of text more easily

who = Bold
what = Outline 
when = Underline
where = {Curly Brackets}
command = shadow
action = Italicized
why = Handwritten font
seed = Superscript "*" before word
harvest = Superscript "=" before word
prediction = Superscript ~ before word

Viewport Rendering (“Anchor Trick”)

(main loading system)
function loadChunk(center: number, buffer = 250) {
  const start = Math.max(0, center - buffer);
  const end   = Math.min(verseKeys.length, center + buffer);
  return verseKeys.slice(start, end);
}
Only 150–250 DOM rows exist at any time; works for canonical or chronological order.

## Optional Columns and Extra Resources
-Dates column dates‑*.txt (same # delimiter as translations)
-Cross‑reference columns cf1.txt, cf2.txt
-Prophecy P/F/V columns prophecy‑file.txt (+ prophecyDetails.json for the drawer)
-Labels labels/{CODE}/ALL.json (loaded on first toggle)
-Context groups metadata/context_groups.json (array‑of‑arrays used for row shading)
-Strong’s assets (see next section)

## Strong’s Sub‑system
Big blobs in Supabase
-strongs/strongsVerses.txt (70 MB, verse‑centric)
-strongs/strongsIndex.txt (70 MB, lemma‑centric)

Tiny helper maps
-strongs/strongsVerseOffsets.json (≈ 1 MB, verseID → [start,end])
-strongs/strongsIndexOffsets.json (≈ 1 MB, G/H# → [start,end])

Workers
VerseWorker receives {t:"VERSE", id:"Gen.1:1"}
→ uses verse offset map, Range‑fetches 2‑4 KB, parses tokens, returns interlinear grid.

LemmaWorker receives {t:"LEMMA", id:"G430"}
→ uses index offset map, Range‑fetches 2‑5 KB, parses hits, returns list of verses.

Rules:
-Offset JSONs load once on main thread and live in memory.
-.txt blobs stay raw (no gzip) so byte ranges align.
-Cached slices skip network on repeat views.

## Performance & Threading Rules
-Exactly one fetch per resource per session, stored in resourceCache.
-Any blob ≥ 8MB parses inside a Web Worker.
-Streaming parsers may paint rows while data arrives.
-Strong's blobs stay cold until user opens interlinear or lemma search.

## Auth & Feature Gating
Guest mode
Main translation locked to KJV; alternates limited to BSB, WEB, YLT; others greyed out.

Notes, Highlights, Bookmarks buttons show toast “Sign in to save.

No persistent state; page reload resets everything.

Signed‑in user
Access to all translations. KJV, NKJV, AMP, NLT, ESV, NIV, NASB, CSB, BSB, NRSV, WEB, YLT

Supabase tables notes, highlights, bookmarks, settings, user_actions restricted by user_id.

On login the app restores main + alt translations, last anchor verse, scroll position, theme, and the last 10 actions.
Also restores layout mapped of chosen arrangement of columns, text size, labels toggled, notes saved, bookmarks remembered

User profile persistence
Intro banner after login (greeting + patch notes + verse of the day).
Auto‑save of column layout and verse location every minute
Mobile profile loads last spot with default layout and optional Notes column.
   autosave happens with the circle intro bible wheel, visible in tiny overlay on the bottom right of window

Implementation cue:

const user = supabase.auth.user();
const isGuest = !user;
const availableTranslations = isGuest
  ? ["KJV", "BSB", "WEB", "YLT"]
  : ALL_TRANSLATIONS;

## UI → Data Event Flow (bullet form)
User/Guest scrolls
→ loadChunk(anchor) replaces 150‑row window.

### User/Guest toggles a translation
→ if cache miss, fetch whole 4 MB file, parse in TranslationWorker, then renderViewport().
   if selected for main translation 
   →switch main translations text.
   if selected for multi-translation, 
   →add additional column with that translations text appropriately aligned to new column, verse text appearing in line with verseKey reference markers

### User/Guest opens Labels Legend (menu)
   →list of togglable buttons appear
   who = Bold
   what = Outline 
   when = Underline
   where = {Curly Brackets}
   command = shadow
   action = Italicized
   why = Handwritten font
   seed = Superscript "*" before word
   harvest = Superscript "=" before word
   prediction = Superscript ~ before word
   User toggles any of these labels from the legend
   → fetch label JSON, add metadata layer.

### User/Guest toggles Prophecy
→ fetch pointer map, show P/F/V counts; prediction column, fulfillment column, verification column
   -each separately togglable after prophecy is toggled on

### User/Guest double‑clicks verse
→ VerseWorker slices strongsVerses.txt, paints interlinear grid.
   User clicks Hebrew/Greek token
   → LemmaWorker slices strongsIndex.txt, fills search drawer.

### Logged in User selects portion of verse/note text
→ Highlight wheel appears for marking that text with chosen color. as user scrolls across different colors in wheel, the selected texts highlight changes to show the user the color they will be choosing.
   Highlighted color is selected
   →chosen highlight color is applied to text, exact characters in text are recorded with chosen color, e.g. 1Sam.15:7 5-10 #FFEA00 (5-10 = characters chosen within verses text to highlight, #FFEA00 = color code chosen)

### Logged in User holds right mouse button on chosen verse
→bookmark selector modal popup, allowing user to see selected verse marker chose, type bookmark name for rememberance, choose color for bookmarker
   User selects save in bookmark modal popup
   →Verse's index reference is saved in bookmark references associated with that user's profile, bookmark indicator is saved in the exact line of where the pixels of that versekeys reference is in the global scrollbar

## Additional Features

### Themes 
Theme modes: Dark, Light, Sepia, Fireworks, Aurora.
   -Adaptive highlight colours per theme.

### Bookmarking specifics
Colour dots along global scrollbar showing bookmark positions. (verkey reference saved bookmark positions)
Scroll‑jump when user clicks a bookmark in the track (global scrollbar)

### Context boundaries
Context toggle that draws light‑blue bounding boxes based on context_groups.json.
color of context boundaries adapt to aesthetically noticable color based on theme chosen

### Column customization (lock button)
drag‑and‑drop 
user hold-clicks column header, column hovers and allows user to drag it inbetween rows
user clicks side border of column header
→allows changes in size of column 
text-wrapping & internal scroll if a cell overflows remain

### Content‑size control (small / medium / large). shifts the size of all texts and columns, headers to larger of smaller size in aesthetic adaptability

### Global navigation
-Back ⟵ / Forward ⟶ history buttons (verse jump history).
-go to-> specific verse
-curated list of verseKeys
-Global search bar that queries all active translations. with % random verse selector 
-Sign Up/Sign In Button
-Hamburger button opens the floating settings panel.

## Key‑Join Guarantee
Every dataset uses the identical verseID string.

Switching canonical ↔ chronological only reorders verseKeys[]; no data re‑keying needed.
All joins are direct map look‑ups (map.get(verseID)).

## Do & Don't Reminder
### Do
-Parse blobs > 8 MB in a Worker.
-Regenerate offset JSONs whenever their source files change.
-Keep row rendering virtualised (150–250 rows).

### Don't
-Gzip the big .txt blobs (breaks byte ranges).
-Range‑slice 4MB translation files (load them whole once).
-Block the main thread with Strong’s parsing.

## One‑sentence mental model
React knows the verse IDs; Workers cut 2‑4 KB slices out of 70 MB scrolls on Supabase, parse them off‑thread, and the UI paints instantly—guests explore, users get everything saved.

## GUEST VS USER EXPERIENCE
The guest experience persists only in localStorage; the moment a user logs in, everything syncs to per‑user rows in Supabase and merges back on every device, with TanStack Query keeping the UI snappy and a debounced queue guarding against write storms.

# Recent Changes


## Current Status  
- **PWA PRODUCTION READY**: Complete progressive web app with offline-first architecture and enterprise-grade caching
- Bible website fully operational with Excel-style layout and fixed 120px row heights
- Complete Bible loading implemented with all 31,102 verses from user's actual Supabase KJV file
- **GLOBAL VERSE TEXT LOADING COMPLETED**: ProphecyColumns now displays actual Bible text for all verse references with clickable navigation


## Next Priority: Magic Link Authentication System
- **GOAL**: Transform top-bar "Genesis 1:1 / Psalm 23 / John 3:16" shortcuts into living entrance
- **LOGGED OUT**: Show glowing "Sign Up" and "Sign In" buttons
- **LOGGED IN**: Replace with circular avatar + display name (e.g., "👤 Jacob Brinhad")
- **AUTH METHOD**: Supabase Magic Link (email-only, no password)
- **SIGN UP FLOW**: Name + email → magic link → automatic account creation
- **SIGN IN FLOW**: Email only → magic link → session restoration
- **SESSION PERSISTENCE**: localStorage-based session management
- **PROFILE DROPDOWN**: "My Profile", "Sign Out", "Pay It Forward" options

# User Preferences

Preferred communication style: Simple, everyday language.
Project focus: Excel-style Bible interface with comprehensive study tools and multi-translation support.
Data source: User's Supabase storage containing actual Bible translations and reference materials.



# Implementation Status (July 2025)

## Missing Core Features (Per User Analysis)
0. Current Bottleneck
   Load Speed: All translations parse on the main thread.
Fix: parse each translation in its own worker, then post back a Map<verseID,string>; paint rows incrementally as each worker resolves.
1. cross reference loading
2. prophecy columns loading
3. **Chronological Order**: Button exists but doesn't reorder verses
4. **Legend Word Highlighting**: Checkboxes exist but no event listeners or word markup
5. **Context Borders**: toggle exists but context_groups.json never fetched
6. **Global Search**: Only searches current translation, % random verse not handled
7. **Strong's Overlay**: Opens but no word boxes or worker integration
8. **Web Worker**: searchWorker.js exists but not connected
9. **Drag Column Reordering**: No drag listeners, lock flag unused
10. **Bookmark Delete**: Only adds, no delete functionality
11. **Forum Vote Guard**: No duplicate vote prevention