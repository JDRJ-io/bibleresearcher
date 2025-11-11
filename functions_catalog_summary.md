# Functions Catalog Summary
*Comprehensive analysis of Bible study application codebase*

## High-Level Counts by Kind

| Kind | Count | Percentage |
|------|-------|------------|
| **React Components** | 12 | 35.3% |
| **React Hooks** | 10 | 29.4% |
| **Functions** | 7 | 20.6% |
| **API Handlers** | 2 | 5.9% |
| **SQL Functions** | 6 | 17.6% |
| **Web Workers** | 3 | 8.8% |
| **Classes** | 1 | 2.9% |
| **TOTAL** | **34** | **100%** |

## Top Files with Most Symbols

| File | Symbol Count | Primary Focus |
|------|--------------|---------------|
| `client/src/App.tsx` | 2 | Core application shell and central state management |
| `client/src/data/BibleDataAPI.ts` | 4 | Bible data loading and caching system |
| `client/src/hooks/useAdaptivePortraitColumns.ts` | 2 | Responsive column width calculations |
| `migration.sql` | 4 | Database schema and security setup |
| `migration-username-function.sql` | 2 | Username management system |
| `shared/schema.ts` | 4 | Database table definitions |
| Individual component/hook files | 1 each | Specialized functionality |

## Tables/Endpoints Touched and Governing Symbols

### Database Tables
| Table | Governing Symbols | Purpose |
|-------|-------------------|---------|
| **users** | `users` schema, `CREATE_TABLES`, `signup` API | Core user authentication and profiles |
| **user_notes** | `notes` schema, `useNotes` hook, `CREATE_TABLES` | Verse-specific user notes |
| **user_bookmarks** | `userBookmarks` schema, `useBookmarks` hook | User's saved Bible verses |
| **user_highlights** | `userHighlights` schema, `useHighlights` hook | Text highlighting in verses |
| **profiles** | `username_available` function, `handle_new_user` trigger | User profile management |
| **navigation_history** | `CREATE_TABLES`, `RLS_POLICIES` | User navigation tracking |

