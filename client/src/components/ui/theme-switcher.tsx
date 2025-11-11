import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/components/bible/ThemeProvider';
import { Palette } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();

  const themeNames = {
    light: 'Light',
    dark: 'Dark'
  } as const;

  return (
    <div className="flex items-center gap-2">
      <Palette className="w-4 h-4 text-muted-foreground" />
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent>
          {themes.map((themeName) => (
            <SelectItem key={themeName} value={themeName}>
              {themeNames[themeName] || themeName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}