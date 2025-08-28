// client/src/themes/registry.ts
export type ThemeName = 'light' | 'ancient-dark' | 'monastery-candlelight';

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
  'monastery-candlelight': {
    bgPrimary: 'rgba(48, 34, 17, 0.3)', // Transparent wooden brown
    bgSecondary: 'rgba(48, 34, 17, 0.2)', // Even more transparent
    headerBg: 'rgba(48, 34, 17, 0.4)', // Slightly less transparent header
    columnBg: 'rgba(48, 34, 17, 0.2)', // Very transparent columns
    highlightBg: 'rgba(255, 140, 0, 0.2)', // Transparent orange highlight
    grad0: 'rgba(30, 20, 10, 0.8)', // Dark gradient start
    grad1: 'rgba(20, 15, 8, 0.9)', // Darker gradient end
    glassBg: 'rgba(62, 45, 26, 0.15)', // Very transparent glass
    textPrimary: 'hsl(40, 10%, 95%)', // Warm parchment off-white
    textSecondary: 'hsl(40, 5%, 80%)', // Brighter secondary text
    borderColor: 'rgba(255, 165, 0, 0.3)', // Transparent amber borders
    accentColor: 'hsl(25, 60%, 50%)', // Brighter amber accent
    linkColor: 'hsl(25, 70%, 60%)', // Brighter amber links
    linkHoverColor: 'hsl(25, 80%, 70%)', // Even brighter on hover
  },
};