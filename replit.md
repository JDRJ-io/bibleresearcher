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