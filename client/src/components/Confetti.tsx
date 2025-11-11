import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/** Public API */
export type ConfettiOptions = {
  /** Origin of the burst in client pixels; if omitted, uses center of viewport */
  origin?: { x: number; y: number } | HTMLElement;
  /** How many particles to spawn (default 120) */
  count?: number;
  /** Spread in degrees around 90° (down) (default 70) */
  spread?: number;
  /** Base velocity (px/s) (default 850) */
  velocity?: number;
  /** Gravity (px/s^2) (default 1800) */
  gravity?: number;
  /** Scalar multiplier for particle size (default 1) */
  scalar?: number;
  /** Palette override */
  colors?: string[];
  /** Tri | Rect | Circle mix ratio (0..1 each, will be normalized) */
  shapeMix?: { tri?: number; rect?: number; circ?: number };
  /** How long to run before stopping new spawns (ms) (default 450) */
  durationMs?: number;
  /** Style of confetti: burst or curtain (default "burst") */
  style?: "burst" | "curtain";
  /** Wind lateral drift for curtain style (px/s) (default 0) */
  wind?: number;
};

/** Exposed singleton controller */
export const Confetti = {
  /** Imperative fire */
  fire(opts: ConfettiOptions = {}) {
    window.dispatchEvent(new CustomEvent("__confetti_fire__", { detail: opts }));
  },
};

const DEFAULT_COLORS = [
  "#3b82f6","#10b981","#f59e0b","#ef4444",
  "#8b5cf6","#ec4899","#6366f1","#059669",
  "#f97316","#06b6d4",
];

type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  rot: number; vr: number;
  life: number; ttl: number;
  size: number;
  color: string;
  shape: 0 | 1 | 2; // 0=rect 1=circle 2=tri
  alive: boolean;
};

const MAX_PARTICLES = 600; // pooled cap (enough for multiple bursts)

