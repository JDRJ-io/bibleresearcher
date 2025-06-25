import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useBibleData } from '@/hooks/useBibleData';
import { useToast } from '@/hooks/use-toast';
import { TopHeader } from '@/components/bible/TopHeader';
import { HamburgerMenu } from '@/components/bible/HamburgerMenu';
import { BibleTable } from '@/components/bible/BibleTable';
import { ExpandedVerseOverlay } from '@/components/bible/ExpandedVerseOverlay';
import { AuthModal } from '@/components/bible/AuthModal';
import { Button } from '@/components/ui/button';
import type { AppPreferences, Translation } from '@/types/bible';

export default function BiblePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    verses,
    translations,
    isLoading,
    searchQuery,
    setSearchQuery,
    expandedVerse,
    goBack,
    goForward,
    expandVerse,
    closeExpandedVerse,
    canGoBack,
    canGoForward,
  } = useBibleData();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isForumOpen, setIsForumOpen] = useState(false);
  
  const [selectedTranslations, setSelectedTranslations] = useState<Translation[]>(
    translations.map(t => ({ ...t, selected: t.id === 'KJV' }))
  );

  const [preferences, setPreferences] = useState<AppPreferences>({
    theme: 'light-mode',
    selectedTranslations: ['KJV'],
    showNotes: false,
    showProphecy: false,
    showContext: false,
    fontSize: 'medium',
    layoutLocked: false,
  });

  const createBookmarkMutation = useMutation({
    mutationFn: async (bookmarkData: {
      userId: string;
      name: string;
      indexValue: number;
      color: string;
    }) => {
      return apiRequest('POST', '/api/bookmarks', bookmarkData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/bookmarks`] });
      toast({ title: "Bookmark saved successfully" });
    },
  });

  const handleTranslationToggle = (translationId: string) => {
    setSelectedTranslations(prev => 
      prev.map(t => 
        t.id === translationId ? { ...t, selected: !t.selected } : t
      )
    );
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetLayout = () => {
    setSelectedTranslations(prev => 
      prev.map(t => ({ ...t, selected: t.id === 'KJV' }))
    );
    setPreferences(prev => ({
      ...prev,
      showNotes: false,
      showProphecy: false,
      showContext: false,
      layoutLocked: false,
    }));
    toast({ title: "Layout reset to default" });
  };

  const handleSaveBookmark = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save bookmarks",
        variant: "destructive",
      });
      return;
    }

    const bookmarkName = prompt("Enter bookmark name:");
    if (bookmarkName) {
      createBookmarkMutation.mutate({
        userId: user.id,
        name: bookmarkName,
        indexValue: 0, // Current verse index
        color: '#ef4444',
      });
    }
  };

  const handleStrongsClick = (word: any) => {
    // Open Strong's definition modal or navigate to Strong's search
    toast({
      title: "Strong's Definition",
      description: `${word.strongs}: ${word.definition}`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading Bible...</div>
          <div className="text-sm opacity-75 mt-2">Preparing your study session</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col transition-all duration-300"
      style={{ 
        backgroundColor: 'var(--bg-color)', 
        color: 'var(--text-color)' 
      }}
    >
      <TopHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onBack={goBack}
        onForward={goForward}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
      />

      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onShowAuth={() => setIsAuthOpen(true)}
        onShowForum={() => setIsForumOpen(true)}
        translations={selectedTranslations}
        onTranslationToggle={handleTranslationToggle}
        preferences={preferences}
        onPreferenceChange={handlePreferenceChange}
        onResetLayout={handleResetLayout}
        onSaveBookmark={handleSaveBookmark}
      />

      <BibleTable
        verses={verses}
        translations={translations}
        selectedTranslations={selectedTranslations}
        preferences={preferences}
        onExpandVerse={expandVerse}
      />

      <ExpandedVerseOverlay
        verse={expandedVerse}
        onClose={closeExpandedVerse}
        onStrongsClick={handleStrongsClick}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Footer */}
      <footer 
        className="border-t py-4 px-4"
        style={{ 
          backgroundColor: 'var(--header-bg)', 
          borderColor: 'var(--border-color)' 
        }}
      >
        <div className="flex flex-wrap justify-center items-center space-x-6 text-sm">
          <a href="#" className="hover:underline transition-colors duration-200">FAQ</a>
          <a href="#" className="hover:underline transition-colors duration-200">Forum</a>
          <a href="#" className="hover:underline transition-colors duration-200">Contact</a>
          <a href="#" className="hover:underline transition-colors duration-200">Donate</a>
          <span className="text-xs opacity-60">© 2024 Anointed.io</span>
        </div>
      </footer>
    </div>
  );
}
