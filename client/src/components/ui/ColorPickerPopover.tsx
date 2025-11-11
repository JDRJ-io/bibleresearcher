import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { HexColorPicker } from "react-colorful";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from '@/contexts/AuthContext';
import { useLandscapeSidecar } from '@/hooks/useLandscapeSidecar';
import { useFocusScroller } from '@/hooks/useFocusScroller';

type RecentColor = { color_hex: string; label?: string | null };

const DEFAULTS = [
  "#FFD166", "#F4978E", "#EF476F", "#9B5DE5",
  "#00BBF9", "#06D6A0", "#118AB2", "#F77F00"
];

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export interface ColorPickerPopoverProps {
  children?: React.ReactNode;               // the trigger (e.g., "Highlight" button)
  initialColor?: string;                    // default #hex
  initialOpacity?: number;                  // 0..1
  verseKey?: string;                        // optional; handy if you auto-apply
  translation?: string;                     // e.g. 'NKJV'
  onPick?: (hex: string, opacity: number) => Promise<void> | void; // called when user hits "Apply"
  autoSaveToPalette?: boolean;              // default true
}

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  children,
  initialColor = "#FF8C00",
  initialOpacity = 1,
  verseKey,
  translation = "NKJV",
  onPick,
  autoSaveToPalette = true,
}) => {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [hex, setHex] = React.useState(initialColor);
  const [opacity, setOpacity] = React.useState(clamp01(initialOpacity));
  const [recent, setRecent] = React.useState<RecentColor[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [hexInput, setHexInput] = React.useState(initialColor);
  const isLandscape = useLandscapeSidecar();
  
  // Auto-center focused inputs (callback ref)
  const scrollContainerRef = useFocusScroller();

  // Load last 12 saved colors for the user (from user_color_palette table or similar)
  React.useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setErr(null);
      if (!user?.id) { setLoading(false); return; }
      
      try {
        // Try to load recent colors - this may need to be adapted based on your actual schema
        // For now, we'll use a simple query and adapt later if the table structure is different
        const { data, error } = await supabase()
          .from("user_color_palette")
          .select("color_hex,label")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(12);
        
        if (active) {
          if (error && !error.message.includes('relation "user_color_palette" does not exist')) {
            setErr(error.message);
          } else if (data) {
            setRecent(data.map(r => ({ color_hex: r.color_hex, label: r.label as string | null })));
          }
          setLoading(false);
        }
      } catch (e: any) {
        if (active) {
          // Silently fail if table doesn't exist - we'll work without recent colors
          setLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, [open, user?.id]); // refresh each time the popover opens or user changes

  const pickDefault = (c: string) => { 
    setHex(c); 
    setHexInput(c);
  };
  const pickRecent = (c: string) => { 
    setHex(c);
    setHexInput(c);
  };

  // Validate and update hex from input
  const handleHexInputChange = (value: string) => {
    setHexInput(value);
    // Validate hex format: # followed by 3 or 6 hex digits
    const hexPattern = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
    if (hexPattern.test(value)) {
      // Expand 3-digit hex to 6-digit
      let fullHex = value;
      if (value.length === 4) {
        fullHex = '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3];
      }
      setHex(fullHex.toUpperCase());
    }
  };

  // Sync hex to input when picker changes
  React.useEffect(() => {
    setHexInput(hex);
  }, [hex]);

  const saveToPalette = async (c: string) => {
    setSaving(true);
    try {
      const { error } = await supabase().rpc("fn_save_color", { p_color: c, p_label: null });
      if (error) throw error;
      // optimistic update
      setRecent((prev) => {
        const next = [{ color_hex: c }, ...prev.filter(p => p.color_hex.toLowerCase() !== c.toLowerCase())];
        return next.slice(0, 12);
      });
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save color");
    } finally {
      setSaving(false);
    }
  };

  const apply = async () => {
    setErr(null);
    try {
      // Try to save to palette first, but don't block highlighting if it fails
      if (autoSaveToPalette) {
        try {
          await saveToPalette(hex);
        } catch (paletteError: any) {
          // Log palette save error but continue with highlighting
          console.warn('Failed to save color to palette:', paletteError);
          setErr(`Warning: ${paletteError?.message ?? "Couldn't save to palette"}`);
        }
      }
      
      // Always try to apply the highlight, even if palette save failed
      if (onPick) {
        await onPick(hex, opacity);
      }
      setOpen(false);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to apply color");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ?? (
          <Button variant="secondary" className="gap-2" data-testid="button-highlight-trigger">
            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: hex, opacity }} />
            Highlight
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        ref={scrollContainerRef}
        className={`w-full ${isLandscape ? "max-w-[580px]" : "max-w-[min(280px,calc(100vw-2rem))]"} ${isLandscape ? "p-3" : "p-2"} max-h-[90vh] overflow-y-auto`}
        style={{ paddingBottom: 'var(--kb)' }}
        data-testid="popover-color-picker"
      >
        {/* Dual-pane layout for landscape - Single-Scroll Parent */}
        <div className={isLandscape ? "grid grid-cols-2 gap-4" : "space-y-2"}>
          
          {/* Left Pane: Picker & Swatches (in landscape) */}
          <div className={isLandscape ? "space-y-3" : "space-y-1.5"}>
            <div className={isLandscape ? "space-y-2" : "space-y-1"}>
              <div className={`font-medium ${isLandscape ? "text-sm" : "text-xs"}`}>Pick a color</div>
              <div className={`w-full mx-auto ${isLandscape ? "max-w-[240px] h-[180px]" : "max-w-[180px] h-[120px]"}`}>
                <HexColorPicker color={hex} onChange={setHex} style={{ width: '100%', maxWidth: '100%', height: '100%' }} />
              </div>
            </div>

            <SwatchRow
              title="Defaults"
              colors={DEFAULTS}
              onPick={pickDefault}
              isLandscape={isLandscape}
            />

            <SwatchRow
              title="Recent"
              colors={recent.map(r => r.color_hex)}
              onPick={pickRecent}
              loading={loading}
              isLandscape={isLandscape}
            />
          </div>

          {/* Right Pane: Controls & Actions (in landscape) */}
          <div className={isLandscape ? "space-y-3" : "space-y-1.5"}>
            {/* Hex Input */}
            <div className="space-y-1">
              <div className="text-xs font-medium">Color Code</div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-muted-foreground">HEX</span>
                <Input
                  type="text"
                  value={hexInput}
                  onChange={(e) => handleHexInputChange(e.target.value.toUpperCase())}
                  placeholder="#FF8C00"
                  className={`font-mono px-2 flex-1 ${isLandscape ? "h-9 text-base" : "h-7 text-sm"}`}
                  data-testid="input-hex-value"
                />
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-1">
              <div className="text-xs font-medium">Opacity</div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[opacity * 100]}
                  max={100}
                  step={1}
                  onValueChange={(v) => setOpacity(clamp01((v?.[0] ?? 100) / 100))}
                  className="w-full h-2"
                  data-testid="slider-opacity"
                />
                <span className="w-8 text-right text-[10px] tabular-nums" data-testid="text-opacity-value">{Math.round(opacity * 100)}%</span>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-1">
              <div className="text-xs font-medium">Preview</div>
              <div className={`rounded border ${isLandscape ? "h-10" : "h-6"}`} style={{ backgroundColor: hex, opacity }} />
            </div>

            {err && <div className="text-[10px] text-red-600" data-testid="text-error">{err}</div>}

            {/* Actions */}
            <div className={`space-y-1.5 ${isLandscape ? "pt-2" : "pt-1"}`}>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => { saveToPalette(hex); }} 
                disabled={saving}
                data-testid="button-save-palette"
                className={`w-full ${isLandscape ? "text-xs" : "text-[10px] h-7"}`}
              >
                {saving ? "Saving…" : "Save to palette"}
              </Button>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)} data-testid="button-cancel" className={`flex-1 ${isLandscape ? "text-xs" : "text-[10px] h-7"}`}>Cancel</Button>
                <Button onClick={apply} size="sm" data-testid="button-apply" className={`flex-1 ${isLandscape ? "text-xs" : "text-[10px] h-7"}`}>Apply</Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

function SwatchRow({
  title,
  colors,
  onPick,
  loading,
  isLandscape
}: {
  title: string;
  colors: string[];
  onPick: (c: string) => void;
  loading?: boolean;
  isLandscape?: boolean;
}) {
  return (
    <div className={isLandscape ? "space-y-1" : "space-y-0.5"}>
      <div className={`font-medium ${isLandscape ? "text-xs" : "text-[10px]"}`}>{title}</div>
      {loading ? (
        <div className="text-[10px] text-muted-foreground">Loading…</div>
      ) : (
        <div className={`grid gap-1 ${isLandscape ? "grid-cols-10 gap-1.5" : "grid-cols-8"}`}>
          {colors.map((c) => (
            <button
              key={c}
              title={c}
              onClick={() => onPick(c)}
              className={`rounded border border-white/20 ring-0 hover:scale-[1.1] transition ${isLandscape ? "h-5 w-5" : "h-4 w-4"}`}
              style={{ backgroundColor: c }}
              data-testid={`button-swatch-${c.replace('#', '')}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}