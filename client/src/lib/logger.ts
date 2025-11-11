// Centralized, gated, structured logger with sampling/throttling/redaction/timing.

type Level = 'debug' | 'info' | 'warn' | 'error';
const IS_DEV = import.meta.env.DEV;

// Env knobs (set in .env / Vite)
const LOG_LEVEL = (import.meta.env.VITE_LOG_LEVEL ?? (IS_DEV ? 'debug' : 'error')) as Level;
// Comma-separated tags to allow at lower levels (e.g. "CROSS-REF,HL_V2_*,PREFETCH")
// Supports wildcards: "HL_V2_*" matches "HL_V2_RENDER", "HL_V2_CACHE", etc.
const LOG_TAGS = (import.meta.env.VITE_LOG_TAGS ?? import.meta.env.VITE_DEBUG_TAGS ?? '').split(',').map((s: string) => s.trim()).filter(Boolean);

// Muted tags (can be controlled at runtime)
// These are hot-path/verbose tags muted by default unless explicitly enabled via VITE_LOG_TAGS
// To enable: set VITE_LOG_TAGS="ROLLING,PREFETCH" or use logger.unmute('ROLLING') at runtime
const MUTED_TAGS = new Set<string>([
  'PREFETCH',    // Verbose prefetch operations
  'ROLLING',     // Rolling window render cycles
  'WINDOWS',     // Window diagnostics
  'COL',         // Column layout
  'SESSION',     // Session tracking
  'REALTIME',    // Realtime subscriptions
  'BOOKMARKS',   // Bookmark operations
]);

// Hot-path defaults (safe for dev; strict in prod)
const DEFAULT_SAMPLE = Number(import.meta.env.VITE_LOG_SAMPLE_HOTPATH ?? (IS_DEV ? 0.02 : 0)); // 2% in dev by default
const DEFAULT_THROTTLE_MS = Number(import.meta.env.VITE_LOG_THROTTLE_MS ?? 500);               // once/0.5s per tag

// Throttle state
const lastEmit = new Map<string, number>();

// Simple correlation id for a "session" (refresh = new)
const SESSION_ID = Math.random().toString(36).slice(2, 8);

// Level ordering
const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const levelEnabled = (lvl: Level) => order[lvl] >= order[LOG_LEVEL];

// Redact signed URLs, emails, querystrings
export function redact(input: unknown): unknown {
  if (typeof input !== 'string') return input;
  try {
    const u = new URL(input);
    u.search = ''; // drop tokens/query
    u.username = '';
    u.password = '';
    u.host = u.host.replace(/^[^.]+(?=\.)/, '…'); // redact subdomain (tenant)
    return u.toString();
  } catch {
    // scrub obvious email/token-ish substrings
    return input
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '***@***')
      .replace(/(token|authorization|apikey)=([^&\s]+)/gi, '$1=***');
  }
}

// Throttle by tag key
function throttled(tag: string, ms = DEFAULT_THROTTLE_MS): boolean {
  const now = performance.now();
  const last = lastEmit.get(tag) ?? 0;
  if (now - last < ms) return true;
  lastEmit.set(tag, now);
  return false;
}

// Sampling gate
function sampled(p = DEFAULT_SAMPLE): boolean {
  return Math.random() < p;
}

// Wildcard pattern matcher: "HL_V2_*" matches "HL_V2_RENDER", "HL_V2_CACHE", etc.
function matchesPattern(tag: string, pattern: string): boolean {
  if (!pattern.includes('*')) return tag === pattern;
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  return regex.test(tag);
}

// Tag allowlist: always allow errors; allow explicit tags or wildcard patterns; else rely on level
function tagAllowed(tag?: string, lvl: Level = 'debug') {
  if (lvl === 'error' || lvl === 'warn') return true;
  if (!tag) return false;
  // Check whitelist FIRST - allows env var overrides (highest priority)
  if (LOG_TAGS.some((pattern: string) => matchesPattern(tag, pattern))) return true;
  // Then check muted tags (blocks muted tags)
  if (MUTED_TAGS.has(tag)) return false;
  // Allow all other tags by default (only explicitly muted tags are blocked)
  return true;
}

// Core emit (structured)
function emit(lvl: Level, tag: string | undefined, msg: string, data?: unknown) {
  const payload = {
    t: new Date().toISOString(),
    s: SESSION_ID,
    lvl,
    tag,
    msg,
    data: Array.isArray(data)
      ? data.map(redact)
      : (typeof data === 'object' && data !== null ? JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'string' ? redact(v) : v)) : redact(data)),
  };
  const line = `[${payload.lvl.toUpperCase()}${tag ? `:${tag}` : ''}] ${payload.msg}`;
  if (lvl === 'error')      console.error(line, payload);
  else if (lvl === 'warn')  console.warn(line, payload);
  else if (lvl === 'info')  console.info(line, payload);
  else                      console.log(line, payload);
}

