import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TUTORIALS } from './registry';
import { Step, Tutorial, Side } from './types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Confetti } from '@/components/Confetti';
import './tutorial.css';

type Ctx = {
  active?: { tutorial: Tutorial; index: number };
  start: (id: string) => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
};
const TutorialCtx = createContext<Ctx | null>(null);

export const useTutorials = () => {
  const ctx = useContext(TutorialCtx);
  if (!ctx) throw new Error('Wrap app in <TutorialProvider/>');
  return ctx;
};

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<{ tutorial: Tutorial; index: number }>();
  const [targetEl, setTargetEl] = useState<HTMLElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<SVGRectElement>(null);
  const roRef = useRef<ResizeObserver>();

  const resolveSelector = (sel: string | Record<string,string>) => {
    if (typeof sel === 'string') return sel;
    for (const [mq, value] of Object.entries(sel)) {
      if (mq === 'default') continue;
      if (window.matchMedia(mq).matches) return value;
    }
    return sel['default'];
  };

  // Get viewport padding including safe areas
  const getViewportPadding = useCallback(() => {
    const safeTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-top') || '0px');
    const safeBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom') || '0px');
    const safeLeft = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-left') || '0px');
    const safeRight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-right') || '0px');
    
    return {
      top: Math.max(8, safeTop + 8),
      bottom: Math.max(8, safeBottom + 8),
      left: Math.max(8, safeLeft + 8),
      right: Math.max(8, safeRight + 8)
    };
  }, []);

  // Center popover in viewport when no target element
  const placeCentered = useCallback((pop: HTMLElement) => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const padding = getViewportPadding();
    
    // Check if we need to adjust for small screens or specific orientations
    const isSmallHeight = vh < 600;
    const isLandscape = vw > vh;
    const isMobile = vw < 768;
    
    // Smart centering based on screen type
    let yOffset = 0;
    if (isSmallHeight && isLandscape && isMobile) {
      // Mobile landscape: position slightly higher to account for virtual keyboards
      yOffset = -vh * 0.1;
    } else if (isSmallHeight) {
      // Small height screens: position slightly higher
      yOffset = -20;
    }
    
    // Use CSS transform for perfect centering, with optional offset
    pop.style.transform = `translate(-50%, calc(-50% + ${yOffset}px))`;
    pop.style.top = '50%';
    pop.style.left = '50%';
    pop.dataset.placement = 'center';
    
    // Hide spotlight mask when no target
    if (maskRef.current) {
      maskRef.current.setAttribute('x', '0');
      maskRef.current.setAttribute('y', '0');
      maskRef.current.setAttribute('width', '0');
      maskRef.current.setAttribute('height', '0');
      maskRef.current.setAttribute('rx', '0');
    }
    
    // Mark as ready and show the popover smoothly
    pop.style.opacity = '1';
    pop.style.visibility = 'visible';
    pop.dataset.ready = '1';
    setIsReady(true);
  }, [getViewportPadding]);

  const placePopover = useCallback((target: HTMLElement, pop: HTMLElement, prefer: Side[] = ['right','left','bottom','top']) => {
    const t = target.getBoundingClientRect();
    const p = pop.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const gap = 12;
    const padding = getViewportPadding();
    
    const fits = {
      right:  t.right + gap + p.width <= vw - padding.right,
      left:   t.left  - gap - p.width >= padding.left,
      bottom: t.bottom + gap + p.height <= vh - padding.bottom,
      top:    t.top    - gap - p.height >= padding.top,
    };
    const side = prefer.find(s => (fits as any)[s]) ?? 'bottom';
    let x=0,y=0;
    const clamp = (v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
    
    if (side==='right')  { x = t.right + gap; y = clamp(t.top + t.height/2 - p.height/2, padding.top, vh-p.height-padding.bottom); }
    if (side==='left')   { x = t.left - gap - p.width; y = clamp(t.top + t.height/2 - p.height/2, padding.top, vh-p.height-padding.bottom); }
    if (side==='bottom') { x = clamp(t.left + t.width/2 - p.width/2, padding.left, vw-p.width-padding.right); y = t.bottom + gap; }
    if (side==='top')    { x = clamp(t.left + t.width/2 - p.width/2, padding.left, vw-p.width-padding.right); y = t.top - gap - p.height; }
    
    // Reset CSS positioning and use absolute positioning
    pop.style.top = '0';
    pop.style.left = '0';
    pop.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    pop.dataset.placement = side;
    
    // Update spotlight mask (SVG rect) to the target's bounds
    if (maskRef.current) {
      maskRef.current.setAttribute('x', String(Math.max(0, t.left - 8)));
      maskRef.current.setAttribute('y', String(Math.max(0, t.top - 8)));
      maskRef.current.setAttribute('width', String(t.width + 16));
      maskRef.current.setAttribute('height', String(t.height + 16));
      maskRef.current.setAttribute('rx', '12');
    }
    
    // Mark as ready and show the popover smoothly
    pop.style.opacity = '1';
    pop.style.visibility = 'visible';
    pop.dataset.ready = '1';
    setIsReady(true);
  }, [getViewportPadding]);

  const remeasure = useCallback(() => {
    if (!active) return;
    const step = active.tutorial.steps[active.index];
    if (!step) return;
    const el = targetEl;
    const pop = popRef.current;
    
    if (!pop) return;
    
    if (el) {
      placePopover(el, pop, step.prefer);
    } else {
      // Fallback to centered positioning when no target element
      placeCentered(pop);
    }
  }, [active, placePopover, placeCentered, targetEl]);

  // Resolve the current step's element (with wait + observers)
  useEffect(() => {
    if (!active) return;
    const step = active.tutorial.steps[active.index];
    if (!step) return;

    let cancelled = false;
    let mo: MutationObserver | null = null;

    (async () => {
      const findNow = (): HTMLElement | null => {
        if (step.target.find) return step.target.find();
        if (step.target.selector) {
          const sel = typeof step.target.selector === 'string'
            ? step.target.selector
            : resolveSelector(step.target.selector);
          if (!sel) return null;
          return document.querySelector(sel) as HTMLElement | null;
        }
        return null;
      };

      const waitFor = async (ms: number) => new Promise<void>((resolve) => {
        const t0 = performance.now();
        const tryFind = () => {
          if (cancelled) return;
          const el = findNow();
          if (el) return resolve();
          if (performance.now() - t0 > ms) return resolve();
          requestAnimationFrame(tryFind);
        };
        tryFind();
      });

      if (step.target.waitMs) await waitFor(step.target.waitMs);
      const element = findNow();

      if (!element) {
        setTargetEl(step.target.optional ? null : null);
      } else {
        // Optional scroll with timeout to wait for scroll to settle
        if (step.target.scroll && step.target.scroll !== 'none') {
          element.scrollIntoView({ behavior: 'smooth', block: step.target.scroll === 'center' ? 'center' : 'nearest', inline: 'nearest' });
          // Wait for scroll to settle before setting target element
          setTimeout(() => {
            if (!cancelled) setTargetEl(element);
          }, 300);
        } else {
          setTargetEl(element);
        }
        // Observe element box changes
        roRef.current?.disconnect();
        roRef.current = new ResizeObserver(remeasure);
        roRef.current.observe(element);
      }

      // Auto-advance wiring
      const cleanup: Array<() => void> = [];
      if (step.advanceOn) {
        for (const a of step.advanceOn) {
          const n = document.querySelector(a.selector);
          if (n) {
            const handler = () => next();
            n.addEventListener(a.event, handler, { once: true });
            cleanup.push(() => n.removeEventListener(a.event, handler));
          }
        }
      }

      // Mutation observe to catch late targets (if none yet)
      if (!element && step.target.waitMs) {
        mo = new MutationObserver(() => {
          const el = findNow();
          if (el) {
            setTargetEl(el);
            mo?.disconnect();
          }
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
      }

      return () => {
        cleanup.forEach(fn => fn());
        mo?.disconnect();
      };
    })();

    return () => { roRef.current?.disconnect(); };
  }, [active?.tutorial.id, active?.index, remeasure]); // eslint-disable-line

  // Use useLayoutEffect for initial positioning to block paint until ready
  useLayoutEffect(() => {
    if (!active) {
      setIsReady(false);
      return;
    }
    
    // Reset ready state when step changes
    setIsReady(false);
    
    // Trigger repositioning when targetEl or step changes
    const timer = requestAnimationFrame(() => {
      remeasure();
    });
    
    return () => cancelAnimationFrame(timer);
  }, [targetEl, active?.index, remeasure]);

  // Reset isReady when active tutorial changes
  useEffect(() => {
    if (!active) {
      setIsReady(false);
    }
  }, [active?.tutorial.id]);

  // Global repositioners
  useEffect(() => {
    const onScroll = () => remeasure();
    const onResize = () => remeasure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [remeasure]);

  // Keyboard controls: < > and ESC
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { stop(); }
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);


  const start = useCallback((id: string) => {
    const t = TUTORIALS[id];
    if (!t) return;
    // respect versioned completion
    const doneKey = `tutorial:${t.id}:v${t.version}:done`;
    if (localStorage.getItem(doneKey)) {
      // allow restart anyway; remove the check if you want to skip replays
    }
    setActive({ tutorial: t, index: 0 });
  }, []);

  const stop = useCallback(() => {
    if (active) {
      // Celebrate tutorial completion with curtain confetti
      console.log('🎉 CONFETTI: Tutorial completed, firing confetti burst!');
      Confetti.fire({
        style: "curtain",
        count: 220,
        durationMs: 900,
        gravity: 2100,
        wind: 60,
        scalar: 1.0,
        colors: ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#6366f1","#059669","#f97316","#06b6d4"],
      });
      console.log('🎉 CONFETTI: Event dispatched successfully');
      
      localStorage.setItem(`tutorial:${active.tutorial.id}:v${active.tutorial.version}:done`, '1');
      active.tutorial.onComplete?.();
    }
    setActive(undefined);
    setTargetEl(null);
  }, [active]);

  const next = useCallback(() => {
    if (!active) return;
    const { tutorial, index } = active;
    let i = index + 1;
    // skip steps that fail `when`
    while (i < tutorial.steps.length && tutorial.steps[i].when && !tutorial.steps[i].when!()) i++;
    if (i >= tutorial.steps.length) return stop();
    setActive({ tutorial, index: i });
  }, [active, stop]);

  const prev = useCallback(() => {
    if (!active) return;
    const { tutorial, index } = active;
    let i = index - 1;
    while (i >= 0 && tutorial.steps[i].when && !tutorial.steps[i].when!()) i--;
    if (i < 0) return;
    setActive({ tutorial, index: i });
  }, [active]);

  const value = useMemo(() => ({ active, start, stop, next, prev }), [active, start, stop, next, prev]);

  return (
    <TutorialCtx.Provider value={value}>
      {children}
      {active && (
        <Overlay
          step={active.tutorial.steps[active.index]}
          stepIndex={active.index}
          totalSteps={active.tutorial.steps.length}
          targetEl={targetEl}
          isReady={isReady}
          onNext={next}
          onPrev={prev}
          onClose={stop}
          place={remeasure}
          refPop={popRef}
          refMaskRect={maskRef}
        />
      )}
    </TutorialCtx.Provider>
  );
}

// ---------- UI Overlay ----------
function Overlay({
  step, stepIndex, totalSteps, targetEl, isReady, onNext, onPrev, onClose, place, refPop, refMaskRect
}: {
  step: Step; stepIndex: number; totalSteps: number; targetEl: HTMLElement | null; isReady: boolean;
  onNext: () => void; onPrev: () => void; onClose: () => void;
  place: (pop: HTMLDivElement) => void;
  refPop: React.RefObject<HTMLDivElement>;
  refMaskRect: React.RefObject<SVGRectElement>;
}) {
  const popCb = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    if (refPop) (refPop as React.MutableRefObject<HTMLDivElement | null>).current = el;
    requestAnimationFrame(() => place(el));
  }, [place, refPop]);

  // Handle escape key to close tutorial
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div aria-live="polite" role="dialog" aria-modal="true">
      {/* Backdrop with spotlight (SVG mask) */}
      <div className="tutorial-backdrop" onClick={onClose} aria-hidden>
        <svg className="tutorial-mask" width="0" height="0">
          <defs>
            <mask id="hole">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* The hole cutout */}
              <rect ref={refMaskRect} x="0" y="0" width="0" height="0" rx="12" fill="black" />
            </mask>
          </defs>
        </svg>
        <div className="tutorial-dim" style={{ mask: 'url(#hole)', WebkitMask: 'url(#hole)' }} />
      </div>

      {/* Popover */}
      <div 
        ref={popCb} 
        className="tutorial-popover" 
        role="document"
        style={{ 
          visibility: isReady ? 'visible' : 'hidden',
          opacity: isReady ? 1 : 0
        }}
      >
        {/* Header */}
        <div className="tutorial-header">
          <div className="tutorial-title">{step.title}</div>
          <div className="tutorial-progress">
            <span className="tutorial-step-indicator">
              {stepIndex + 1} of {totalSteps}
            </span>
            <div className="tutorial-progress-bar">
              <div 
                className="tutorial-progress-fill"
                style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Close button in top-right corner */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            aria-label="Close tutorial"
            className="tutorial-close-btn"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Body */}
        <div className="tutorial-body">
          {step.html ? (
            <div dangerouslySetInnerHTML={{ __html: step.html }} />
          ) : (
            <ul className="tutorial-bullets">
              {(step.bullets ?? []).map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="tutorial-footer">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onPrev}
            disabled={stepIndex === 0}
            aria-label="Previous step"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={onNext}
            aria-label={stepIndex === totalSteps - 1 ? "Finish tutorial" : "Next step"}
            data-tutorial-target={stepIndex === totalSteps - 1 ? "finish" : undefined}
          >
            {stepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
            {stepIndex < totalSteps - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}