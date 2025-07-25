import { useTheme } from '@/components/bible/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette, Zap, Crown } from 'lucide-react';

export function OptimizedThemeSelector() {
  const { theme, setTheme, themes, enablePerformanceMode } = useTheme();

  const currentTheme = themes.find(t => t.id === theme);

  const getThemeIcon = (priority: string) => {
    switch (priority) {
      case 'essential': return '⚡';
      case 'enhanced': return '🎨';
      case 'premium': return '👑';
      default: return '🎨';
    }
  };

  const getMemoryBadge = (footprint: string) => {
    switch (footprint) {
      case 'low': return <Badge variant="default" className="text-xs">Light</Badge>;
      case 'medium': return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case 'high': return <Badge variant="outline" className="text-xs">Rich</Badge>;
      default: return null;
    }
  };

  const essentialThemes = themes.filter(t => t.priority === 'essential');
  const enhancedThemes = themes.filter(t => t.priority === 'enhanced');
  const premiumThemes = themes.filter(t => t.priority === 'premium');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 min-w-[120px] justify-start"
        >
          <Palette className="h-4 w-4" />
          <span className="flex-1 text-left">{currentTheme?.name || 'Theme'}</span>
          {enablePerformanceMode && <Zap className="h-3 w-3 text-yellow-500" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Theme Selection
          {enablePerformanceMode && (
            <Badge variant="secondary" className="text-xs">
              Performance Mode
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Essential Themes (Fast Loading)
        </DropdownMenuLabel>
        {essentialThemes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.id}
            onClick={() => setTheme(themeOption.id as any)}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <span>{getThemeIcon(themeOption.priority)}</span>
              <span>{themeOption.name}</span>
              {theme === themeOption.id && (
                <Badge variant="default" className="text-xs">Active</Badge>
              )}
            </div>
            {getMemoryBadge(themeOption.memoryFootprint)}
          </DropdownMenuItem>
        ))}

        {enhancedThemes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Enhanced Themes
            </DropdownMenuLabel>
            {enhancedThemes.map((themeOption) => (
              <DropdownMenuItem
                key={themeOption.id}
                onClick={() => setTheme(themeOption.id as any)}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span>{getThemeIcon(themeOption.priority)}</span>
                  <span>{themeOption.name}</span>
                  {theme === themeOption.id && (
                    <Badge variant="default" className="text-xs">Active</Badge>
                  )}
                </div>
                {getMemoryBadge(themeOption.memoryFootprint)}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {premiumThemes.length > 0 && !enablePerformanceMode && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-center gap-1">
              <Crown className="h-3 w-3" />
              Premium Themes
            </DropdownMenuLabel>
            {premiumThemes.map((themeOption) => (
              <DropdownMenuItem
                key={themeOption.id}
                onClick={() => setTheme(themeOption.id as any)}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span>{getThemeIcon(themeOption.priority)}</span>
                  <span>{themeOption.name}</span>
                  {theme === themeOption.id && (
                    <Badge variant="default" className="text-xs">Active</Badge>
                  )}
                </div>
                {getMemoryBadge(themeOption.memoryFootprint)}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {premiumThemes.length > 0 && enablePerformanceMode && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-amber-600 font-normal">
              Premium themes disabled in Performance Mode
            </DropdownMenuLabel>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}