import { THEMES, ThemeName } from '@/themes/tokens';

const LS_KEY = 'bible-theme-optimized';
const FX_THEMES = new Set<ThemeName>(['aurora', 'rainbow', 'electric', 'eden']);

const VARS = {
  surface: '--bg-primary',
  surfaceAlt: '--column-bg',
  surfaceHeader: '--header-bg',
  surfaceHighlight: '--highlight-bg',
  text: '--text-primary',
  textMuted: '--text-secondary',
  border: '--border-color',
  ring: '--ring',
  accent: '--accent-color',
  accentFg: '--accent-foreground',
  link: '--link-color',
  linkHover: '--link-hover-color',
  glass: '--glass-bg',
  grad0: '--bg-grad-0',
  grad1: '--bg-grad-1',
  gradAngle: '--bg-grad-angle',

  // tailwind bridges
  background: '--background',
  foreground: '--foreground',
  primary: '--primary',
  primaryFg: '--primary-foreground',
  secondary: '--secondary',
  secondaryFg: '--secondary-foreground',
  muted: '--muted',
  mutedFg: '--muted-foreground',
  card: '--card',
  cardFg: '--card-foreground',
  popover: '--popover',
  popoverFg: '--popover-foreground',
  input: '--input',
  destructive: '--destructive',
  destructiveFg: '--destructive-foreground',

  // app-specific helpers (derived from accent)
  markBg: '--mark-bg',
  markFg: '--mark-fg',
  flashBg: '--flash-bg',
  highlightOverlay: '--highlight-overlay',
  highlightBorder: '--highlight-border',
  chart1: '--chart-1',
  chart2: '--chart-2',
  chart3: '--chart-3',
  chart4: '--chart-4',
  chart5: '--chart-5',
};

function clearThemeProperties() {
  const root = document.documentElement;
  Object.values(VARS).forEach(prop => root.style.removeProperty(prop));
}

function restartFxAnimation() {
  const fx = document.getElementById('theme-fx');
  if (!fx) return;
  
  // Respect user's motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  fx.style.animation = 'none';
  void fx.offsetHeight;
  
  if (document.body.classList.contains('rainbow-mode')) {
    fx.style.animation = 'rainbow-bg 20s ease infinite';
  } else if (document.body.classList.contains('electric-mode')) {
    fx.style.animation = 'electric-bg 15s ease infinite';
  } else {
    fx.style.animation = '';
  }
  
  // Pause animation if user prefers reduced motion
  if (prefersReducedMotion) {
    fx.style.animationPlayState = 'paused';
  }
}

