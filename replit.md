# Biblical Research Platform

## Overview
A sophisticated web application for biblical research, providing an Excel-like interface for studying the Bible. It supports multi-translations, cross-references, Strong's concordance, prophecy tracking, and community features. The platform is designed for client-side data loading, utilizing Supabase Storage for all Bible content and PostgreSQL for user-specific data, aiming to provide a comprehensive and intuitive study experience.

## User Preferences
- **Documentation Style**: Prefers comprehensive real implementation analysis over static docs
- **Debugging Approach**: Wants global system monitoring to understand actual data flows
- **Development Focus**: Values understanding how things actually work vs. how they're designed

## System Architecture

### Core Design Principles
- **Client-Side Centric**: No custom backend server; entirely client-side with Supabase as BaaS.
- **Single Data API**: All data operations funnel through `BibleDataAPI.ts`.
- **Master Cache**: Global in-memory caching for frequently accessed data (translations, cross-references).
- **File-based Content**: All Bible content (translations, cross-references, Strong's data, metadata) is stored as text/JSON files in Supabase Storage.
- **Anchor-centered Virtual Scrolling**: Efficient rendering of large Bible texts by loading verses centered around the current view.
- **PWA Capabilities**: Designed for offline access and installability.

### Recent Changes
- **Column Headers Refactor (Jan 2025)**: Replaced complex ColumnHeaders component with simplified NewColumnHeaders that uses the same responsive width system as VirtualRow, ensuring perfect alignment between headers and data cells.
- **Complete Authentication System (Jan 2025)**: 
  - Implemented modern PKCE authentication flow with Supabase
  - Added visual authentication status with UserProfileDropdown component
  - Profile management with editable name, bio, and tier display
  - Premium subscription gating with crown icon for premium users
  - Developer code redemption system for team access (DevUnlock component)
  - Supabase Edge Function for redeem-code functionality
  - Direct Supabase integration for profile updates (bypassing custom backend)
  - AuthContext with full session management and profile synchronization
  - Sign-in button disappears when authenticated, replaced with profile avatar
  - **Critical Fix (Aug 2025)**: Resolved circular dependency in useMyProfile hook by passing user/authLoading as parameters instead of calling useAuth() inside the hook, enabling proper profile loading and form functionality
- **Notes System Optimization (Aug 2025)**:
  - Migrated from global notes loading to verse-specific filtering
  - Updated schema from `user_notes` table to `notes` table with better structure
  - Implemented new `useNotes(verseRef)` hook for efficient verse-specific note management
  - Real-time local state updates after CRUD operations
  - Improved performance by loading only relevant notes per verse
- **Complete Study Features Implementation (Aug 2025)**:
  - **Auto-save State Management**: useReadingState hook saves position every 60 seconds and on page unload
  - **Seamless Notes**: Auto-save notes with 500ms debounce, no manual save buttons, vertical scrollbar for overflow
  - **Bookmark System**: BookmarkButton integrated in TopHeader, save with custom names and colors
  - **Text Highlighting**: Complete highlighting system with color wheel overlay on text selection, per-translation and per-verse accuracy, authentication-gated for logged users only
- **Universal Semantic Label System (Aug 2025)**:
  - **Dynamic Cross-Reference Labels**: Enhanced useViewportLabels to load labels for ALL cross-reference and prophecy verses from any book or chapter
  - **Comprehensive Coverage**: Semantic highlighting (who, what, where, when, etc.) now works across main translation, alternate translations, cross-references, and prophecy columns
  - **Optimized Worker**: Web worker handles targeted verse loading for improved performance while maintaining complete semantic coverage
  - **Unified Label Architecture**: Eliminated duplicate hook calls and established single-source label loading at VirtualBibleTable level
- **Responsive Mobile Optimization (Aug 2025)**:
  - **Adaptive MinWidth**: VirtualRow now uses responsive minWidth that constrains to 95% of viewport width on mobile devices (≤768px)
  - **Better Space Utilization**: Eliminates horizontal overflow caused by fixed minWidth reserving space for larger screens
  - **Flexible Column Layout**: Maintains exact widths on desktop while allowing more efficient space usage on mobile portrait mode
  - **Mobile-Optimized Scrollbar**: Enhanced custom scrollbar with proper touch event support, 24px mobile width (vs 8px), minimum 44px touch targets, edge positioning, and touch-action CSS properties for native mobile interaction
- **Bookmark System Unified (Aug 2025)**:
  - **Fixed Conflicting Systems**: Eliminated dual bookmark management systems causing JSON parsing errors
  - **Direct Supabase Integration**: Both TopHeader and BookmarksList now use direct Supabase calls instead of non-existent API routes
  - **Schema Consistency**: Fixed field name mismatches (index_value vs indexValue) ensuring proper data access
  - **Query Cache Unification**: Both components use same TanStack Query cache keys for real-time synchronization
  - **Full CRUD Operations**: Create, read, update, delete bookmarks with proper user authentication and error handling

### Frontend
- **Framework**: React 18 with TypeScript.
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS with Radix UI components (shadcn/ui).
- **Routing**: Wouter for client-side navigation.
- **Data Fetching/Caching**: TanStack Query.
- **State Management**: Zustand for global state.
- **Offline Data**: Dexie (IndexedDB) for client-side persistence.

### UI/UX Decisions
- **Layout**: Flexible 20-column system with toggleable sections, including reference, notes, multiple translation columns, cross-references, and prophecy tracking.
- **Theming**: Dark/light theme switching.
- **Responsiveness**: Mobile-first design with adaptive column layouts for various screen sizes, ensuring core columns (Reference, Main Translation, Cross-References) fit in portrait mode.
- **Interactive Elements**: Strong's overlay for word analysis, user notes and highlights, search functionality.
- **Loading Indicators**: Uses a blue circle spinner across the platform.

### Feature Specifications
- Multi-translation Bible display with KJV as default.
- Virtual scrolling with anchor-centered loading.
- Cross-reference display with optimized HTTP Range Requests for efficient data fetching.
- Strong's concordance integration with word analysis overlay.
- Prophecy tracking system (P/F/V columns).
- User notes and highlights.
- Search functionality.
- Chronological and Canonical verse ordering modes.

## External Dependencies
- **Supabase**:
    - **PostgreSQL**: For user data (notes, bookmarks, highlights, forum posts).
    - **Storage ('anointed' bucket)**: Hosts all Bible content files (translations, cross-references, metadata, Strong's data).
    - **Authentication**: Magic link email authentication.