### Supabase Storage Buckets
| Bucket/Path | Governing Symbols | Data Type |
|-------------|-------------------|-----------|
| **anointed/translations/** | `loadTranslation`, `fetchFromStorage` | Bible text (KJV, AMP, CSB, etc.) |
| **anointed/references/** | `getCrossRefsBatch`, `loadProphecyData` | Cross-references and prophecy data |
| **anointed/metadata/** | `loadVerseKeys`, `loadDatesData` | Verse ordering and dating |
| **anointed/labels/** | `getLabelsData`, `labelsWorker` | Semantic highlighting data |
| **anointed/strongs/** | `getStrongsOffsets`, `strongsWorker` | Strong's concordance data |

### API Endpoints
| Endpoint | Method | Governing Symbol | Purpose |
|----------|--------|------------------|---------|
| `/api/auth/username-available` | GET | `username-available` handler | Username validation |
| `/api/auth/signup` | POST | `signup` handler | User registration |
| `/api/health` | GET | `server` | Health check |
| `/api/users/*` | Various | User routes (not detailed) | User management |
| `/api/storage/*` | Various | Storage routes (not detailed) | Data storage |

## Top 10 Governing Functions for Critical Flows

### 1. Authentication Flow
1. **`signup`** (API handler) - User registration with username validation
2. **`username_available`** (SQL function) - Real-time username checking  
3. **`AuthProvider`** (component) - App-wide authentication state
4. **`useAuth`** (hook) - Component-level auth access
5. **`handle_new_user`** (SQL trigger) - Automatic profile creation

### 2. Bible Data Loading
1. **`loadTranslation`** (function) - Primary Bible text loader with caching
2. **`fetchFromStorage`** (function) - Core Supabase storage interface
3. **`getCrossRefsBatch`** (function) - Optimized cross-reference loading
4. **`loadProphecyData`** (function) - Prophecy system data loader
5. **`useBibleStore`** (hook) - Central data state management

### 3. Column System & Layout
1. **`useResponsiveColumns`** (hook) - Screen-aware column configuration
2. **`useAdaptivePortraitColumns`** (hook) - Portrait mode optimization
3. **`NewColumnHeaders`** (component) - Header rendering with drag-and-drop
4. **`computeVisibleRangeDynamic`** (function) - Visibility calculations
5. **`makeColumnScroller`** (function) - Horizontal navigation

### 4. User Data Management (Notes/Bookmarks/Highlights)
1. **`useNotes`** (hook) - Notes management with auto-save
2. **`useBookmarks`** (hook) - Bookmark synchronization
3. **`useHighlights`** (hook) - Text highlighting with conflict resolution
4. **`RLS_POLICIES`** (SQL) - Data security enforcement
5. **`HighlightProvider`** (component) - Highlighting context

### 5. Bible Verse Rendering
1. **`VirtualRow`** (component) - Individual verse rendering
2. **`VirtualBibleTable`** (component) - Virtual scrolling table
3. **`useMeasureVisibleColumns`** (hook) - Dynamic column fitting
4. **`useColumnData`** (hook) - Column-specific data loading
5. **`ColumnChangeSignal`** (class) - Inter-component communication

### 6. Performance & Background Processing
1. **`crossReferencesWorker`** (worker) - Background cross-ref processing
2. **`strongsWorker`** (worker) - Strong's concordance analysis
3. **`labelsWorker`** (worker) - Semantic label processing
4. **`queryClient`** (instance) - API request caching
5. **`apiRequest`** (function) - HTTP client with auth

### 7. Navigation & Search
1. **`App`** (component) - Main routing and providers
2. **`useBibleStore.searchVerses`** (method) - Bible text search
3. **`loadVerseKeys`** (function) - Verse ordering (canonical/chronological)
4. **`makeColumnScroller`** (function) - Column navigation
5. **Navigation history tracking** - User journey management

## Architecture Insights

### State Management Pattern
- **Central Hub**: `useBibleStore` (Zustand) manages all Bible-related state
- **Specialized Hooks**: Individual hooks for specific features (notes, bookmarks, highlights)
- **Context Providers**: Authentication and highlighting contexts
- **Event System**: `ColumnChangeSignal` for cross-component communication

### Data Flow Architecture
1. **Storage Layer**: Supabase Storage + PostgreSQL
2. **Caching Layer**: Master cache + React Query + Zustand store
3. **Processing Layer**: Web Workers for heavy computations
4. **UI Layer**: React components with responsive column system
5. **Network Layer**: Optimized HTTP Range requests

### Performance Optimizations
- **Virtual Scrolling**: Handles 31,000+ Bible verses efficiently
- **HTTP Range Requests**: Expert-optimized cross-reference loading
- **Web Workers**: Background processing for concordance and labels
- **Aggressive Caching**: Multiple caching layers for instant access
- **Responsive Design**: Dynamic column calculations for all screen sizes

### Security Implementation
- **Row Level Security**: Database policies enforce user data isolation
- **Authentication Gates**: User-specific features require auth
- **Input Validation**: Zod schemas for API requests
- **CORS Configuration**: Proper cross-origin request handling

### Data Relationships
- **Users** → **Profiles** (1:1, auto-created via trigger)
- **Users** → **Notes/Bookmarks/Highlights** (1:many, with RLS)
- **Verses** → **Cross-references** (many:many, optimized loading)
- **Verses** → **Prophecy Data** (many:many, P/F/V classification)
- **Translations** → **Verse Text** (1:many, cached by translation)

## Notable Technical Patterns

### Advanced Column System
- 20-column layout with dynamic visibility
- Drag-and-drop reordering with @dnd-kit
- Responsive width calculations for all screen sizes
- CSS variable-based styling system

### Bible Data Management
- File-based content storage in Supabase Storage
- Optimized parsing of reference#text format
- HTTP Range requests for efficient loading
- Master cache for instant repeated access

### User Experience Optimizations
- Optimistic updates for notes and bookmarks
- Conflict resolution for highlights (server_rev system)
- Auto-save functionality with debouncing
- Responsive design with portrait/landscape modes

## Potential Improvements

### Error Handling Gaps
- Some functions lack explicit error handling
- Missing error boundaries in React components
- Limited offline functionality for some features

### Type Safety Opportunities  
- Some API responses use `any` types
- Dynamic imports could be more strictly typed
- Web Worker message types could be formalized

### Performance Enhancements
- Additional caching layers for frequently accessed data
- Service Worker implementation for offline Bible reading
- Further optimization of virtual scrolling calculations

### Security Enhancements
- Additional input validation on complex data structures
- Rate limiting for API endpoints
- Enhanced CSRF protection