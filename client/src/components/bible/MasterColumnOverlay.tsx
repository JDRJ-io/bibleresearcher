import { useMemo, useEffect, useState, useRef } from "react";
import { MasterColumnPanel } from "./MasterColumnPanel";
import { getStickyHeaderOffset } from "@/utils/geometry";
import type { ScrollRoot } from "@/hooks/useScrollRoot";
import { useVerseSelectionCapture } from "@/hooks/useVerseSelectionCapture";
import { usePreventScrollPropagation } from "@/hooks/usePreventScrollPropagation";

// Configurable top position adjustments for different orientations, devices, and banner states
// These adjust the final top position after stickyOffset + presetBarHeight + columnHeaderHeight
const MASTER_COLUMN_TOP_ADJUSTMENTS = {
  desktop: {
    landscape: {
      bannerOn: 125, // Desktop landscape with banner visible
      bannerOff: 60, // Desktop landscape with banner hidden
    },
    portrait: {
      bannerOn: 125, // Desktop portrait with banner visible
      bannerOff: 60, // Desktop portrait with banner hidden
    },
  },
  mobile: {
    landscape: {
      bannerOn: 0, // Mobile landscape with banner visible
      bannerOff: 80, // Mobile landscape with banner hidden
    },
    portrait: {
      bannerOn: -28, // Mobile portrait with banner visible (48px header + 56px banner)
      bannerOff: -20, // Mobile portrait with banner hidden (48px header only)
    },
  },
};

interface MasterColumnOverlayProps {
  currentVerse: { reference: string; index: number };
  store: any;
  scrollRoot: ScrollRoot;
  getVerseText: (verseID: string, translationCode: string) => string;
  getVerseLabels?: (verseReference: string) => Record<string, string[]>;
  mainTranslation: string;
  activeTranslations: string[];
  onVerseClick?: (ref: string) => void;
  viewportWidth: number;
  containerRef: React.RefObject<HTMLDivElement>;
  onStrongsClick?: (verseRef: string, strongsKey: string) => void;
  isPatchNotesBannerVisible?: boolean;
  isMinimized?: boolean;
}

