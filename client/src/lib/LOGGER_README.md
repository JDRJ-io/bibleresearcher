# Centralized Debug Logger

All debug logging in this application uses the centralized logger at `@/lib/logger.ts`.

## Features

- **Environment-aware**: Auto-disables in production
- **Tag-based filtering**: Filter logs by component/feature
- **Wildcard patterns**: Support for patterns like `HL_V2_*`, `CROSS-*`, etc.
- **Throttling**: Prevents console spam (configurable per call)
- **Sampling**: Reduce hot-path noise (configurable)
- **Level control**: debug/info/warn/error
- **Redaction**: Automatically scrubs sensitive data
- **Runtime control**: Mute/unmute tags programmatically

## Usage

```typescript
import { logger } from '@/lib/logger';

// Debug logs (dev only, throttled)
logger.debug('COMPONENT', 'event-name', { data: 'here' }, { 
  throttleMs: 500,  // optional: throttle identical logs
  sample: 0.1       // optional: only log 10% of the time
});

// Info logs (shows in dev, controlled by level in prod)
logger.info('FEATURE', 'action-complete', { result: 'data' });

// Warnings (always show)
logger.warn('FEATURE', 'potential-issue', { context: 'data' });

// Errors (always show)
logger.error('FEATURE', 'operation-failed', error);
```

## Configuration

Set environment variables in `.env`:

```bash
# Log level (debug|info|warn|error)
# Default: 'debug' in development, 'error' in production
VITE_LOG_LEVEL=debug

# Allow specific tags even if below log level (comma-separated)
# Supports wildcard patterns with * (e.g., "HL_V2_*" matches all HL_V2_xxx tags)
VITE_LOG_TAGS=CROSS-REF,PREFETCH,HL_V2_*

# Legacy alias (VITE_DEBUG_TAGS also works)
VITE_DEBUG_TAGS=ROLLING,WINDOWS

# Sampling rate for hot paths (0-1, default: 0.02 in dev, 0 in prod)
VITE_LOG_SAMPLE_HOTPATH=0.02

# Default throttle window in milliseconds (default: 500)
VITE_LOG_THROTTLE_MS=500
```

### Wildcard Pattern Examples

The logger supports wildcard patterns for flexible tag filtering:

```bash
# Match all highlight-related tags
VITE_LOG_TAGS=HL_V2_*
# Matches: HL_V2_RENDER, HL_V2_CACHE, HL_V2_UPDATE, etc.

# Match all cross-reference tags
VITE_LOG_TAGS=CROSS-*
# Matches: CROSS-REF, CROSS-LINK, CROSS-VERIFY, etc.

# Combine exact tags and patterns
VITE_LOG_TAGS=PREFETCH,HL_V2_*,CROSS-REF,ROLLING
# Allows: PREFETCH (exact), any HL_V2_xxx tag, CROSS-REF (exact), ROLLING (exact)

# Match everything (use with caution!)
VITE_LOG_TAGS=*
```

## Controlling Logs

By default, logs are **disabled in production** and **enabled in development**.

### Build-time Control (Environment Variables)

To control logs at build time:
1. Set `VITE_LOG_LEVEL` to desired level (debug/info/warn/error)
2. Add specific tags or patterns to `VITE_LOG_TAGS` to allow them
3. Adjust throttling/sampling for noisy components

### Runtime Control (Dynamic Muting)

You can dynamically mute/unmute tags at runtime (useful for debugging in production):

```typescript
import { logger } from '@/lib/logger';

// Mute a noisy tag
logger.mute('PREFETCH');

// Unmute when you need to debug
logger.unmute('PREFETCH');

// In production console, you can do:
// window.logger = logger;
// logger.unmute('HL_V2_RENDER');
```

## Production Recommendations

To reduce console noise from ~5000 to ~50 logs in production:

```bash
# Production .env configuration (minimal logging)
VITE_LOG_LEVEL=error

# Only allow critical tags (empty = errors only)
VITE_LOG_TAGS=

# OR allow specific important tags only
VITE_LOG_TAGS=AUTH,BILLING,PAYMENT
```

For debugging specific features in production:

```bash
# Enable only highlight-related logs
VITE_LOG_LEVEL=info
VITE_LOG_TAGS=HL_V2_*

# Enable multiple feature areas
VITE_LOG_TAGS=HL_V2_*,CROSS-REF,PREFETCH
```

