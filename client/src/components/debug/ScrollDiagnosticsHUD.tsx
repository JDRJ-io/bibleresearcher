import { useEffect, useState, useRef } from 'react';
import { useBibleStore } from '@/App';
import { verseCache } from '@/hooks/data/verseCache';
import { prefetch } from '@/hooks/prefetch/PrefetchManager';
import { getVerseKeys } from '@/lib/verseKeysLoader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VirtualizationState {
  centerIdx: number;
  steppedIdx: number;
  velocity: number;
  windows: {
    render: [number, number];
    safety: [number, number];
    background: [number, number];
  };
  totalRows: number;
  rowHeight: number;
  isDesktop: boolean;
}

interface CacheStats {
  totalSize: number;
  currentTranslationSize: number;
  inFlightCount: number;
  recentEvictions: number;
}

interface PrefetchStats {
  queueSize: number;
  isProcessing: boolean;
  totalProcessed: number;
  recentlyLoaded: string[];
}

export function ScrollDiagnosticsHUD() {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top-right' | 'bottom-right' | 'bottom-left' | 'top-left'>('top-right');
  const [virtualizationState, setVirtualizationState] = useState<VirtualizationState | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats>({ totalSize: 0, currentTranslationSize: 0, inFlightCount: 0, recentEvictions: 0 });
  const [prefetchStats, setPrefetchStats] = useState<PrefetchStats>({ queueSize: 0, isProcessing: false, totalProcessed: 0, recentlyLoaded: [] });
  const [scrollPosition, setScrollPosition] = useState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 });
  const [loadingEvents, setLoadingEvents] = useState<Array<{ time: number; event: string; details: string }>>([]);
  const [evictionEvents, setEvictionEvents] = useState<Array<{ time: number; count: number; translation: string }>>([]);
  
  const prevCacheSizeRef = useRef(0);
  const loadingEventsRef = useRef<Array<{ time: number; event: string; details: string }>>([]);
  const evictionEventsRef = useRef<Array<{ time: number; count: number; translation: string }>>([]);
  
  const translationState = useBibleStore(s => s.translationState);
  const currentTranslation = translationState.main || 'KJV';

  // Toggle visibility with keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(prev => !prev);
      }
      // Cycle position with Ctrl+Shift+P
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setPosition(prev => {
          const positions: Array<'top-right' | 'bottom-right' | 'bottom-left' | 'top-left'> = 
            ['top-right', 'bottom-right', 'bottom-left', 'top-left'];
          const currentIndex = positions.indexOf(prev);
          return positions[(currentIndex + 1) % positions.length];
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Monitor virtualization state from global window object
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const state = (window as any).__VIRTUALIZATION_STATE__ as VirtualizationState | undefined;
      if (state) {
        setVirtualizationState(state);
      }
    }, 100); // Update 10 times per second

    return () => clearInterval(interval);
  }, [isVisible]);

  // Monitor cache stats
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const totalSize = verseCache.size();
      const inFlightCount = verseCache.inFlight.size;
      
      // Count cache entries for current translation
      let currentTranslationSize = 0;
      // We can't iterate over the cache directly, but we can estimate
      // by checking if entries exist for indices 0-31102
      const verseKeys = getVerseKeys();
      for (let i = 0; i < Math.min(1000, verseKeys.length); i++) {
        if (verseCache.has(currentTranslation, i)) {
          currentTranslationSize++;
        }
      }
      
      // Detect evictions
      const recentEvictions = Math.max(0, prevCacheSizeRef.current - totalSize);
      if (recentEvictions > 0) {
        const newEvent = { time: Date.now(), count: recentEvictions, translation: currentTranslation };
        evictionEventsRef.current = [...evictionEventsRef.current.slice(-9), newEvent];
        setEvictionEvents(evictionEventsRef.current);
      }
      prevCacheSizeRef.current = totalSize;

      setCacheStats({ 
        totalSize, 
        currentTranslationSize: currentTranslationSize * (verseKeys.length / 1000), // Extrapolate
        inFlightCount,
        recentEvictions
      });
    }, 200); // Update 5 times per second

    return () => clearInterval(interval);
  }, [isVisible, currentTranslation]);

  // Monitor prefetch state
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const state = prefetch.getState();
      setPrefetchStats({
        queueSize: state.queueSize,
        isProcessing: state.isProcessing,
        totalProcessed: state.totalProcessed,
        recentlyLoaded: state.recentlyLoaded || []
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Monitor scroll position
  useEffect(() => {
    if (!isVisible) return;

    const updateScrollPosition = () => {
      const container = document.querySelector('[data-scroll-root]') as HTMLElement;
      if (container) {
        setScrollPosition({
          scrollTop: container.scrollTop,
          scrollHeight: container.scrollHeight,
          clientHeight: container.clientHeight
        });
      }
    };

    const container = document.querySelector('[data-scroll-root]') as HTMLElement;
    if (container) {
      container.addEventListener('scroll', updateScrollPosition);
      updateScrollPosition();
      
      return () => container.removeEventListener('scroll', updateScrollPosition);
    }
  }, [isVisible]);

  // Intercept console logs to capture loading events
  useEffect(() => {
    if (!isVisible) return;

    const originalLog = console.log;
    const originalInfo = console.info;
    
    const interceptLog = (level: string, ...args: any[]) => {
      const message = args.join(' ');
      
      // Capture loading-related events
      if (message.includes('PREFETCH') || message.includes('ROLLING') || 
          message.includes('ANCHOR') || message.includes('cache') ||
          message.includes('Loading')) {
        const newEvent = {
          time: Date.now(),
          event: level.toUpperCase(),
          details: message.substring(0, 100)
        };
        loadingEventsRef.current = [...loadingEventsRef.current.slice(-19), newEvent];
        setLoadingEvents(loadingEventsRef.current);
      }
      
      // Call original
      if (level === 'log') originalLog(...args);
      else originalInfo(...args);
    };

    console.log = (...args) => interceptLog('log', ...args);
    console.info = (...args) => interceptLog('info', ...args);

    return () => {
      console.log = originalLog;
      console.info = originalInfo;
    };
  }, [isVisible]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge 
          variant="outline" 
          className="cursor-pointer bg-black/80 text-white hover:bg-black"
          onClick={() => setIsVisible(true)}
        >
          Ctrl+Shift+D to toggle diagnostics
        </Badge>
      </div>
    );
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-left': 'top-4 left-4'
  };

  const scrollPercent = scrollPosition.scrollHeight > 0 
    ? ((scrollPosition.scrollTop / (scrollPosition.scrollHeight - scrollPosition.clientHeight)) * 100).toFixed(1)
    : '0.0';

  const verseKeys = getVerseKeys();
  const currentVerseRef = virtualizationState && verseKeys[virtualizationState.centerIdx] 
    ? verseKeys[virtualizationState.centerIdx] 
    : 'Unknown';

  return (
    <Card className={`fixed ${positionClasses[position]} z-50 p-4 max-w-md max-h-[90vh] overflow-y-auto bg-black/90 text-white border-2 border-blue-500 shadow-2xl backdrop-blur-sm`}>
      <div className="space-y-4 text-xs font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-500 pb-2">
          <h2 className="text-sm font-bold text-blue-300">📊 Scroll Diagnostics</h2>
          <div className="flex gap-2">
            <Badge 
              variant="outline" 
              className="cursor-pointer text-xs"
              onClick={() => setPosition(prev => {
                const positions: Array<'top-right' | 'bottom-right' | 'bottom-left' | 'top-left'> = 
                  ['top-right', 'bottom-right', 'bottom-left', 'top-left'];
                const currentIndex = positions.indexOf(prev);
                return positions[(currentIndex + 1) % positions.length];
              })}
            >
              Move (Ctrl+Shift+P)
            </Badge>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scroll Position */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-yellow-300">🎯 Scroll Position</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>ScrollTop: <span className="text-green-400">{scrollPosition.scrollTop.toFixed(0)}px</span></div>
            <div>Progress: <span className="text-green-400">{scrollPercent}%</span></div>
            <div>Height: <span className="text-green-400">{scrollPosition.scrollHeight.toFixed(0)}px</span></div>
            <div>Viewport: <span className="text-green-400">{scrollPosition.clientHeight.toFixed(0)}px</span></div>
          </div>
        </div>

        {/* Virtualization State */}
        {virtualizationState && (
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-yellow-300">📍 Virtualization</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Anchor: <span className="text-green-400">{virtualizationState.centerIdx}</span></div>
              <div>Stable: <span className="text-green-400">{virtualizationState.steppedIdx}</span></div>
              <div>Velocity: <span className={virtualizationState.velocity > 20 ? 'text-red-400' : 'text-green-400'}>
                {virtualizationState.velocity.toFixed(1)} rps
              </span></div>
              <div>Row Height: <span className="text-green-400">{virtualizationState.rowHeight}px</span></div>
              <div className="col-span-2">Current Verse: <span className="text-blue-400">{currentVerseRef}</span></div>
            </div>
          </div>
        )}

        {/* Render Windows */}
        {virtualizationState && (
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-yellow-300">🪟 Render Windows</h3>
            <div className="space-y-1 text-xs">
              <div className="bg-green-900/30 p-1 rounded">
                <span className="text-green-300">Render:</span> [{virtualizationState.windows.render[0]}, {virtualizationState.windows.render[1]}] 
                <span className="text-gray-400 ml-2">({virtualizationState.windows.render[1] - virtualizationState.windows.render[0] + 1} verses)</span>
              </div>
              <div className="bg-blue-900/30 p-1 rounded">
                <span className="text-blue-300">Safety:</span> [{virtualizationState.windows.safety[0]}, {virtualizationState.windows.safety[1]}]
                <span className="text-gray-400 ml-2">({virtualizationState.windows.safety[1] - virtualizationState.windows.safety[0] + 1} verses)</span>
              </div>
              <div className="bg-purple-900/30 p-1 rounded">
                <span className="text-purple-300">Background:</span> [{virtualizationState.windows.background[0]}, {virtualizationState.windows.background[1]}]
                <span className="text-gray-400 ml-2">({virtualizationState.windows.background[1] - virtualizationState.windows.background[0] + 1} verses)</span>
              </div>
            </div>
          </div>
        )}

        {/* Cache Stats */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-yellow-300">💾 Cache State</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Total Size: <span className="text-green-400">{cacheStats.totalSize}</span></div>
            <div>In-Flight: <span className="text-yellow-400">{cacheStats.inFlightCount}</span></div>
            <div className="col-span-2">
              {currentTranslation}: <span className="text-green-400">{cacheStats.currentTranslationSize.toFixed(0)} verses</span>
            </div>
            {cacheStats.recentEvictions > 0 && (
              <div className="col-span-2 text-red-400">
                ⚠️ Evicted: {cacheStats.recentEvictions} entries
              </div>
            )}
          </div>
        </div>

        {/* Prefetch Stats */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-yellow-300">⚡ Prefetch Queue</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Queue: <span className="text-green-400">{prefetchStats.queueSize}</span></div>
            <div>Status: <span className={prefetchStats.isProcessing ? 'text-yellow-400' : 'text-gray-400'}>
              {prefetchStats.isProcessing ? '🔄 Processing' : '💤 Idle'}
            </span></div>
            <div className="col-span-2">Processed: <span className="text-green-400">{prefetchStats.totalProcessed}</span></div>
          </div>
          {prefetchStats.recentlyLoaded.length > 0 && (
            <div className="text-xs">
              <div className="text-gray-400">Recently loaded:</div>
              <div className="text-green-400 max-h-20 overflow-y-auto">
                {prefetchStats.recentlyLoaded.slice(-5).map((verse, i) => (
                  <div key={i}>• {verse}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Evictions */}
        {evictionEvents.length > 0 && (
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-red-300">🗑️ Recent Evictions</h3>
            <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
              {evictionEvents.slice().reverse().map((event, i) => (
                <div key={i} className="bg-red-900/20 p-1 rounded">
                  <span className="text-gray-400">{new Date(event.time).toLocaleTimeString()}</span>
                  {' - '}
                  <span className="text-red-400">{event.count} entries</span>
                  {' '}
                  <span className="text-gray-500">({event.translation})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading Events Log */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-yellow-300">📝 Loading Events</h3>
          <div className="space-y-1 text-xs max-h-48 overflow-y-auto">
            {loadingEvents.slice().reverse().slice(0, 10).map((event, i) => (
              <div key={i} className="bg-gray-900/50 p-1 rounded">
                <span className="text-gray-400">{new Date(event.time).toLocaleTimeString()}</span>
                {' '}
                <Badge variant="outline" className="text-[10px] h-4">
                  {event.event}
                </Badge>
                {' '}
                <span className="text-green-400">{event.details}</span>
              </div>
            ))}
            {loadingEvents.length === 0 && (
              <div className="text-gray-500 italic">No loading events yet...</div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="pt-2 border-t border-blue-500">
          <div className="text-[10px] text-gray-400">
            <div>• Ctrl+Shift+D = Toggle HUD</div>
            <div>• Ctrl+Shift+P = Move Position</div>
            <div>• Updates in real-time</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
