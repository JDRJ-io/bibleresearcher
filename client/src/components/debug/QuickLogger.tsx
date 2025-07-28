// Quick Logger Component - Small debugging widget that can be embedded anywhere
// Shows live system stats and provides quick access to full logger

import { useState, useEffect } from 'react';
import { globalLogger } from '@/lib/globalLogger';
import { systemDocumenter } from '@/lib/systemDocumenter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity,
  FileText,
  AlertTriangle,
  Download,
  ExternalLink
} from 'lucide-react';

interface QuickLoggerProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  minimized?: boolean;
}

export function QuickLogger({ 
  position = 'bottom-right', 
  minimized: initialMinimized = false 
}: QuickLoggerProps) {
  const [stats, setStats] = useState<any>({});
  const [minimized, setMinimized] = useState(initialMinimized);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const updateStats = () => {
      const summary = globalLogger.getSystemSummary();
      const systemDoc = systemDocumenter.getLastDocumentation();
      
      setStats({
        totalLogs: summary.totalLogs || 0,
        errors: summary.errorCount || 0,
        uptime: summary.uptime || 0,
        cacheEfficiency: summary.cacheEfficiency || '0.00',
        activeComponents: summary.activeComponents?.length || 0,
        filesAccessed: summary.topAccessedFiles?.length || 0,
        documentsGenerated: systemDoc ? 1 : 0
      });
      setLastUpdate(Date.now());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const exportReport = () => {
    const report = systemDocumenter.exportMarkdownReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biblical-research-system-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openFullLogger = () => {
    window.open('/debug/logger', '_blank');
  };

  if (minimized) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setMinimized(false)}
          className="bg-background/80 backdrop-blur-sm border-2"
        >
          <Activity className="w-4 h-4" />
          <span className="ml-1 text-xs">{stats.totalLogs}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 w-72`}>
      <Card className="bg-background/95 backdrop-blur-sm border-2 shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-sm">System Logger</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMinimized(true)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-green-500" />
                <span>{stats.totalLogs} logs</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                <span>{stats.errors} errors</span>
              </div>
              <div>
                <span className="text-gray-600">Components:</span>
                <span className="ml-1 font-mono">{stats.activeComponents}</span>
              </div>
              <div>
                <span className="text-gray-600">Files:</span>
                <span className="ml-1 font-mono">{stats.filesAccessed}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                Cache: {stats.cacheEfficiency}%
              </Badge>
              <span className="text-xs text-gray-500">
                {Math.round(stats.uptime / 1000)}s uptime
              </span>
            </div>

            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={openFullLogger} className="flex-1 h-7 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                Full Logger
              </Button>
              <Button size="sm" variant="outline" onClick={exportReport} className="h-7 px-2">
                <Download className="w-3 h-3" />
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Updated {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}