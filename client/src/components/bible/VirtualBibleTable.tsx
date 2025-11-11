import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useSyncExternalStore,
} from "react";
import { ROW_HEIGHT } from "@/constants/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePreventScrollPropagation } from "@/hooks/usePreventScrollPropagation";
import { NewColumnHeaders } from "./NewColumnHeaders";
import { useColumnData } from "@/hooks/useColumnData";
import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";
import { useAdaptivePortraitColumns } from "@/hooks/useAdaptivePortraitColumns";
import { useMeasureVisibleColumns } from "@/hooks/useMeasureVisibleColumns";
import { useAdaptiveWidths } from "@/hooks/useAdaptiveWidths";
import { useOrientation } from "@/hooks/useOrientation";
import { useReferenceColumnWidth } from "@/hooks/useReferenceColumnWidth";
import { VirtualRow } from "./VirtualRow";
import { RowSkeleton } from "./RowSkeleton";
import { MasterColumnOverlay } from "./MasterColumnOverlay";
import {
  getVerseCount,
  getVerseKeys,
  getVerseKeyByIndex,
} from "@/lib/verseKeysLoader";
import { useVirtualization } from "@/hooks/useRollingVirtualization";
import { useTranslationMaps } from "@/hooks/useTranslationMaps";
import { useRowData } from "@/hooks/useRowData";
import { useSliceDataLoader } from "@/hooks/useSliceDataLoader";
import { useCrossRefLoader } from "@/hooks/useCrossRefLoader";
import { useCrossRefTextPrefetcher } from "@/hooks/useCrossRefTextPrefetcher";
import { useBibleStore } from "@/App";
import { verseCache, isVerseReady } from "@/hooks/data/verseCache";
import { useColumnAlignmentStateMachine } from "@/hooks/useColumnAlignmentStateMachine";
import { useBibleData } from "@/hooks/useBibleData";
import { useVerseNav } from "@/hooks/useVerseNav";
import { getVerseIndex } from "@/lib/verseIndexMap";
import {
  scrollTopForIndex,
  centerIndexFrom,
  getStickyHeaderOffset,
} from "@/utils/geometry";
import { useNaturalAxisLock } from "@/hooks/useNaturalAxisLock";
import { useColumnSwipeNavigation } from "@/hooks/useColumnSwipeNavigation";
import { useTwoFingerSwipeNavigation } from "@/hooks/useTwoFingerSwipeNavigation";
import { useRogueElementCleaner } from "@/hooks/useRogueElementCleaner";
import { useScrollRoot } from "@/hooks/useScrollRoot";
import { useContainerMetrics } from "@/hooks/useContainerMetrics";
import { useReferenceColumnObserver } from "@/hooks/useReferenceColumnObserver";
import { useVerseSelectionCapture } from "@/hooks/useVerseSelectionCapture";
import { trackNavigationJump } from "@/lib/navigationHistory";
import { expandVerseRange } from "@/lib/verseRangeUtils";

import type {
  BibleVerse,
  Translation,
  UserNote,
  AppPreferences,
} from "@/types/bible";
import { useViewportLabels } from "@/hooks/useViewportLabels";
import { useNotesCache } from "@/hooks/useNotesCache";
import { useUserBookmarksCompat } from "@/hooks/useBookmarksMemory";
import { ScrollbarTooltip } from "@/components/ui/ScrollbarTooltip";
import { TickRenderer } from "@/components/ui/TickRenderer";
import { BandBackgrounds } from "@/components/ui/BandBackgrounds";
import { FourWayJoystick } from "@/components/ui/FourWayJoystick";
import { JoystickToggle } from "@/components/ui/JoystickToggle";
import { ScrollbarLabel } from "@/components/ui/ScrollbarLabel";
import type { LabelName } from "@/lib/labelBits";
import {
  SmartScrollbarController,
  makeCanonicalModel,
  DEFAULT_AUTOZOOM_CONFIG,
  MOBILE_AUTOZOOM_CONFIG,
  type ScrollMode,
} from "@/lib/smartScrollbar";
import { bookTickIndices } from "@/lib/bookBands";
import { FEATURES } from "@/config/features";
import { logger } from "@/lib/logger";

// Joystick positioning config - easily editable values for all viewport modes
// All values are in pixels (px) from bottom of viewport
const JOYSTICK_BOTTOM_SPACING = {
  mobile: {
    portrait: {
      normal: { withBanner: 230, withoutBanner: 175 },
      focus: 65,
    },
    landscape: {
      normal: { withBanner: 96, withoutBanner: 96 },
      focus: 80,
    },
  },
  desktop: {
    portrait: {
      normal: { withBanner: 130, withoutBanner: 130 },
      focus: 90,
    },
    landscape: {
      normal: { withBanner: 130, withoutBanner: 130 },
      focus: 90,
    },
  },
};

type El = HTMLElement | null;

const GAP = 4;
const HEADER_MIN = 22;
const JOYSTICK_H = 56;
const FOOTER_MIN = 40;
const EPS = 0.5;

function getVH() {
  const vv = (window as any).visualViewport;
  return vv?.height ? vv.height : window.innerHeight;
}

function rect(el: Element | null) {
  const r = el?.getBoundingClientRect?.();
  return r
    ? { top: r.top, bottom: r.bottom, height: r.height, ok: true }
    : { top: 0, bottom: 0, height: 0, ok: false };
}

function near(a: number, b: number, eps = EPS) {
  return Math.abs(a - b) <= eps;
}

function useExact4pxPositionsSafe(opts: {
  isMinimized: boolean;
  headerRef?: React.RefObject<HTMLDivElement>;
  footerEl?: El;
  joystickHeight?: number;
  gap?: number;
  isMobile?: boolean;
  orientation?: "portrait" | "landscape";
  isPatchNotesBannerVisible?: boolean;
}) {
  const {
    isMinimized,
    headerRef,
    footerEl,
    joystickHeight = JOYSTICK_H,
    gap = GAP,
    isMobile = false,
    orientation = "portrait",
    isPatchNotesBannerVisible = true,
  } = opts;

  const [scrollbarTop, setScrollbarTop] = useState(0);
  const [scrollbarHeight, setScrollbarHeight] = useState(0);
  const [joystickToggleTop, setJoystickToggleTop] = useState(0);
  const [joystickTop, setJoystickTop] = useState(0);

  const lastRef = useRef({ sbTop: -1, sbH: -1, jsToggleTop: -1, jsTop: -1 });
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef(false);

  const measureNow = useMemo(() => {
    return () => {
      const vh = getVH();
      const isMobile = window.innerWidth <= 768;

      const headerEl = headerRef?.current;
      const usedFallback = !headerEl;
      const h = rect(
        headerEl || document.querySelector(".column-headers-section"),
      );
      const headerBottom = h.ok ? h.bottom : HEADER_MIN;

      // Measure sticky header elements for viewport-specific adjustments
      const topHeader = document.querySelector(".top-header");
      const banner = document.querySelector(".patch-notes-banner");
      const presetBar = document.querySelector(".preset-bar");
      const topHeaderHeight = topHeader?.getBoundingClientRect().height || 0;
      const bannerHeight = banner?.getBoundingClientRect().height || 0;
      const presetBarHeight = presetBar?.getBoundingClientRect().height || 0;

      let adjustment = 0;
      if (isMinimized) {
        adjustment = 0;
      } else if (isMobile) {
        if (bannerHeight > 0) {
          // Mobile with banner up: subtract double banner height + column headers
          adjustment = -(bannerHeight * 2) - h.height;
        } else {
          // Mobile without banner: subtract column headers + top header
          adjustment = -h.height - topHeaderHeight;
        }
      } else {
        // Desktop: no adjustment needed (headerBottom already accounts for sticky positioning)
        adjustment = 0;
      }

      const sbTop = headerBottom + gap + adjustment;

      let footerTop: number | null = null;

      if (!isMinimized) {
        const f = rect(
          footerEl || document.querySelector(".footer-section, .site-footer"),
        );
        if (f.ok) {
          footerTop = f.top;
        } else {
          footerTop = null;
        }
      } else {
        footerTop = null;
      }

      const footerTopPos = Math.min(vh, footerTop ?? vh);

      // Mobile: shrink scrollbar to account for sticky header overlap at bottom
      let bottomSpacing = 0;
      if (isMobile && !isMinimized) {
        if (bannerHeight > 0) {
          // Mobile with banner: include 2x column headers in bottom spacing
          bottomSpacing = topHeaderHeight + presetBarHeight + h.height * 2;
        } else {
          // Mobile without banner: subtract 32px to make scrollbar longer (clamped to 0)
          bottomSpacing = Math.max(
            0,
            topHeaderHeight + presetBarHeight + h.height - 32,
          );
        }
      }

      // Calculate scrollbar height first (OLD LOGIC - unchanged)
      const sbH = Math.max(
        0,
        footerTopPos - sbTop - joystickHeight - 2 * gap - bottomSpacing,
      );

      // Calculate joystick toggle position (OLD LOGIC - keep it where it was)
      const jsToggleTop = sbTop + sbH + gap;

      // Calculate joystick position using JOYSTICK_BOTTOM_SPACING config (NEW LOGIC - only for the joystick)
      const deviceType = isMobile ? "mobile" : "desktop";
      const orientationType = orientation;
      const hasBanner = isPatchNotesBannerVisible;

      let joystickBottomSpacing: number;
      if (isMinimized) {
        // Focus mode
        joystickBottomSpacing =
          JOYSTICK_BOTTOM_SPACING[deviceType][orientationType].focus;
      } else {
        // Normal mode
        const normalConfig =
          JOYSTICK_BOTTOM_SPACING[deviceType][orientationType].normal;
        joystickBottomSpacing = hasBanner
          ? normalConfig.withBanner
          : normalConfig.withoutBanner;
      }

      // Position joystick from bottom of viewport
      const jsTop = vh - joystickHeight - joystickBottomSpacing;

      const last = lastRef.current;
      const needTop = !near(last.sbTop, sbTop);
      const needH = !near(last.sbH, sbH);
      const needJsToggle = !near(last.jsToggleTop, jsToggleTop);
      const needJs = !near(last.jsTop, jsTop);

      if (needTop) {
        last.sbTop = sbTop;
        setScrollbarTop(sbTop);
      }
      if (needH) {
        last.sbH = sbH;
        setScrollbarHeight(sbH);
      }
      if (needJsToggle) {
        last.jsToggleTop = jsToggleTop;
        setJoystickToggleTop(jsToggleTop);
      }
      if (needJs) {
        last.jsTop = jsTop;
        setJoystickTop(jsTop);
      }

      pendingRef.current = false;
      rafRef.current = null;
    };
  }, [
    headerRef,
    footerEl,
    gap,
    joystickHeight,
    isMinimized,
    isMobile,
    orientation,
    isPatchNotesBannerVisible,
  ]);

  const scheduleMeasure = useMemo(() => {
    return () => {
      if (pendingRef.current) return;
      pendingRef.current = true;
      rafRef.current = requestAnimationFrame(measureNow);
    };
  }, [measureNow]);

  useLayoutEffect(() => {
    measureNow();
  }, [measureNow]);

  useEffect(() => {
    const re = scheduleMeasure;

    const vv = (window as any).visualViewport as VisualViewport | undefined;
    vv?.addEventListener?.("resize", re);

    window.addEventListener("resize", re, { passive: true });
    window.addEventListener("orientationchange", re);

    const ro = new ResizeObserver(re);
    const headerNode =
      headerRef?.current ||
      (document.querySelector(".column-headers-section") as HTMLElement | null);
    const footerNode =
      footerEl ||
      (document.querySelector(
        ".footer-section, .site-footer",
      ) as HTMLElement | null);

    if (headerNode) ro.observe(headerNode);
    if (headerNode?.parentElement) ro.observe(headerNode.parentElement);
    if (footerNode) ro.observe(footerNode);
    if (footerNode?.parentElement) ro.observe(footerNode.parentElement);

    const mos: MutationObserver[] = [];
    const addMO = (el?: HTMLElement | null) => {
      if (!el?.parentElement) return;
      const mo = new MutationObserver(re);
      mo.observe(el.parentElement, { childList: true });
      mos.push(mo);
    };
    addMO(headerNode || null);
    addMO(footerNode || null);

    const id = requestAnimationFrame(re);

    return () => {
      vv?.removeEventListener?.("resize", re);
      window.removeEventListener("resize", re);
      window.removeEventListener("orientationchange", re);
      ro.disconnect();
      mos.forEach((m) => m.disconnect());
      cancelAnimationFrame(id);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      pendingRef.current = false;
      rafRef.current = null;
    };
  }, [scheduleMeasure, headerRef, footerEl]);

  return { scrollbarTop, scrollbarHeight, joystickToggleTop, joystickTop };
}