export function applyTheme(name: ThemeName) {
  const t = THEMES[name];
  const root = document.documentElement;

  // Remove all theme classes from html and body
  root.classList.remove('light', 'dark', 'aurora', 'rainbow', 'electric', 'eden');
  document.body.classList.remove('light-mode', 'dark-mode', 'aurora-mode', 'rainbow-mode', 'electric-mode', 'eden-mode');
  
  // Add theme classes to both html and body
  root.classList.add(name);
  document.body.classList.add(`${name}-mode`);
  
  clearThemeProperties();
  
  // Handle FX themes: neutralize inline backgrounds and the --interactive-background var
  const isFx = FX_THEMES.has(name);
  
  if (isFx) {
    // Neutralize the --interactive-background variable (used by inline styles)
    root.style.setProperty('--interactive-background', 'transparent', 'important');
    document.body.style.setProperty('--interactive-background', 'transparent', 'important');
    
    // Force transparent backgrounds on html and body
    root.style.setProperty('background', 'transparent', 'important');
    root.style.setProperty('background-color', 'transparent', 'important');
    document.body.style.setProperty('background', 'transparent', 'important');
    document.body.style.setProperty('background-color', 'transparent', 'important');
  } else {
    // Non-FX themes: remove forced transparency
    root.style.removeProperty('--interactive-background');
    document.body.style.removeProperty('--interactive-background');
    root.style.removeProperty('background');
    root.style.removeProperty('background-color');
    document.body.style.removeProperty('background');
    document.body.style.removeProperty('background-color');
  }
  
  restartFxAnimation();

  const set = (k: string, v: string) => root.style.setProperty(k, v);

  // base tokens
  set(VARS.surface, t.surface);
  set(VARS.surfaceAlt, t.surfaceAlt);
  set(VARS.surfaceHeader, t.surfaceHeader);
  set(VARS.surfaceHighlight, t.surfaceHighlight);
  set(VARS.text, t.text);
  set(VARS.textMuted, t.textMuted);
  set(VARS.border, t.border);
  set(VARS.ring, t.ring);
  set(VARS.accent, t.accent);
  set(VARS.accentFg, t.accentFg);
  set(VARS.link, t.link);
  set(VARS.linkHover, t.linkHover);
  set(VARS.glass, t.glass);
  set(VARS.grad0, t.grad0);
  set(VARS.grad1, t.grad1);
  set(VARS.gradAngle, t.gradAngle);

  // tailwind bridges
  set(VARS.background, t.surface);
  set(VARS.foreground, t.text);
  set(VARS.primary, t.accent);
  set(VARS.primaryFg, t.accentFg);
  set(VARS.secondary, t.surfaceAlt);
  set(VARS.secondaryFg, t.text);
  set(VARS.muted, t.surfaceAlt);
  set(VARS.mutedFg, t.textMuted);
  set(VARS.card, t.surfaceAlt);
  set(VARS.cardFg, t.text);
  set(VARS.popover, t.surfaceHeader);
  set(VARS.popoverFg, t.text);
  set(VARS.input, t.border);
  set(VARS.destructive, name === 'dark' ? 'hsl(221 83% 53%)' : 'hsl(0 84.2% 60.2%)');
  set(VARS.destructiveFg, t.text);

  // unified highlights & charts (derive from accent using color-mix)
  set(VARS.markBg, 'color-mix(in oklch, var(--accent-color) 18%, transparent)');
  set(VARS.markFg, 'var(--text-primary)');
  set(VARS.flashBg, 'color-mix(in oklch, var(--accent-color) 12%, transparent)');
  set(VARS.highlightOverlay, 'color-mix(in oklch, var(--accent-color) 10%, transparent)');
  set(VARS.highlightBorder, 'color-mix(in oklch, var(--accent-color) 50%, transparent)');
  set(VARS.chart1, 'var(--accent-color)');
  set(VARS.chart2, 'color-mix(in oklch, var(--accent-color) 80%, white)');
  set(VARS.chart3, 'color-mix(in oklch, var(--accent-color) 65%, black)');
  set(VARS.chart4, 'color-mix(in oklch, var(--accent-color) 50%, white)');
  set(VARS.chart5, 'color-mix(in oklch, var(--accent-color) 40%, black)');

  // Legacy variable bridges for backward compatibility with existing CSS
  set('--bg-color', t.surface);
  set('--text-color', t.text);

  localStorage.setItem(LS_KEY, name);
}

export function initTheme(defaultName: ThemeName = 'light') {
  const saved = localStorage.getItem(LS_KEY) as ThemeName;
  
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const systemPreferred = prefersDark ? 'dark' : 'light';
  
  // Coerce FX themes to basic themes
  const availableThemes = ['light', 'dark'] as ThemeName[];
  const themeName = (saved && availableThemes.includes(saved)) ? saved : systemPreferred;
  
  applyTheme(themeName);
  return themeName;
}

export function getCurrentTheme(): ThemeName {
  const saved = localStorage.getItem(LS_KEY) as ThemeName;
  
  const availableThemes = ['light', 'dark'] as ThemeName[];
  if (saved && availableThemes.includes(saved)) {
    return saved;
  }
  
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function getAvailableThemes(): ThemeName[] {
  return ['light', 'dark'];
}
