import { useState, useEffect } from 'react';
import { Bug, X, Play, Copy, Trash2, Monitor, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export function MobileDiagnosticsHUD() {
  const [isOpen, setIsOpen] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [command, setCommand] = useState('');
  const { toast } = useToast();

  // Toggle HUD with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + D to toggle
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const executeCommand = (cmd: string) => {
    try {
      const result = (window as any).eval(cmd);
      const stringified = typeof result === 'object' 
        ? JSON.stringify(result, null, 2) 
        : String(result);
      setOutput(prev => prev + '\n> ' + cmd + '\n' + stringified + '\n');
    } catch (error) {
      setOutput(prev => prev + '\n> ' + cmd + '\nError: ' + (error as Error).message + '\n');
    }
  };

  const runDiagnostics = () => {
    const cmd = '__runMobileDiagnostics__({ print: false })';
    executeCommand(cmd);
    executeCommand('JSON.stringify(window.__PREFETCH_DIAGNOSTICS__, null, 2)');
  };

  const runBeforeAfter = () => {
    executeCommand('window.__DIAG_BEFORE__ = window.__PREFETCH_DIAGNOSTICS__');
    setOutput(prev => prev + '\n✅ Before snapshot saved. Scroll/flick now, then click "After Snapshot"\n');
  };

  const runAfter = () => {
    executeCommand('__runMobileDiagnostics__({ print: false })');
    executeCommand('window.__DIAG_AFTER__ = window.__PREFETCH_DIAGNOSTICS__');
    const comparison = `
Before Windows: ${JSON.stringify((window as any).__DIAG_BEFORE__?.mobilePolicy?.computedWindows)}
After Windows: ${JSON.stringify((window as any).__DIAG_AFTER__?.mobilePolicy?.computedWindows)}

Before Velocity: ${(window as any).__DIAG_BEFORE__?.velocityMetrics?.samples}
After Velocity: ${(window as any).__DIAG_AFTER__?.velocityMetrics?.samples}

Batch Stats: ${JSON.stringify((window as any).__DIAG_AFTER__?.batchStats, null, 2)}
`;
    setOutput(prev => prev + '\n' + comparison);
  };

  const startMonitoring = () => {
    executeCommand('__startMonitoring__(500)');
    setOutput(prev => prev + '\n📊 Monitoring started (500ms intervals). Scroll/flick now!\n');
  };

  const stopMonitoring = () => {
    executeCommand('__stopMonitoring__()');
    executeCommand('JSON.stringify(window.__PREFETCH_DIAGNOSTICS__, null, 2)');
  };

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast({ title: 'Copied to clipboard!' });
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const runQuickCheck = () => {
    const cmd = 'window.__quickCheck__()';
    executeCommand(cmd);
  };

  const runVelocityTest = () => {
    executeCommand('window.__velocityTest__()');
    setOutput(prev => prev + '\n🏃 Velocity test started. Scroll/flick now! Results in 2 seconds...\n');
  };

  const quickCommands = [
    { label: 'Full Report', fn: runDiagnostics },
    { label: 'Before Snapshot', fn: runBeforeAfter },
    { label: 'After Snapshot', fn: runAfter },
    { label: 'Quick Check', fn: runQuickCheck },
    { label: 'Velocity Test', fn: runVelocityTest },
    { label: 'Start Monitor', fn: startMonitoring },
    { label: 'Stop Monitor', fn: stopMonitoring },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-end sm:items-center sm:justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Mobile Diagnostics</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            data-testid="button-close-diagnostics-hud"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Quick Commands */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {quickCommands.map((cmd) => (
              <Button
                key={cmd.label}
                variant="outline"
                size="sm"
                onClick={cmd.fn}
                className="text-xs"
                data-testid={`button-${cmd.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                {cmd.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Output Area */}
        <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-950">
          <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
            {output || 'No output yet. Run a diagnostic command.'}
          </pre>
        </div>

        {/* Command Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter JavaScript command..."
              className="flex-1 text-sm font-mono"
              rows={2}
              data-testid="input-diagnostic-command"
            />
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => {
                  executeCommand(command);
                  setCommand('');
                }}
                data-testid="button-execute-command"
              >
                <Play className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={copyOutput}
                data-testid="button-copy-output"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOutput('')}
                data-testid="button-clear-output"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-xs text-blue-700 dark:text-blue-300">
          <strong>Quick Tips:</strong> Use buttons above for common diagnostics. Or type custom JS commands.
          <br />
          <strong>Shortcut:</strong> Ctrl/Cmd + Shift + D to toggle this panel
        </div>
      </div>
    </div>
  );
}
