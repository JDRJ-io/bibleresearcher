// client/src/themes/registry.ts
export type ThemeName = 'light' | 'dark' | 'aurora' | 'sepia' | 'forest' | 'cyberpunk' | 'electric';

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
    grad0: 'hsl(220, 20%, 10%)',
    grad1: 'hsl(210, 25%, 8%)',
    glassBg: 'rgba(0,0,0,0.15)',
    textPrimary: 'hsl(213, 31%, 91%)',
    textSecondary: 'hsl(215, 20%, 65%)',
    borderColor: 'hsl(217, 33%, 17%)',
    accentColor: 'hsl(217, 91%, 65%)',
    linkColor: 'hsl(217, 91%, 70%)',
    linkHoverColor: 'hsl(217, 91%, 80%)',
  },
  aurora: {
    bgPrimary: 'hsl(210, 30%, 12%)',
    bgSecondary: 'hsl(200, 25%, 10%)',
    headerBg: 'hsl(210, 30%, 12%)',
    columnBg: 'hsl(210, 30%, 12%)',
    highlightBg: 'hsla(170, 80%, 60%, 0.18)',
    gradAngle: '200deg',
    grad0: 'hsl(190, 90%, 18%)',
    grad1: 'hsl(280, 70%, 16%)',
    glassBg: 'rgba(10, 20, 30, 0.28)',
    textPrimary: 'hsl(190, 70%, 85%)',
    textSecondary: 'hsl(190, 40%, 65%)',
    borderColor: 'hsl(190, 50%, 25%)',
    accentColor: 'hsl(170, 80%, 60%)',
    linkColor: 'hsl(170, 100%, 70%)',
    linkHoverColor: 'hsl(170, 100%, 80%)',
  },
  sepia: {
    bgPrimary: 'hsl(35, 35%, 92%)',
    bgSecondary: 'hsl(35, 30%, 88%)',
    headerBg: 'hsl(35, 35%, 92%)',
    columnBg: 'hsl(35, 35%, 92%)',
    highlightBg: 'hsla(50, 90%, 60%, 0.25)',
    grad0: 'hsl(35, 40%, 96%)',
    grad1: 'hsl(30, 30%, 90%)',
    glassBg: 'rgba(255, 247, 230, 0.85)',
    textPrimary: 'hsl(30, 40%, 20%)',
    textSecondary: 'hsl(30, 30%, 35%)',
    borderColor: 'hsl(35, 30%, 78%)',
    accentColor: 'hsl(40, 70%, 45%)',
    linkColor: 'hsl(210, 85%, 50%)',
    linkHoverColor: 'hsl(210, 85%, 40%)',
  },
  forest: {
    bgPrimary: 'hsl(145, 20%, 12%)',
    bgSecondary: 'hsl(145, 18%, 10%)',
    headerBg: 'hsl(145, 20%, 12%)',
    columnBg: 'hsl(145, 20%, 12%)',
    highlightBg: 'hsla(120, 50%, 50%, 0.22)',
    grad0: 'hsl(150, 25%, 14%)',
    grad1: 'hsl(130, 20%, 10%)',
    glassBg: 'rgba(8, 24, 14, 0.24)',
    textPrimary: 'hsl(120, 40%, 85%)',
    textSecondary: 'hsl(120, 25%, 65%)',
    borderColor: 'hsl(130, 30%, 25%)',
    accentColor: 'hsl(120, 50%, 50%)',
    linkColor: 'hsl(120, 60%, 60%)',
    linkHoverColor: 'hsl(120, 60%, 70%)',
  },
  cyberpunk: {
    bgPrimary: 'hsl(280, 28%, 10%)',
    bgSecondary: 'hsl(280, 24%, 8%)',
    headerBg: 'hsl(280, 28%, 10%)',
    columnBg: 'hsl(280, 28%, 10%)',
    highlightBg: 'hsla(310, 95%, 60%, 0.22)',
    gradAngle: '180deg',
    grad0: 'hsl(300, 80%, 18%)',
    grad1: 'hsl(200, 80%, 18%)',
    glassBg: 'rgba(20, 10, 30, 0.28)',
    textPrimary: 'hsl(310, 70%, 85%)',
    textSecondary: 'hsl(310, 40%, 65%)',
    borderColor: 'hsl(300, 50%, 25%)',
    accentColor: 'hsl(310, 95%, 60%)',
    linkColor: 'hsl(310, 100%, 70%)',
    linkHoverColor: 'hsl(310, 100%, 80%)',
  },
  electric: {
    bgPrimary: 'hsl(240, 85%, 28%)',
    bgSecondary: 'hsl(242, 80%, 25%)',
    headerBg: 'hsl(240, 85%, 28%)',
    columnBg: 'hsl(240, 85%, 28%)',
    highlightBg: 'hsla(60, 100%, 50%, 0.25)',
    gradAngle: '135deg',
    grad0: 'hsl(238, 90%, 32%)',
    grad1: 'hsl(244, 85%, 25%)',
    glassBg: 'rgba(45, 45, 200, 0.25)',
    textPrimary: 'hsl(60, 100%, 95%)',
    textSecondary: 'hsl(55, 90%, 80%)',
    borderColor: 'hsl(240, 70%, 45%)',
    accentColor: 'hsl(60, 100%, 50%)',
    linkColor: 'hsl(55, 100%, 60%)',
    linkHoverColor: 'hsl(50, 100%, 70%)',
  },
};