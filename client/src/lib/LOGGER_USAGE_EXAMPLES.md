# Logger Usage Examples

This file demonstrates real-world usage of the centralized logger system.

## Basic Usage Examples

### Example 1: Simple Debug Logging

```typescript
import { logger } from '@/lib/logger';

function loadVerseData(verseKey: string) {
  logger.debug('BIBLE', 'loading-verse', { verseKey });
  
  const data = fetchVerse(verseKey);
  
  logger.debug('BIBLE', 'verse-loaded', { verseKey, dataSize: data.length });
  return data;
}
```

### Example 2: Info Logging with Throttling

```typescript
import { logger } from '@/lib/logger';

function onScroll() {
  // Only log once every 2 seconds to avoid spam
  logger.info('SCROLL', 'position-changed', 
    { y: window.scrollY }, 
    { throttleMs: 2000 }
  );
}
```

### Example 3: Error Logging

```typescript
import { logger } from '@/lib/logger';

async function fetchData() {
  try {
    return await api.getData();
  } catch (error) {
    logger.error('API', 'fetch-failed', { 
      endpoint: '/data',
      error: error.message 
    });
    throw error;
  }
}
```

## Wildcard Pattern Examples

### Example 4: Highlight System Logging (HL_V2_*)

Set in `.env`:
```bash
VITE_LOG_TAGS=HL_V2_*
```

Then all these logs will be enabled:
```typescript
logger.info('HL_V2_BOOTSTRAP', 'init-complete', { rangesCount: 7 });
logger.info('HL_V2_REALTIME', 'subscribed', { channels: 2 });
logger.debug('HL_V2_CACHE', 'cache-hit', { verseKey: 'gen.1:1' });
logger.debug('HL_V2_RENDER', 'highlights-applied', { count: 15 });
```

### Example 5: Cross-Reference System (CROSS-*)

Set in `.env`:
```bash
VITE_LOG_TAGS=CROSS-*
```

Matches:
```typescript
logger.info('CROSS-REF', 'batch-loaded', { count: 10 });
logger.debug('CROSS-LINK', 'link-resolved', { from: 'gen.1:1', to: 'john.1:1' });
logger.warn('CROSS-VERIFY', 'invalid-reference', { ref: 'invalid' });
```

## Production Configuration Examples

### Example 6: Minimal Production Logging (Errors Only)

`.env.production`:
```bash
VITE_LOG_LEVEL=error
VITE_LOG_TAGS=
```

Result: Only error logs appear (~50 logs vs ~5000)

### Example 7: Production with Critical Tags

`.env.production`:
```bash
VITE_LOG_LEVEL=error
VITE_LOG_TAGS=AUTH,BILLING,PAYMENT
```

Result: Errors + INFO/WARN from AUTH, BILLING, PAYMENT tags

### Example 8: Debug Specific Feature in Production

`.env.production`:
```bash
VITE_LOG_LEVEL=info
VITE_LOG_TAGS=HL_V2_*,BOOKMARKS
```

Result: All highlight system and bookmark logs at INFO+ level

## Advanced Usage Examples

### Example 9: Performance Timing

```typescript
import { logger } from '@/lib/logger';

async function loadBibleChapter(chapter: number) {
  return await logger.time('BIBLE', `load-chapter-${chapter}`, async () => {
    const verses = await fetchChapterVerses(chapter);
    await processVerses(verses);
    return verses;
  }, 'info');
  // Automatically logs: [INFO:BIBLE] load-chapter-1 (245ms)
}
```

### Example 10: Sampling for Hot Paths

```typescript
import { logger } from '@/lib/logger';

function onMouseMove(e: MouseEvent) {
  // Only log 1% of mouse move events
  logger.debug('UI', 'mouse-move', 
    { x: e.clientX, y: e.clientY }, 
    { sample: 0.01, throttleMs: 100 }
  );
}
```

### Example 11: Runtime Control

```typescript
import { logger } from '@/lib/logger';

// Temporarily mute noisy logs
logger.mute('PREFETCH');

// Do something that generates lots of prefetch logs
await prefetchVerses();

// Re-enable logging
logger.unmute('PREFETCH');

// In browser console during debugging:
// window.logger = logger;
// logger.unmute('HL_V2_RENDER');
// logger.mute('SCROLL');
```

### Example 12: Force Logging for Critical Debug

```typescript
import { logger } from '@/lib/logger';

function criticalOperation() {
  // Always log this, even if filtered
  logger.debug('CRITICAL', 'state-snapshot', 
    { state: getCurrentState() }, 
    { force: true }
  );
}
```

## Migration Examples

### Before (Console Spam)

```typescript
console.log('🔄 PREFETCH[batch]:', { start: 100, end: 200 });
console.log('✓ PREFETCH[complete]:', { count: 100 });
console.log('📖 BIBLE[nav]:', { verse: 'gen.1:1' });
console.log('💾 SESSION[save]:', { data: {...} });
console.log('🎨 HL_V2[render]:', { highlights: 15 });
// ... 5000+ logs like this
```

### After (Filtered & Structured)

```typescript
logger.debug('PREFETCH', 'batch-start', { start: 100, end: 200 });
logger.info('PREFETCH', 'batch-complete', { count: 100 });
logger.info('BIBLE', 'navigation', { verse: 'gen.1:1' });
logger.debug('SESSION', 'state-saved', { data: {...} });
logger.debug('HL_V2_RENDER', 'highlights-applied', { count: 15 });
// In production with VITE_LOG_LEVEL=error: 0 logs!
// In production with VITE_LOG_TAGS=PREFETCH,BIBLE: only 2 logs!
```

## Configuration Scenarios

### Development Mode
```bash
VITE_LOG_LEVEL=debug
VITE_LOG_TAGS=*
VITE_LOG_SAMPLE_HOTPATH=0.05
VITE_LOG_THROTTLE_MS=500
```
Result: All logs enabled with 5% sampling on debug calls

### Staging Mode
```bash
VITE_LOG_LEVEL=info
VITE_LOG_TAGS=AUTH,BIBLE,HL_V2_*,BOOKMARKS
```
Result: Info+ logs for critical features only

### Production Mode
```bash
VITE_LOG_LEVEL=error
VITE_LOG_TAGS=
```
Result: Only errors (~50 logs instead of ~5000)

### Debug Specific Issue in Production
```bash
VITE_LOG_LEVEL=debug
VITE_LOG_TAGS=HL_V2_BOOTSTRAP,HL_V2_REALTIME
# Or use wildcard: VITE_LOG_TAGS=HL_V2_*
```
Result: Detailed logs for highlight system only
