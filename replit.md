# Biblical Research Platform

## Overview
A sophisticated web application for biblical research, providing an Excel-like interface for studying the Bible. It supports multi-translations, cross-references, Strong's concordance, prophecy tracking, and community features. The platform is designed for client-side data loading, utilizing Supabase Storage for all Bible content and PostgreSQL for user-specific data, aiming to provide a comprehensive and intuitive study experience. The project envisions a comprehensive, intuitive, and community-driven platform for deep biblical study, leveraging modern web technologies to make complex research accessible and engaging.

## User Preferences
- **Documentation Style**: Prefers comprehensive real implementation analysis over static docs
- **Debugging Approach**: Wants global system monitoring to understand actual data flows
- **Development Focus**: Values understanding how things actually work vs. how they're designed

## System Architecture

### Core Design Principles
- **Client-Side Centric**: No custom backend server; entirely client-side with Supabase as Backend-as-a-Service (BaaS).
- **Single Data API**: All data operations funnel through `BibleDataAPI.ts`.
- **Master Cache**: Global in-memory caching for frequently accessed data (translations, cross-references).
- **File-based Content**: All Bible content (translations, cross-references, Strong's data, metadata) is stored as text/JSON files in Supabase Storage.
- **Anchor-centered Virtual Scrolling**: Efficient rendering of large Bible texts by loading verses centered around the current view.
- **PWA Capabilities**: Designed for offline access and installability.

### Technical Implementations
- **Authentication System**: Modern PKCE authentication flow with Supabase, including profile management, premium subscription gating, developer code redemption, and seamless magic link user experience. Includes cross-domain authentication for forum integration and a recovery passkey system.
- **Database Management**: Supabase CLI integrated for professional migration management, with an ordered migration system, clean schema architecture, and Row Level Security policies for all user data and community features.
- **Notes System**: Optimized for verse-specific filtering with real-time local state updates after CRUD operations.
- **Study Features**: Auto-save state management, seamless notes with debounced auto-save, comprehensive bookmark system, and a robust text highlighting system with per-translation and per-verse accuracy.
- **Semantic Label System**: Universal system for dynamic cross-reference and prophecy labels, providing semantic highlighting across all content (main translation, alternate translations, cross-references, prophecy columns) optimized via web workers.
- **Strong's Concordance**: Progressive enhancement system for immediate basic results display, stable in-place updates of morphology data, and smart final organization with visual progress indicators.
- **UI Effects**: Dynamic border effects based on prophecy status (yellow, red, blue glows), subtle mystical effects for verses, divine shimmer and glow effects on buttons, and divine-themed authentication modals.
- **Community Membership**: Integrated with Stripe for subscription management, with a dedicated upgrade interface and subscribe page.
- **Performance Optimization**: Significant improvements in scrolling smoothness and app loading times achieved through efficient ResizeObserver usage, optimized DOM queries, reduced verbose logging, and streamlined navigation.
- **Responsive Optimization**: Adaptive minWidth for VirtualRow, mobile-optimized custom scrollbar with enhanced touch support, and pause-loading mechanism during scrollbar drag for fluid navigation.
- **Glass Morphism**: Performance-optimized design with static backgrounds, lightweight glass effects (reduced blur, increased opacity), and a no-animation policy for peaceful Bible study and battery optimization.

### Frontend
- **Framework**: React 18 with TypeScript.
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS with Radix UI components (shadcn/ui).
- **Routing**: Wouter for client-side navigation.
- **Data Fetching/Caching**: TanStack Query.
- **State Management**: Zustand for global state.
- **Offline Data**: Dexie (IndexedDB) for client-side persistence.

### UI/UX Decisions
- **Layout**: Flexible 20-column system with toggleable sections (reference, notes, multiple translation columns, cross-references, prophecy tracking).
- **Theming**: Dark/light theme switching.
- **Responsiveness**: Mobile-first design with adaptive column layouts ensuring core content fits on various screen sizes.
- **Interactive Elements**: Strong's overlay for word analysis, user notes and highlights, search functionality.
- **Loading Indicators**: Uses a blue circle spinner across the platform.

### Feature Specifications
- Multi-translation Bible display with KJV as default.
- Virtual scrolling with anchor-centered loading.
- Cross-reference display with optimized HTTP Range Requests.
- Strong's concordance integration with word analysis overlay.
- Prophecy tracking system (P/F/V columns).
- User notes and highlights.
- Search functionality.
- Chronological and Canonical verse ordering modes.

## External Dependencies
- **Supabase**:
    - **PostgreSQL**: For user data (notes, bookmarks, highlights, forum posts, community features).
    - **Storage ('anointed' bucket)**: Hosts all Bible content files (translations, cross-references, metadata, Strong's data).
    - **Authentication**: Magic link email authentication.
    - **Edge Functions**: Used for specific serverless functionalities (e.g., redeem-code, recover-with-passkey).
- **Stripe**: For processing community membership payments.
```