// Singleton host mounted once
export default function ConfettiHost() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const particlesRef = useRef<Particle[]>(
    Array.from({ length: MAX_PARTICLES }, () => ({
      x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, life: 0, ttl: 0,
      size: 0, color: "#fff", shape: 0, alive: false,
    }))
  );
  const lastTsRef = useRef<number>(performance.now());
  const mountedRef = useRef(false);

  // Resize canvas to device pixels
  const resize = () => {
    const c = canvasRef.current!;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const { innerWidth: w, innerHeight: h } = window;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctxRef.current = ctx;
    }
  };

  // Spawn a burst or curtain
  const spawn = (opts: ConfettiOptions = {}) => {
    // Add null checks for canvas/ctx safety
    if (!canvasRef.current || !ctxRef.current) return;
    
    // Reduced motion: do a subtle flash + early exit
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const c = canvasRef.current;
      const ctx = ctxRef.current;
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.clientWidth, c.clientHeight);
      ctx.restore();
      return;
    }

    const {
      count = 120,
      spread = 70,
      velocity = 850,
      gravity = 1800,
      scalar = 1,
      colors = DEFAULT_COLORS,
      shapeMix = { tri: 0.25, rect: 0.5, circ: 0.25 },
      durationMs = 450,
      style = "burst",
      wind = 0,
    } = opts;

    // Normalize shapes
    const triW = shapeMix.tri ?? 0.25;
    const rectW = shapeMix.rect ?? 0.5;
    const circW = shapeMix.circ ?? 0.25;
    const total = triW + rectW + circW;

    const particles = particlesRef.current;
    const now = performance.now();
    
    // Handle curtain style
    if (style === "curtain") {
      for (let i = 0, spawned = 0; i < particles.length && spawned < count; i++) {
        const p = particles[i];
        if (p.alive) continue;

        // Position particles across full window width from top edge
        const x = Math.random() * window.innerWidth;
        const y = -10 - Math.random() * 20; // Start slightly above viewport
        
        // Gentle downward velocity with horizontal drift
        const baseVy = velocity * 0.3; // Gentler downward velocity
        const vy = baseVy * (0.8 + Math.random() * 0.4); // 80-120%
        const vx = wind * (0.8 + Math.random() * 0.4) + (Math.random() * 20 - 10); // Directional wind with small random jitter

        const size = (6 + Math.random() * 6) * scalar; // 6–12px

        // Pick shape by weighted probability
        const r = Math.random() * total;
        const shape: 0 | 1 | 2 = r < rectW
          ? 0
          : r < rectW + circW
          ? 1
          : 2;

        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.rot = Math.random() * Math.PI * 2;
        p.vr = (Math.random() * 4 - 2) * (Math.random() < 0.5 ? 1 : -1); // Slower rotation
        
        // Stagger spawns for sheet effect, scaled to duration
        const staggerDelay = (spawned / count) * durationMs * 0.6; // Properly scaled staggering
        p.life = now + staggerDelay;
        p.ttl = durationMs + 400 + Math.random() * 500;
        p.size = size;
        p.color = colors[(Math.random() * colors.length) | 0];
        p.shape = shape;
        p.alive = true;
        (p as any).g = gravity * (0.7 + Math.random() * 0.6); // small variance
        spawned++;
      }
      return; // Skip burst logic
    }

    // Original burst logic
    let ox: number, oy: number;
    if (opts.origin instanceof HTMLElement) {
      const r = opts.origin.getBoundingClientRect();
      ox = r.left + r.width / 2;
      oy = r.top + r.height / 2;
    } else if (opts.origin) {
      ox = opts.origin.x;
      oy = opts.origin.y;
    } else {
      ox = window.innerWidth / 2;
      oy = window.innerHeight * 0.2; // a bit above center
    }

    for (let i = 0, spawned = 0; i < particles.length && spawned < count; i++) {
      const p = particles[i];
      if (p.alive) continue;

      // Angle within spread around downward (90°)
      const base = Math.PI / 2; // down
      const half = (spread * Math.PI) / 180 / 2;
      const angle = base + (Math.random() * 2 - 1) * half;

      const speed = velocity * (0.65 + Math.random() * 0.5); // 65–115%
      const size = (6 + Math.random() * 6) * scalar; // 6–12px

      // Pick shape by weighted probability
      const r = Math.random() * total;
      const shape: 0 | 1 | 2 = r < rectW
        ? 0
        : r < rectW + circW
        ? 1
        : 2;

      p.x = ox;
      p.y = oy;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed * 0.8; // slightly less vertical to fan out
      p.rot = Math.random() * Math.PI * 2;
      p.vr = (Math.random() * 8 - 4) * (Math.random() < 0.5 ? 1 : -1);
      p.life = now;
      p.ttl = durationMs + 400 + Math.random() * 500;
      p.size = size;
      p.color = colors[(Math.random() * colors.length) | 0];
      p.shape = shape;
      p.alive = true;
      (p as any).g = gravity * (0.7 + Math.random() * 0.6); // small variance
      spawned++;
    }
  };

  const loop = () => {
    const ctx = ctxRef.current!;
    const particles = particlesRef.current;
    const now = performance.now();
    const dt = Math.min(0.032, (now - lastTsRef.current) / 1000); // clamp 32ms
    lastTsRef.current = now;

    // Auto stop when hidden to save battery
    const hidden = document.hidden;

    // Clear
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    if (!hidden) {
      // Update & draw
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p.alive) continue;

        // Handle staggered start times (particles with age < 0 should continue)
        const age = now - p.life;
        if (age < 0) {
          // Particle hasn't been born yet, skip processing
          continue;
        }
        
        if (age > p.ttl || p.y - p.size > h + 40) {
          p.alive = false;
          continue;
        }

        // Physics
        p.vy += (p as any).g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;

        // Fade out at the tail
        const remain = 1 - age / p.ttl;
        const alpha = Math.max(0, Math.min(1, remain));

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        ctx.fillStyle = p.color;
        switch (p.shape) {
          case 0: { // rect
            const w2 = p.size, h2 = p.size * 0.6;
            ctx.fillRect(-w2 / 2, -h2 / 2, w2, h2);
            break;
          }
          case 1: { // circle
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case 2: { // triangle
            const s = p.size;
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.6);
            ctx.lineTo(s * 0.6, s * 0.6);
            ctx.lineTo(-s * 0.6, s * 0.6);
            ctx.closePath();
            ctx.fill();
            break;
          }
        }
        ctx.restore();
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const c = document.createElement("canvas");
    c.setAttribute("aria-hidden", "true");
    c.setAttribute("data-confetti-canvas", "true"); // Whitelist for rogue cleaner
    c.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:10000;display:block;";
    document.body.appendChild(c);
    canvasRef.current = c;
    resize();
    window.addEventListener("resize", resize);

    const onFire = (e: Event) => spawn((e as CustomEvent<ConfettiOptions>).detail);
    window.addEventListener("__confetti_fire__", onFire);

    const vis = () => {
      lastTsRef.current = performance.now();
    };
    document.addEventListener("visibilitychange", vis);

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("__confetti_fire__", onFire);
      document.removeEventListener("visibilitychange", vis);
      c.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nothing to render; canvas is appended to body
  return null;
}

/** Helper to mount the host once in your root layout */
export function ConfettiPortal() {
  if (typeof document === "undefined") return null;
  return createPortal(<ConfettiHost />, document.body);
}