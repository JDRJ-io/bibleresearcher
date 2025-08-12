# Biblical Research Platform

## Overview
A sophisticated web application for biblical research, providing an Excel-like interface for studying the Bible. It supports multi-translations, cross-references, Strong's concordance, prophecy tracking, and community features. The platform is designed for client-side data loading, utilizing Supabase Storage for all Bible content and PostgreSQL for user-specific data, aiming to provide a comprehensive and intuitive study experience with a business vision to become the leading digital Bible study platform, enabling deep personal and community-driven insights.

## User Preferences
- **Documentation Style**: Prefers comprehensive real implementation analysis over static docs
- **Debugging Approach**: Wants global system monitoring to understand actual data flows
- **Development Focus**: Values understanding how things actually work vs. how they're designed

## Recent Changes (August 12, 2025)
- **Column Header System**: Completed unified dynamic column width system using CSS calc() expressions and --column-width-mult variable
- **Navigation Logic**: Fixed all maxVisibleColumns references, now using dynamic getVisibleSlice() system throughout VirtualRow.tsx
- **Data Loading Issue Resolved**: Fixed translation cache initialization - all Bible translations (KJV, AMP, CSB) now loading correctly with 31,102 verses each
- **Infinite Render Loop Fixed**: Resolved React infinite render issue in ColumnNavigationArrows component by properly memoizing dependencies
- **Bible Verse Display**: Verse text now displaying correctly, cross-references working (e.g., Gen.1:1 shows 76 cross-refs)

## System Architecture

### Core Design Principles
- **Client-Side Centric**: No custom backend server; entirely client-side with Supabase as BaaS.
- **Single Data API**: All data operations funnel through `BibleDataAPI.ts`.
- **Master Cache**: Global in-memory caching for frequently accessed data (translations, cross-references).
- **File-based Content**: All Bible content is stored as text/JSON files in Supabase Storage.
- **Anchor-centered Virtual Scrolling**: Efficient rendering of large Bible texts.
- **PWA Capabilities**: Designed for offline access and installability.

### Technical Implementations & Features
- **Database Management**: Utilizes Supabase CLI for professional migration management, including a clean schema for user data, notes, and comprehensive community features (posts, comments, DMs, group chats). Row Level Security is implemented for all user and community data.
- **Authentication System**: Modern PKCE authentication flow with Supabase, including visual status, profile management, premium subscription gating, and developer code redemption. Supports seamless cross-domain authentication for related platforms and enhanced magic link UX with in-app confirmations. Includes a recovery passkey system and marketing opt-in functionality.
- **Study Features**:
    - **Notes System**: Verse-specific note management with real-time local state updates and auto-save functionality.
    - **Bookmarks**: Integrated bookmark system with custom naming and colors, synchronized via Supabase.
    - **Text Highlighting**: Per-translation and per-verse highlighting with color selection, authentication-gated.
    - **Reading State**: Auto-saves reading position periodically and on page unload.
- **Semantic Label System**: Dynamic loading of semantic labels for all cross-reference and prophecy verses across all displayed columns (main translation, alternate translations, cross-references, prophecy). Uses a web worker for optimized performance.
- **Responsive Optimization**: Adaptive column widths for various screen sizes, especially on mobile (≤768px). Enhanced custom scrollbar with touch event support, optimized for mobile UX with reduced track height, speed multiplier for dragging, and real-time tooltip feedback.
- **Smart Virtual Scrolling**: Device-aware buffer optimization that detects mobile devices, low memory conditions, and slow connections to prevent crashes while maintaining smooth navigation. Uses dynamic thresholds (5 verses mobile, 8 desktop) and adaptive buffers (40 verses mobile/throttled, 100 desktop) with preemptive loading to ensure verses appear instantly during scrolling. Mobile gets additional instant loading within 3 verses of viewport edge.
- **UI/UX Decisions**:
    - **Layout**: Flexible 20-column system with toggleable sections for reference, notes, multiple translation columns, cross-references, and prophecy tracking. Reference column treated as foundation pillar (excluded from column counting for mobile display logic).
    - **Theming**: Dark/light theme switching.
    - **Interactive Elements**: Strong's overlay for word analysis, user notes and highlights, search functionality.
    - **Presentation Mode**: Quick toggle in column headers for instant display scaling (width x2, text x1.5, row height x1.35) with visual preset button.
    - **Mystical & Divine UI Effects**: Prophecy-based verse animations (yellow/red/blue glows), subtle mystical effects, and holy button animations with divine shimmer/glow. Authentication modals feature divine-themed aesthetics.
    - **Glass Morphism**: Performance-optimized with static backgrounds, lightweight blur effects (4px desktop, 2px mobile), and high opacity (95%) for readability. All heavy animations and transitions are removed for peaceful study and battery optimization.
- **Community Features**: Integration ready for Stripe-based community subscriptions, with a divine-themed upgrade modal and subscribe page. Designed to provide community members a voice in project direction and enhanced forum participation.
- **Search Features**: Includes random verse navigation (desktop and mobile, Ctrl+R shortcut) and integrated Strong's concordance search.
- **Strong's Concordance**: Optimized loading with progressive enhancement, stable in-place updates, smart final organization, batch processing with progress indicators, and error resilience for a smooth word analysis workflow.

### Frontend Technologies
- **Framework**: React 18 with TypeScript.
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS with Radix UI components (shadcn/ui).
- **Routing**: Wouter.
- **Data Fetching/Caching**: TanStack Query.
- **State Management**: Zustand.
- **Offline Data**: Dexie (IndexedDB).

## External Dependencies
- **Supabase**:
    - **PostgreSQL**: Used for user data (notes, bookmarks, highlights, forum posts, profiles).
    - **Storage ('anointed' bucket)**: Hosts all Bible content files (translations, cross-references, metadata, Strong's data).
    - **Authentication**: Provides magic link email authentication and supports custom Edge Functions (e.g., `recover-with-passkey`).
- **Stripe**: Integrated for community membership subscription payments.