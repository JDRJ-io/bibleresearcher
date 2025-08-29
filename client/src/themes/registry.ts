// client/src/themes/registry.ts
export type ThemeName = 'light' | 'ancient-dark' | 'monastery-candlelight' | 'mystical-meadow' | 'electric-blue' | 'rainbow' | 'celestial-veil';

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
    bgPrimary: 'rgba(255, 140, 60, 0.15)', // Transparent sunset orange
    bgSecondary: 'rgba(255, 180, 120, 0.1)', // Transparent lighter orange
    headerBg: 'rgba(255, 140, 60, 0.08)', // Very transparent orange header
    columnBg: 'rgba(255, 180, 120, 0.08)', // Very transparent orange columns
    highlightBg: 'rgba(255, 215, 0, 0.4)', // Bright gold highlights
    grad0: 'hsl(25, 90%, 65%)', // Sunset orange gradient start
    grad1: 'hsl(210, 80%, 70%)', // Sky blue gradient end
    glassBg: 'rgba(255, 180, 120, 0.05)', // Minimal sunset glass effect
    textPrimary: 'hsl(25, 40%, 25%)', // Warm brown text for contrast
    textSecondary: 'hsl(25, 30%, 35%)', // Lighter brown secondary
    borderColor: 'rgba(255, 140, 60, 0.5)', // Orange borders
    accentColor: 'hsl(45, 100%, 50%)', // Pure gold for buttons
    linkColor: 'hsl(45, 90%, 45%)', // Golden links
    linkHoverColor: 'hsl(45, 100%, 40%)', // Darker gold on hover
  },
  'electric-blue': {
    bgPrimary: 'rgba(0, 34, 238, 0.15)', // Transparent electric blue (#0022EE)
    bgSecondary: 'rgba(0, 34, 238, 0.1)', // Lighter electric blue
    headerBg: 'rgba(0, 34, 238, 0.08)', // Very transparent blue header
    columnBg: 'rgba(0, 34, 238, 0.08)', // Very transparent blue columns
    highlightBg: 'rgba(255, 255, 0, 0.4)', // Bright yellow highlights
    grad0: 'hsl(236, 100%, 47%)', // Electric blue gradient start (#0022EE)
    grad1: 'hsl(236, 80%, 35%)', // Darker blue gradient end
    glassBg: 'rgba(0, 34, 238, 0.05)', // Minimal blue glass effect
    textPrimary: 'hsl(0, 0%, 98%)', // Crisp white text
    textSecondary: 'hsl(0, 0%, 90%)', // Bright secondary for contrast
    borderColor: 'rgba(0, 34, 238, 0.4)', // Electric blue borders
    accentColor: 'hsl(60, 100%, 50%)', // Bright electric yellow
    linkColor: 'hsl(60, 100%, 50%)', // Yellow links
    linkHoverColor: 'hsl(60, 100%, 60%)', // Brighter yellow on hover
  },
  'rainbow': {
    bgPrimary: 'rgba(15, 15, 25, 0.3)', // Dark transparent background to let rainbow show
    bgSecondary: 'rgba(20, 20, 30, 0.2)', // Darker transparent background
    headerBg: 'rgba(15, 15, 25, 0.2)', // Dark transparent header
    columnBg: 'rgba(20, 20, 30, 0.15)', // Dark transparent columns
    highlightBg: 'rgba(255, 165, 0, 0.4)', // Bright orange highlights for contrast
    grad0: 'hsl(0, 50%, 10%)', // Dark red gradient start
    grad1: 'hsl(240, 50%, 10%)', // Dark blue gradient end
    glassBg: 'rgba(15, 15, 25, 0.1)', // Dark minimal glass effect
    textPrimary: 'hsl(0, 0%, 92%)', // Light text for contrast
    textSecondary: 'hsl(0, 0%, 75%)', // Lighter secondary text
    borderColor: 'rgba(153, 102, 204, 0.5)', // Brighter violet borders for visibility
    accentColor: 'hsl(220, 85%, 65%)', // Bright sky blue
    linkColor: 'hsl(220, 85%, 65%)', // Bright blue links
    linkHoverColor: 'hsl(220, 85%, 75%)', // Even brighter blue on hover
  },
  'celestial-veil': {
    bgPrimary: 'rgba(20, 40, 60, 0.2)', // Transparent midnight blue to let aurora show
    bgSecondary: 'rgba(25, 50, 75, 0.15)', // Transparent dark blue
    headerBg: 'rgba(20, 40, 60, 0.1)', // Very transparent header
    columnBg: 'rgba(25, 50, 75, 0.1)', // Very transparent columns
    highlightBg: 'rgba(180, 100, 200, 0.3)', // Semi-transparent purple highlights
    grad0: 'hsl(160, 80%, 20%)', // Aurora green gradient start
    grad1: 'hsl(280, 70%, 20%)', // Purple gradient end
    glassBg: 'rgba(25, 50, 75, 0.05)', // Minimal glass effect
    textPrimary: 'hsl(0, 0%, 96%)', // Soft white text
    textSecondary: 'hsl(0, 0%, 85%)', // Brighter secondary for contrast
    borderColor: 'rgba(100, 150, 200, 0.4)', // Semi-transparent blue borders
    accentColor: 'hsl(160, 80%, 45%)', // Aurora green
    linkColor: 'hsl(160, 80%, 45%)', // Aurora green links
    linkHoverColor: 'hsl(160, 80%, 55%)', // Brighter green on hover
  },
};