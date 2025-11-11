import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Heart, Share2, X } from "lucide-react";
import { useTheme } from "@/components/bible/ThemeProvider";
import { useLandscapeSidecar } from "@/hooks/useLandscapeSidecar";

interface SupportUsModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
}

export function SupportUsModal({ isOpen, onClose }: SupportUsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isLandscape = useLandscapeSidecar();

  // 🔐 NEW: read publishable key from Vite env (set in Vercel)
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? "";

  useEffect(() => {
    if (!isOpen) return;

    // Lazy-load Stripe Buy Button script only when modal opens
    if (!document.querySelector('script[src*="stripe.com/v3/buy-button.js"]')) {
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/buy-button.js";
      script.async = true;
      document.body.appendChild(script);
    }

    // Lock body scroll
    document.body.style.overflow = "hidden";

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
      <div
        ref={modalRef}
        className={`relative bg-white/80 dark:bg-black/80 backdrop-blur-xl backdrop-saturate-150 rounded-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] w-full mx-4 ${
          isLandscape ? "max-w-4xl" : "max-w-[95vw] sm:max-w-md"
        } border border-white/20 overflow-hidden max-h-[90vh] flex flex-col`}
      >
        {/* Close button - absolute positioned for landscape */}
        {isLandscape && (
          <div className="absolute top-3 right-3 z-10 pointer-events-none">
            <button
              onClick={() => onClose(false)}
              className="pointer-events-auto p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
              data-testid="button-close-support-modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Two-Pane Grid Layout for Landscape - Single-Scroll Parent */}
        <div
          className={
            isLandscape
              ? "grid grid-cols-12 gap-6 flex-1 overflow-y-auto"
              : "space-y-4 overflow-y-auto flex-1"
          }
          style={{ paddingBottom: "var(--kb)" }}
        >
          {/* Left Pane: Message (in landscape) */}
          <div
            className={`${
              isLandscape
                ? "col-span-6 pr-4 border-r border-gray-200 dark:border-gray-700"
                : ""
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                <Heart className="w-5 h-5 text-red-500" />
                Love Anointed? Share the Word!
              </h2>
              {!isLandscape && (
                <button
                  onClick={() => onClose(false)}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                  data-testid="button-close-support-modal"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              {/* Main message */}
              <div className="flex gap-3">
                <Share2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    The best way to support us:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Share this tool with your church, small group, or friends
                    who love Scripture study. Your word-of-mouth support helps
                    us bring more translations and features to life.
                  </p>
                </div>
              </div>

              {/* Journey together message */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Walk with us as we build something special for the body of
                  Christ. We have so much more in store, and your feedback means
                  the world to us.
                </p>
              </div>
            </div>
          </div>

          {/* Right Pane: Donation (in landscape) */}
          <div className={isLandscape ? "col-span-6 pl-4" : ""}>
            {/* Coffee donation */}
            <div
              className={`${
                isLandscape
                  ? "w-full p-4 sm:p-6 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700"
                  : "border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6"
              }`}
            >
              <div className="w-full max-w-[520px] mx-auto">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">
                  Want to bless us further?
                </p>

                <div
                  className="w-full min-h-[280px] grid place-items-center rounded-xl bg-white/5 transition-opacity duration-150"
                  data-testid="stripe-donate-button"
                >
                  {/* Only render Stripe button if key is present */}
                  {publishableKey ? (
                    <stripe-buy-button
                      buy-button-id={
                        theme === "dark"
                          ? "buy_btn_1SP4xPDPQkBO3I7W92t4I5IH"
                          : "buy_btn_1SP4ddDPQkBO3I7WhKH2bLA1"
                      }
                      publishable-key={publishableKey}
                    />
                  ) : (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center p-3">
                      Donation button unavailable (missing Stripe key).
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