## Common Tags

Currently used tags in the application:

- `AUTH` - Authentication and user management
- `BIBLE` - Bible navigation and verse loading
- `BOOKMARKS` - Bookmark operations
- `CROSS-REF` - Cross-reference loading
- `HL_V2_*` - Highlight system v2 (BOOTSTRAP, REALTIME, CACHE, etc.)
- `PREFETCH` - Verse prefetching
- `ROLLING` - Rolling window virtualization
- `WINDOWS` - Window calculations
- `HEADER` - Header centering/sizing
- `SESSION` - Session management
- `REALTIME` - Real-time updates
- `COL` - Column operations

## Output Format

```
[LEVEL:TAG] message {structured data}
```

Example:
```
[DEBUG:WINDOWS] desktop {render: '[0, 200]', centerIdx: 100}
[INFO:CROSS-REF] batch-complete {versesLoaded: 10, loadTimeMs: 125}
[ERROR:PREFETCH] batch-error {range: '100-200', error: 'Network failed'}
```

## Migration from console.log

**Before:**
```typescript
console.log('🪟 WINDOWS[desktop]:', { render: '[0, 200]' });
```

**After:**
```typescript
logger.debug('WINDOWS', 'desktop', { render: '[0, 200]' }, { throttleMs: 500 });
```

This provides:
- Automatic throttling (no spam)
- Tag-based filtering
- Production safety
- Structured output

## Advanced Features

### Timing Helper

Measure execution time and automatically log results:

```typescript
import { logger } from '@/lib/logger';

// Measure async operation
const data = await logger.time('DB', 'fetch-users', async () => {
  return await db.users.findMany();
}, 'info');
// Logs: [INFO:DB] fetch-users (245ms)

// Measure sync operation
const result = await logger.time('CALC', 'process-data', () => {
  return heavyCalculation();
});
```

### Structured Data with Redaction

The logger automatically redacts sensitive data:

```typescript
logger.info('AUTH', 'login-success', {
  email: 'user@example.com',      // Redacted to ***@***
  token: 'abc123def456',            // Redacted if contains "token"
  userId: '12345'                   // Preserved
});
```

### Hot-path Sampling

For frequently-called code, use sampling to reduce noise:

```typescript
// Only log 5% of scroll events
function onScroll() {
  logger.debug('SCROLL', 'position-update', 
    { y: window.scrollY }, 
    { sample: 0.05, throttleMs: 1000 }
  );
}
```

### Force Logging

Bypass filtering for critical debug points:

```typescript
logger.debug('DEBUG', 'critical-state', 
  { state: getCurrentState() }, 
  { force: true }  // Always logs, even in production
);
```

## Troubleshooting

### Logs not appearing?

1. Check `VITE_LOG_LEVEL` - must be at or below the log level you're using
2. Check `VITE_LOG_TAGS` - your tag must match (exact or wildcard)
3. Check if tag is muted via `logger.mute('TAG')`
4. For debug logs, ensure `import.meta.env.DEV` is true or use `force: true`

### Too many logs?

1. Increase `VITE_LOG_LEVEL` to `info` or `error`
2. Use throttling: `{ throttleMs: 1000 }`
3. Use sampling: `{ sample: 0.1 }`
4. Mute specific tags: `logger.mute('NOISY_TAG')`

### Wildcard not working?

Ensure you're using the pattern correctly:
- `HL_V2_*` matches `HL_V2_RENDER`, `HL_V2_CACHE`, etc.
- `*_V2` matches `HL_V2`, `CROSS_V2`, etc.
- `*` matches everything

## Quick Reference

```typescript
// Basic logging
logger.debug('TAG', 'message', { data });
logger.info('TAG', 'message', { data });
logger.warn('TAG', 'message', { data });
logger.error('TAG', 'message', error);

// With options
logger.debug('TAG', 'msg', data, { throttleMs: 500, sample: 0.1 });
logger.info('TAG', 'msg', data, { throttleMs: 1000 });

// Timing
await logger.time('TAG', 'operation', async () => { ... }, 'info');

// Runtime control
logger.mute('TAG');
logger.unmute('TAG');
```
