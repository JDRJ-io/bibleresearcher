// client/src/themes/registry.ts
export type ThemeName = 'light' | 'dark' | 'ancient-dark';

type ThemeVars = {
  // surfaces
  bgPrimary: string;
  bgSecondary: string;
  headerBg: string;
  columnBg: string;
  highlightBg: string;

  // gradient driving body::before
  gradAngle?: string;   // default "180deg"
  grad0: string;
  grad1: string;

  // glass morphism (rgba so gradient shows through)
  glassBg: string;

  // text colors
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  accentColor: string;
  linkColor: string;
  linkHoverColor: string;
};

export const THEMES: Record<ThemeName, ThemeVars> = {
  light: {
    bgPrimary: 'hsl(0, 0%, 100%)',
    bgSecondary: 'hsl(210, 40%, 98%)',
    headerBg: 'hsl(0, 0%, 100%)',
    columnBg: 'hsl(0, 0%, 100%)',
    highlightBg: 'hsl(214, 100%, 97%)',
    grad0: 'hsl(210, 40%, 99%)',
    grad1: 'hsl(200, 30%, 97%)',
    glassBg: 'rgba(255,255,255,0.92)',
    textPrimary: 'hsl(210, 24%, 16%)',
    textSecondary: 'hsl(215, 20%, 35%)',
    borderColor: 'hsl(214, 32%, 91%)',
    accentColor: 'hsl(221, 83%, 53%)',
    linkColor: 'hsl(221, 83%, 53%)',
    linkHoverColor: 'hsl(221, 83%, 43%)',
  },
  dark: {
    bgPrimary: 'hsl(222, 20%, 11%)',
    bgSecondary: 'hsl(222, 15%, 8%)',
    headerBg: 'hsl(222, 20%, 11%)',
    columnBg: 'hsl(222, 20%, 11%)',
    highlightBg: 'hsl(215, 27%, 32%)',
    grad0: 'hsl(222, 15%, 9%)',
    grad1: 'hsl(217, 20%, 7%)',
    glassBg: 'rgba(30, 39, 59, 0.92)',
    textPrimary: 'hsl(213, 31%, 91%)',
    textSecondary: 'hsl(215, 20%, 65%)',
    borderColor: 'hsl(217, 33%, 17%)',
    accentColor: 'hsl(217, 91%, 65%)',
    linkColor: 'hsl(217, 91%, 65%)',
    linkHoverColor: 'hsl(217, 91%, 75%)',
  },
  'ancient-dark': {
    bgPrimary: 'hsl(220, 25%, 8%)',
    bgSecondary: 'hsl(220, 20%, 6%)',
    headerBg: 'hsl(220, 25%, 8%)',
    columnBg: 'hsl(220, 20%, 10%)',
    highlightBg: 'hsl(10, 40%, 25%)',
    grad0: 'hsl(220, 20%, 7%)',
    grad1: 'hsl(220, 25%, 5%)',
    glassBg: 'rgba(26, 35, 62, 0.95)',
    textPrimary: 'hsl(30, 5%, 92%)',
    textSecondary: 'hsl(30, 5%, 70%)',
    borderColor: 'hsl(220, 10%, 18%)',
    accentColor: 'hsl(40, 70%, 45%)',
    linkColor: 'hsl(40, 70%, 45%)',
    linkHoverColor: 'hsl(40, 70%, 55%)',
  },
};