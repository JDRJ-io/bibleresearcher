import { useState } from 'react';
import { Settings, X, Book, Tag, Eye, Lock, RotateCcw, Bookmark, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Translation } from '@/types/bible';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  translations: Translation[];
  selectedTranslations: Translation[];
  onTranslationToggle: (translation: Translation) => void;
  preferences: {
    showNotes: boolean;
    showProphecy: boolean;
    showContext: boolean;
    layoutLocked: boolean;
    crossRefSet: 'cf1' | 'cf2';
  };
  onPreferenceChange: (key: string, value: any) => void;
  onReset: () => void;
  onAuthClick: () => void;
  isAuthenticated: boolean;
  userBookmarks: any[];
  onBookmarkSelect: (bookmark: any) => void;
}

export function HamburgerMenu({
  isOpen,
  onClose,
  translations,
  selectedTranslations,
  onTranslationToggle,
  preferences,
  onPreferenceChange,
  onReset,
  onAuthClick,
  isAuthenticated,
  userBookmarks,
  onBookmarkSelect
}: HamburgerMenuProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div 
        className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Translations Section */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => toggleSection('translations')}
            >
              <span className="flex items-center gap-2">
                <Book className="w-4 h-4" />
                Translations ({selectedTranslations.length})
              </span>
            </Button>
            
            {expandedSection === 'translations' && (
              <div className="pl-6 space-y-2 max-h-48 overflow-y-auto">
                {translations.map((translation) => (
                  <div key={translation.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={translation.id}
                      checked={selectedTranslations.some(t => t.id === translation.id)}
                      onCheckedChange={() => onTranslationToggle(translation)}
                    />
                    <Label htmlFor={translation.id} className="text-sm">
                      {translation.name} ({translation.abbreviation})
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Labels Section */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => toggleSection('labels')}
            >
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Labels
              </span>
            </Button>
            
            {expandedSection === 'labels' && (
              <div className="pl-6 space-y-2">
                {['who', 'what', 'where', 'when', 'why', 'action', 'seed', 'harvest', 'prediction'].map((label) => (
                  <div key={label} className="flex items-center space-x-2">
                    <Checkbox
                      id={label}
                      checked={false} // TODO: Connect to state
                    />
                    <Label htmlFor={label} className="text-sm capitalize">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extra Details Section */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => toggleSection('details')}
            >
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Extra Details
              </span>
            </Button>
            
            {expandedSection === 'details' && (
              <div className="pl-6 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showNotes"
                    checked={preferences.showNotes}
                    onCheckedChange={(checked) => onPreferenceChange('showNotes', checked)}
                  />
                  <Label htmlFor="showNotes" className="text-sm">Notes Column</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showProphecy"
                    checked={preferences.showProphecy}
                    onCheckedChange={(checked) => onPreferenceChange('showProphecy', checked)}
                  />
                  <Label htmlFor="showProphecy" className="text-sm">Prophecy Columns</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showContext"
                    checked={preferences.showContext}
                    onCheckedChange={(checked) => onPreferenceChange('showContext', checked)}
                  />
                  <Label htmlFor="showContext" className="text-sm">Context Boundaries</Label>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Cross Reference Set</Label>
                  <Select 
                    value={preferences.crossRefSet}
                    onValueChange={(value) => onPreferenceChange('crossRefSet', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cf1">Cross References 1</SelectItem>
                      <SelectItem value="cf2">Cross References 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Layout Controls */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="layoutLocked"
                checked={preferences.layoutLocked}
                onCheckedChange={(checked) => onPreferenceChange('layoutLocked', checked)}
              />
              <Label htmlFor="layoutLocked" className="text-sm flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Lock Layout
              </Label>
            </div>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={onReset}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </div>

          {/* Bookmarks Section */}
          {isAuthenticated && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-between"
                onClick={() => toggleSection('bookmarks')}
              >
                <span className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  Bookmarks ({userBookmarks.length})
                </span>
              </Button>
              
              {expandedSection === 'bookmarks' && (
                <div className="pl-6 space-y-2 max-h-32 overflow-y-auto">
                  {userBookmarks.map((bookmark) => (
                    <Button
                      key={bookmark.id}
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={() => onBookmarkSelect(bookmark)}
                    >
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: bookmark.color }}
                      />
                      {bookmark.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Authentication */}
          <div className="pt-4 border-t">
            <Button
              variant={isAuthenticated ? "outline" : "default"}
              className="w-full justify-start"
              onClick={onAuthClick}
            >
              <User className="w-4 h-4 mr-2" />
              {isAuthenticated ? 'Profile' : 'Sign In / Sign Up'}
            </Button>
          </div>

          {/* Forum Access */}
          {isAuthenticated && (
            <Button
              variant="outline"
              className="w-full justify-start"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Community Forum
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}