// client/src/utils/themeManager.ts
import { THEMES, ThemeName } from '@/themes/registry';

const LS_KEY = 'bible-theme-optimized';

export function applyTheme(name: ThemeName) {
  const t = THEMES[name];
  const root = document.documentElement;

  // remove previous theme-* class
  Array.from(root.classList)
    .filter(c => c.startsWith('theme-'))
    .forEach(c => root.classList.remove(c));
  root.classList.add(`theme-${name}`);

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
  set('--primary', t.bgPrimary);
  set('--secondary', t.bgSecondary);
  set('--card', t.columnBg);
  set('--popover', t.headerBg);

  localStorage.setItem(LS_KEY, name);
}

export function initTheme(defaultName: ThemeName = 'light') {
  // Always apply light theme
  applyTheme('light');
  return 'light';
}

export function getCurrentTheme(): ThemeName {
  // Always return light theme
  return 'light';
}

export function getAvailableThemes(): ThemeName[] {
  // Only light theme is available
  return ['light'];
}