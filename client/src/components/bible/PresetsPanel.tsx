import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { collectSessionState } from '@/lib/sessionCollector';
import { restoreSessionState } from '@/lib/sessionRestore';
import { Trash2, Edit2, Check, X, Plus, Download } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Preset {
  id: string;
  name: string;
  preset_data: any;
  created_at: string;
  updated_at: string;
}

interface PresetsPanelProps {
  onNavigateToVerse?: (reference: string) => void;
}

export function PresetsPanel({ onNavigateToVerse }: PresetsPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPresetName, setNewPresetName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: presets, isLoading } = useQuery<Preset[]>({
    queryKey: ['/api/presets'],
    queryFn: async () => {
      const { data, error } = await supabase().rpc('list_presets');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const sessionState = collectSessionState();
      const { error } = await supabase().rpc('create_preset', {
        p_name: name,
        p_preset_data: sessionState,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/presets'] });
      setNewPresetName('');
      toast({
        title: "Preset Created",
        description: "Your preset has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create preset. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const preset = presets?.find(p => p.id === id);
      const { error } = await supabase().rpc('update_preset', {
        p_id: id,
        p_name: name,
        p_preset_data: preset?.preset_data || {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/presets'] });
      setEditingId(null);
      toast({
        title: "Preset Renamed",
        description: "Preset name updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to rename preset. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase().rpc('delete_preset', {
        p_id: id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/presets'] });
      setDeletingId(null);
      toast({
        title: "Preset Deleted",
        description: "Preset removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete preset. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePreset = () => {
    if (!newPresetName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your preset.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newPresetName.trim());
  };

  const handleApplyPreset = (preset: Preset) => {
    // Use provided navigation callback instead of custom event
    const navigateToVerse = onNavigateToVerse
      ? (verseKey: string) => {
          onNavigateToVerse(verseKey);
        }
      : undefined;
    
    // Restore state with navigation callback
    restoreSessionState(preset.preset_data, navigateToVerse);
    
    toast({
      title: "Preset Applied",
      description: `"${preset.name}" has been loaded successfully.`,
    });
  };

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingName.trim()) {
      toast({
        title: "Name Required",
        description: "Preset name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({ id, name: editingName.trim() });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  if (!user) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Please sign in to use custom presets.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Custom Presets</h4>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Save your current configuration:</p>
        <div className="flex gap-2">
          <Input
            placeholder="Preset name..."
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreatePreset()}
            className="h-8 text-sm"
            data-testid="input-preset-name"
          />
          <Button
            onClick={handleCreatePreset}
            size="sm"
            disabled={createMutation.isPending}
            data-testid="button-create-preset"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Your saved presets:</p>
        {isLoading ? (
          <div className="text-xs text-center py-4 text-muted-foreground">Loading...</div>
        ) : !presets || presets.length === 0 ? (
          <div className="text-xs text-center py-4 text-muted-foreground">No presets yet</div>
        ) : (
          <div className="space-y-1">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center gap-2 p-2 rounded bg-muted/30 hover:bg-muted/50"
                data-testid={`preset-item-${preset.id}`}
              >
                {editingId === preset.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(preset.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="h-7 text-sm flex-1"
                      autoFocus
                      data-testid={`input-edit-preset-${preset.id}`}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSaveEdit(preset.id)}
                      className="h-7 w-7 p-0"
                      data-testid={`button-save-edit-${preset.id}`}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-7 w-7 p-0"
                      data-testid={`button-cancel-edit-${preset.id}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 text-sm font-medium truncate" data-testid={`text-preset-name-${preset.id}`}>
                      {preset.name}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleApplyPreset(preset)}
                      className="h-7 px-2 text-xs"
                      data-testid={`button-apply-preset-${preset.id}`}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStartEdit(preset.id, preset.name)}
                      className="h-7 w-7 p-0"
                      data-testid={`button-edit-preset-${preset.id}`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingId(preset.id)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      data-testid={`button-delete-preset-${preset.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your preset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
