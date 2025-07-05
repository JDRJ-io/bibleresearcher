import React, { useState } from "react";
import { useFastBibleData } from "@/hooks/useFastBibleData";
import { FastVirtualBibleTable } from "@/components/bible/FastVirtualBibleTable";
import { LoadingWheel } from "@/components/LoadingWheel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function FastBiblePage() {
  const {
    allVerses,
    isLoading,
    loadingProgress,
    currentCenterVerse,
    navigateToVerse,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    getVerseText,
    getCrossReferences,
    totalRows,
  } = useFastBibleData();

  const [searchQuery, setSearchQuery] = useState("");

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigateToVerse(searchQuery.trim());
    }
  };

  // Handle verse expansion (placeholder for now)
  const handleExpandVerse = (verse: any) => {
    console.log("Expanding verse:", verse.reference);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingWheel size="large" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Loading Fast Bible Interface</h2>
            <p className="text-muted-foreground">
              Optimizing for instant navigation...
            </p>
            <div className="w-64 mx-auto bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {loadingProgress}% complete
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-primary">Fast Bible</h1>
          <div className="text-sm text-muted-foreground">
            {totalRows.toLocaleString()} verses loaded
          </div>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goBack}
            disabled={!canGoBack}
            className="flex items-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goForward}
            disabled={!canGoForward}
            className="flex items-center space-x-1"
          >
            <span>Forward</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Search (e.g., John 3:16)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48"
            />
            <Button type="submit" size="sm" variant="secondary">
              <Search className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Main content */}
      <FastVirtualBibleTable
        verses={allVerses}
        currentCenterVerse={currentCenterVerse}
        onNavigateToVerse={navigateToVerse}
        onExpandVerse={handleExpandVerse}
        getCrossReferences={getCrossReferences}
      />

      {/* Footer */}
      <div className="p-2 bg-card border-t text-center">
        <div className="text-xs text-muted-foreground">
          Fast Bible Interface - No lag, instant navigation
          {currentCenterVerse >= 0 && allVerses[currentCenterVerse] && (
            <span className="ml-4">
              Current: {allVerses[currentCenterVerse].reference}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}