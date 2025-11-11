import { DevUnlock } from '@/components/auth/DevUnlock';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { useEffect, useState, useRef } from 'react';
import { 
  Crown, 
  Code, 
  User, 
  Database, 
  Settings,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Search,
  Play,
  Terminal,
  Trash2
} from 'lucide-react';


export default function DevTools() {
  const { user, profile, loading, profileLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [diagnosticOutput, setDiagnosticOutput] = useState<string>('');
  const [consoleInput, setConsoleInput] = useState<string>('');
  const [consoleHistory, setConsoleHistory] = useState<Array<{ input: string; output: string; isError: boolean }>>([]);
  const consoleOutputRef = useRef<HTMLDivElement>(null);

  // Expose search diagnostic functions to window for console testing
  useEffect(() => {
    // Import and expose the parser functions
    import('@/lib/bible-reference-parser').then((parser) => {
      (window as any).parseReferences = parser.parseReferences;
      (window as any).toKeys = parser.toKeys;
      console.log('✅ Diagnostic tools exposed to window: parseReferences, toKeys');
    });

    // Expose getVerseIndex from verseIndexMap
    import('@/lib/verseIndexMap').then((indexMap) => {
      (window as any).getVerseIndex = indexMap.getVerseIndex;
      console.log('✅ Diagnostic tools exposed to window: getVerseIndex');
    });
  }, []);

  const executeConsoleCommand = () => {
    if (!consoleInput.trim()) return;

    // Capture console output
    const logs: string[] = [];
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalTable = console.table;

    // Override console methods temporarily
    console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
    console.warn = (...args) => logs.push('⚠️ ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
    console.error = (...args) => logs.push('❌ ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
    console.table = (data) => {
      if (Array.isArray(data)) {
        logs.push(JSON.stringify(data, null, 2));
      } else {
        logs.push(JSON.stringify(data, null, 2));
      }
    };

    try {
      // Execute the code and capture the result
      const result = eval(consoleInput);
      
      // Restore console methods
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.table = originalTable;

      // Format the output - prioritize console logs, then return value
      let output: string;
      if (logs.length > 0) {
        output = logs.join('\n');
        // If there's also a return value, append it
        if (result !== undefined) {
          if (typeof result === 'object') {
            try {
              output += '\n← ' + JSON.stringify(result, null, 2);
            } catch {
              output += '\n← ' + String(result);
            }
          } else {
            output += '\n← ' + String(result);
          }
        }
      } else {
        // No console logs, just show return value
        if (result === undefined) {
          output = 'undefined';
        } else if (result === null) {
          output = 'null';
        } else if (typeof result === 'object') {
          try {
            output = JSON.stringify(result, null, 2);
          } catch {
            output = String(result);
          }
        } else {
          output = String(result);
        }
      }

      setConsoleHistory(prev => [...prev, { 
        input: consoleInput, 
        output, 
        isError: false 
      }]);
    } catch (error) {
      // Restore console methods even on error
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.table = originalTable;

      setConsoleHistory(prev => [...prev, { 
        input: consoleInput, 
        output: `Error: ${error}`, 
        isError: true 
      }]);
    }

    setConsoleInput('');
    
    // Auto-scroll to bottom
    setTimeout(() => {
      consoleOutputRef.current?.scrollTo({
        top: consoleOutputRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  };

  const clearConsoleHistory = () => {
    setConsoleHistory([]);
  };

  const runSearchDiagnostic = async () => {
    try {
      setDiagnosticOutput('Running search engine diagnostic...\n\n');
      
      const { parseReferences, toKeys } = await import('@/lib/bible-reference-parser');
      const { getVerseIndex } = await import('@/lib/verseIndexMap');
      
      const testCases = [
        "Gen 1:1",
        "Genesis 1.1",
        "Jn 3:16",
        "John 3:16",
        "John 3:16-18",
        "Song 1:1",
      ];

      let output = 'TEST CASES:\n';
      output += '═'.repeat(70) + '\n\n';

      for (const testCase of testCases) {
        const parsed = parseReferences(testCase);
        const keys = toKeys(parsed);
        const indexes = keys.map(k => getVerseIndex(k));
        
        output += `Query: "${testCase}"\n`;
        output += `  Parsed: ${JSON.stringify(parsed, null, 2)}\n`;
        output += `  Keys: ${keys.join(', ')}\n`;
        output += `  Indexes: ${indexes.join(', ')}\n`;
        output += `  Status: ${indexes.every(i => i >= 0) ? '✅ PASS' : '❌ FAIL'}\n\n`;
      }

      // Storage test
      output += '\nSTORAGE TEST:\n';
      output += '═'.repeat(70) + '\n\n';
      
      const storageUrl = "https://ecaqvxbbscwcxbjpfrdm.supabase.co/storage/v1/object/public/anointed/translations/kjv.txt";
      const response = await fetch(storageUrl, { 
        headers: { Range: "bytes=0-256" }
      });
      
      output += `URL: ${storageUrl}\n`;
      output += `Status: ${response.status}\n`;
      output += `Content-Range: ${response.headers.get('content-range')}\n`;
      output += `Status: ${response.status === 206 ? '✅ PASS' : '❌ FAIL'}\n\n`;

      setDiagnosticOutput(output);
      console.log(output);
    } catch (error) {
      setDiagnosticOutput(`Error: ${error}\n\n${diagnosticOutput}`);
      console.error('Diagnostic error:', error);
    }
  };

  const testTextSearch = async () => {
    try {
      setDiagnosticOutput('Testing text search for "love your enemies"...\n\n');
      
      // This requires the search modal to be open or we need to import the engine
      const output = 'To test text search:\n' +
        '1. Open the search modal (Cmd/Ctrl + K)\n' +
        '2. Search for "love your enemies"\n' +
        '3. Expected: Matthew 5:44, Luke 6:27/35 in results\n\n' +
        'Check browser console for search logs starting with 🔍';
      
      setDiagnosticOutput(output);
      console.log('📝 Text search test instructions:', output);
    } catch (error) {
      setDiagnosticOutput(`Error: ${error}`);
    }
  };

  const runSmokeTests = async () => {
    try {
      setDiagnosticOutput('Running smoke tests...\n\n');
      let output = '';
      const log = (msg: string) => {
        output += msg + '\n';
        console.log(msg);
      };

      const ok = (cond: boolean, msg: string) => {
        const result = (cond ? "✅" : "❌") + " " + msg;
        log(result);
      };

      const has = (k: string) => (window as any).getVerseIndex ? Number.isFinite((window as any).getVerseIndex(k)) : false;
      const parseKeys = (q: string) => ((window as any).toKeys?.((window as any).parseReferences?.(q) || []) || []);
      const expectKey = (q: string, exp: string) => {
        const keys = parseKeys(q);
        ok(keys[0] === exp, `toKeys("${q}") === "${exp}" (got: ${keys[0]})`);
        ok(has(exp), `index has "${exp}"`);
      };
      const expectSome = async (q: string, expects: string[] = []) => {
        const out = await (window as any).bibleSearchEngine?.search?.(q, "KJV", 50, true) || [];
        ok(out.length > 0, `search("${q}") returns results`);
        for (const exp of expects) ok(out.some((r: any) => r.reference === exp), `search("${q}") contains ${exp}`);
      };

      log('=== Reference normalizations ===');
      expectKey("Gen 1:1", "Gen.1:1");
      expectKey("Genesis 1.1", "Gen.1:1");
      expectKey("gen1:1", "Gen.1:1");
      expectKey("Jn 3:16", "John.3:16");
      expectKey("Joh 3:16", "John.3:16");
      expectKey("jn316", "John.3:16");
      expectKey("1 Kings 3:5", "1Kgs.3:5");
      expectKey("Eccles 12:1", "Eccl.12:1");
      expectKey("Est 1:1", "Esth.1:1");
      expectKey("Php 4:13", "Phil.4:13");
      expectKey("1 Th 5:17", "1Thess.5:17");
      expectKey("1 Thess 5:17", "1Thess.5:17");
      expectKey("Philem 1:1", "Phlm.1:1");
      expectKey("Apoc 12:1", "Rev.12:1");
      expectKey("Cant 2:1", "Song.2:1");
      expectKey("Qoh 1:2", "Eccl.1:2");

      log('\n=== Jonah specific ===');
      expectKey("Jon 1:1", "Jonah.1:1");
      expectKey("Jonah 1:1", "Jonah.1:1");

      log('\n=== Roman numerals ===');
      expectKey("I Sam 3:1", "1Sam.3:1");
      expectKey("II Kings 2:1", "2Kgs.2:1");
      expectKey("III John 1:2", "3John.1:2");

      log('\n=== Separators ===');
      expectKey("John 3.16", "John.3:16");
      expectKey("John 3,16", "John.3:16");

      log('\n=== Lists/ranges ===');
      const listKeys = parseKeys("John 3:16,18; 4:1–3");
      ok(listKeys.length >= 3, "list/range produced multiple keys");
      ok(listKeys[0].startsWith("John.") && listKeys[listKeys.length - 1].startsWith("John."), "keys belong to John");

      log('\n=== f/ff/parts ===');
      const ff = parseKeys("John 3:16ff"); ok(ff.length >= 1, "3:16ff parsed");
      const f1 = parseKeys("John 3:16f"); ok(f1.length >= 1, "3:16f parsed");
      const part = parseKeys("John 3:16a"); ok(part.length >= 1, "3:16a parsed");

      log('\n=== Single-chapter books ===');
      expectKey("Jude 5", "Jude.1:5");
      expectKey("Obad 1", "Obad.1:1");

      log('\n=== Cross-chapter ===');
      const cross = parseKeys("Gen 1:31–2:2");
      ok(cross.length >= 2, "cross-chapter range yields at least 2 keys");

      log('\n=== Reference search ===');
      const refRes = await (window as any).bibleSearchEngine?.search?.("John 3:16", "KJV", 5, false);
      ok(refRes?.[0]?.reference === "John.3:16", "reference search returns the exact verse first");

      log('\n=== Text search ===');
      await expectSome("in the beginning", ["Gen.1:1"]);
      await expectSome("love your enemies", ["Matt.5:44", "Luke.6:27", "Luke.6:35"]);
      await expectSome("GOD LOVE WORLD", ["John.3:16"]);
      await expectSome("world; God, loved!", ["John.3:16"]);

      log('\n=== Multi-translation ===');
      const multi = await (window as any).bibleSearchEngine?.search?.("love your enemies", "KJV", 50, true);
      const hasKJV = multi?.some((r: any) => r.reference === "Matt.5:44" && r.translationCode === "KJV");
      const hasWEB = multi?.some((r: any) => r.reference === "Matt.5:44" && r.translationCode === "WEB");
      ok(hasKJV && hasWEB, "multi-translation includes KJV and WEB for Matt.5:44");

      log('\n✅ Smoke tests complete');
      setDiagnosticOutput(output);
    } catch (error) {
      const errorMsg = `Error: ${error}`;
      setDiagnosticOutput(errorMsg);
      console.error('Smoke test error:', error);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
          </div>
          <p>Loading developer tools...</p>
        </div>
      </div>
    );
  }

  // Role-based access control - premium members and staff can access DevTools
  const isStaff = profile?.role === 'staff' || profile?.role === 'admin';
  const isPremium = profile?.tier === 'premium';
  const isLifetime = profile?.tier === 'lifetime';
  const hasAccess = isStaff || isPremium || isLifetime;
  
  if (!user || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Premium membership required to view developer tools.</p>
          <Button variant="outline" onClick={() => setLocation('/profile')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Code className="h-8 w-8" />
              Developer Tools
            </h1>
            <p className="text-muted-foreground">Premium member tools and utilities</p>
          </div>
          <Button variant="outline" onClick={() => setLocation('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bible Study
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Code Redemption */}
          <div className="md:col-span-1">
            <DevUnlock />
          </div>

          {/* User Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Status
              </CardTitle>
              <CardDescription>
                Current user information and subscription details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm">{user.email}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm">{profile?.name || 'Not set'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tier:</span>
                    <div className="flex items-center gap-2">
                      {isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
                      <Badge variant={isPremium || isLifetime ? "default" : "secondary"}>
                        {profile?.tier || 'free'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Premium Access:</span>
                    <div className="flex items-center gap-1">
                      {isPremium || isLifetime ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600 dark:text-green-400">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600 dark:text-red-400">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Please sign in to view account status</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Information Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Available Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>DEV-ALPHA-2025:</span>
                  <Badge variant="outline">Premium Access</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  For developers and team members
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Premium Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Advanced Search</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Unlimited Bookmarks</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Community Features</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Priority Support</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Engine Diagnostics */}
        <Card className="md:col-span-2" data-testid="card-search-diagnostics">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Engine Diagnostics
            </CardTitle>
            <CardDescription>
              Test reference parsing, verse indexing, storage, and text search
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={runSearchDiagnostic}
                variant="outline"
                data-testid="button-run-diagnostic"
              >
                Run Parser + Index Test
              </Button>
              <Button 
                onClick={testTextSearch}
                variant="outline"
                data-testid="button-test-search"
              >
                Test Text Search
              </Button>
              <Button 
                onClick={runSmokeTests}
                variant="default"
                data-testid="button-smoke-tests"
              >
                Run Full Smoke Tests
              </Button>
            </div>

            {diagnosticOutput && (
              <div className="mt-4">
                <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-md overflow-auto max-h-96 font-mono text-xs whitespace-pre">
                  {diagnosticOutput}
                </div>
              </div>
            )}

            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  JavaScript Console
                </h3>
                {consoleHistory.length > 0 && (
                  <Button
                    onClick={clearConsoleHistory}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Console Output */}
              {consoleHistory.length > 0 && (
                <div 
                  ref={consoleOutputRef}
                  className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded-md overflow-auto max-h-64 font-mono text-xs space-y-2"
                >
                  {consoleHistory.map((entry, index) => (
                    <div key={index} className="border-b border-gray-700 pb-2 last:border-0">
                      <div className="text-blue-400">{'> '}{entry.input}</div>
                      <div className={entry.isError ? 'text-red-400' : 'text-green-400'}>
                        {entry.output}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Console Input */}
              <div className="flex gap-2">
                <textarea
                  value={consoleInput}
                  onChange={(e) => setConsoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      e.preventDefault();
                      executeConsoleCommand();
                    }
                  }}
                  placeholder="Enter JavaScript (e.g., window.parseReferences('Jn 3:16')). Press Ctrl+Enter to run."
                  rows={3}
                  className="flex-1 px-3 py-2 text-sm font-mono bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
                <Button
                  onClick={executeConsoleCommand}
                  size="sm"
                  variant="default"
                  disabled={!consoleInput.trim()}
                  className="self-end"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Run
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                <p className="mb-1"><strong>Available functions:</strong></p>
                <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  window.parseReferences("Jn 3:16"){'\n'}
                  window.getVerseIndex("John.3:16"){'\n'}
                  window.toKeys(parsed)
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}