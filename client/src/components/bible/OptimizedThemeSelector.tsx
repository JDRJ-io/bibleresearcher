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
import { Palette } from 'lucide-react';
import { ThemeName } from '@/themes/tokens';

export function OptimizedThemeSelector() {
  const { theme, setTheme, themes } = useTheme();

  const themeDisplayNames: Record<ThemeName, string> = {
    light: 'Light',
    dark: 'Dark',
    aurora: 'Aurora',
    rainbow: 'Rainbow',
    electric: 'Electric',
    eden: 'Eden'
  };

  const getThemeIcon = (themeName: ThemeName) => {
    switch (themeName) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'aurora': return '🌌';
      case 'rainbow': return '🌈';
      case 'electric': return '⚡';
      case 'eden': return '🌿';
      default: return '🎨';
    }
  };

  const availableThemes: ThemeName[] = ['light', 'dark'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 min-w-[120px] justify-start"
        >
          <Palette className="h-4 w-4" />
          <span className="flex-1 text-left">{themeDisplayNames[theme] || 'Theme'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Theme Selection
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {availableThemes.map((themeName) => (
          <DropdownMenuItem
            key={themeName}
            onClick={() => setTheme(themeName)}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <span>{getThemeIcon(themeName)}</span>
              <span>{themeDisplayNames[themeName]}</span>
              {theme === themeName && (
                <Badge variant="default" className="text-xs">Active</Badge>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}