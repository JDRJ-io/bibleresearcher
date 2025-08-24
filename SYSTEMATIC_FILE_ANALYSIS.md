# SYSTEMATIC CODEBASE ANALYSIS - FILE TRACKING

## ANALYSIS STATUS: IN PROGRESS
**Target**: Extract every function, component, hook, method, API route, and SQL procedure with precise evidence-based analysis

## FILE INVENTORY & COMPLETION TRACKING

### ROOT LEVEL FILES
- [ ] package.json
- [ ] vite.config.ts  
- [ ] tailwind.config.ts
- [ ] tsconfig.json
- [ ] drizzle.config.ts
- [ ] migration.sql ✅ COMPLETED
- [ ] functions_catalog.jsonl ✅ COMPLETED (ongoing updates)

### CLIENT CORE FILES  
- [ ] client/src/App.tsx ✅ PARTIAL (main store analyzed, need full component analysis)
- [ ] client/src/main.tsx
- [ ] client/src/index.css
- [ ] client/src/sw.ts

### DATA & API LAYER
- [ ] client/src/data/BibleDataAPI.ts ✅ COMPLETED
- [ ] client/src/lib/verseKeysLoader.ts ✅ COMPLETED  
- [ ] client/src/lib/translationLoader.ts
- [ ] client/src/lib/supabaseClient.ts
- [ ] client/src/lib/queryClient.ts
- [ ] client/src/lib/userDataApi.ts
- [ ] client/src/lib/strongsService.ts
- [ ] client/src/lib/navigationHistory.ts
- [ ] client/src/lib/auth.ts
- [ ] client/src/lib/utils.ts

### HOOKS DIRECTORY (Critical System Controllers)
- [ ] client/src/hooks/useBibleData.ts ✅ COMPLETED
- [ ] client/src/hooks/useAnchorSlice.ts ✅ COMPLETED 
- [ ] client/src/hooks/useRowData.ts ✅ COMPLETED
- [ ] client/src/hooks/useMyProfile.ts ✅ COMPLETED
- [x] client/src/hooks/useAdaptivePortraitColumns.ts ✅ COMPLETED
- [x] client/src/hooks/useResponsiveColumns.ts ✅ COMPLETED
- [x] client/src/hooks/useColumnData.ts ✅ COMPLETED
- [x] client/src/hooks/useTranslationMaps.ts ✅ COMPLETED
- [x] client/src/hooks/useAuth.ts ✅ COMPLETED
- [x] client/src/hooks/useBookmarks.ts ✅ COMPLETED
- [x] client/src/hooks/useHighlights.ts ✅ COMPLETED
- [x] client/src/hooks/useNotes.ts ✅ COMPLETED
- [x] client/src/hooks/useVerseNav.ts ✅ COMPLETED
- [ ] client/src/hooks/useLabeledText.ts
- [ ] client/src/hooks/useColumnChangeSignal.ts
- [ ] client/src/hooks/useMeasureVisibleColumns.ts
- [ ] client/src/hooks/useViewportLabels.ts
- [ ] client/src/hooks/useStrongsWorker.ts
- [ ] client/src/hooks/useSearchWorker.ts
- [ ] client/src/hooks/useInstallPrompt.ts
- [ ] client/src/hooks/use-toast.ts
- [ ] client/src/hooks/use-mobile.tsx

### MAJOR COMPONENTS  
- [ ] client/src/components/bible/VirtualBibleTable.tsx ✅ COMPLETED
- [ ] client/src/components/bible/VirtualRow.tsx ✅ COMPLETED
- [ ] client/src/components/bible/NewColumnHeaders.tsx ✅ COMPLETED
- [ ] client/src/components/bible/LabeledText.tsx ✅ COMPLETED
- [ ] client/src/components/bible/TopHeader.tsx
- [ ] client/src/components/bible/BibleTable.tsx
- [ ] client/src/components/bible/ColumnHeaders.tsx.backup
- [ ] client/src/components/bible/ColumnNavigationArrows.tsx
- [ ] client/src/components/bible/SearchModal.tsx
- [ ] client/src/components/bible/HoverVerseBar.tsx
- [ ] client/src/components/bible/InlineDateInfo.tsx
- [ ] client/src/components/bible/StrongsOverlay.tsx
- [ ] client/src/components/bible/ProphecyColumns.tsx

### AUTH COMPONENTS
- [ ] client/src/components/auth/AuthModals.tsx
- [ ] client/src/components/auth/CombinedAuthModal.tsx  
- [ ] client/src/components/auth/UserProfile.tsx
- [ ] client/src/contexts/AuthContext.tsx

### USER FEATURES COMPONENTS
- [ ] client/src/components/user/NotesCell.tsx
- [ ] client/src/components/user/BookmarkButton.tsx
- [ ] client/src/components/user/HighlightableText.tsx
- [ ] client/src/components/highlights/VerseText.tsx

### UI COMPONENTS
- [ ] client/src/components/ui/button.tsx
- [ ] client/src/components/ui/form.tsx
- [ ] client/src/components/ui/dialog.tsx
- [ ] client/src/components/ui/toast.tsx
- [ ] client/src/components/ui/scroll-area.tsx
- [... additional UI components to be analyzed ...]

### PAGES
- [ ] client/src/pages/bible.tsx
- [ ] client/src/pages/Profile.tsx
- [ ] client/src/pages/Subscribe.tsx
- [ ] client/src/pages/auth/callback.tsx

### STORE & STATE MANAGEMENT
- [ ] client/src/store/translationSlice.ts ✅ PARTIAL (main hooks analyzed, need complete review)
- [ ] client/src/store/useBibleData.ts

### WORKERS
- [ ] client/src/workers/strongsWorker.ts ✅ COMPLETED
- [ ] client/src/workers/labels.worker.ts
- [ ] client/src/workers/crossReferencesWorker.ts
- [ ] client/src/workers/prophecyWorker.ts

### SERVER SIDE
- [ ] server/index.ts
- [ ] server/db.ts
- [ ] server/routes/auth.ts
- [ ] server/routes/profile.ts
- [ ] server/routes/storage.ts
- [ ] server/routes/stripe.ts
- [ ] server/routes/users.ts
- [ ] server/lib/supabase.ts

### SHARED SCHEMAS
- [ ] shared/schema.ts
- [ ] shared/highlights.ts

### SUPABASE FUNCTIONS
- [ ] supabase/functions/recover-with-passkey/index.ts
- [ ] supabase/functions/redeem-code/index.ts

### UTILITIES & HELPERS
- [ ] client/src/utils/columnLayout.ts
- [ ] client/src/utils/scrollToVerse.ts
- [ ] client/src/utils/auth.ts
- [ ] client/src/utils/themeManager.ts

### CONSTANTS & TYPES
- [ ] client/src/types/bible.ts
- [ ] client/src/constants/columnLayout.ts
- [ ] client/src/constants/layout.ts

## CURRENT ANALYSIS PROGRESS
**Files Completed**: 12/200+
**Functions Documented**: 90+
**Next Target**: Continue systematically through hooks directory, then major components

## METHODOLOGY  
1. ✅ Create complete file inventory 
2. 🔄 **CURRENT**: Systematic file-by-file analysis
3. ⏳ Cross-reference dependency mapping
4. ⏳ Architectural pattern documentation
5. ⏳ Final governance analysis report