export const logger = {
  // Runtime control over muted tags
  mute(tag: string) {
    MUTED_TAGS.add(tag);
  },

  unmute(tag: string) {
    MUTED_TAGS.delete(tag);
  },
  
  // Helper to see all muted tags and how to enable them
  help() {
    console.log('📋 Logger Configuration:');
    console.log('  Muted tags:', Array.from(MUTED_TAGS).join(', '));
    console.log('  Enabled tags:', LOG_TAGS.join(', ') || 'none');
    console.log('\n💡 To enable specific tags:');
    console.log('  1. Runtime: logger.unmute("ROLLING") or logger.unmute("PREFETCH")');
    console.log('  2. Environment: Set VITE_LOG_TAGS="ROLLING,PREFETCH" in .env');
    console.log('  3. Wildcard: VITE_LOG_TAGS="*" enables all');
    console.log('\n🔇 To mute: logger.mute("TAG_NAME")');
  },

  // For DEV breadcrumbs only (never in prod builds if LOG_LEVEL >= info)
  debug(tag: string | undefined, msg: string, data?: unknown, { sample = DEFAULT_SAMPLE, throttleMs = DEFAULT_THROTTLE_MS, force = false } = {}) {
    if (!IS_DEV && !force) return;                           // dev-only by default
    // When force=true, bypass ALL gating (level, tag, throttle, sample)
    if (force) {
      emit('debug', tag, msg, data);
      return;
    }
    if (!levelEnabled('debug') && !tagAllowed(tag, 'debug')) return;
    if (throttleMs && throttled(`DBG:${tag ?? msg}`, throttleMs)) return;
    if (sample && !sampled(sample)) return;
    emit('debug', tag, msg, data);
  },

  info(tag: string | undefined, msg: string, data?: unknown, { throttleMs = 0 } = {}) {
    // If tag is provided, it MUST be allowed (respects MUTED_TAGS)
    // If no tag, fall back to level check
    if (tag) {
      if (!tagAllowed(tag, 'info')) return;
    } else if (!levelEnabled('info')) {
      return;
    }
    if (throttleMs && throttled(`INF:${tag ?? msg}`, throttleMs)) return;
    emit('info', tag, msg, data);
  },

  warn(tag: string | undefined, msg: string, data?: unknown) {
    if (tag && MUTED_TAGS.has(tag)) return; // respect muted tags for warnings too
    emit('warn', tag, msg, data);
  },

  error(tag: string | undefined, msg: string, data?: unknown) {
    emit('error', tag, msg, data);
  },

  // Timing helper
  async time<T>(tag: string, msg: string, fn: () => Promise<T> | T, lvl: Level = 'info') {
    const start = performance.now();
    try {
      const out = await fn();
      const dur = Math.round(performance.now() - start);
      if (lvl === 'debug') this.debug(tag, `${msg} (${dur}ms)`);
      else if (lvl === 'info') this.info(tag, `${msg} (${dur}ms)`);
      else if (lvl === 'warn') this.warn(tag, `${msg} (${dur}ms)`);
      else this.error(tag, `${msg} (${dur}ms)`);
      return out;
    } catch (e) {
      const dur = Math.round(performance.now() - start);
      this.error(tag, `${msg} FAILED (${dur}ms)`, e);
      throw e;
    }
  },
};

// Expose logger to window for debugging
if (typeof window !== 'undefined') {
  (window as any).logger = logger;
  (window as any).MUTED_TAGS = MUTED_TAGS;
  
  // Show helpful message in dev only, once per session
  if (IS_DEV && !sessionStorage.getItem('__logger_help_shown')) {
    sessionStorage.setItem('__logger_help_shown', '1');
    console.log(
      '%c🔇 Console logs are now cleaner!',
      'font-weight: bold; font-size: 13px; color: #10b981;'
    );
    console.log(
      '%cMuted tags: PREFETCH, ROLLING, WINDOWS, COL, SESSION, REALTIME, BOOKMARKS',
      'color: #6b7280; font-size: 11px;'
    );
    console.log(
      '%c💡 To enable verbose logs: logger.unmute("ROLLING") or logger.help()',
      'color: #3b82f6; font-size: 11px;'
    );
  }
}
