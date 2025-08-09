# Biblical Research Platform

## Overview
A sophisticated web application for biblical research, providing an Excel-like interface for studying the Bible. It supports multi-translations, cross-references, Strong's concordance, prophecy tracking, and community features. The platform is designed for client-side data loading, utilizing Supabase Storage for all Bible content and PostgreSQL for user-specific data, aiming to provide a comprehensive and intuitive study experience. The business vision is to provide a comprehensive and intuitive study experience, with market potential in spiritual growth and academic biblical studies. Project ambition is to be the leading digital tool for in-depth biblical research.

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

### Technical Implementations
- **Database Migrations**: Uses Supabase CLI for managed migrations, including schema for community features (posts, comments, DMs, group chats), RLS policies, and email synchronization.
- **Authentication System**: Modern PKCE authentication flow with Supabase, including profile management, premium subscription gating, and developer code redemption. Cross-domain authentication for forum integration. Enhanced Magic Link UX with seamless confirmation.
- **Notes System**: Verse-specific note management (`useNotes` hook) with real-time local state updates and auto-save.
- **Study Features**: Auto-save reading state, seamless auto-save notes, bookmark system with custom names and colors, and text highlighting with color wheel overlay (per-translation and per-verse accuracy).
- **Universal Semantic Label System**: Dynamic cross-reference labels and semantic highlighting across main, alternate, cross-reference, and prophecy columns, handled by a web worker for performance.
- **Responsive Optimization**: Adaptive minimum width for VirtualRow on mobile, custom mobile-optimized scrollbar with touch event support, and pause-loading during scrollbar drag for smooth navigation.
- **Bookmark System Unification**: Consolidated bookmark management using direct Supabase calls and unified TanStack Query cache keys.
- **Sign-Up Features**: Recovery passkey system (bcryptjs-based) and user-controlled marketing opt-in with Supabase Edge Function integration.
- **Mystical UI Effects**: Dynamic border effects based on prophecy status (yellow for prediction, red for fulfillment, blue for verification), subtle glowing borders, and divine shimmer effects on buttons.
- **Community Membership System**: Framework for Stripe payment integration for community subscriptions, with a divine-themed upgrade interface.
- **Strong's Concordance Optimization**: Progressive enhancement for Strong's word analysis, displaying immediate basic results, stable in-place updates for morphology data, and batch processing with visual progress indicators.
- **Glass Morphism**: Performance-optimized glass morphism with minimal processing design, static backgrounds, lightweight blur effects, and no CSS animations for peaceful study.
- **Live Scrollbar Tooltip**: Real-time verse preview tooltip with glass morphism design, using requestAnimationFrame for smooth updates and optimized state management.

### Frontend
- **Framework**: React 18 with TypeScript.
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS with Radix UI components (shadcn/ui).
- **Routing**: Wouter.
- **Data Fetching/Caching**: TanStack Query.
- **State Management**: Zustand.
- **Offline Data**: Dexie (IndexedDB).

### UI/UX Decisions
- **Layout**: Flexible 20-column system with toggleable sections (reference, notes, multiple translation columns, cross-references, prophecy).
- **Theming**: Dark/light theme switching.
- **Responsiveness**: Mobile-first design with adaptive column layouts ensuring core columns (Reference, Main Translation, Cross-References) fit in portrait mode.
- **Interactive Elements**: Strong's overlay, user notes and highlights, search functionality.
- **Loading Indicators**: Blue circle spinner.

### Feature Specifications
- Multi-translation Bible display (KJV default).
- Virtual scrolling with anchor-centered loading.
- Cross-reference display with optimized HTTP Range Requests.
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
    - **Edge Functions**: For specific serverless functionalities (e.g., code redemption, passkey recovery).
- **Stripe**: For community membership payments.