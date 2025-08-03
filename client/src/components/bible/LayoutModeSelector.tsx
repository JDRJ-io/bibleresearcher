import { LayoutGrid, Columns3, PanelRightOpen } from 'lucide-react';
import { useLayoutStore, LayoutMode } from '@/store/useLayoutStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const modeConfig: Record<LayoutMode, { icon: any; label: string; description: string }> = {
  grid: {
    icon: LayoutGrid,
    label: 'Grid View',
    description: 'Traditional scrollable columns'
  },
  carousel: {
    icon: Columns3,
    label: 'Carousel View',
    description: 'Fixed columns with pagination'
  },
  'context-lens': {
    icon: PanelRightOpen,
    label: 'Context Lens',
    description: 'Minimal view with side panel'
  }
};

export function LayoutModeSelector() {
  const { mode, setMode } = useLayoutStore();
  const currentMode = modeConfig[mode];
  const Icon = currentMode.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline-block">{currentMode.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {Object.entries(modeConfig).map(([modeKey, config]) => {
          const ModeIcon = config.icon;
          return (
            <DropdownMenuItem
              key={modeKey}
              onClick={() => setMode(modeKey as LayoutMode)}
              className="flex flex-col items-start gap-1 py-3"
            >
              <div className="flex items-center gap-2">
                <ModeIcon className="h-4 w-4" />
                <span className="font-medium">{config.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {config.description}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}