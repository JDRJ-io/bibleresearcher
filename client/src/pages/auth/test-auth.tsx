import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export default function TestAuth() {
  const { user, session, loading } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults((prev) => [...prev, result]);
  };

  const testSupabaseConnection = async () => {
    addResult("Testing Supabase connection...");
    try {
      const { data, error } = await supabase().auth.getSession();
      if (error) {
        addResult(`❌ Connection error: ${error.message}`);
      } else {
        addResult("✅ Supabase connection successful");
        addResult(`Session exists: ${!!data.session}`);
        if (data.session) {
          addResult(`User email: ${data.session.user.email}`);
        }
      }
    } catch (error) {
      addResult(`❌ Unexpected error: ${error}`);
    }
  };

  const testManualAuth = async () => {
    addResult("Testing manual authentication...");
    const testEmail = "jdrjacobus@yahoo.com";

    try {
      const { error } = await supabase().auth.signInWithOtp({
        email: testEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        addResult(`❌ Auth test failed: ${error.message}`);
      } else {
        addResult(`✅ Magic link would be sent to ${testEmail}`);
        addResult(`Redirect URL: ${window.location.origin}/auth/callback`);
      }
    } catch (error) {
      addResult(`❌ Test error: ${error}`);
    }
  };

  useEffect(() => {
    addResult(`Current URL: ${window.location.origin}`);
    addResult(`Loading state: ${loading}`);
    addResult(`User exists: ${!!user}`);
    addResult(`Session exists: ${!!session}`);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication System Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={testSupabaseConnection}>
                Test Supabase Connection
              </Button>
              <Button onClick={testManualAuth} variant="outline">
                Test Auth Flow
              </Button>
              <Button onClick={() => setTestResults([])} variant="outline">
                Clear Results
              </Button>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className="space-y-1 text-sm font-mono">
                {testResults.map((result, index) => (
                  <div key={index} className="text-gray-700 dark:text-gray-300">
                    {result}
                  </div>
                ))}
                {testResults.length === 0 && (
                  <div className="text-gray-500">No tests run yet...</div>
                )}
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Current Auth State:
              </h3>
              <div className="text-sm space-y-1">
                <div>Loading: {loading ? "Yes" : "No"}</div>
                <div>User: {user ? user.email : "None"}</div>
                <div>Session: {session ? "Active" : "None"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
