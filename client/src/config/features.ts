// Feature flags for smart scrollbar system
// Lightweight toggle system for safe staging of new features

export const FEATURES = {
  AUTO_ZOOM_ENABLED: false,        // Auto-zoom feature (velocity/dwell-based style switching)
  BOOK_ZOOM_ENABLED: false,        // Book-level zoom (0.80 allocation)
  DIVIDER_TAP_ENABLED: false,      // OT/NT divider tap-to-jump
  A11Y_ANNOUNCE_ENABLED: true,     // ARIA-live announcements for mode/lock
  KEYBOARD_NAV_ENABLED: false,     // Keyboard shortcuts ([, ], L)
} as const;

export type FeatureFlags = typeof FEATURES;
export type FeatureName = keyof FeatureFlags;
