# Logger Usage Guide

## Overview

The centralized logger provides structured, gated logging with:
- Tag-based muting/enabling
- Throttling and sampling for hot-path logs
- Automatic redaction of sensitive data
- Runtime control

## Console is Now Clean by Default

By default, verbose tags are **muted** to reduce console noise:
- `PREFETCH` - Prefetch operations
- `ROLLING` - Rolling window render cycles  
- `WINDOWS` - Window diagnostics
- `COL` - Column layout
- `SESSION` - Session tracking
- `REALTIME` - Realtime subscriptions
- `BOOKMARKS` - Bookmark operations

You will only see:
- **Errors** and **Warnings** (always)
- **Important info logs** (untagged or non-muted tags)
- **Cross-ref batches** and other summary logs

## Enabling Verbose Logs

### 1. Runtime (Browser Console)

```javascript
// See current config
logger.help()

// Enable specific tags
logger.unmute('ROLLING')
logger.unmute('PREFETCH')

// Mute them again
logger.mute('ROLLING')
```

### 2. Environment Variable (Persistent)

Create or edit `.env` file:
```bash
# Enable specific tags
VITE_LOG_TAGS="ROLLING,PREFETCH,CROSS-REF"

# Enable all tags
VITE_LOG_TAGS="*"

# Enable with wildcards
VITE_LOG_TAGS="HL_V2_*"  # All highlights v2 logs
```

### 3. Query String (Temporary)

```
http://localhost:5000/?debug=ROLLING,PREFETCH
```

## Log Levels

- **debug**: Development breadcrumbs (dev only by default)
- **info**: Operational events (muted tags require explicit enable)
- **warn**: Important warnings (always shown)
- **error**: Errors (always shown)

Set via environment:
```bash
VITE_LOG_LEVEL="warn"  # Only warnings and errors
```

## Usage in Code

```typescript
import { logger } from '@/lib/logger';

// Basic logging
logger.info('PREFETCH', 'batch:done', { count: 100, ms: 45 });
logger.warn('AUTH', 'token-expired', { userId });
logger.error('API', 'request-failed', { error, endpoint });

// With throttling
logger.info('ROLLING', 'render-slice', data, { throttleMs: 500 });

// Timing
await logger.time('API', 'fetch-verses', async () => {
  return await fetchVerses();
});

// Debug (dev only)
logger.debug('CACHE', 'hit', { key, value });
```

## Debugging Tips

```javascript
// In browser console:

// 1. See what's muted
logger.help()

// 2. Enable temporarily
logger.unmute('ROLLING')
// ... do your testing ...
logger.mute('ROLLING')

// 3. See recent state
MUTED_TAGS  // Set of currently muted tags

// 4. Enable everything (nuclear option)
['PREFETCH', 'ROLLING', 'WINDOWS', 'COL', 'SESSION', 'REALTIME', 'BOOKMARKS']
  .forEach(tag => logger.unmute(tag))
```

## Best Practices

1. **Use tags for categorization**: Always provide a tag for filterable logs
2. **Keep info logs concise**: Summary only (batch complete, high-level events)
3. **Use debug for verbose**: Hot-path logs should use `logger.debug()`
4. **Throttle hot-path logs**: Use `{ throttleMs: 500 }` for render/scroll logs
5. **Sample expensive logs**: Use sampling for high-frequency debug logs

## Migration from console.log

```typescript
// Before
console.log('[INFO:ROLLING] render-slice', data);

// After (will be muted by default)
logger.info('ROLLING', 'render-slice', data);

// Or for verbose debug
logger.debug('ROLLING', 'render-slice', data);
```
