import { useState, useEffect } from 'react';
import { useTheme } from '@/components/bible/ThemeProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export function ThemePerformanceMonitor() {
  const { performanceMetrics, theme, enablePerformanceMode } = useTheme();
  const [memoryMetrics, setMemoryMetrics] = useState<MemoryMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const updateMemoryMetrics = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryMetrics({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        });
      }
    };

    updateMemoryMetrics();
    const interval = setInterval(updateMemoryMetrics, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const getPerformanceLevel = (metrics: typeof performanceMetrics) => {
    if (metrics.memoryEstimate < 10) return 'excellent';
    if (metrics.memoryEstimate < 25) return 'good';
    if (metrics.memoryEstimate < 50) return 'fair';
    return 'needs-optimization';
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100"
      >
        📊 Theme Debug
      </Button>
    );
  }

  const performanceLevel = getPerformanceLevel(performanceMetrics);

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 max-h-96 overflow-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Theme Performance</CardTitle>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-medium">Current Theme:</span>
            <Badge variant="secondary" className="ml-1">
              {theme}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Performance Mode:</span>
            <Badge variant={enablePerformanceMode ? "default" : "outline"} className="ml-1">
              {enablePerformanceMode ? 'ON' : 'OFF'}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Theme Changes:</span>
            <span>{performanceMetrics.themeChanges}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Last Change Time:</span>
            <span>{performanceMetrics.lastChangeTime.toFixed(1)}ms</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Cache Size:</span>
            <span>{performanceMetrics.cacheSize} vars</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Memory Estimate:</span>
            <span>{performanceMetrics.memoryEstimate.toFixed(1)} KB</span>
          </div>
        </div>

        {memoryMetrics && (
          <div className="space-y-2 border-t pt-2">
            <div className="text-xs font-medium">Browser Memory:</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Used Heap:</span>
                <span>{formatBytes(memoryMetrics.usedJSHeapSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Heap:</span>
                <span>{formatBytes(memoryMetrics.totalJSHeapSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>Heap Limit:</span>
                <span>{formatBytes(memoryMetrics.jsHeapSizeLimit)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs font-medium">Performance:</span>
          <Badge 
            variant={
              performanceLevel === 'excellent' ? 'default' :
              performanceLevel === 'good' ? 'secondary' :
              performanceLevel === 'fair' ? 'outline' : 'destructive'
            }
          >
            {performanceLevel.replace('-', ' ').toUpperCase()}
          </Badge>
        </div>

        {performanceLevel === 'needs-optimization' && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            💡 Consider enabling Performance Mode or using lighter themes for better memory usage.
          </div>
        )}
      </CardContent>
    </Card>
  );
}