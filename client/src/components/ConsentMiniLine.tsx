import { useEffect, useState } from "react";

const KEY = "anointedio_privacy_prefs";
type Prefs = { analytics: boolean; decided: boolean };

const getPrefs = (): Prefs => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "") || { analytics: false, decided: false };
  } catch {
    return { analytics: false, decided: false };
  }
};
const setPrefs = (p: Prefs) => localStorage.setItem(KEY, JSON.stringify(p));

declare global {
  interface Window {
    enableAnalytics?: (domain?: string) => void;
  }
}

export function ConsentMiniLine() {
  const [show, setShow] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const prefs = getPrefs();
    if (prefs.analytics && typeof window.enableAnalytics === "function") {
      window.enableAnalytics();
    }
    if (!prefs.decided) setShow(true);

    const timeout = setTimeout(() => setFadeOut(true), 10000);

    const handleScroll = () => {
      if (window.scrollY > 200) setFadeOut(true);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!show) return null;

  const choose = (allow: boolean) => {
    setPrefs({ analytics: allow, decided: true });
    setShow(false);
    if (allow && typeof window.enableAnalytics === "function") {
      window.enableAnalytics();
    }
  };

  return (
    <div
      className={`fixed bottom-2 left-1/2 -translate-x-1/2 z-50 w-full px-2 transition-opacity duration-700 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div
        role="region"
        aria-label="Privacy notice"
        className="mx-auto w-[min(720px,calc(100vw-1rem))] flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-3 
                   rounded-full border border-gray-300/70 dark:border-neutral-700/60
                   bg-white/75 dark:bg-neutral-900/75 backdrop-blur-md shadow-lg
                   text-[13px] sm:text-sm text-gray-800 dark:text-gray-200 px-4 py-2"
      >
        <span className="truncate">
          Help us improve with{" "}
          <span className="font-semibold">anonymous, cookie-free</span> analytics?
        </span>

        <button
          onClick={() => choose(true)}
          className="px-3 py-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black 
                     hover:opacity-90 transition-opacity"
          data-testid="consent-allow"
        >
          Allow
        </button>

        <button
          onClick={() => choose(false)}
          className="px-3 py-1.5 rounded-full border border-gray-300 dark:border-neutral-700
                     hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          data-testid="consent-decline"
        >
          No Thanks
        </button>

        <a
          href="/privacy"
          className="underline underline-offset-2 opacity-80 hover:opacity-100 whitespace-nowrap"
          data-testid="consent-privacy-link"
        >
          Privacy
        </a>
      </div>
    </div>
  );
}

export function useAnalyticsConsent(): boolean {
  const [hasConsent, setHasConsent] = useState(false);
  
  useEffect(() => {
    const prefs = getPrefs();
    setHasConsent(prefs.analytics);
  }, []);
  
  return hasConsent;
}
