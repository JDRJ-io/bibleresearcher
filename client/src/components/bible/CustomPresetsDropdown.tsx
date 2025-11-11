import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { ChevronDown, Plus, Trash2, LogIn } from 'lucide-react';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from '@/store/translationSlice';
import { useAuth } from '@/contexts/AuthContext';

interface CustomPreset {
  id: string;
  name: string;
  showNotes: boolean;
  showCrossRefs: boolean;
  showProphecies: boolean;
  showHybrid?: boolean;
  alternates: string[];
  createdAt: number;
}

export function CustomPresetsDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<CustomPreset | null>(null);
  const [presetName, setPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState<CustomPreset[]>(() => {
    const stored = localStorage.getItem('bibleCustomPresets');
    return stored ? JSON.parse(stored) : [];
  });

  const { 
    showNotes, 
    showCrossRefs, 
    showProphecies,
    showHybrid,
    toggleNotes,
    toggleCrossRefs,
    toggleProphecies,
    toggleHybrid
  } = useBibleStore();
  
  const { alternates, toggleAlternate } = useTranslationMaps();

  // Clear presets when user logs out to prevent guests from accessing them
  useEffect(() => {
    if (!user) {
      setSavedPresets([]);
    } else {
      // Reload presets from localStorage when user signs in
      const stored = localStorage.getItem('bibleCustomPresets');
      setSavedPresets(stored ? JSON.parse(stored) : []);
    }
  }, [user]);

  const saveCurrentPreset = () => {
    if (!presetName.trim()) return;

    const newPreset: CustomPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      showNotes,
      showCrossRefs,
      showProphecies,
      showHybrid,
      alternates: [...alternates],
      createdAt: Date.now(),
    };

    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem('bibleCustomPresets', JSON.stringify(updated));
    
    setPresetName('');
    setIsSaveDialogOpen(false);
  };

  const loadPreset = (preset: CustomPreset) => {
    // Apply the preset state
    if (preset.showNotes !== showNotes) toggleNotes();
    if (preset.showCrossRefs !== showCrossRefs) toggleCrossRefs();
    if (preset.showProphecies !== showProphecies) toggleProphecies();
    
    // Handle showHybrid with backward compatibility (default to false for old presets)
    const presetShowHybrid = preset.showHybrid ?? false;
    if (presetShowHybrid !== showHybrid) toggleHybrid();

    // Clear current alternates
    const currentAlternates = [...alternates];
    currentAlternates.forEach(altId => toggleAlternate(altId));

    // Apply preset alternates
    preset.alternates.forEach(altId => toggleAlternate(altId));

    setIsOpen(false);
  };

  const deletePreset = (preset: CustomPreset, event: React.MouseEvent) => {
    event.stopPropagation();
    setPresetToDelete(preset);
    setIsDeleteDialogOpen(true);
    setIsOpen(false);
  };

  const confirmDelete = () => {
    if (!presetToDelete) return;
    const updated = savedPresets.filter(p => p.id !== presetToDelete.id);
    setSavedPresets(updated);
    localStorage.setItem('bibleCustomPresets', JSON.stringify(updated));
    setIsDeleteDialogOpen(false);
    setPresetToDelete(null);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 sm:w-auto px-0 sm:px-3 text-sm rounded-full bg-transparent hover:bg-gray-200/50 text-gray-600 hover:text-gray-900 dark:hover:bg-gray-700/30 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            data-testid="button-preset-custom"
            aria-label="Custom presets"
          >
            <span className="hidden sm:inline">Custom</span>
            <span className="sm:hidden">•••</span>
            <ChevronDown className="hidden sm:inline w-3 h-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Custom Presets</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {user ? (
            <DropdownMenuItem
              onClick={() => setIsSaveDialogOpen(true)}
              className="cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Save Current Layout</span>
            </DropdownMenuItem>
          ) : (
            <div className="px-2 py-4 text-center" data-testid="banner-signin-presets">
              <div className="flex items-center justify-center mb-2">
                <LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1" data-testid="text-signin-title">
                Sign in to create custom presets
              </p>
              <p className="text-xs text-muted-foreground" data-testid="text-signin-description">
                Save your favorite column layouts
              </p>
            </div>
          )}

          {user && savedPresets.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Saved Layouts
              </DropdownMenuLabel>
              {savedPresets.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => loadPreset(preset)}
                  className="cursor-pointer justify-between group"
                >
                  <span className="truncate">{preset.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => deletePreset(preset, e)}
                  >
                    <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </>
          )}

          {user && savedPresets.length === 0 && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No saved presets yet
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Custom Preset</DialogTitle>
            <DialogDescription>
              Give your current column layout a name so you can quickly switch to it later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveCurrentPreset();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPresetName('');
                setIsSaveDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveCurrentPreset}
              disabled={!presetName.trim()}
            >
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{presetToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setPresetToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
