/**
 * User Data Testing Component
 * Tests the new bookmark and highlight functionality
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToggleBookmark, useIsBookmarked, useSaveHighlights, useVerseHighlights, useDeleteHighlights } from '@/hooks/useUserData';
import { Segment, addRange, removeRange, recolorRange } from '@shared/highlights';
import { useToast } from '@/hooks/use-toast';
import { runUserDataTests } from '@/tests/userDataTests';

export function UserDataTesting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testTranslation, setTestTranslation] = useState('KJV');
  const [testVerseKey, setTestVerseKey] = useState('John.3:16');
  const [testText, setTestText] = useState('For God so loved the world that he gave his one and only Son');

  // Hooks
  const toggleBookmark = useToggleBookmark();
  const { data: isBookmarked, refetch: refetchBookmark } = useIsBookmarked(testTranslation, testVerseKey);
  const { data: highlightData, refetch: refetchHighlights } = useVerseHighlights(testTranslation, testVerseKey);
  const saveHighlights = useSaveHighlights();
  const deleteHighlights = useDeleteHighlights();

  // Test functions
  const testBookmarkRoundTrip = async () => {
    try {
      toast({ title: "Testing bookmarks...", description: "Running bookmark round-trip test" });
      
      // Toggle bookmark ON
      await toggleBookmark.mutateAsync({ translation: testTranslation, verse_key: testVerseKey });
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for mutation
      
      // Check if bookmark exists
      await refetchBookmark();
      if (!isBookmarked) {
        throw new Error('Bookmark was not created');
      }
      
      // Toggle bookmark OFF
      await toggleBookmark.mutateAsync({ translation: testTranslation, verse_key: testVerseKey });
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for mutation
      
      // Check if bookmark is gone
      await refetchBookmark();
      if (isBookmarked) {
        throw new Error('Bookmark was not deleted');
      }
      
      toast({ 
        title: "✅ Bookmark test passed", 
        description: "Bookmark toggle on/off working correctly" 
      });
    } catch (error: any) {
      toast({ 
        title: "❌ Bookmark test failed", 
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const testHighlightRoundTrip = async () => {
    try {
      toast({ title: "Testing highlights...", description: "Running highlight round-trip test" });
      
      // Create test segments
      const testSegments: Segment[] = [
        { start: 0, end: 12, color: 'yellow' }
      ];
      
      // Save highlights
      await saveHighlights.mutateAsync({
        translation: testTranslation,
        verseKey: testVerseKey,
        segments: testSegments,
        textLen: testText.length
      });
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for mutation
      
      // Read back highlights
      await refetchHighlights();
      if (!highlightData || !highlightData.segments.length) {
        throw new Error('Highlights were not saved');
      }
      
      const savedSegment = highlightData.segments[0];
      if (savedSegment.start !== 0 || savedSegment.end !== 12 || savedSegment.color !== 'yellow') {
        throw new Error('Highlight data does not match expected values');
      }
      
      toast({ 
        title: "✅ Highlight test passed", 
        description: `Highlight saved with server_rev: ${highlightData.server_rev}` 
      });
    } catch (error: any) {
      toast({ 
        title: "❌ Highlight test failed", 
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const testHighlightManipulation = () => {
    try {
      // Test the highlight manipulation functions
      let segments: Segment[] = [];
      
      // Add yellow highlight
      segments = addRange(segments, 0, 10, 'yellow');
      
      // Add blue highlight
      segments = addRange(segments, 15, 25, 'blue');
      
      // Add overlapping green highlight
      segments = addRange(segments, 8, 18, 'green');
      
      // Remove part of the highlights
      segments = removeRange(segments, 5, 20);
      
      // Recolor remaining segment
      if (segments.length > 0) {
        segments = recolorRange(segments, segments[0].start, segments[0].end, 'purple');
      }
      
      toast({ 
        title: "✅ Highlight manipulation test passed", 
        description: `Final segments: ${JSON.stringify(segments)}` 
      });
    } catch (error: any) {
      toast({ 
        title: "❌ Highlight manipulation test failed", 
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const testOffsetClamping = async () => {
    try {
      toast({ title: "Testing offset clamping...", description: "Testing segment clamping to text length" });
      
      // Create segment that exceeds text length
      const testSegments: Segment[] = [
        { start: 0, end: testText.length + 10, color: 'red' } // Exceeds text length
      ];
      
      // Save highlights with text length
      await saveHighlights.mutateAsync({
        translation: testTranslation,
        verseKey: testVerseKey,
        segments: testSegments,
        textLen: testText.length
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Read back and check if clamped
      await refetchHighlights();
      if (!highlightData || !highlightData.segments.length) {
        throw new Error('No highlights found after clamping test');
      }
      
      const clampedSegment = highlightData.segments[0];
      if (clampedSegment.end > testText.length) {
        throw new Error('Segment was not clamped to text length');
      }
      
      toast({ 
        title: "✅ Offset clamping test passed", 
        description: `Segment clamped to end: ${clampedSegment.end} (text length: ${testText.length})` 
      });
    } catch (error: any) {
      toast({ 
        title: "❌ Offset clamping test failed", 
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const clearTestData = async () => {
    try {
      // Clear highlights
      await deleteHighlights.mutateAsync({ 
        translation: testTranslation, 
        verseKey: testVerseKey 
      });
      
      // Clear bookmark if exists
      if (isBookmarked) {
        await toggleBookmark.mutateAsync({ 
          translation: testTranslation, 
          verse_key: testVerseKey 
        });
      }
      
      await refetchBookmark();
      await refetchHighlights();
      
      toast({ 
        title: "🧹 Test data cleared", 
        description: "All test bookmarks and highlights removed" 
      });
    } catch (error: any) {
      toast({ 
        title: "❌ Clear failed", 
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const runComprehensiveTests = async () => {
    try {
      toast({ title: "🧪 Running comprehensive tests...", description: "This may take a few moments" });
      
      const results = await runUserDataTests();
      const totalTests = Object.values(results).reduce((sum, cat) => sum + cat.passed + cat.failed, 0);
      const totalPassed = Object.values(results).reduce((sum, cat) => sum + cat.passed, 0);
      const successRate = Math.round((totalPassed / totalTests) * 100);
      
      toast({ 
        title: `📊 Tests completed`, 
        description: `${totalPassed}/${totalTests} passed (${successRate}%). Check console for details.`,
        variant: successRate > 80 ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({ 
        title: "❌ Test suite failed", 
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>Please sign in to test user data functionality</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Data API Testing</CardTitle>
          <CardDescription>
            Test the new bookmark and highlight functionality with proper RLS authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="translation">Translation</Label>
              <Input
                id="translation"
                value={testTranslation}
                onChange={(e) => setTestTranslation(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="verse">Verse Key</Label>
              <Input
                id="verse"
                value={testVerseKey}
                onChange={(e) => setTestVerseKey(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={clearTestData} variant="outline" className="w-full">
                Clear Test Data
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="testText">Test Text</Label>
            <Textarea
              id="testText"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              rows={2}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Length: {testText.length} characters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-medium">Current Status:</p>
              <p className="text-sm">Bookmarked: <span className="font-mono">{String(isBookmarked || false)}</span></p>
              <p className="text-sm">
                Highlights: <span className="font-mono">
                  {highlightData ? `${highlightData.segments.length} segments (rev: ${highlightData.server_rev})` : 'none'}
                </span>
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">User Info:</p>
              <p className="text-sm">Email: <span className="font-mono">{user.email}</span></p>
              <p className="text-sm">ID: <span className="font-mono">{user.id.slice(0, 8)}...</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Suite</CardTitle>
          <CardDescription>Run automated tests to verify functionality</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Button 
              onClick={testBookmarkRoundTrip}
              disabled={toggleBookmark.isPending}
            >
              Test Bookmarks
            </Button>
            <Button 
              onClick={testHighlightRoundTrip}
              disabled={saveHighlights.isPending}
            >
              Test Highlights
            </Button>
            <Button 
              onClick={testHighlightManipulation}
              variant="outline"
            >
              Test Manipulation
            </Button>
            <Button 
              onClick={testOffsetClamping}
              disabled={saveHighlights.isPending}
              variant="outline"
            >
              Test Clamping
            </Button>
            <Button 
              onClick={runComprehensiveTests}
              variant="secondary"
              className="md:col-span-1"
            >
              🧪 Full Test Suite
            </Button>
          </div>
        </CardContent>
      </Card>

      {highlightData && highlightData.segments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
              {JSON.stringify(highlightData.segments, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}