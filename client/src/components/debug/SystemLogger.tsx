// System Logger Dashboard Component
// Real-time debugging interface for the global logging system

import { useState, useEffect, useRef } from 'react';
import { globalLogger } from '@/lib/globalLogger';
import type { LogEntry } from '@/lib/globalLogger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { 
  Download, 
  Trash2, 
  Play, 
  Pause, 
  Filter, 
  Search,
  FileText,
  Activity,
  Database,
  Zap,
  AlertTriangle,
  MousePointer
} from 'lucide-react';

export function SystemLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [summary, setSummary] = useState<any>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Refresh logs and summary periodically
  useEffect(() => {
    const updateData = () => {
      if (globalLogger) {
        const allLogs = globalLogger.exportLogs();
        setLogs(allLogs.logs);
        setSummary(globalLogger.getSystemSummary());
      }
    };

    updateData();
    intervalRef.current = setInterval(updateData, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Toggle logging
  const toggleLogging = () => {
    if (isEnabled) {
      globalLogger.disable();
    } else {
      globalLogger.enable();
    }
    setIsEnabled(!isEnabled);
  };

  // Export logs
  const exportLogs = () => {
    const data = globalLogger.exportLogs();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biblical-research-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear logs
  const clearLogs = () => {
    globalLogger.clear();
    setLogs([]);
    setSummary({});
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (selectedCategory !== 'all' && log.category !== selectedCategory) return false;
    if (filter && !JSON.stringify(log).toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const getCategoryIcon = (category: string) => {
    const icons = {
      'filesystem': <FileText className="w-4 h-4" />,
      'data-flow': <Activity className="w-4 h-4" />,
      'state-change': <Database className="w-4 h-4" />,
      'performance': <Zap className="w-4 h-4" />,
      'error': <AlertTriangle className="w-4 h-4" />,
      'user-action': <MousePointer className="w-4 h-4" />
    };
    return icons[category as keyof typeof icons] || <FileText className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'filesystem': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'data-flow': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'state-change': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'performance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'error': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'user-action': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    return duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`;
  };

  return (
    <div className="w-full h-full bg-background">
      <Tabs defaultValue="logs" className="h-full flex flex-col">
        <div className="border-b px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">System Logger Dashboard</h2>
            <div className="flex items-center gap-2">
              <Switch
                checked={isEnabled}
                onCheckedChange={toggleLogging}
                id="logging-toggle"
              />
              <label htmlFor="logging-toggle" className="text-sm">
                {isEnabled ? 'Logging On' : 'Logging Off'}
              </label>
            </div>
          </div>
          
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="logs">Live Logs</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="filesystem">File System</TabsTrigger>
            <TabsTrigger value="dataflow">Data Flow</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="logs" className="flex-1 flex flex-col p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Filter logs..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="max-w-xs"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border rounded-md bg-background"
            >
              <option value="all">All Categories</option>
              <option value="filesystem">Filesystem</option>
              <option value="data-flow">Data Flow</option>
              <option value="state-change">State Change</option>
              <option value="performance">Performance</option>
              <option value="error">Errors</option>
              <option value="user-action">User Actions</option>
            </select>

            <Switch
              checked={autoScroll}
              onCheckedChange={setAutoScroll}
              id="auto-scroll"
            />
            <label htmlFor="auto-scroll" className="text-sm whitespace-nowrap">Auto Scroll</label>

            <Button onClick={exportLogs} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            
            <Button onClick={clearLogs} size="sm" variant="outline">
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>

          <ScrollArea ref={scrollRef} className="flex-1 border rounded-md p-2">
            <div className="space-y-1">
              {filteredLogs.slice(-500).map((log, index) => (
                <div key={index} className="flex items-start gap-2 p-2 rounded text-xs font-mono border-l-2 border-l-gray-200 dark:border-l-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <span className="text-gray-500 min-w-[80px]">
                    {formatTime(log.timestamp)}
                  </span>
                  
                  <Badge className={`min-w-[80px] justify-center ${getCategoryColor(log.category)}`}>
                    <span className="flex items-center gap-1">
                      {getCategoryIcon(log.category)}
                      {log.category}
                    </span>
                  </Badge>
                  
                  <span className="text-blue-600 dark:text-blue-400 min-w-[100px]">
                    {log.subcategory}
                  </span>
                  
                  <span className="font-semibold min-w-[100px]">
                    {log.operation}
                  </span>
                  
                  {log.component && (
                    <span className="text-purple-600 dark:text-purple-400 min-w-[120px]">
                      {log.component}
                    </span>
                  )}
                  
                  {log.duration && (
                    <span className="text-orange-600 dark:text-orange-400 min-w-[60px]">
                      {formatDuration(log.duration)}
                    </span>
                  )}
                  
                  <span className="text-gray-600 dark:text-gray-400 flex-1">
                    {JSON.stringify(log.details).substring(0, 200)}
                    {JSON.stringify(log.details).length > 200 && '...'}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="mt-2 text-sm text-gray-500">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        </TabsContent>

        <TabsContent value="summary" className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Logs:</span>
                    <span className="font-mono">{summary.totalLogs || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span className="font-mono">
                      {summary.uptime ? Math.round(summary.uptime / 1000) + 's' : '0s'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Errors:</span>
                    <span className="font-mono text-red-600">{summary.errorCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Efficiency:</span>
                    <span className="font-mono">{summary.cacheEfficiency || '0.00'}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Components</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {summary.activeComponents?.map((component: string) => (
                    <Badge key={component} variant="outline" className="text-xs">
                      {component}
                    </Badge>
                  )) || <span className="text-gray-500">None</span>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top Files Accessed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs">
                  {summary.topAccessedFiles?.map((file: any) => (
                    <div key={file.key} className="flex justify-between">
                      <span className="truncate">{file.key}</span>
                      <span className="font-mono">{file.count}</span>
                    </div>
                  )) || <span className="text-gray-500">None</span>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="filesystem" className="flex-1 p-4">
          <Card>
            <CardHeader>
              <CardTitle>File System Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(globalLogger.getFileSystemMap(), null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dataflow" className="flex-1 p-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Flow Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(globalLogger.getDataFlowMap(), null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}