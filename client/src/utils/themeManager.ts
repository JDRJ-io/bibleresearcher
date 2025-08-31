// client/src/utils/themeManager.ts
import { THEMES, ThemeName } from '@/themes/registry';

const LS_KEY = 'bible-theme-optimized';

function clearThemeProperties() {
  const root = document.documentElement;
  
  // Clear all theme-related CSS custom properties
  const themeProperties = [
    '--bg-primary', '--bg-secondary', '--header-bg', '--column-bg', '--highlight-bg',
    '--bg-grad-angle', '--bg-grad-0', '--bg-grad-1', '--glass-bg',
    '--text-primary', '--text-secondary', '--border-color', '--accent-color', 
    '--link-color', '--link-hover-color',
    '--background', '--foreground', '--primary', '--primary-foreground',
    '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
    '--accent', '--accent-foreground', '--destructive', '--destructive-foreground',
    '--border', '--input', '--ring', '--card', '--card-foreground',
    '--popover', '--popover-foreground'
  ];
  
  themeProperties.forEach(prop => root.style.removeProperty(prop));
}

export function applyTheme(name: ThemeName) {
  const t = THEMES[name];
  const root = document.documentElement;

  // remove previous theme classes
  Array.from(root.classList)
    .filter(c => c.startsWith('theme-') || ['light', 'ancient-dark'].includes(c))
    .forEach(c => root.classList.remove(c));
  
  // Clear all previous theme CSS properties
  clearThemeProperties();
  
  root.classList.add(name); // Add the theme name directly as class

  const set = (k: string, v: string) => root.style.setProperty(k, v);

  // canonical vars
  set('--bg-primary', t.bgPrimary);
  set('--bg-secondary', t.bgSecondary);
  set('--header-bg', t.headerBg);
  set('--column-bg', t.columnBg);
  set('--highlight-bg', t.highlightBg);

  // gradient vars
  set('--bg-grad-angle', t.gradAngle ?? '180deg');
  set('--bg-grad-0', t.grad0);
  set('--bg-grad-1', t.grad1);

  // glass
  set('--glass-bg', t.glassBg);

  // text and colors
  set('--text-primary', t.textPrimary);
  set('--text-secondary', t.textSecondary);
  set('--border-color', t.borderColor);
  set('--accent-color', t.accentColor);
  set('--link-color', t.linkColor);
  set('--link-hover-color', t.linkHoverColor);

  // Tailwind-facing aliases
  set('--background', t.bgPrimary);
  set('--foreground', t.textPrimary);
  set('--primary', t.accentColor);
  set('--primary-foreground', name === 'light' ? '#ffffff' : t.bgPrimary);
  set('--secondary', t.bgSecondary);
  set('--secondary-foreground', t.textPrimary);
  set('--muted', t.bgSecondary);
  set('--muted-foreground', t.textSecondary);
  set('--accent', t.highlightBg);
  set('--accent-foreground', t.textPrimary);
  set('--destructive', name === 'ancient-dark' ? 'hsl(0, 50%, 20%)' : 'hsl(0, 84.2%, 60.2%)');
  set('--destructive-foreground', t.textPrimary);
  set('--border', t.borderColor);
  set('--input', t.borderColor);
  set('--ring', t.accentColor);
  set('--card', t.columnBg);
  set('--card-foreground', t.textPrimary);
  set('--popover', t.headerBg);
  set('--popover-foreground', t.textPrimary);

  localStorage.setItem(LS_KEY, name);
}

export function initTheme(defaultName: ThemeName = 'light') {
  const saved = localStorage.getItem(LS_KEY) as ThemeName;
  const themeName = saved && saved in THEMES ? saved : defaultName;
  applyTheme(themeName);
  return themeName;
}

export function getCurrentTheme(): ThemeName {
  const saved = localStorage.getItem(LS_KEY) as ThemeName;
  return saved && saved in THEMES ? saved : 'light';
}

export function getAvailableThemes(): ThemeName[] {
  return Object.keys(THEMES) as ThemeName[];
}