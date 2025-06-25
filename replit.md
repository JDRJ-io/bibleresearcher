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
- Mock authentication system that simulates Supabase Auth
- User session management via localStorage
- Login/signup functionality with email-based authentication
- User state management throughout the application

## Bible Data Management
- Mock Bible verse data with multi-translation support (KJV, ESV, NIV)
- Cross-reference system linking related verses
- Strong's concordance integration for original language study
- Prophecy tracking and fulfillment verification

## User Interface Components
- **BibleTable**: Main verse display with column-based layout
- **ExpandedVerseOverlay**: Detailed verse study modal
- **HamburgerMenu**: Application settings and preferences
- **AuthModal**: User authentication interface
- Comprehensive form components and UI primitives

# Data Flow

1. **Client Initialization**: React app loads and checks authentication status
2. **Data Fetching**: TanStack Query manages API calls and caching
3. **Bible Content**: Verses loaded from mock data with translation selection
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

# Recent Changes

## June 25, 2025 - Supabase Integration & Enhanced Bible Interface
- Connected to user's actual Supabase storage with Bible translation files
- Implemented fixed row heights (120px) with text wrapping and scrollbars
- Added comprehensive file loading system for translations, cross-references, Strong's data, and prophecy information
- Enhanced column layout matching user's reference image specifications
- Integrated all 12 Bible translations (KJV, ESV, NIV, NKJV, NLT, AMP, CSB, BSB, NASB, YLT, WEB, NRSV)
- Added prophecy data loading with predictions, fulfillments, and verifications
- Implemented context groups for verse organization
- Enhanced Strong's concordance integration with original language support

## December 25, 2025 - PostgreSQL Database Integration
- Added PostgreSQL database using Neon serverless database
- Created comprehensive database schema with tables for users, notes, bookmarks, highlights, forum posts, and preferences
- Implemented full PostgreSQL storage layer replacing in-memory storage
- Successfully pushed database schema using Drizzle ORM migrations
- Database ready for user authentication and data persistence

## Current Status
- Bible website fully operational with proper column structure
- Supabase storage integration working with user's actual Bible files
- PostgreSQL database configured and ready for user data
- All themes functional (light, dark, sepia, aurora, electric, fireworks)
- User authentication system ready for personal notes and bookmarks
- Foundation prepared for complete feature implementation per user's blueprint

# User Preferences

Preferred communication style: Simple, everyday language.
Project focus: Excel-style Bible interface with comprehensive study tools and multi-translation support.
Data source: User's Supabase storage containing actual Bible translations and reference materials.