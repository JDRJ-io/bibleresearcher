// client/src/themes/registry.ts
export type ThemeName = 'light' | 'ancient-dark' | 'monastery-candlelight' | 'mystical-meadow' | 'electric-voodoo' | 'spectral-covenant' | 'celestial-veil';

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
  'mystical-meadow': {
    bgPrimary: 'hsl(120, 30%, 95%)', // Light grassy green, like sunlit meadow
    bgSecondary: 'hsl(120, 25%, 98%)', // Even lighter grass tone
    headerBg: 'hsl(120, 30%, 96%)', // Soft meadow header
    columnBg: 'hsl(120, 25%, 98%)', // Pale elevation for columns
    highlightBg: 'hsl(30, 70%, 85%)', // Warm orange glow for highlights
    grad0: 'hsl(120, 40%, 96%)', // Light meadow gradient start
    grad1: 'hsl(100, 30%, 94%)', // Soft blue-green gradient end
    glassBg: 'rgba(240, 248, 240, 0.85)', // Light green glass effect
    textPrimary: 'hsl(120, 50%, 20%)', // Deep green text for contrast
    textSecondary: 'hsl(120, 30%, 40%)', // Medium green secondary text
    borderColor: 'hsl(120, 20%, 80%)', // Subtle green borders
    accentColor: 'hsl(45, 80%, 60%)', // Golden orb yellow for buttons
    linkColor: 'hsl(45, 70%, 50%)', // Golden links
    linkHoverColor: 'hsl(45, 80%, 40%)', // Darker gold on hover
  },
  'electric-voodoo': {
    bgPrimary: 'hsl(208, 73%, 33%)', // Vibrant Voodoo Blue
    bgSecondary: 'hsl(208, 60%, 28%)', // Deeper blue for elevation
    headerBg: 'hsl(208, 70%, 30%)', // Electric blue header
    columnBg: 'hsl(208, 60%, 28%)', // Deep blue columns
    highlightBg: 'hsl(45, 90%, 75%)', // Bright yellow highlights
    grad0: 'hsl(208, 80%, 35%)', // Vibrant gradient start
    grad1: 'hsl(208, 60%, 25%)', // Darker gradient end
    glassBg: 'rgba(23, 89, 147, 0.85)', // Electric blue glass
    textPrimary: 'hsl(0, 0%, 98%)', // Crisp white text
    textSecondary: 'hsl(0, 0%, 80%)', // Light gray secondary text
    borderColor: 'hsl(208, 50%, 45%)', // Lighter blue borders
    accentColor: 'hsl(45, 90%, 65%)', // Bright Pikachu Yellow
    linkColor: 'hsl(45, 90%, 65%)', // Yellow links
    linkHoverColor: 'hsl(45, 95%, 75%)', // Brighter yellow on hover
  },
  'spectral-covenant': {
    bgPrimary: 'hsl(0, 0%, 97%)', // Soft ivory for unity
    bgSecondary: 'hsl(150, 30%, 90%)', // Pale green for cards
    headerBg: 'hsl(0, 0%, 97%)', // Ivory header
    columnBg: 'hsl(150, 30%, 90%)', // Pale green columns
    highlightBg: 'hsl(30, 70%, 60%)', // Orange for highlights
    grad0: 'hsl(0, 100%, 85%)', // Red gradient start
    grad1: 'hsl(240, 100%, 85%)', // Blue gradient end
    glassBg: 'rgba(255, 255, 255, 0.85)', // Light glass effect
    textPrimary: 'hsl(0, 0%, 15%)', // Dark charcoal text
    textSecondary: 'hsl(0, 0%, 40%)', // Medium gray secondary
    borderColor: 'hsl(270, 50%, 80%)', // Soft violet borders
    accentColor: 'hsl(220, 85%, 55%)', // Vibrant sky blue
    linkColor: 'hsl(220, 85%, 55%)', // Blue links
    linkHoverColor: 'hsl(220, 85%, 45%)', // Darker blue on hover
  },
  'celestial-veil': {
    bgPrimary: 'hsl(200, 60%, 8%)', // Midnight blue
    bgSecondary: 'hsl(200, 50%, 12%)', // Darker blue for cards
    headerBg: 'hsl(200, 60%, 8%)', // Midnight blue header
    columnBg: 'hsl(200, 50%, 12%)', // Dark blue columns
    highlightBg: 'hsl(280, 70%, 40%)', // Purple highlights
    grad0: 'hsl(160, 80%, 20%)', // Aurora green gradient start
    grad1: 'hsl(280, 70%, 20%)', // Purple gradient end
    glassBg: 'rgba(25, 50, 75, 0.85)', // Dark glass effect
    textPrimary: 'hsl(0, 0%, 96%)', // Soft white text
    textSecondary: 'hsl(0, 0%, 75%)', // Light gray secondary
    borderColor: 'hsl(200, 45%, 20%)', // Subtle blue borders
    accentColor: 'hsl(160, 80%, 45%)', // Aurora green
    linkColor: 'hsl(160, 80%, 45%)', // Aurora green links
    linkHoverColor: 'hsl(160, 80%, 55%)', // Brighter green on hover
  },
};