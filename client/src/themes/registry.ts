// client/src/themes/registry.ts
export type ThemeName = 'light' | 'dark';

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
    bgPrimary: 'hsl(210, 14%, 95%)', // Cool White
    bgSecondary: 'hsl(210, 14%, 93%)',
    headerBg: 'hsl(210, 14%, 95%)',
    columnBg: 'hsl(210, 14%, 95%)',
    highlightBg: 'hsl(210, 19%, 27%)', // Slate Blue highlight
    grad0: 'hsl(210, 14%, 96%)',
    grad1: 'hsl(210, 14%, 94%)',
    glassBg: 'rgba(240,242,245,0.92)',
    textPrimary: 'hsl(26, 8%, 12%)', // Dark Rich Black for text
    textSecondary: 'hsl(210, 19%, 27%)', // Slate Blue for secondary
    borderColor: 'hsl(210, 14%, 85%)',
    accentColor: 'hsl(210, 19%, 27%)', // Slate Blue primary
    linkColor: 'hsl(50, 100%, 33%)', // Muted Gold for links
    linkHoverColor: 'hsl(50, 100%, 28%)', // Darker gold on hover
  },
  dark: {
    bgPrimary: 'hsl(210, 11%, 11%)', // Deep Charcoal
    bgSecondary: 'hsl(210, 11%, 9%)',
    headerBg: 'hsl(210, 11%, 11%)',
    columnBg: 'hsl(210, 11%, 13%)',
    highlightBg: 'hsl(210, 19%, 27%)', // Slate Blue highlight
    grad0: 'hsl(210, 11%, 10%)',
    grad1: 'hsl(210, 11%, 8%)',
    glassBg: 'rgba(26,28,32,0.95)',
    textPrimary: 'hsl(210, 14%, 95%)', // Cool White for text
    textSecondary: 'hsl(210, 14%, 75%)',
    borderColor: 'hsl(210, 11%, 20%)',
    accentColor: 'hsl(210, 19%, 27%)', // Slate Blue primary
    linkColor: 'hsl(50, 100%, 33%)', // Muted Gold for links
    linkHoverColor: 'hsl(50, 100%, 38%)', // Brighter gold on hover
  },
};