export interface VirtualBibleTableHandle {
  scrollToVerse: (ref: string) => void;
  get node(): HTMLDivElement | null;
  getCurrentVerse: () => { reference: string; index: number };
}

interface VirtualBibleTableProps {
  verses: BibleVerse[];
  selectedTranslations: Translation[];
  preferences: AppPreferences;
  mainTranslation: string;
  className?: string;
  onExpandVerse?: (verse: BibleVerse) => void;
  onNavigateToVerse?: (verseId: string) => void;
  getProphecyDataForVerse?: (verseId: string) => any;
  getGlobalVerseText?: (verseId: string, translation: string) => string;
  totalRows?: number;
  onCenterVerseChange?: (verseIndex: number) => void;
  centerVerseIndex?: number;
  onPreserveAnchor?: (callback: any) => void;
  onVerseClick?: (ref: string) => void;
  onCurrentVerseChange?: (verseInfo: {
    reference: string;
    index: number;
  }) => void;
  currentVerse?: { reference: string; index: number };
  onOpenProphecy?: (prophecyId: number) => void;
  onStrongsClick?: (verseRef: string, strongsKey: string) => void;
  isPatchNotesBannerVisible?: boolean;
  isMenuOpen?: boolean;
  isSearchModalOpen?: boolean;
  isProphecyDrawerOpen?: boolean;
  isStrongsOverlayOpen?: boolean;
  isIntroOverlayOpen?: boolean;
  isMinimized?: boolean;
  headerBoundaryRef?: React.RefObject<HTMLDivElement>;
}

const VirtualBibleTable = forwardRef<
  VirtualBibleTableHandle,
  VirtualBibleTableProps