export function MasterColumnOverlay({
  currentVerse,
  store,
  scrollRoot,
  getVerseText,
  getVerseLabels,
  mainTranslation,
  activeTranslations,
  onVerseClick,
  viewportWidth,
  containerRef,
  onStrongsClick,
  isPatchNotesBannerVisible = true,
  isMinimized = false,
}: MasterColumnOverlayProps) {
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [columnRect, setColumnRect] = useState<DOMRect | null>(null);
  
  // Create ref for text selection capture
  const panelContainerRef = useRef<HTMLDivElement>(null);
  
  // Enable text selection capture for highlighting
  useVerseSelectionCapture(panelContainerRef);
  
  // Prevent scroll propagation to underlying table (fixes mobile portrait scroll issues)
  usePreventScrollPropagation(panelContainerRef, {
    allowInternalScroll: true,
    preventWheel: true,
    preventTouch: true
  });

  // Detect device type and orientation
  const isMobile = viewportWidth <= 768;
  const isPortrait = windowHeight > viewportWidth;

  // Get configured top adjustment based on device, orientation, and banner visibility
  const getConfiguredTopAdjustment = () => {
    const bannerState = isPatchNotesBannerVisible ? "bannerOn" : "bannerOff";

    if (isMobile) {
      return isPortrait
        ? MASTER_COLUMN_TOP_ADJUSTMENTS.mobile.portrait[bannerState]
        : MASTER_COLUMN_TOP_ADJUSTMENTS.mobile.landscape[bannerState];
    }
    return isPortrait
      ? MASTER_COLUMN_TOP_ADJUSTMENTS.desktop.portrait[bannerState]
      : MASTER_COLUMN_TOP_ADJUSTMENTS.desktop.landscape[bannerState];
  };

  // Track window resize and measure column position
  useEffect(() => {
    const measureColumn = () => {
      const placeholder = containerRef.current?.querySelector(
        ".master-column-placeholder",
      );
      if (placeholder) {
        setColumnRect(placeholder.getBoundingClientRect());
      }
      setWindowHeight(window.innerHeight);
    };

    // Immediate measurement on mount
    measureColumn();

    // Retry measurement if placeholder wasn't ready - check every 100ms for up to 1 second
    let retryCount = 0;
    const maxRetries = 10;
    const retryInterval = setInterval(() => {
      const placeholder = containerRef.current?.querySelector(
        ".master-column-placeholder",
      );
      if (placeholder || retryCount >= maxRetries) {
        clearInterval(retryInterval);
        if (placeholder) {
          measureColumn();
        }
      }
      retryCount++;
    }, 100);

    // Window resize - immediate measurement
    const handleResize = () => {
      measureColumn();
    };
    window.addEventListener("resize", handleResize);

    // Fullscreen change - immediate measurement
    const handleFullscreenChange = () => {
      measureColumn();
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    // Orientation change - immediate measurement
    const handleOrientationChange = () => {
      measureColumn();
    };
    window.addEventListener("orientationchange", handleOrientationChange);
    screen.orientation?.addEventListener("change", handleOrientationChange);

    // Observe the placeholder element itself to detect movement
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(measureColumn);
    });
    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(measureColumn);
    });

    const placeholder = containerRef.current?.querySelector(
      ".master-column-placeholder",
    );
    if (placeholder) {
      observer.observe(placeholder);
      mutationObserver.observe(placeholder, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }

    // Observe container for child additions (to detect when placeholder appears)
    const containerMutationObserver = new MutationObserver(() => {
      requestAnimationFrame(measureColumn);
    });
    if (containerRef.current) {
      containerMutationObserver.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    // Also re-measure on scroll events (column alignment changes)
    const handleScroll = () => {
      requestAnimationFrame(measureColumn);
    };
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      clearInterval(retryInterval);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange,
      );
      window.removeEventListener("orientationchange", handleOrientationChange);
      screen.orientation?.removeEventListener(
        "change",
        handleOrientationChange,
      );
      observer.disconnect();
      mutationObserver.disconnect();
      containerMutationObserver.disconnect();
    };
  }, [containerRef]);

  // Track header/footer/preset bar heights to trigger recalculation when they change
  const [headerFooterKey, setHeaderFooterKey] = useState(0);

  // Monitor for UI changes that affect layout (preset bar, header, footer)
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const triggerRecalc = () => {
      // Minimal debounce to avoid redundant recomputes but stay responsive
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setHeaderFooterKey((prev) => prev + 1);
      }, 16); // ~1 frame at 60fps for near-instant updates
    };

    const mutationObserver = new MutationObserver(triggerRecalc);
    const resizeObserver = new ResizeObserver(triggerRecalc);

    // Observe the entire top header area to catch preset bar mounting
    const topHeaderArea = document.querySelector(
      'header, .top-header, [class*="top-header"]',
    );
    if (topHeaderArea) {
      mutationObserver.observe(topHeaderArea, {
        childList: true,
        subtree: true,
        attributes: true,
      });
      resizeObserver.observe(topHeaderArea);
    }

    // Observe column header - both mutations and size changes
    const headerEl = document.querySelector(".column-headers-wrapper");
    if (headerEl) {
      mutationObserver.observe(headerEl, {
        childList: true,
        subtree: true,
        attributes: true,
      });
      resizeObserver.observe(headerEl);
    }

    // Observe footer - both mutations and size changes
    const footerEl = document.querySelector(
      '.footer-component, footer, [class*="footer"]',
    );
    if (footerEl) {
      mutationObserver.observe(footerEl, {
        childList: true,
        subtree: true,
        attributes: true,
      });
      resizeObserver.observe(footerEl);
    }

    // Initial trigger to measure immediately
    triggerRecalc();

    return () => {
      clearTimeout(debounceTimer);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  // Memoize positioning calculations - recalculate on viewport OR header/footer changes
  const { fixedTop, fixedHeight } = useMemo(() => {
    // Focus Mode: Use simplified positioning
    if (isMinimized) {
      // In Focus Mode, position just below the sticky headers (PresetBar + ColumnHeaders)
      const presetBar = document.querySelector('.preset-bar, [class*="preset-bar"]');
      const columnHeaders = document.querySelector('.column-headers-section');
      
      const presetBarHeight = presetBar?.getBoundingClientRect().height || 40;
      const columnHeadersHeight = columnHeaders?.getBoundingClientRect().height || 22;
      const stickyHeadersHeight = presetBarHeight + columnHeadersHeight;
      
      // Measure footer height (footer is still visible in Focus Mode)
      const footerEl = document.querySelector('.footer-component, footer, [class*="footer"]');
      const footerHeight = footerEl?.getBoundingClientRect().height || 0;
      const footerPadding = 8; // Small padding to avoid touching footer
      
      // Calculate height: full viewport minus sticky headers and footer
      const height = Math.max(50, windowHeight - stickyHeadersHeight - footerHeight - footerPadding);
      
      return { fixedTop: stickyHeadersHeight, fixedHeight: height };
    }
    
    // Normal mode: Use complex positioning logic
    // Measure preset bar height
    const getPresetBarHeight = () => {
      const presetBar = document.querySelector(
        '.preset-bar, [class*="preset-bar"]',
      );
      if (presetBar) {
        return presetBar.getBoundingClientRect().height;
      }
      return 0;
    };
    const presetBarHeight = getPresetBarHeight();

    // Measure column header to get stable vertical position
    const getColumnHeaderHeight = () => {
      const headerEl = document.querySelector(".column-headers-wrapper");
      if (headerEl) {
        return headerEl.getBoundingClientRect().height;
      }
      return 32;
    };
    const columnHeaderHeight = getColumnHeaderHeight();

    const getFooterHeight = () => {
      const footerEl = document.querySelector(
        '.footer-component, footer, [class*="footer"]',
      );
      if (footerEl) {
        return footerEl.getBoundingClientRect().height;
      }
      return 0;
    };
    const footerHeight = getFooterHeight();

    const stickyOffset = getStickyHeaderOffset(scrollRoot.kind);
    const headerClearance = 0; // No extra clearance needed - align perfectly with column content

    // Calculate base top position
    const baseTop =
      stickyOffset + presetBarHeight + columnHeaderHeight + headerClearance;

    // Apply device/orientation-specific top adjustment
    const topAdjustment = getConfiguredTopAdjustment();
    const top = baseTop + topAdjustment;

    // Calculate height to fill space between column header and footer
    const footerPadding = 8; // Small padding to avoid touching footer
    const maxAvailableHeight =
      windowHeight - top - footerHeight - footerPadding;

    // Use full available height (no more limiting by configured heights)
    const height = Math.max(50, maxAvailableHeight);

    return { fixedTop: top, fixedHeight: height };
  }, [
    windowHeight,
    scrollRoot.kind,
    viewportWidth,
    headerFooterKey,
    isMobile,
    isPortrait,
    isPatchNotesBannerVisible,
    isMinimized,
  ]);

  // Get data for current verse - this updates on scroll
  const centerVerseRef = currentVerse.reference;
  const masterCrossRefStatus = store.crossRefs[centerVerseRef];
  const masterCrossRefs = masterCrossRefStatus?.data || [];
  const masterProphecyRoles = store.prophecyData?.[centerVerseRef];
  const masterStrongsData = store.strongsData[centerVerseRef] || [];

  // Don't render until we have column measurements
  if (!columnRect) return null;

  return (
    <div
      className="master-column-fixed-overlay flex flex-col"
      style={{
        position: "fixed",
        top: `${fixedTop}px`,
        left: `${columnRect.left}px`,
        width: `${columnRect.width}px`,
        height: `${fixedHeight}px`,
        zIndex: 50,
        backgroundColor: "var(--bg-primary)",
        borderLeft: "1px solid var(--border-color)",
        pointerEvents: "none",
      }}
    >
      <div ref={panelContainerRef} className="h-full overflow-hidden" style={{ pointerEvents: "auto", touchAction: "pan-y", overscrollBehavior: "contain" }}>
        <MasterColumnPanel
          verseRef={centerVerseRef}
          getVerseText={getVerseText}
          getVerseLabels={getVerseLabels}
          mainTranslation={mainTranslation}
          alternateTranslations={activeTranslations.slice(1, 3)}
          onVerseClick={onVerseClick}
          crossRefs={masterCrossRefs}
          strongsWords={masterStrongsData}
          prophecyRoles={masterProphecyRoles}
          onStrongsClick={onStrongsClick}
        />
      </div>
    </div>
  );
}
