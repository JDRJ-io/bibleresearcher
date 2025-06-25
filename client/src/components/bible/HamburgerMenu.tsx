import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Book, Tags, Settings, Layout, Bookmark, Plus, 
  Lock, RotateCcw, MessageSquare, LogOut, LogIn, UserPlus 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Translation, Bookmark as BookmarkType } from '@/types/bible';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onShowAuth: () => void;
  onShowForum: () => void;
  translations: Translation[];
  onTranslationToggle: (translationId: string) => void;
  preferences: {
    showNotes: boolean;
    showProphecy: boolean;
    showContext: boolean;
    layoutLocked: boolean;
  };
  onPreferenceChange: (key: string, value: boolean) => void;
  onResetLayout: () => void;
  onSaveBookmark: () => void;
}

export function HamburgerMenu({
  isOpen,
  onClose,
  onShowAuth,
  onShowForum,
  translations,
  onTranslationToggle,
  preferences,
  onPreferenceChange,
  onResetLayout,
  onSaveBookmark,
}: HamburgerMenuProps) {
  const { user, isLoggedIn, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookmarks = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/bookmarks`],
    enabled: !!user?.id,
  });

  const deleteBmMutation = useMutation({
    mutationFn: async (bookmarkId: number) => {
      await apiRequest('DELETE', `/api/bookmarks/${bookmarkId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/bookmarks`] });
      toast({ title: "Bookmark deleted successfully" });
    },
  });

  const labels = [
    { id: 'who', name: 'Who (Bold)' },
    { id: 'what', name: 'What (Outline)' },
    { id: 'where', name: 'Where {Brackets}' },
    { id: 'when', name: 'When (Underline)' },
    { id: 'why', name: 'Why (Handwritten)' },
    { id: 'action', name: 'Action (Italics)' },
    { id: 'seed', name: 'Seed (*prefix)' },
    { id: 'harvest', name: 'Harvest (=prefix)' },
    { id: 'prediction', name: 'Prediction (~prefix)' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div 
        className="fixed top-16 right-4 w-80 max-w-sm rounded-xl shadow-2xl border max-h-[90vh] overflow-auto"
        style={{ 
          backgroundColor: 'var(--header-bg)', 
          borderColor: 'var(--border-color)' 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          
          {/* Translation Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center">
              <Book className="w-5 h-5 mr-2" style={{ color: 'var(--accent-color)' }} />
              Translations
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {translations.map((translation) => (
                <div key={translation.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={translation.id}
                    checked={translation.selected}
                    onCheckedChange={() => onTranslationToggle(translation.id)}
                  />
                  <Label htmlFor={translation.id} className="text-sm cursor-pointer">
                    {translation.name} ({translation.abbreviation})
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Labels & Effects */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center">
              <Tags className="w-5 h-5 mr-2" style={{ color: 'var(--accent-color)' }} />
              Labels & Effects
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {labels.map((label) => (
                <div key={label.id} className="flex items-center space-x-2">
                  <Checkbox id={label.id} />
                  <Label htmlFor={label.id} className="cursor-pointer text-xs">
                    {label.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Extra Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center">
              <Settings className="w-5 h-5 mr-2" style={{ color: 'var(--accent-color)' }} />
              Extra Details
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Cross References</Label>
                <Checkbox defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Prophecy Columns</Label>
                <Checkbox
                  checked={preferences.showProphecy}
                  onCheckedChange={(checked) => onPreferenceChange('showProphecy', !!checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Personal Notes</Label>
                <Checkbox
                  checked={preferences.showNotes}
                  onCheckedChange={(checked) => onPreferenceChange('showNotes', !!checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Context Boundaries</Label>
                <Checkbox
                  checked={preferences.showContext}
                  onCheckedChange={(checked) => onPreferenceChange('showContext', !!checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Layout Controls */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center">
              <Layout className="w-5 h-5 mr-2" style={{ color: 'var(--accent-color)' }} />
              Layout
            </h3>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onPreferenceChange('layoutLocked', !preferences.layoutLocked)}
              >
                <Lock className="w-4 h-4 mr-1" />
                {preferences.layoutLocked ? 'Unlock' : 'Lock'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onResetLayout}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          <Separator />

          {/* Bookmarks */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center">
              <Bookmark className="w-5 h-5 mr-2" style={{ color: 'var(--accent-color)' }} />
              Bookmarks
            </h3>
            <ScrollArea className="max-h-32">
              <div className="space-y-1">
                {bookmarks.map((bookmark: BookmarkType) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200"
                    style={{ backgroundColor: 'var(--column-bg)' }}
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: bookmark.color }}
                      />
                      <span className="text-sm">{bookmark.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => deleteBmMutation.mutate(bookmark.id)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={onSaveBookmark}
              disabled={!isLoggedIn}
            >
              <Plus className="w-4 h-4 mr-1" />
              Save Current Position
            </Button>
          </div>

          <Separator />

          {/* Authentication */}
          <div className="space-y-3">
            {!isLoggedIn ? (
              <div className="flex space-x-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={onShowAuth}
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={onShowAuth}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Sign Up
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={onShowForum}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Community Forum
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={signOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