>((props, ref) => {
  const {
    selectedTranslations,
    preferences,
    mainTranslation,
    className = "",
    onExpandVerse,
    onNavigateToVerse,
    getProphecyDataForVerse,
    getGlobalVerseText,
    totalRows,
    onCenterVerseChange,
    centerVerseIndex = 0,
    onPreserveAnchor,
    onVerseClick,
    onCurrentVerseChange,
    currentVerse,
    onOpenProphecy,
    onStrongsClick,
    isPatchNotesBannerVisible = true,
    isMenuOpen = false,
    isSearchModalOpen = false,
    isProphecyDrawerOpen = false,
    isStrongsOverlayOpen = false,
    isIntroOverlayOpen = false,
    isMinimized = false,
    headerBoundaryRef,
  } = props;
  // All hooks must be called at the top level of the component
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const orientation = useOrientation();
  // Match the CSS .is-portrait condition from App.tsx for consistent layout
  const currentWidth = typeof window !== "undefined" ? window.innerWidth : 0;
  const currentHeight = typeof window !== "undefined" ? window.innerHeight : 0;
  const isNarrow = Math.min(currentWidth, currentHeight) <= 900;
  const isPortrait = orientation === "portrait" && isNarrow;
  const isPortraitOrientation = orientation === "portrait"; // For layout alignment regardless of width

  // Dynamically measure sticky header height for Focus Mode
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(62); // Default fallback

  useLayoutEffect(() => {
    if (!isMinimized) {
      setStickyHeaderHeight(0);
      return;
    }

    const measureHeaders = () => {
      const presetBar = document.querySelector(".preset-bar");
      const columnHeaders = document.querySelector(".column-headers-section");

      const presetBarHeight = presetBar?.getBoundingClientRect().height || 0;
      const columnHeadersHeight =
        columnHeaders?.getBoundingClientRect().height || 0;
      const totalHeight = presetBarHeight + columnHeadersHeight;

      if (totalHeight > 0) {
        setStickyHeaderHeight(totalHeight);
      }
    };

    // Measure after layout is complete
    measureHeaders();
    const timeoutId = setTimeout(measureHeaders, 200);

    // Debounced resize handler
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measureHeaders, 100);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMinimized]); // Only depend on isMinimized, not isMobile

  // Initialize notes caching system for batch loading
  const { batchLoadNotes } = useNotesCache();

  // Get verse text retrieval function from useBibleData - MUST BE EARLY
  const { getVerseText: getBibleVerseText } = useBibleData();

  // Integrate translation maps system for verse text loading
  const translationMaps = useTranslationMaps();
  const {
    activeTranslations,
    mainTranslation: translationMainTranslation,
    getVerseText: getTranslationVerseText,
  } = translationMaps;

  // Subscribe to verse cache changes - triggers re-render when verses become ready
  useSyncExternalStore(
    verseCache.subscribe,
    verseCache.getSnapshot,
    verseCache.getSnapshot,
  );

  // UNIFIED SCROLL ROOT IMPLEMENTATION: Single source of truth across orientations
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRoot = useScrollRoot(containerRef);

  // PERF FIX: Single ResizeObserver on container instead of 240 (2 per row)
  useContainerMetrics(containerRef);

  // PERF FIX: Single ResizeObserver on reference column instead of 120 (one per row)
  useReferenceColumnObserver(containerRef);

  // PERF FIX: Single event listener for text selection instead of one per verse row
  useVerseSelectionCapture(containerRef);

  const [isScrollbarDragging, setIsScrollbarDragging] = useState(false);
  const [showScrollTooltip, setShowScrollTooltip] = useState(false);
  const [mousePosition, setMousePosition] = useState<
    { x: number; y: number } | undefined
  >();

  // Smart scrollbar controller for intelligent piecewise mapping
  const controllerRef = useRef<SmartScrollbarController | null>(null);

  // Phase A: Controls state (lock removed - auto-zoom disabled)
  const [scrollbarMode, setScrollbarMode] = useState<ScrollMode>("global");
  const [scrollbarLabel, setScrollbarLabel] = useState("GLOBAL");
  const [scrollbarPrimaryLabel, setScrollbarPrimaryLabel] = useState("GLOBAL");
  const [scrollbarSecondaryLabel, setScrollbarSecondaryLabel] = useState("OT");
  const [scaleVersion, setScaleVersion] = useState(0); // Track scale changes for reactive updates

  // Velocity tracking for smart scrollbar
  const [lastDragY, setLastDragY] = useState(0);
  const [lastDragTime, setLastDragTime] = useState(0);

  // Bypass mode tracking (Alt key on desktop, long-press on mobile)
  const [bypassMode, setBypassMode] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track click-to-jump state
  const trackDownYRef = useRef(0);
  const trackDownTimeRef = useRef(0);
  const trackDownOnThumbRef = useRef(false);

  // Task 5: rAF throttling for pointer move handlers
  const rafIdRef = useRef(0);

  // Task 6: ARIA-live announcements for accessibility
  const [ariaAnnouncement, setAriaAnnouncement] = useState("");

  // Track the current center verse index for navigation history
  const [currentCenterIndex, setCurrentCenterIndex] = useState(0);

  // Joystick visibility state - initialize from preferences and auto-hide when overlays are open
  const [joystickVisible, setJoystickVisible] = useState(
    () => preferences.showJoystick ?? false,
  );

  // Sync with preferences when they change
  useEffect(() => {
    if (preferences.showJoystick !== undefined) {
      setJoystickVisible(preferences.showJoystick);
    }
  }, [preferences.showJoystick]);

  // Hide joystick when any overlay is open
  const anyOverlayOpen =
    isMenuOpen ||
    isSearchModalOpen ||
    isProphecyDrawerOpen ||
    isStrongsOverlayOpen ||
    isIntroOverlayOpen;
  const shouldShowJoystick = joystickVisible && !anyOverlayOpen;

  // ANCHOR TRACKING REFS (Single Authority System)
  const liveIndexRef = useRef(0);
  const lastIndexRef = useRef(0);
  const velocityRef = useRef(0);
  const directionRef = useRef(0);
  const lastTimestampRef = useRef(performance.now());
  const anchorIndexRef = useRef(0);
  const prefetchAnchorRef = useRef(0);
  const stableAnchorRef = useRef(0);

  // Refs for scroll propagation prevention on fixed overlays
  const scrollbarWrapperRef = useRef<HTMLDivElement>(null);
  const joystickWrapperRef = useRef<HTMLDivElement>(null);

  // Prevent scroll propagation from scrollbar and joystick to underlying table
  usePreventScrollPropagation(scrollbarWrapperRef, {
    allowInternalScroll: false, // Scrollbar itself doesn't scroll
    preventWheel: true,
    preventTouch: true, // Prevent page shift when dragging track; thumb uses stopPropagation
  });
  usePreventScrollPropagation(joystickWrapperRef, {
    allowInternalScroll: false, // Joystick doesn't scroll
    preventWheel: true,
    preventTouch: true,
  });

  // NATURAL AXIS-LOCKED SCROLLING: Let browser handle momentum with optimized timing
  useNaturalAxisLock(containerRef);

  // NEW: Measure actual column container for dynamic visible count calculation
  useMeasureVisibleColumns(containerRef);

  // NEW: Update store with current column configuration - per-field selectors
  const setFixedColumns = useBibleStore((s) => s.setFixedColumns);
  const setNavigableColumns = useBibleStore((s) => s.setNavigableColumns);
  const setColumnWidthPx = useBibleStore((s) => s.setColumnWidthPx);

  // Remove ref handling for now

  // Get reactive verse keys from store instead of static function - per-field selectors
  const currentVerseKeys = useBibleStore((s) => s.currentVerseKeys);
  const isChronological = useBibleStore((s) => s.isChronological);
  const verseKeys =
    currentVerseKeys.length > 0 ? currentVerseKeys : getVerseKeys(); // Use store keys or fallback

  // Get dynamic row height from CSS variable (set by CompactSizeController)
  const [rowHeightMult, setRowHeightMult] = useState(() =>
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--row-height-mult",
      ) || "1.0",
    ),
  );

  // Listen for manual size changes from CompactSizeController
  useEffect(() => {
    const handleSizeChange = (e: CustomEvent) => {
      const newRowHeight = e.detail.rowHeight;
      if (newRowHeight !== undefined) {
        setRowHeightMult(newRowHeight);
      }
    };

    window.addEventListener(
      "manualSizeChange",
      handleSizeChange as EventListener,
    );
    return () =>
      window.removeEventListener(
        "manualSizeChange",
        handleSizeChange as EventListener,
      );
  }, []);

  const effectiveRowHeight = ROW_HEIGHT * rowHeightMult;

  // Initialize smart scrollbar controller (run once)
  useEffect(() => {
    if (!controllerRef.current) {
      const model = makeCanonicalModel();
      const config = isMobile
        ? MOBILE_AUTOZOOM_CONFIG
        : DEFAULT_AUTOZOOM_CONFIG;
      controllerRef.current = new SmartScrollbarController(model, config);
    }
  }, [isMobile]);

  // Task 5: Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Task 6: ARIA-live announcements - update when mode or lock changes
  useEffect(() => {
    if (!FEATURES.A11Y_ANNOUNCE_ENABLED) return;

    const info = controllerRef.current?.getActiveScaleInfo();
    if (info) {
      setAriaAnnouncement(`Scrollbar mode: ${info.label}.`);
    }
  }, [scrollbarLabel]);

  // Track Alt key for bypass mode (desktop only)
  useEffect(() => {
    if (isMobile) return; // Skip on mobile

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && isScrollbarDragging) {
        setBypassMode(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey) {
        setBypassMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isMobile, isScrollbarDragging]);

  // PERF GOVERNOR: Get actual visible columns from column layout store
  // Session restore updates column layout but not toggle booleans, so we must
  // use the authoritative source (navigableColumns) instead of toggle states FOR ROW CAPPING
  const navigableColumns = useBibleStore((s) => s.navigableColumns);
  const showHybrid = useBibleStore((s) => s.showHybrid);

  // These toggle states are still needed for UI rendering and column visibility logic
  const showCrossRefs = useBibleStore((s) => s.showCrossRefs);
  const showNotes = useBibleStore((s) => s.showNotes);
  const showProphecies = useBibleStore((s) => s.showProphecies);

  // PERF GOVERNOR: Compute actual column count for row capping
  // This ensures render window adapts to actual visible columns
  // columnCount = 1 reference + navigableColumns + hybrid (if visible)
  // Note: navigableColumns excludes hybrid Master column by design
  const columnCount = useMemo(() => {
    let count = 1 + (navigableColumns?.length || 0); // 1 for reference + navigable columns
    if (showHybrid) count++; // Add hybrid Master column when visible
    return count;
  }, [navigableColumns, showHybrid]);

  // Rolling windows virtualization with intelligent prefetching + column-aware row capping
  const { anchorIndex, stableAnchor, slice, metrics } = useVirtualization(
    scrollRoot,
    verseKeys,
    mainTranslation,
    effectiveRowHeight,
    { disabled: isScrollbarDragging, columnCount },
  );

  // Update smart scrollbar controller with anchor changes
  useEffect(() => {
    if (controllerRef.current && !isScrollbarDragging) {
      controllerRef.current.onViewportAnchor(anchorIndex, 16);

      // Check if scale version changed and update state for reactive rendering
      const snapshot = controllerRef.current.getScaleSnapshot();
      if (snapshot.version !== scaleVersion) {
        setScaleVersion(snapshot.version);
      }
    }
  }, [anchorIndex, isScrollbarDragging, scaleVersion]);

  const bibleStore = useBibleStore();

  // Handle scrollbar dragging state changes
  const handleScrollbarDragChange = useCallback(
    (dragging: boolean, clientX?: number, clientY?: number) => {
      setIsScrollbarDragging(dragging);
      setShowScrollTooltip(dragging);
      if (dragging && clientX !== undefined && clientY !== undefined) {
        setMousePosition({ x: clientX, y: clientY });
      } else {
        setMousePosition(undefined);
      }
    },
    [],
  );

  // Get current verse reference from anchor index
  const getCurrentVerse = useCallback(() => {
    const currentRef = verseKeys[anchorIndex] || verseKeys[0] || "Gen.1:1";
    return { reference: currentRef, index: anchorIndex };
  }, [anchorIndex, verseKeys]);

  // Notify parent of current verse changes
  useEffect(() => {
    if (onCurrentVerseChange) {
      const verseInfo = getCurrentVerse();
      onCurrentVerseChange(verseInfo);
    }
    // Note: getCurrentVerse is intentionally NOT in deps to prevent infinite loop
    // since it already depends on anchorIndex and verseKeys which ARE in deps
  }, [anchorIndex, verseKeys, onCurrentVerseChange]);

  // Phase A: Scrollbar control handlers
  const cycleScrollbarMode = useCallback((direction: "next" | "prev") => {
    if (!controllerRef.current) return;

    const modes: ScrollMode[] = ["global", "testament", "section", "book"];
    const currentMode = controllerRef.current.getMode();
    const currentIndex = modes.indexOf(
      currentMode === "auto" ? "global" : currentMode,
    );

    const nextIndex =
      direction === "next"
        ? (currentIndex + 1) % modes.length
        : (currentIndex - 1 + modes.length) % modes.length;

    controllerRef.current.setMode(modes[nextIndex]);
    updateScrollbarLabel();
  }, []);

  // REMOVED: toggleScrollbarLock (auto-zoom disabled)

  const stepSelection = useCallback(
    (direction: "prev" | "next") => {
      if (!controllerRef.current) return;

      // Get the verse index to scroll to from stepSelection
      const targetVerseIndex = controllerRef.current.stepSelection(direction);
      updateScrollbarLabel();

      // If a verse index is returned, scroll to it
      if (targetVerseIndex !== undefined) {
        const viewportHeight = scrollRoot.getClientHeight();
        const targetScrollTop =
          targetVerseIndex * effectiveRowHeight - viewportHeight / 2;
        const maxScroll = Math.max(
          0,
          verseKeys.length * effectiveRowHeight - viewportHeight,
        );
        const clampedScrollTop = Math.max(
          0,
          Math.min(maxScroll, targetScrollTop),
        );

        scrollRoot.scrollToTop(clampedScrollTop, true); // smooth scroll
      }
    },
    [scrollRoot, effectiveRowHeight, verseKeys.length],
  );

  const updateScrollbarLabel = useCallback(() => {
    if (!controllerRef.current) return;
    const info = controllerRef.current.getActiveScaleInfo();
    setScrollbarLabel(info.label);
    setScrollbarPrimaryLabel(info.primaryLabel);
    setScrollbarSecondaryLabel(info.secondaryLabel);
    setScrollbarMode(info.mode);
  }, []);

  // Helper: Find nearest section boundary at a given y position
  const getNearestSectionBoundary = useCallback(
    (y01: number, scale: any): number | null => {
      const bands = scale.bands.filter((b: any) => b.id.startsWith("sec:"));
      if (bands.length === 0) return null;

      let nearestIdx: number | null = null;
      let minDist = Infinity;

      for (const band of bands) {
        // Check both start and end of each section
        const startDist = Math.abs((band.y0 ?? 0) - y01);
        const endDist = Math.abs((band.y1 ?? 1) - y01);

        if (startDist < minDist) {
          minDist = startDist;
          nearestIdx = band.startIdx;
        }
        if (endDist < minDist) {
          minDist = endDist;
          nearestIdx = band.endIdx;
        }
      }

      return nearestIdx;
    },
    [],
  );

  // Helper: Find nearest book start at a given y position
  const getNearestBookStart = useCallback(
    (y01: number, scale: any): number | null => {
      const bookStarts = bookTickIndices();

      let nearestIdx: number | null = null;
      let minDist = Infinity;

      for (const idx of bookStarts) {
        const bookY = scale.toY01(idx);
        const dist = Math.abs(bookY - y01);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = idx;
        }
      }

      return nearestIdx;
    },
    [],
  );

  // Track click-to-jump handlers
  const handleTrackPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Check if clicking on thumb
      const isThumb =
        (e.target as HTMLElement)?.closest?.("[data-smart-scrollbar-thumb]") !=
        null;
      trackDownOnThumbRef.current = isThumb;
      if (isThumb) return;

      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      trackDownYRef.current = e.clientY;
      trackDownTimeRef.current = performance.now();
    },
    [],
  );

  const handleTrackPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const CLICK_MOTION_THRESHOLD = 8; // px

      if (trackDownOnThumbRef.current) return; // Was dragging thumb

      const dy = Math.abs(e.clientY - trackDownYRef.current);
      if (dy > CLICK_MOTION_THRESHOLD) return; // Was dragging track, not clicking

      // Compute y01 in the track
      const track = e.currentTarget.getBoundingClientRect();
      let y01 = (e.clientY - track.top) / track.height;
      y01 = Math.max(0, Math.min(1, y01));

      // Get current scale from controller
      if (!controllerRef.current) return;
      const scaleSnapshot = controllerRef.current.getScaleSnapshot();

      // Verify scale is ready before using it
      if (!scaleSnapshot || !scaleSnapshot.toIndex) return;

      // Determine target index based on modifiers
      let targetIdx = scaleSnapshot.toIndex(y01);

      if (e.altKey || e.metaKey) {
        // Alt/Cmd: snap to nearest book start
        const bookIdx = getNearestBookStart(y01, scaleSnapshot);
        if (bookIdx !== null) targetIdx = bookIdx;
      } else if (e.shiftKey) {
        // Shift: snap to nearest section boundary
        const sectionIdx = getNearestSectionBoundary(y01, scaleSnapshot);
        if (sectionIdx !== null) targetIdx = sectionIdx;
      }

      // Center target index in viewport
      const viewport = scrollRoot.getClientHeight();
      const targetTop = targetIdx * effectiveRowHeight - viewport / 2;
      const maxScroll = Math.max(
        0,
        verseKeys.length * effectiveRowHeight - viewport,
      );
      const clamped = Math.max(0, Math.min(maxScroll, targetTop));

      // Smooth scroll in rAF for clean frame
      requestAnimationFrame(() => {
        scrollRoot.scrollToTop(clamped, true);
      });
    },
    [
      getNearestBookStart,
      getNearestSectionBoundary,
      scrollRoot,
      effectiveRowHeight,
      verseKeys.length,
    ],
  );

  // Update label when anchor changes
  useEffect(() => {
    updateScrollbarLabel();
  }, [anchorIndex, updateScrollbarLabel]);

  // Task 8: Expose debug API in dev mode
  useEffect(() => {
    if (import.meta.env.DEV && controllerRef.current) {
      (window as any).__scrollbar = {
        getMode: () => controllerRef.current?.getMode(),
        // REMOVED: getLock (auto-zoom disabled)
        getScale: () => controllerRef.current?.getScale(),
        getInfo: () => controllerRef.current?.getActiveScaleInfo(),
        setMode: (m: any) => {
          controllerRef.current?.setMode(m);
          updateScrollbarLabel();
        },
        // REMOVED: setLock (auto-zoom disabled)
      };
      console.log("🔧 Scrollbar debug API exposed: window.__scrollbar");
    }

    return () => {
      if (import.meta.env.DEV) {
        delete (window as any).__scrollbar;
      }
    };
  }, [updateScrollbarLabel]);

  // Task 6: Keyboard shortcuts for scrollbar controls
  useEffect(() => {
    if (!FEATURES.KEYBOARD_NAV_ENABLED) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "[") {
        e.preventDefault();
        cycleScrollbarMode("prev");
      } else if (e.key === "]") {
        e.preventDefault();
        cycleScrollbarMode("next");
      }
      // REMOVED: 'L' key for lock toggle (auto-zoom disabled)
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cycleScrollbarMode]);

  // MEMORY OPTIMIZATION: Load main translation into verseCache
  const { data: rowData } = useRowData(slice.verseIDs, mainTranslation);

  // Batch load bookmarks for visible verses to prevent excessive network requests
  const visibleVerseKeys = useMemo(() => slice.verseIDs, [slice.verseIDs]);
  const { data: bookmarksData } = useUserBookmarksCompat(
    visibleVerseKeys,
    mainTranslation,
  );

  // Create bookmark lookup function for child components to avoid individual queries
  const isVerseBookmarked = useCallback(
    (verseKey: string): boolean => {
      if (!bookmarksData?.isVerseBookmarked) return false;
      return bookmarksData.isVerseBookmarked(verseKey);
    },
    [bookmarksData],
  );

  // Labels system integration - get entire store for debugging
  const store = useBibleStore();
  const activeLabels = store.activeLabels;

  // VirtualBibleTable immediate debug logs removed for performance

  // Store subscription debug logs removed for performance

  // Direct test debug logs removed for performance

  // VirtualBibleTable urgent debug logs removed for performance

  // Convert slice to verse objects for useViewportLabels
  const sliceVerses = useMemo(() => {
    return slice.verseIDs.map((verseID) => {
      const verseData = rowData?.[verseID];
      if (verseData && "book" in verseData && "chapter" in verseData) {
        return verseData as unknown as BibleVerse;
      }
      // Create properly typed fallback verse
      return {
        id: verseID,
        index: 0,
        reference: verseID, // STRAIGHT-LINE: Keep original format
        book: "",
        chapter: 0,
        verse: 0,
        text: {},
        crossReferences: [],
        strongsWords: [],
        labels: [],
        contextGroup: "standard" as const,
      } as BibleVerse;
    });
  }, [slice.verseIDs, rowData]);

  // Force hook re-evaluation when activeLabels changes
  useEffect(() => {
    // useViewportLabels debug logs removed for performance
  }, [
    activeLabels,
    sliceVerses.length,
    translationMainTranslation,
    mainTranslation,
  ]);

  // Collect all cross-ref and prophecy verses from visible slice for label loading
  const additionalVerseRefs = useMemo(() => {
    const refs = new Set<string>();

    // Helper to add verse ref, handling compounds (#) and ranges (-)
    const addVerseRef = (ref: string) => {
      // Split compound references (e.g., "John.1:1#John.1:2#John.1:3")
      const compounds = ref.split("#");

      compounds.forEach((compound) => {
        // Expand verse ranges (e.g., "Gen.7:17-23") to individual verses
        const expanded = expandVerseRange(compound.trim());
        expanded.forEach((v) => refs.add(v));
      });
    };

    // Collect cross-reference verses
    slice.verseIDs.forEach((verseID) => {
      const crossRefData = store.crossRefs[verseID];
      if (crossRefData?.data) {
        crossRefData.data.forEach(addVerseRef);
      }
    });

    // Collect prophecy verses (P, F, V)
    slice.verseIDs.forEach((verseID) => {
      const prophecyRoles = store.prophecyData?.[verseID];
      if (prophecyRoles) {
        // Get all prophecy IDs for this verse
        const prophecyIds = [
          ...(prophecyRoles.P || []),
          ...(prophecyRoles.F || []),
          ...(prophecyRoles.V || []),
        ];

        // For each prophecy ID, get all its verses
        prophecyIds.forEach((id) => {
          const prophecy = store.prophecyIndex?.[id];
          if (prophecy) {
            prophecy.prophecy?.forEach(addVerseRef);
            prophecy.fulfillment?.forEach(addVerseRef);
            prophecy.verification?.forEach(addVerseRef);
          }
        });
      }
    });

    return Array.from(refs);
  }, [
    slice.verseIDs,
    store.crossRefs,
    store.prophecyData,
    store.prophecyIndex,
  ]);

  const { getVerseLabels } = useViewportLabels({
    verses: sliceVerses,
    activeLabels: activeLabels || [],
    mainTranslation: translationMainTranslation || mainTranslation,
    additionalVerseRefs,
  });

  // CRITICAL: Preserve center verse when row height changes (fixes drift at different scales)
  const prevRowHeightRef = useRef(effectiveRowHeight);

  useEffect(() => {
    const prev = prevRowHeightRef.current;
    if (prev === effectiveRowHeight) return;

    const containerH = scrollRoot.getClientHeight();
    const currentScrollTop = scrollRoot.getScrollTop();
    const stickyHeaderOffset = getStickyHeaderOffset(scrollRoot.kind);

    // Find which verse was centered with the OLD row height
    const centerVerseIndex = centerIndexFrom(
      currentScrollTop,
      containerH,
      prev,
      stickyHeaderOffset,
    );

    // Calculate new scroll position to keep that same verse centered with NEW row height
    let newScrollTop = scrollTopForIndex(
      centerVerseIndex,
      containerH,
      effectiveRowHeight,
      stickyHeaderOffset,
    );

    // Clamp to bounds
    const contentHeight = verseKeys.length * effectiveRowHeight;
    const maxScroll = Math.max(0, contentHeight - containerH);
    newScrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));

    logger.debug(
      "LAYOUT",
      "row-height-changed-preserve-center",
      {
        centerVerseIndex,
        prevRowHeight: prev,
        newRowHeight: effectiveRowHeight,
        oldScrollTop: currentScrollTop,
        newScrollTop,
        multiplier: effectiveRowHeight / ROW_HEIGHT,
      },
      { throttleMs: 500 },
    );

    scrollRoot.scrollToTop(newScrollTop, false);
    prevRowHeightRef.current = effectiveRowHeight;
  }, [effectiveRowHeight, scrollRoot, verseKeys.length]);

  // B-1: Load slice data for cross-references and prophecy
  const { isLoading: isSliceLoading } = useSliceDataLoader(
    slice.verseIDs,
    mainTranslation,
  );

  // B-2: Load cross-references for prefetch window (for instant availability)
  useCrossRefLoader(slice.verseIDs);

  // B-3: Prefetch verse texts for all cross-referenced verses
  // PERF FIX: Pass velocity for adaptive window sizing (8 verses when fast, 15 when slow)
  useCrossRefTextPrefetcher(slice.verseIDs, mainTranslation, metrics.velocity);

  // Cross-reference text loading handled by main translation system - no duplication - per-field selector
  const crossRefsStore = useBibleStore((s) => s.crossRefs);

  // Load column-specific data when columns are toggled
  useColumnData();

  // Get remaining store state (toggles already pulled earlier for perf governor)
  const toggleCrossRefs = useBibleStore((s) => s.toggleCrossRefs);
  const columnState = useBibleStore((s) => s.columnState);
  const translationState = useBibleStore((s) => s.translationState);
  const shiftColumnsLeft = useBibleStore((s) => s.shiftColumnsLeft);
  const shiftColumnsRight = useBibleStore((s) => s.shiftColumnsRight);
  const canShiftLeft = useBibleStore((s) => s.canShiftLeft);
  const canShiftRight = useBibleStore((s) => s.canShiftRight);
  const navigationOffset = useBibleStore((s) => s.navigationOffset);
  const getVisibleSlice = useBibleStore((s) => s.getVisibleSlice);

  // MEMORY OPTIMIZATION PHASE 1: Build full column structure (stable, no navigationOffset)
  // This is only recomputed when column toggles or translations change, NOT on scroll
  const fullColumnStructure = useMemo(() => {
    const { mainTranslation: mainTrans, alternates } = translationMaps;
    // MOBILE-AWARE LAYOUT: Use mobile layout for ALL mobile devices (portrait and landscape)
    const isMobileDevice = window.innerWidth <= 1024;
    const isPortraitMode = window.innerHeight > window.innerWidth;
    const useMobileLayout = isMobileDevice; // True for both portrait and landscape on mobile

    // Build slot configuration
    const slotConfig: Record<number, any> = {};

    // Reference column (slot 0) - always present
    slotConfig[0] = { type: "reference", header: "Reference", visible: true };

    // Map column types based on store state
    if (columnState?.columns) {
      columnState.columns.forEach((col) => {
        switch (col.slot) {
          case 1:
            slotConfig[1] = {
              type: "notes",
              header: "Notes",
              visible: col.visible && showNotes,
            };
            break;
          case 2:
            slotConfig[2] = {
              type: "main-translation",
              header: mainTrans,
              translationCode: mainTrans,
              visible: col.visible,
            };
            break;
          case 15:
            slotConfig[15] = {
              type: "cross-refs",
              header: "Cross Refs",
              visible: col.visible && showCrossRefs,
            };
            break;
          case 16:
            slotConfig[16] = {
              type: "prophecy",
              header: "Prophecy",
              visible: col.visible && showProphecies,
            };
            break;
          case 19:
            slotConfig[19] = {
              type: "hybrid",
              header: "Master",
              visible: col.visible && showHybrid,
            };
            break;
        }
      });
    }

    // Add alternate translations
    const activeAlternates = alternates.filter((tc) => tc !== mainTrans);
    activeAlternates.forEach((translationCode, index) => {
      const slotNumber = 3 + index;
      if (slotNumber <= 14) {
        slotConfig[slotNumber] = {
          type: "alt-translation",
          header: translationCode,
          translationCode,
          visible: true,
        };
      }
    });

    // Helper function for default widths
    const getDefaultWidth = (slot: number): number => {
      switch (slot) {
        case 0:
          return 5;
        case 1:
          return 16;
        case 2:
          return 20;
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
        case 10:
        case 11:
        case 12:
        case 13:
        case 14:
          return 18;
        case 15:
          return 18;
        case 16:
          return 18;
        case 19:
          return 20;
        default:
          return 16;
      }
    };

    // Build all columns array
    let allColumns = Object.entries(slotConfig)
      .map(([slotStr, config]) => ({
        slot: parseInt(slotStr),
        config,
        widthRem: getDefaultWidth(parseInt(slotStr)),
        visible: config?.visible !== false,
      }))
      .filter((col) => col.config && col.visible);

    // Sort by displayOrder
    if (columnState?.columns) {
      const slotToDisplayOrder = new Map();
      columnState.columns.forEach((col) => {
        if (col.visible) {
          slotToDisplayOrder.set(col.slot, col.displayOrder);
        }
      });
      allColumns.forEach((col: any) => {
        col.displayOrder = slotToDisplayOrder.get(col.slot) ?? col.slot;
      });
      allColumns.sort(
        (a: any, b: any) =>
          (a.displayOrder ?? a.slot) - (b.displayOrder ?? b.slot),
      );
    } else {
      allColumns.sort((a, b) => a.slot - b.slot);
    }

    // Categorize columns: always-visible, hybrid, and navigable
    const alwaysVisibleColumns = allColumns.filter(
      (col) => col.config?.type === "reference",
    );
    const hybridColumn = allColumns.filter(
      (col) => col.config?.type === "hybrid",
    );
    const navigableColumns = allColumns.filter(
      (col) =>
        col.config?.type !== "reference" && col.config?.type !== "hybrid",
    );

    return {
      alwaysVisibleColumns,
      hybridColumn,
      navigableColumns,
      useMobileLayout,
    };
  }, [
    columnState,
    showCrossRefs,
    showNotes,
    showProphecies,
    showHybrid,
    translationMaps,
  ]);

  // MEMORY OPTIMIZATION PHASE 2: Apply column slice (lightweight, changes with navigationOffset)
  // This only slices and reindexes arrays, no heavy object building
  const visibleSlice = getVisibleSlice();

  // PERF FIX #4: Memoize visibleColumnsConfig with stable dependencies
  // visibleSlice is for column navigation, not scroll position - should be stable unless columns shift
  const visibleColumnsConfig = useMemo(() => {
    const {
      alwaysVisibleColumns,
      hybridColumn,
      navigableColumns,
      useMobileLayout,
    } = fullColumnStructure;

    // Slice ONLY the navigable columns based on navigation offset
    const shiftedNavigableColumns = navigableColumns.slice(
      visibleSlice.start,
      visibleSlice.end,
    );

    // Recombine: [reference, sliced navigable, hybrid]
    let visibleColumns = [
      ...alwaysVisibleColumns,
      ...shiftedNavigableColumns,
      ...hybridColumn,
    ];

    // Reindex to contiguous slots
    visibleColumns = visibleColumns.map((col, index) => ({
      ...col,
      slot: index,
      originalSlot: col.slot,
    }));

    // Filter out context columns on mobile devices (portrait AND landscape)
    if (useMobileLayout) {
      visibleColumns = visibleColumns.filter(
        (col) => col.config?.type !== "context",
      );
    }

    // Freeze for referential stability
    return Object.freeze(visibleColumns) as ReadonlyArray<any>;
  }, [fullColumnStructure, visibleSlice.start, visibleSlice.end]);

  // NOTE: visibleSlice deps are correct - they control column navigation, not scroll virtualization

  // COLUMN SWIPE NAVIGATION: Enable left/right swipe for column navigation (after store hooks)
  useColumnSwipeNavigation(
    containerRef,
    {
      minSwipeDistance: 80,
      maxVerticalDeviation: 100,
      swipeTimeout: 300,
    },
    {
      canShiftLeft: canShiftLeft || (() => false),
      canShiftRight: canShiftRight || (() => false),
      shiftLeft: shiftColumnsLeft || (() => {}),
      shiftRight: shiftColumnsRight || (() => {}),
    },
  );

  // TWO-FINGER TRACKPAD SWIPE NAVIGATION: Enable trackpad horizontal swipes for column navigation
  useTwoFingerSwipeNavigation(
    containerRef,
    {
      minHorizontalDelta: 35,
      debounceMs: 300,
      horizontalDominanceRatio: 2.5, // Very strict horizontal requirement
    },
    {
      canShiftLeft: canShiftLeft || (() => false),
      canShiftRight: canShiftRight || (() => false),
      shiftLeft: shiftColumnsLeft || (() => {}),
      shiftRight: shiftColumnsRight || (() => {}),
    },
  );

  // ROGUE ELEMENT CLEANER: Remove browser extension overlays that interfere with UI components
  useRogueElementCleaner();

  // Component-level guard to prevent redundant writes
  const prev = useRef({ fixed: "", nav: "" });

  // 🔄 Get translation data from the same source as NewColumnHeaders to ensure consistency
  const translationMain = translationMaps.mainTranslation || mainTranslation;
  const translationAlternates = translationMaps.alternates || [];

  // NEW: Update store with current column configuration (now that store variables are available)
  useEffect(() => {
    // Fixed: keep the reference column pinned
    const fixedKey = "reference";
    if (prev.current.fixed !== fixedKey) {
      prev.current.fixed = fixedKey;
      setFixedColumns(["reference"]);
    }

    // 🎯 FIXED: Use same data source as NewColumnHeaders (useTranslationMaps) for consistency
    const nav: string[] = ["main-translation"];
    if (showCrossRefs) nav.push("cross-refs");
    if (showNotes) nav.push("notes");
    if (showProphecies) nav.push("prophecy");

    // 🔧 BUG FIX: Use useTranslationMaps alternates (same as NewColumnHeaders) instead of translationState
    translationAlternates
      .filter((code) => code !== translationMain)
      .forEach((code) => nav.push(`alt-translation-${code}`));

    const navKey = nav.join("|");
    if (prev.current.nav !== navKey) {
      prev.current.nav = navKey;
      logger.debug(
        "NAVIGATION",
        "setting-navigable-columns",
        { columns: nav },
        { throttleMs: 500 },
      );
      setNavigableColumns(nav);
    }

    // Measure and update column widths
    setTimeout(() => {
      const measureColumns = () => {
        // Measure reference column
        const refEl = document.querySelector('[data-column="reference"]');
        if (refEl) {
          setColumnWidthPx("reference", refEl.getBoundingClientRect().width);
        }

        // Measure main translation column
        const mainEl = document.querySelector(
          '[data-column="main-translation"]',
        );
        if (mainEl)
          setColumnWidthPx(
            "main-translation",
            mainEl.getBoundingClientRect().width,
          );

        // Measure cross refs column
        if (showCrossRefs) {
          const crossEl = document.querySelector('[data-column="cross-refs"]');
          if (crossEl)
            setColumnWidthPx(
              "cross-refs",
              crossEl.getBoundingClientRect().width,
            );
        }

        // Measure unified prophecy column
        if (showProphecies) {
          const prophecyEl = document.querySelector('[data-column="prophecy"]');
          if (prophecyEl)
            setColumnWidthPx(
              "prophecy",
              prophecyEl.getBoundingClientRect().width,
            );
        }

        // Measure all alternate translations
        document
          .querySelectorAll<HTMLElement>('[data-column="alt-translation"]')
          .forEach((el) => {
            const id = el.getAttribute("data-col-key"); // e.g., alt-translation-NKJV
            if (id) setColumnWidthPx(id, el.getBoundingClientRect().width);
          });
      };

      measureColumns();
    }, 100); // Small delay to ensure DOM is ready
  }, [
    showCrossRefs,
    showProphecies,
    showNotes,
    translationAlternates,
    translationMain,
    setFixedColumns,
    setNavigableColumns,
    setColumnWidthPx,
  ]);

  // PERFORMANCE FIX: Preload notes for visible verses when notes column is enabled
  useEffect(() => {
    if (showNotes && user && slice.verseIDs.length > 0) {
      batchLoadNotes(slice.verseIDs);
    }
  }, [showNotes, user?.id, slice.verseIDs, batchLoadNotes]);

  // MEMORY OPTIMIZATION: Use translation-keyed verseCache for ALL translations
  const getVerseTextForRow = useCallback(
    (verseID: string, translationCode: string): string => {
      // First try verseCache (optimized, translation-keyed, mobile-friendly)
      const verseIndex = verseKeys.indexOf(verseID);
      if (verseIndex >= 0) {
        const cached = verseCache.get(translationCode, verseIndex);
        if (cached?.text) {
          return cached.text;
        }
      }

      // Fallback to translation maps (for any verses not yet in cache)
      return (
        getTranslationVerseText(verseID, translationCode) ||
        getBibleVerseText(verseID, translationCode) ||
        ""
      );
    },
    [verseKeys, getTranslationVerseText, getBibleVerseText],
  );

  // Create getMainVerseText wrapper for VirtualRow (main translation) - USE PROPER MAIN TRANSLATION
  const getMainVerseTextForRow = useCallback(
    (verseID: string): string => {
      const effectiveMainTranslation =
        translationMainTranslation || mainTranslation;
      return (
        getTranslationVerseText(verseID, effectiveMainTranslation) ||
        getBibleVerseText(verseID, effectiveMainTranslation) ||
        ""
      );
    },
    [
      getTranslationVerseText,
      getBibleVerseText,
      translationMainTranslation,
      mainTranslation,
    ],
  );

  // 3-B. Preserve scroll position during slice swaps
  // DISABLED: This was causing infinite render loop - onCenterVerseChange not properly memoized
  // useEffect(() => {
  //   if (onCenterVerseChange && anchorIndex !== centerVerseIndex) {
  //     onCenterVerseChange(anchorIndex);
  //   }
  // }, [anchorIndex, centerVerseIndex, onCenterVerseChange]);

  // Removed direct scroll assignment - let browser handle natural scrolling

  // 3-B. Preserve scroll position during slice swaps - SMOOTH FIX: apply only the delta, not an absolute reset
  const prevStart = useRef(slice.start);
  const prevScroll = useRef(0);

  // 2-C. Stop rubber-band by clamping scroll compensation
  const MAX_COMPENSATION_ROWS = 150; // < 1 screen height

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !onPreserveAnchor) return;

    // Browser's native inertial scrolling handles movement - no manual assignments needed

    // Save latest for next pass
    prevStart.current = slice.start;
  }, [slice.start, anchorIndex, onPreserveAnchor]);

  // Get verse data for current chunk - now use rowData instead of verses array
  const getVerseData = useCallback(
    (verseId: string) => {
      return rowData?.[verseId];
    },
    [rowData],
  );

  // User actions
  const noteMutation = useMutation({
    mutationFn: async ({
      verseId,
      note,
    }: {
      verseId: string;
      note: string;
    }) => {
      return apiRequest(`/api/notes`, "POST", { verseId, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({ description: "Note saved successfully" });
    },
    onError: () => {
      toast({ description: "Failed to save note", variant: "destructive" });
    },
  });

  const highlightMutation = useMutation({
    mutationFn: async ({
      verseId,
      text,
      color,
    }: {
      verseId: string;
      text: string;
      color: string;
    }) => {
      return apiRequest(`/api/highlights`, "POST", { verseId, text, color });
    },
    onSuccess: () => {
      // Note: Legacy highlight invalidation removed - new system uses different query keys
      toast({ description: "Highlight saved successfully" });
    },
    onError: () => {
      toast({
        description: "Failed to save highlight",
        variant: "destructive",
      });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async ({
      verseId,
      note,
    }: {
      verseId: string;
      note: string;
    }) => {
      return apiRequest(`/api/bookmarks`, "POST", { verseId, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({ description: "Bookmark saved successfully" });
    },
    onError: () => {
      toast({ description: "Failed to save bookmark", variant: "destructive" });
    },
  });

  // VirtualBibleTable anchor-centered render log removed for performance
  const rowDataSize = rowData ? Object.keys(rowData).length : 0;
  // Chunk data log removed for performance

  // LAYOUT THRASHING FIX: Width check effect disabled to prevent scroll jumping
  // This effect was causing layout reflow on every slice change during scrolling
  // Only check widths on actual column layout changes, not during virtual scrolling
  useEffect(() => {
    // Only run width checks on column layout changes (toggles, window resize)
    // NOT on slice.verseIDs changes which happen constantly during scrolling
    const shouldCheckWidths = false; // Disabled until needed for debugging

    if (!shouldCheckWidths) return;

    const checkWidthsOnlyWhenNeeded = () => {
      // Width debugging code available but disabled for smooth scrolling performance
      console.log(
        "🔧 Width debug check - only runs on explicit column layout changes",
      );
    };

    // Only check on mount/column changes, never during scroll slicing
    checkWidthsOnlyWhenNeeded();
  }, [showCrossRefs, showProphecies, preferences?.showNotes]); // Only on actual column toggles

  // Expert's physically separated scroll axes - one axis at a time
  const vScrollRef = useRef<HTMLDivElement>(null); // Vertical scroller
  const hScrollRef = useRef<HTMLDivElement>(null); // Horizontal scroller
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<
    "vertical" | "horizontal" | null
  >(null);

  // Handle runtime error overlay that blocks navigation
  useEffect(() => {
    const dismissErrorOverlay = () => {
      // Look for runtime error overlay and dismiss it
      const overlay = document.querySelector(
        '[data-testid="runtime-error-modal"], .runtime-error-overlay, [class*="runtime-error"]',
      );
      if (overlay) {
        // Try clicking outside or pressing escape
        const escEvent = new KeyboardEvent("keydown", {
          key: "Escape",
          code: "Escape",
        });
        document.dispatchEvent(escEvent);
        // Also try clicking the overlay backdrop
        (overlay as HTMLElement).click();
      }
    };

    // Dismiss any existing overlays
    dismissErrorOverlay();

    // Set up observer for new overlays
    const observer = new MutationObserver(() => {
      dismissErrorOverlay();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  // Navigation system for back/forward buttons - OPTIMIZED for instant navigation
  const scrollToVerse = useCallback(
    (ref: string) => {
      logger.debug(
        "SCROLL",
        "scrollToVerse called",
        { ref },
        { throttleMs: 200 },
      );

      // Track navigation jump for history (only for authenticated users)
      if (user?.id) {
        trackNavigationJump(user.id, ref).catch(() => {}); // Fire and forget
      }

      // ⚡ PERFORMANCE FIX: Use O(1) Map lookup instead of O(n) findIndex
      const idx = getVerseIndex(ref);

      logger.debug(
        "SCROLL",
        "verse index lookup",
        { ref, idx },
        { throttleMs: 200 },
      );

      if (idx === -1) {
        logger.warn("SCROLL", "verse index not found", { ref });
        return;
      }

      const containerH = scrollRoot.getClientHeight();
      const stickyHeaderOffset = getStickyHeaderOffset(scrollRoot.kind);

      // Use geometry helper for consistent calculation (row-middle anchor mode)
      const target = scrollTopForIndex(
        idx,
        containerH,
        effectiveRowHeight,
        stickyHeaderOffset,
      );

      logger.debug(
        "SCROLL",
        "navigation calculation",
        {
          ref,
          idx,
          containerH,
          stickyHeaderOffset,
          effectiveRowHeight,
          target,
          scrollRootKind: scrollRoot.kind,
          rowHeightMultiplier: effectiveRowHeight / ROW_HEIGHT,
        },
        { throttleMs: 200 },
      );

      // SAFE SCROLL: Use scroll root for both window and container modes
      const maxScroll = verseKeys.length * effectiveRowHeight - containerH;
      const scrollTop = Math.max(0, Math.min(target, maxScroll));
      scrollRoot.scrollToTop(scrollTop, false); // Immediate, not smooth

      // Micro-correction frame: verify and nudge if needed (handles rounding/virtualizer lag)
      requestAnimationFrame(() => {
        const measured = centerIndexFrom(
          scrollRoot.getScrollTop(),
          scrollRoot.getClientHeight(),
          effectiveRowHeight,
          stickyHeaderOffset,
        );
        const delta = idx - measured;

        if (Math.abs(delta) >= 1) {
          logger.debug(
            "SCROLL",
            "micro-correction",
            { expected: idx, measured, delta },
            { throttleMs: 500 },
          );
          const correctedTop =
            scrollRoot.getScrollTop() + delta * effectiveRowHeight;
          const clampedTop = Math.max(0, Math.min(correctedTop, maxScroll));
          scrollRoot.scrollToTop(clampedTop, false);
        }
      });

      // Flash highlight with normalized reference
      const normalizedRef = ref.includes(" ") ? ref.replace(/\s/g, ".") : ref;
      setTimeout(() => {
        const el = document.querySelector(
          `[data-verse-ref="${normalizedRef}"]`,
        ) as HTMLElement | null;
        if (el) {
          el.classList.add("verse-highlight-flash");
          setTimeout(() => el.classList.remove("verse-highlight-flash"), 400);
        }
      }, 25);
    },
    [scrollRoot, verseKeys.length, effectiveRowHeight, user],
  );

  // Expose the scroll function and container to parent via ref
  useImperativeHandle(ref, () => ({
    scrollToVerse,
    getCurrentVerse,
    get node() {
      return containerRef.current;
    },
  }));

  const { goTo } = useVerseNav(scrollToVerse);

  // PERF FIX: Memoize column data to prevent fresh object creation on every render
  // NOTE: Must come after goTo definition to avoid reference errors
  const columnData = useMemo(
    () => ({
      translations: selectedTranslations,
      crossReferences: showCrossRefs,
      prophecyData: {},
      settings: {
        mainTranslation: mainTranslation,
        multiTranslations: preferences.selectedTranslations || [],
        showCrossReferences: showCrossRefs,
        showProphecy: showProphecies,
        showStrongs: false,
        showNotes: preferences.showNotes,
        showBookmarks: true,
      },
      // Add bookmark data and lookup function to avoid individual network requests
      bookmarksData: bookmarksData?.bookmarks || [],
      isVerseBookmarked,
      onVerseClick: onVerseClick || ((ref: string) => goTo(ref)),
    }),
    [
      selectedTranslations,
      showCrossRefs,
      showProphecies,
      mainTranslation,
      preferences.selectedTranslations,
      preferences.showNotes,
      bookmarksData?.bookmarks,
      isVerseBookmarked,
      onVerseClick,
      goTo,
    ],
  );

  // PERF FIX #3: Memoize centerVerseRef to prevent changing on every scroll tick
  const centerVerseRef = useMemo(() => {
    return currentVerse?.reference || verseKeys[anchorIndex] || "Gen.1:1";
  }, [currentVerse?.reference, verseKeys, anchorIndex]);

  // PERF FIX #5: Hoist stickyHeaderOffset outside map loop (prevent 120x computation)
  const stickyOffset = useMemo(
    () => getStickyHeaderOffset(scrollRoot.kind),
    [scrollRoot.kind],
  );

  // EXACT 4PX POSITIONING: Column Headers → 4px → Scrollbar → 4px → Joystick → 4px → Footer
  const footerNode = document.querySelector(
    ".footer-section, .site-footer",
  ) as HTMLElement | null;

  const { scrollbarTop, scrollbarHeight, joystickToggleTop, joystickTop } =
    useExact4pxPositionsSafe({
      isMinimized: isMinimized || false,
      headerRef: headerBoundaryRef,
      footerEl: footerNode,
      isMobile,
      orientation,
      isPatchNotesBannerVisible,
    });

  // Measure actual scrollbar wrapper height for BandBackgrounds and thumb calculations
  const [sbHeight, setSbHeight] = useState<number>(0);
  useLayoutEffect(() => {
    const el = scrollbarWrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setSbHeight(el.getBoundingClientRect().height),
    );
    ro.observe(el);
    setSbHeight(el.getBoundingClientRect().height);
    return () => ro.disconnect();
  }, []);

  // Calculate visible columns for layout logic
  const visibleColumns = useMemo(() => {
    const columns = [
      "Reference", // Always visible
      mainTranslation, // Main translation always visible
      ...(showCrossRefs ? ["Cross References"] : []),
      ...(showProphecies ? ["P", "F", "V"] : []),
      ...activeTranslations.filter((t) => t !== mainTranslation), // Alternate translations
    ];
    return columns;
  }, [mainTranslation, showCrossRefs, showProphecies, activeTranslations]);

  // CENTERING FIX: Make viewport width reactive to window resize events
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );

  // Update viewport width on window resize (debounced)
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout;

    const handleResize = () => {
      // Debounce resize to avoid excessive re-renders during drag-resize
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setViewportWidth(window.innerWidth);
      }, 100); // 100ms debounce
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Track previous width to detect 640px threshold crossing
  const prevWidthRef = useRef(window.innerWidth);
  const [isWidthTransitioning, setIsWidthTransitioning] = useState(false);
  const savedScrollPosRef = useRef(0);

  useEffect(() => {
    const currentWidth = viewportWidth;
    const prevWidth = prevWidthRef.current;

    // Detect crossing the 640px threshold
    const crossedThreshold =
      (prevWidth <= 640 && currentWidth > 640) ||
      (prevWidth > 640 && currentWidth <= 640);

    if (crossedThreshold) {
      // Save current scroll position before pausing
      savedScrollPosRef.current = scrollRoot.getScrollTop();

      // Pause verse rendering during width transition
      setIsWidthTransitioning(true);

      // Resume after 1 animation frame (faster than before)
      requestAnimationFrame(() => {
        setIsWidthTransitioning(false);
        prevWidthRef.current = currentWidth;

        // Restore scroll position after re-render
        requestAnimationFrame(() => {
          scrollRoot.scrollToTop(savedScrollPosRef.current, false);
        });
      });
    } else {
      prevWidthRef.current = currentWidth;
    }
  }, [viewportWidth, scrollRoot]);

  // Responsive column system
  const responsiveConfig = useResponsiveColumns();

  // STATE MACHINE: Intelligent alignment control
  const alignmentState = useColumnAlignmentStateMachine();

  // Force alignment recalculation after initial DOM mount
  const [mountComplete, setMountComplete] = useState(false);
  useEffect(() => {
    // Wait for DOM to be fully rendered before forcing alignment calculation
    const timer = setTimeout(() => {
      setMountComplete(true);
      // Force a re-render to recalculate alignment with DOM measurements
      setLayoutRevision((prev) => prev + 1);
    }, 100);

    // Listen for viewport measurements from NewColumnHeaders
    const handleViewportMeasured = () => {
      setLayoutRevision((prev) => prev + 1);
    };

    window.addEventListener("column-viewport-measured", handleViewportMeasured);

    return () => {
      clearTimeout(timer);
      window.removeEventListener(
        "column-viewport-measured",
        handleViewportMeasured,
      );
    };
  }, []);

  // Override responsive config alignment with state machine output
  const finalResponsiveConfig = {
    ...responsiveConfig,
    columnAlignment:
      alignmentState.alignment === "center" ? "centered" : "left-based",
  };
  // Expert's lightweight CSS-first adaptive system
  useAdaptiveWidths();

  const adaptiveConfig = useAdaptivePortraitColumns();

  // Track column width multiplier changes for responsive centering
  const [columnWidthMult, setColumnWidthMult] = useState(1);

  // CENTERING FIX: Add reactive state for translation changes that forces recalculation
  const [layoutRevision, setLayoutRevision] = useState(0);

  // Listen for column width multiplier changes (presentation mode, manual sizing)
  useEffect(() => {
    // Initial read
    const root = document.documentElement;
    const initialMult = parseFloat(
      getComputedStyle(root).getPropertyValue("--column-width-mult") || "1",
    );
    setColumnWidthMult(initialMult);

    // Debounce MutationObserver updates to avoid excessive re-renders
    let updateTimer: NodeJS.Timeout;
    const observer = new MutationObserver(() => {
      clearTimeout(updateTimer);
      updateTimer = setTimeout(() => {
        const currentMult = parseFloat(
          getComputedStyle(root).getPropertyValue("--column-width-mult") || "1",
        );
        if (Math.abs(currentMult - columnWidthMult) > 0.01) {
          setColumnWidthMult(currentMult);
        }
      }, 50); // 50ms debounce
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      observer.disconnect();
      clearTimeout(updateTimer);
    };
  }, [columnWidthMult]);

  // CENTERING FIX: Listen for translation change events and force layout recalculation
  useEffect(() => {
    const handleTranslationLayoutChange = (event: CustomEvent) => {
      logger.debug("LAYOUT", "translation-layout-changed", event.detail, {
        throttleMs: 500,
      });
      // Force recalculation by incrementing revision counter
      setLayoutRevision((prev) => prev + 1);

      // Also trigger a delayed ResizeObserver-style recalculation for the container
      setTimeout(() => {
        const container = containerRef.current;
        if (container) {
          // Force browser to recalculate layout by reading offsetWidth
          const _ = container.offsetWidth;
          // Trigger another recalculation after DOM settles
          setLayoutRevision((prev) => prev + 1);
        }
      }, 50);
    };

    const handleTranslationSlotVisibility = (event: CustomEvent) => {
      logger.debug(
        "LAYOUT",
        "translation-slot-visibility-changed",
        event.detail,
        { throttleMs: 500 },
      );
      // Force recalculation by incrementing revision counter
      setLayoutRevision((prev) => prev + 1);
    };

    // Listen for translation change events
    window.addEventListener(
      "translation-layout-change",
      handleTranslationLayoutChange as EventListener,
    );
    window.addEventListener(
      "translation-slot-visibility",
      handleTranslationSlotVisibility as EventListener,
    );

    return () => {
      window.removeEventListener(
        "translation-layout-change",
        handleTranslationLayoutChange as EventListener,
      );
      window.removeEventListener(
        "translation-slot-visibility",
        handleTranslationSlotVisibility as EventListener,
      );
    };
  }, []);

  // Calculate actual total width based on visible columns using adaptive widths AND column width multiplier
  const actualTotalWidth = useMemo(() => {
    const { adaptiveWidths } = adaptiveConfig;

    let width = 0;

    // Reference column - use adaptive width with multiplier
    width += adaptiveWidths.reference * columnWidthMult;

    // Main translation - use adaptive width with multiplier
    width += adaptiveWidths.mainTranslation * columnWidthMult;

    // Cross references - use adaptive width with multiplier
    if (showCrossRefs) {
      width += adaptiveWidths.crossReference * columnWidthMult;
    }

    // Unified Prophecy column (slot 16) - single column with tabs
    if (showProphecies) {
      width += adaptiveWidths.prophecy * columnWidthMult; // 1 unified prophecy column
    }

    // Notes column - use adaptive width with multiplier
    if (showNotes) {
      width += adaptiveWidths.notes * columnWidthMult;
    }

    // Context/dates - NO WIDTH ADDED (dates appear inline in reference column, not as separate column)

    // CENTERING FIX: Use the same translation state as column rendering
    // Use useTranslationMaps store to match exactly what columns are actually rendered
    const actualAlternatesCount = translationMaps.alternates.filter(
      (code) => code !== translationMaps.mainTranslation,
    ).length;
    if (actualAlternatesCount > 0) {
      width +=
        actualAlternatesCount * adaptiveWidths.alternate * columnWidthMult;
    }

    return width;
  }, [
    adaptiveConfig,
    translationMaps.mainTranslation,
    translationMaps.alternates,
    showCrossRefs,
    showProphecies,
    showNotes,
    columnWidthMult,
    viewportWidth,
    layoutRevision,
  ]);

  // Update CSS variables dynamically based on adaptive configuration
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      // Update CSS custom properties for adaptive column widths
      const root = document.documentElement;
      const { adaptiveWidths } = adaptiveConfig;

      root.style.setProperty(
        "--adaptive-ref-width",
        `${adaptiveWidths.reference}px`,
      );
      root.style.setProperty(
        "--adaptive-main-width",
        `${adaptiveWidths.mainTranslation}px`,
      );
      root.style.setProperty(
        "--adaptive-cross-width",
        `${adaptiveWidths.crossReference}px`,
      );
      root.style.setProperty(
        "--adaptive-alt-width",
        `${adaptiveWidths.alternate}px`,
      );
      root.style.setProperty(
        "--adaptive-prophecy-width",
        `${adaptiveWidths.prophecy}px`,
      );
      root.style.setProperty(
        "--adaptive-notes-width",
        `${adaptiveWidths.notes}px`,
      );
      root.style.setProperty(
        "--adaptive-context-width",
        `${adaptiveWidths.context}px`,
      );

      // console.log('🎯 Applied THREE-COLUMN Adaptive Widths:', { // Disabled for performance
      //   viewport: `${adaptiveConfig.screenWidth}×${adaptiveConfig.screenHeight}`,
      //   isPortrait: adaptiveConfig.isPortrait,
      //   safeWidth: adaptiveConfig.safeViewportWidth,
      //   coreColumnsWidth: adaptiveConfig.coreColumnsWidth,
      //   guaranteedFit: adaptiveConfig.guaranteedFit,
      //   threeColumnWidths: {
      //     reference: adaptiveWidths.reference,
      //     mainTranslation: adaptiveWidths.mainTranslation,
      //     crossReference: adaptiveWidths.crossReference
      //   },
      //   equalMainCross: Math.abs(adaptiveWidths.mainTranslation - adaptiveWidths.crossReference) <= 1
      // });
    }
  }, [adaptiveConfig]);

  // ADAPTIVE VERSE REFERENCE ROTATION: Monitor reference column width and rotate when thin
  useReferenceColumnWidth();

  // Cross-references can now be toggled on/off freely in portrait mode
  // Removed auto-enable logic to allow user control via menu

  // The old static column system has been removed
  // All column calculations now happen dynamically via useMeasureVisibleColumns

  // PROPER CENTERING: Only center when content actually fits without horizontal scroll
  // AND when it won't interfere with ref column sticky positioning
  const shouldCenter = !isMobile && actualTotalWidth <= viewportWidth * 0.9;
  const needsHorizontalScroll = actualTotalWidth > viewportWidth;
  // FIX: Disable centering when horizontal scroll is needed to preserve ref column stickiness
  const canSafelyCenterWithoutInterference =
    shouldCenter && !needsHorizontalScroll;

  // RESPONSIVE MIN-WIDTH: Calculate for both VirtualRow and RowSkeleton
  const responsiveMinWidth = useMemo(() => {
    // On mobile/tablet, allow more flexible width utilization
    if (viewportWidth <= 768) {
      // Use 95% of viewport width or actual width, whichever is smaller
      return Math.min(actualTotalWidth, viewportWidth * 0.95);
    }
    // On desktop, maintain full calculated width
    return actualTotalWidth;
  }, [actualTotalWidth, viewportWidth]);

  // ========== UNIFIED SCROLL SYSTEM ==========
  // Initialize scroll position and set up unified tracking
  useEffect(() => {
    // Reset scroll position to start at Genesis 1:1 (top)
    scrollRoot.scrollToTop(0, false);
    setScrollTop(0);
    logger.debug(
      "SCROLL",
      "unified-system-reset",
      { mode: scrollRoot.kind },
      { throttleMs: 1000 },
    );
  }, [scrollRoot.kind]);

  // ========== PORTRAIT MODE VIRTUAL HEIGHT SETUP ==========
  // Ensure body has correct height for scrollbar calculations in portrait mode
  const originalBodyMinHeightRef = useRef<string | null>(null);

  useEffect(() => {
    // Capture original body height only once
    if (originalBodyMinHeightRef.current === null) {
      originalBodyMinHeightRef.current = document.body.style.minHeight;
    }

    if (!isPortrait) {
      // Restore original height when leaving portrait mode
      if (originalBodyMinHeightRef.current !== null) {
        document.body.style.minHeight = originalBodyMinHeightRef.current;
      }
      return;
    }

    // FIXED: Don't set body height to millions of pixels - causes ballooning!
    // Virtual scrolling handles this internally with spacer divs
    // document.body.style.minHeight = `${fullVirtualHeight}px`;

    logger.debug(
      "MOBILE",
      "portrait-virtual-scrolling",
      {
        totalVerses: verseKeys.length,
        mode: "portrait-virtual-height",
      },
      { throttleMs: 1000 },
    );

    // Cleanup on unmount
    return () => {
      if (originalBodyMinHeightRef.current !== null) {
        document.body.style.minHeight = originalBodyMinHeightRef.current;
      }
    };
  }, [isPortrait, verseKeys.length, effectiveRowHeight]);

  // Unified scroll tracking - works for both window and container modes
  useEffect(() => {
    const onScroll = () => {
      const currentScrollTop = scrollRoot.getScrollTop();

      // Track horizontal scroll for header sync (get from container for both modes)
      const container = containerRef.current;
      if (container) {
        setScrollLeft(container.scrollLeft);
      }

      // Update scrollTop state if not dragging scrollbar
      if (!isScrollbarDragging) {
        setScrollTop(currentScrollTop);
      }

      // Calculate which verse is at the center of the viewport for navigation tracking
      const viewportHeight =
        scrollRoot.kind === "window"
          ? window.innerHeight
          : containerRef.current?.clientHeight || 0;
      const stickyOffset = getStickyHeaderOffset(scrollRoot.kind);
      const centerIdx = centerIndexFrom(
        currentScrollTop,
        viewportHeight,
        effectiveRowHeight,
        stickyOffset,
      );

      // Clamp to valid range
      const clampedCenterIdx = Math.max(
        0,
        Math.min(centerIdx, verseKeys.length - 1),
      );
      setCurrentCenterIndex(clampedCenterIdx);

      // Banner rollup logic for mobile
      if (isMobile && currentScrollTop > 30) {
        window.dispatchEvent(
          new CustomEvent("virtualTableScroll", {
            detail: { scrollDirection: "down", scrollTop: currentScrollTop },
          }),
        );
      }
    };

    // Use unified scroll root listener
    return scrollRoot.addScrollListener(onScroll);
  }, [
    scrollRoot,
    isScrollbarDragging,
    isMobile,
    effectiveRowHeight,
    verseKeys.length,
  ]);

  // ========== END UNIFIED SCROLL SYSTEM ==========

  // ========== KEYBOARD CONTROLS FOR JOYSTICK ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond to arrow keys
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
        return;

      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      e.preventDefault(); // Prevent default scrolling

      switch (e.key) {
        case "ArrowUp":
          stepSelection("prev");
          break;
        case "ArrowDown":
          stepSelection("next");
          break;
        case "ArrowLeft":
          cycleScrollbarMode("prev");
          break;
        case "ArrowRight":
          cycleScrollbarMode("next");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stepSelection, cycleScrollbarMode]);
  // ========== END KEYBOARD CONTROLS ==========

  // CSS handles centering automatically with margin-inline: auto

  // Define --colW CSS variable for mobile dual-column layout
  useEffect(() => {
    const BASE_COL_W = 640; // Base column width to match CSS
    const sizeMultiplier =
      preferences.fontSize === "small"
        ? 0.9
        : preferences.fontSize === "large"
          ? 1.1
          : 1;
    document.documentElement.style.setProperty(
      "--colW",
      `${BASE_COL_W * sizeMultiplier}px`,
    );
  }, [preferences.fontSize]);

  // Expert's CSS Grid handles overflow naturally - no manual scroll interference needed

  return (
    <div
      className={`virtual-bible-table ${className}`}
      style={{ paddingTop: "0px", marginTop: "0px" }}
    >
      {/* NewColumnHeaders moved to TopHeader for unified sticky positioning */}

      {/* Unified scroll container with momentary axis commitment */}
      <div
        id="virtual-bible-scroll"
        ref={(node) => {
          (wrapperRef as any).current = node;
          (vScrollRef as any).current = node;
          (hScrollRef as any).current = node;
          (containerRef as any).current = node; // Connect containerRef for anchor slice system
        }}
        className="unified-scroll-container scroll-area virtualTableViewport fullscreen-area"
        data-bible-scroll-container
        data-scroll-root
        style={
          {
            position: "relative",
            height: isMinimized
              ? "100dvh" // True fullscreen - negative margin on parent pulls table under sticky headers
              : isMobile && isPortrait
                ? isPatchNotesBannerVisible
                  ? "calc(100dvh - 44px)" // With banner (48px header + 56px banner)
                  : "calc(100dvh - 48px)" // Without banner (48px header only)
                : isMobile
                  ? "calc(100dvh - var(--top-header-height-mobile) - 20px)"
                  : "calc(100dvh - var(--top-header-height-desktop))", //,
            paddingTop: isMinimized ? `${stickyHeaderHeight}px` : "0px", // Offset for sticky headers in Focus Mode
            overflowX: "hidden", // DISABLE horizontal scrolling - use column navigation buttons instead
            overflowY: "auto", // Allow vertical scrolling
            overscrollBehavior: "contain",
            contain: "layout paint style",
            willChange: "scroll-position",
            touchAction: "pan-y", // Only allow vertical panning, disable horizontal
            // Hide default scrollbars since we'll show custom ones
            scrollbarWidth: "none", // Firefox
            msOverflowStyle: "none", // IE/Edge
            // On mobile, only allow vertical scrolling - horizontal navigation via buttons
            ...(isMobile && {
              touchAction: "pan-y", // Only vertical panning
              overscrollBehaviorX: "none", // Disable horizontal overscroll
              overscrollBehaviorY: "contain",
            }),
            // SINGLE SOURCE OF TRUTH: Set --row-height for CSS to match JS calculations
            ["--row-height" as any]: `${effectiveRowHeight}px`,
          } as React.CSSProperties
        }
        data-testid="bible-table"
      >
        {/* Content container - preserving original adaptive behavior */}
        <div
          className="tableInner flex will-change-transform"
          style={{
            minWidth: "fit-content",
            width: "fit-content",
            margin:
              isPortraitOrientation || alignmentState.alignment === "left"
                ? "0"
                : "0 auto",
            overflow: "visible",
            transition: "transform 0.3s ease",
          }}
        >
          <div
            style={{
              minWidth:
                finalResponsiveConfig.columnAlignment === "centered"
                  ? "fit-content"
                  : `${actualTotalWidth}px`,
              width:
                finalResponsiveConfig.columnAlignment === "centered"
                  ? "auto"
                  : `${actualTotalWidth}px`,
            }}
          >
            {/* Virtual scroll spacer (top) - creates scroll space for all verses */}
            <div
              style={{
                height: slice.start * effectiveRowHeight,
                pointerEvents: "none",
                contain: "strict", // Prevent layout thrashing
              }}
              data-spacer="top"
              data-debug-height={slice.start * effectiveRowHeight}
              data-debug-start={slice.start}
              data-debug-rowheight={effectiveRowHeight}
            />
            {/* Two-phase rendering: mount skeleton immediately, swap to content when data ready */}
            {!isWidthTransitioning &&
              slice.verseIDs.map((id, i) => {
                const rowIndex = slice.start + i;
                const verseIndex = verseKeys.indexOf(id);
                const isReady =
                  verseIndex >= 0 && isVerseReady(verseIndex, mainTranslation);
                const columnCount = visibleColumnsConfig?.length || 3;

                return isReady ? (
                  <VirtualRow
                    key={id}
                    verseID={id}
                    rowIndex={rowIndex}
                    rowHeight={effectiveRowHeight}
                    columnData={columnData}
                    getVerseText={getVerseTextForRow}
                    getMainVerseText={getMainVerseTextForRow}
                    activeTranslations={activeTranslations}
                    mainTranslation={mainTranslation}
                    translationsVersion={translationMaps.translationsVersion}
                    onVerseClick={columnData.onVerseClick}
                    onExpandVerse={onExpandVerse}
                    getVerseLabels={getVerseLabels}
                    centerVerseRef={centerVerseRef}
                    stickyHeaderOffset={stickyOffset}
                    onOpenProphecy={onOpenProphecy}
                    onNavigateToVerse={columnData.onVerseClick}
                    visibleColumnsConfig={visibleColumnsConfig}
                    isCenterRow={verseIndex === currentCenterIndex}
                  />
                ) : (
                  <RowSkeleton
                    key={id}
                    rowHeight={effectiveRowHeight}
                    verseRef={id}
                    columnCount={columnCount}
                    visibleColumnsConfig={visibleColumnsConfig}
                    actualTotalWidth={actualTotalWidth}
                    responsiveMinWidth={responsiveMinWidth}
                    needsHorizontalScroll={needsHorizontalScroll}
                  />
                );
              })}
            {/* Virtual scroll spacer (bottom) - creates scroll space for all verses */}
            <div
              style={{
                height: (verseKeys.length - slice.end) * effectiveRowHeight,
                pointerEvents: "none",
                contain: "strict", // Prevent layout thrashing
              }}
              data-spacer="bottom"
            />
          </div>
        </div>
      </div>

      {/* Task 6: ARIA-live region for accessibility announcements */}
      {FEATURES.A11Y_ANNOUNCE_ENABLED && (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {ariaAnnouncement}
        </div>
      )}

      {/* Scrollbar Wrapper - relative container for controls and track */}
      <div
        ref={scrollbarWrapperRef}
        className="fixed z-[60] group"
        style={{
          position: "fixed",
          zIndex: 60,
          top: scrollbarTop,
          right: "calc(env(safe-area-inset-right, 0px))",
          height: `${scrollbarHeight}px`,
          transition: "top 300ms ease-out, height 300ms ease-out",
        }}
      >
        {/* REMOVED: Lock toggle button (auto-zoom feature disabled) */}

        {/* Mobile-Optimized Vertical Scrollbar Track */}
        <div
          className="relative w-6 md:w-4 h-full bg-gray-300 dark:bg-gray-700 rounded-l-full transition-all duration-200 cursor-pointer"
          data-smart-scrollbar-track
          role="slider"
          aria-label="Bible scrollbar"
          aria-valuemin={0}
          aria-valuemax={verseKeys.length - 1}
          aria-valuenow={anchorIndex}
          aria-valuetext={scrollbarLabel}
          aria-description="Click to jump; drag to scrub. Shift+click for section boundary, Alt+click for book start."
          onPointerDown={handleTrackPointerDown}
          onPointerUp={handleTrackPointerUp}
          style={{
            boxShadow: "inset 1px 0 0 rgba(255,255,255,0.06)", // Subtle left edge highlight
          }}
        >
          {/* Vertical Labels - Primary (big) and Secondary (smaller) stacked */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              writingMode: "vertical-rl",
              textOrientation: "upright",
              gap: "8px",
            }}
            className="select-none"
          >
            {/* Primary Label (bigger) */}
            <span className="text-[11px] md:text-[12px] tracking-[0.08em] text-black/70 dark:text-white/60 md:group-hover:text-black/90 md:dark:group-hover:text-white/85 transition-opacity duration-200 font-medium">
              {scrollbarPrimaryLabel}
            </span>
            {/* Secondary Label (smaller, beneath) */}
            <span className="text-[9px] md:text-[10px] tracking-[0.06em] text-black/55 dark:text-white/40 md:group-hover:text-black/75 md:dark:group-hover:text-white/65 transition-opacity duration-200">
              {scrollbarSecondaryLabel}
            </span>
          </div>
          {/* Band backgrounds - subtle tint showing active testament/section */}
          {controllerRef.current && sbHeight > 0 && (
            <BandBackgrounds
              key={`bands-${scaleVersion}`}
              scale={controllerRef.current.getScale()}
              height={sbHeight}
              version={scaleVersion}
            />
          )}

          {/* Morphing Thumb: Oval -> Triangle when grabbed */}
          <div
            data-smart-scrollbar-thumb
            data-scrollbar-thumb
            style={(() => {
              // Use actual measured track height
              const trackH = sbHeight || 1;
              const contentH = verseKeys.length * effectiveRowHeight;
              const viewportH = scrollRoot.getClientHeight();
              const maxScroll = Math.max(1, contentH - viewportH);

              // Calculate thumb height as % of track (viewport/content ratio)
              const thumbHeightPct = Math.max(
                8,
                Math.min(40, (viewportH / contentH) * 100),
              );
              const y01FromScroll = Math.max(
                0,
                Math.min(1, scrollTop / maxScroll),
              );

              const thumbY01 = isScrollbarDragging
                ? y01FromScroll
                : (controllerRef.current?.yForIndex(anchorIndex) ??
                  y01FromScroll);

              if (isScrollbarDragging) {
                // Triangle mode (precision pointer)
                const triangleHeight = 16; // px
                const triangleWidth = 12; // px
                return {
                  position: "absolute" as const,
                  right: "0",
                  top: `${thumbY01 * 100}%`,
                  transform: "translateY(-50%)",
                  width: "0",
                  height: "0",
                  borderTop: `${triangleHeight / 2}px solid transparent`,
                  borderBottom: `${triangleHeight / 2}px solid transparent`,
                  borderLeft: `${triangleWidth}px solid rgba(59, 130, 246, 0.75)`,
                  cursor: "pointer",
                  filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
                  transition: "all 120ms ease-out",
                  zIndex: 10,
                  touchAction: "none",
                };
              } else {
                // Oval mode (normal state) - no width override, let Tailwind control it
                return {
                  position: "absolute" as const,
                  right: "0",
                  top: `${thumbY01 * (100 - thumbHeightPct)}%`,
                  height: `${thumbHeightPct}%`,
                  minHeight: "32px",
                  background:
                    "linear-gradient(to right, rgba(59, 130, 246, 0.75), rgba(59, 130, 246, 0.75))",
                  borderRadius: "12px 0 0 12px",
                  cursor: "pointer",
                  boxShadow:
                    "inset 0.5px 0 0 rgba(255,255,255,0.12), 0 2px 6px rgba(0, 0, 0, 0.25)",
                  transition: "all 120ms ease-out",
                  zIndex: 10,
                  touchAction: "none",
                };
              }
            })()}
            className={
              isScrollbarDragging
                ? ""
                : "w-6 md:w-4 md:hover:brightness-110 active:brightness-125"
            }
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation(); // Prevent track click handler from firing
              handleScrollbarDragChange(true, e.clientX, e.clientY);

              // REMOVED: onInteractStart (auto-zoom disabled)

              // Initialize velocity tracking
              setLastDragY(e.clientY);
              setLastDragTime(performance.now());

              const startY = e.clientY;
              const scrollContainer = containerRef.current;
              if (!scrollContainer) return;

              // UNIFIED: Use scrollRoot for consistent coordinate system in both modes
              const startScrollTop = scrollRoot.getScrollTop();
              const viewportHeight = scrollRoot.getClientHeight();
              const maxScroll = Math.max(
                0,
                verseKeys.length * effectiveRowHeight - viewportHeight,
              );

              const handleMouseMove = (e: MouseEvent) => {
                // Update tooltip position immediately for instant feedback
                setMousePosition({ x: e.clientX, y: e.clientY });

                // Task 5: rAF throttling - skip if already scheduled
                if (rafIdRef.current) return;

                rafIdRef.current = requestAnimationFrame(() => {
                  rafIdRef.current = 0;

                  // Calculate velocity
                  const dtMs = performance.now() - lastDragTime;
                  const deltaPx = e.clientY - lastDragY;

                  // Get track element and calculate y01
                  const trackElement = document.querySelector(
                    "[data-smart-scrollbar-track]",
                  );
                  if (!trackElement || !controllerRef.current) return;

                  const trackRect = trackElement.getBoundingClientRect();
                  const y01 = (e.clientY - trackRect.top) / trackRect.height;

                  // Use controller to map to verse index (with bypass mode)
                  const targetIndex = controllerRef.current.onInteractStep(
                    y01,
                    deltaPx,
                    dtMs,
                    bypassMode,
                  );

                  // Convert index to scrollTop (center the target verse)
                  const newScrollTop =
                    targetIndex * effectiveRowHeight - viewportHeight / 2;
                  const clampedScrollTop = Math.max(
                    0,
                    Math.min(maxScroll, newScrollTop),
                  );

                  scrollRoot.scrollToTop(clampedScrollTop, false);
                  setScrollTop(clampedScrollTop);

                  // Update velocity tracking
                  setLastDragY(e.clientY);
                  setLastDragTime(performance.now());
                }) as unknown as number;
              };

              const handleMouseUp = (e: MouseEvent) => {
                handleScrollbarDragChange(false);
                setBypassMode(false); // Reset bypass mode

                // Calculate final y01 position and velocity for controller
                const trackElement = document.querySelector(
                  "[data-smart-scrollbar-track]",
                );
                if (trackElement && controllerRef.current) {
                  const trackRect = trackElement.getBoundingClientRect();
                  const finalY01 =
                    (e.clientY - trackRect.top) / trackRect.height;
                  const finalDtMs = performance.now() - lastDragTime;
                  const finalDeltaPx = Math.abs(e.clientY - lastDragY);
                  const finalVelocity = finalDeltaPx / Math.max(1, finalDtMs);

                  // Notify controller interaction has ended
                  controllerRef.current.onInteractEnd(finalY01, finalVelocity);
                }

                // FORCE REFRESH: Trigger a scroll event to ensure virtual loading catches up
                requestAnimationFrame(() => {
                  // Dispatch scroll event on the correct element
                  const element =
                    scrollRoot.kind === "window"
                      ? document.body
                      : containerRef.current;
                  element?.dispatchEvent(new Event("scroll"));
                });

                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };

              document.addEventListener("mousemove", handleMouseMove, {
                passive: false,
              });
              document.addEventListener("mouseup", handleMouseUp, {
                passive: false,
              });
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation(); // Prevent track click handler from firing
              const touch = e.touches[0];
              handleScrollbarDragChange(true, touch.clientX, touch.clientY);

              // REMOVED: onInteractStart (auto-zoom disabled)

              // Initialize velocity tracking
              setLastDragY(touch.clientY);
              setLastDragTime(performance.now());

              // Long-press detection for bypass mode (mobile)
              if (isMobile) {
                longPressTimerRef.current = setTimeout(() => {
                  setBypassMode(true);
                }, 500); // 500ms long-press threshold
              }

              const startY = touch.clientY;
              const scrollContainer = containerRef.current;
              if (!scrollContainer) return;

              // UNIFIED: Use scrollRoot for consistent coordinate system in both modes
              const startScrollTop = scrollRoot.getScrollTop();
              const viewportHeight = scrollRoot.getClientHeight();
              const maxScroll = Math.max(
                0,
                verseKeys.length * effectiveRowHeight - viewportHeight,
              );

              const handleTouchMove = (e: TouchEvent) => {
                e.preventDefault();
                const touch = e.touches[0];

                // Clear long-press timer on first move (it's now a drag, not a hold)
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = null;
                }

                // Capture touch coordinates BEFORE rAF - touch event is reused by browser
                const touchX = touch.clientX;
                const touchY = touch.clientY;

                // Update tooltip position immediately for instant feedback
                setMousePosition({ x: touchX, y: touchY });

                // Task 5: rAF throttling - skip if already scheduled
                if (rafIdRef.current) return;

                rafIdRef.current = requestAnimationFrame(() => {
                  rafIdRef.current = 0;

                  // Calculate velocity
                  const dtMs = performance.now() - lastDragTime;
                  const deltaPx = touchY - lastDragY;

                  // Get track element and calculate y01
                  const trackElement = document.querySelector(
                    "[data-smart-scrollbar-track]",
                  );
                  if (!trackElement || !controllerRef.current) return;

                  const trackRect = trackElement.getBoundingClientRect();
                  const y01 = (touchY - trackRect.top) / trackRect.height;

                  // Use controller to map to verse index (with bypass mode)
                  const targetIndex = controllerRef.current.onInteractStep(
                    y01,
                    deltaPx,
                    dtMs,
                    bypassMode,
                  );

                  // Convert index to scrollTop (center the target verse)
                  const newScrollTop =
                    targetIndex * effectiveRowHeight - viewportHeight / 2;
                  const clampedScrollTop = Math.max(
                    0,
                    Math.min(maxScroll, newScrollTop),
                  );

                  scrollRoot.scrollToTop(clampedScrollTop, false);
                  setScrollTop(clampedScrollTop);

                  // Update velocity tracking
                  setLastDragY(touchY);
                  setLastDragTime(performance.now());
                }) as unknown as number;
              };

              const handleTouchEnd = (e: TouchEvent) => {
                e.preventDefault();
                handleScrollbarDragChange(false);

                // Clear long-press timer and reset bypass mode
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = null;
                }
                setBypassMode(false);

                // Calculate final y01 position and velocity for controller
                const touch = e.changedTouches[0];
                const trackElement = document.querySelector(
                  "[data-smart-scrollbar-track]",
                );
                if (trackElement && controllerRef.current && touch) {
                  const trackRect = trackElement.getBoundingClientRect();
                  const finalY01 =
                    (touch.clientY - trackRect.top) / trackRect.height;
                  const finalDtMs = performance.now() - lastDragTime;
                  const finalDeltaPx = Math.abs(touch.clientY - lastDragY);
                  const finalVelocity = finalDeltaPx / Math.max(1, finalDtMs);

                  // Notify controller interaction has ended
                  controllerRef.current.onInteractEnd(finalY01, finalVelocity);
                }

                // FORCE REFRESH: Trigger a scroll event to ensure virtual loading catches up
                requestAnimationFrame(() => {
                  // Dispatch scroll event on the correct element
                  const element =
                    scrollRoot.kind === "window"
                      ? document.body
                      : containerRef.current;
                  element?.dispatchEvent(new Event("scroll"));
                });

                document.removeEventListener("touchmove", handleTouchMove);
                document.removeEventListener("touchend", handleTouchEnd);
              };

              document.addEventListener("touchmove", handleTouchMove, {
                passive: false,
              });
              document.addEventListener("touchend", handleTouchEnd);
            }}
          />

          {/* Precision Marker Line - Shows during triangle drag for exact positioning */}
          {isScrollbarDragging &&
            (() => {
              // Use real viewport and content measurements
              const contentH = verseKeys.length * effectiveRowHeight;
              const viewportH = scrollRoot.getClientHeight();
              const maxScroll = Math.max(1, contentH - viewportH);
              const thumbY01 = Math.max(0, Math.min(1, scrollTop / maxScroll));
              return (
                <div
                  className="absolute pointer-events-none left-0 right-[30px] md:right-[18px]"
                  style={{
                    top: `${thumbY01 * 100}%`,
                    height: "1px",
                    background:
                      "linear-gradient(to left, rgba(59, 130, 246, 0.6), rgba(59, 130, 246, 0.1) 60%, transparent)",
                    boxShadow: "0 0 4px rgba(59, 130, 246, 0.4)",
                    zIndex: 5,
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              );
            })()}

          {/* OT/NT Testament Divider - Tappable to jump to Matthew 1:1 */}
          <div
            className="absolute left-0 right-0 h-0.5 bg-amber-500/40 dark:bg-amber-400/40 cursor-pointer hover:bg-amber-500/60 dark:hover:bg-amber-400/60 transition-colors"
            style={{
              top: `${(controllerRef.current?.yForIndex(23145) ?? 0.744) * 100}%`,
              pointerEvents: "auto",
            }}
            onClick={() => {
              // Jump to Matthew 1:1 (index 23145)
              const viewportHeight = scrollRoot.getClientHeight();
              const targetScrollTop =
                23145 * effectiveRowHeight - viewportHeight / 2;
              const maxScroll = Math.max(
                0,
                verseKeys.length * effectiveRowHeight - viewportHeight,
              );
              scrollRoot.scrollToTop(
                Math.max(0, Math.min(maxScroll, targetScrollTop)),
                true,
              );
            }}
            title="Old Testament / New Testament"
          />
        </div>
      </div>

      {/* Scrollbar Tooltip - Shows verse reference during scrollbar dragging */}
      <ScrollbarTooltip
        scrollRoot={scrollRoot}
        containerRef={containerRef}
        scrollbarWrapperRef={scrollbarWrapperRef}
        isVisible={showScrollTooltip}
        mousePosition={mousePosition}
        verseKeys={verseKeys}
        currentScrollTop={scrollTop}
        effectiveRowHeight={effectiveRowHeight}
      />

      {/* Master Column Persistent Overlay - measures and aligns with column position */}
      {showHybrid && (
        <MasterColumnOverlay
          currentVerse={currentVerse || getCurrentVerse()}
          store={store}
          scrollRoot={scrollRoot}
          getVerseText={getVerseTextForRow}
          getVerseLabels={getVerseLabels}
          mainTranslation={mainTranslation}
          activeTranslations={activeTranslations}
          onVerseClick={columnData.onVerseClick}
          viewportWidth={viewportWidth}
          containerRef={containerRef}
          onStrongsClick={onStrongsClick}
          isPatchNotesBannerVisible={isPatchNotesBannerVisible}
          isMinimized={isMinimized}
        />
      )}

      {/* Navigation Joystick - Bottom Right with Toggle */}
      <JoystickToggle
        isVisible={shouldShowJoystick}
        onToggle={() => setJoystickVisible(!joystickVisible)}
        isPatchNotesBannerVisible={isPatchNotesBannerVisible}
        isMobile={isMobile}
        isPortrait={isPortrait}
        isMinimized={isMinimized}
        stickyHeaderHeight={stickyHeaderHeight}
        topPosition={joystickToggleTop}
      />

      <div
        ref={joystickWrapperRef}
        className="fixed z-[9999] transition-all duration-300"
        style={{
          top: `${joystickTop}px`,
          right: shouldShowJoystick
            ? "calc(1cm + env(safe-area-inset-right, 0px))"
            : "calc(-5cm + env(safe-area-inset-right, 0px))",
          opacity: shouldShowJoystick ? 1 : 0,
          pointerEvents: shouldShowJoystick ? "auto" : "none",
          transition: "opacity 200ms, transform 200ms, top 200ms",
          transform: shouldShowJoystick ? "translateX(0)" : "translateX(80%)",
        }}
      >
        <FourWayJoystick
          mode={scrollbarMode}
          onLeft={() => cycleScrollbarMode("prev")}
          onRight={() => cycleScrollbarMode("next")}
          onUp={() => stepSelection("prev")}
          onDown={() => stepSelection("next")}
          size={isMobile ? 108 : 128}
        />
      </div>
    </div>
  );
});

VirtualBibleTable.displayName = "VirtualBibleTable";

export default VirtualBibleTable;
export { VirtualBibleTable };
