export type ThemeName = 'light' | 'dark' | 'aurora' | 'rainbow' | 'electric' | 'eden';

export type ThemeTokens = {
  // surfaces
  surface: string;
  surfaceAlt: string;
  surfaceHeader: string;
  surfaceHighlight: string;

  // text
  text: string;
  textMuted: string;

  // borders & interaction
  border: string;
  ring: string;

  // brand/accent
  accent: string;
  accentFg: string;

  // links
  link: string;
  linkHover: string;

  // glass & gradients
  glass: string;
  grad0: string;
  grad1: string;
  gradAngle: string;
};

export const THEMES: Record<ThemeName, ThemeTokens> = {
  light: {
    surface: 'hsl(0 0% 100%)',
    surfaceAlt: 'hsl(210 40% 98%)',
    surfaceHeader: 'hsl(0 0% 100%)',
    surfaceHighlight: 'hsl(210 90% 96%)',

    text: 'hsl(210 24% 16%)',
    textMuted: 'hsl(215 16% 40%)',

    border: 'hsl(214 15% 90%)',
    ring: 'hsl(210 100% 56%)',

    accent: 'hsl(210 100% 56%)',
    accentFg: 'white',

    link: 'hsl(215 90% 45%)',
    linkHover: 'hsl(215 90% 38%)',

    glass: 'rgba(255,255,255,0.65)',
    grad0: 'hsl(210 100% 56%)',
    grad1: 'hsl(260 100% 70%)',
    gradAngle: '135deg',
  },
  dark: {
    surface: 'hsl(220 25% 8%)',
    surfaceAlt: 'hsl(220 20% 6%)',
    surfaceHeader: 'hsl(220 20% 6%)',
    surfaceHighlight: 'hsl(220 25% 14%)',

    text: 'hsl(30 5% 92%)',
    textMuted: 'hsl(215 10% 65%)',

    border: 'hsl(220 12% 18%)',
    ring: 'hsl(210 100% 56%)',

    accent: 'hsl(210 100% 56%)',
    accentFg: 'black',

    link: 'hsl(210 100% 70%)',
    linkHover: 'hsl(210 100% 62%)',

    glass: 'rgba(24,24,28,0.55)',
    grad0: 'hsl(210 100% 56%)',
    grad1: 'hsl(260 100% 70%)',
    gradAngle: '135deg',
  },
  aurora: {
    surface: 'hsl(270 100% 10%)',
    surfaceAlt: 'rgba(33, 15, 45, 0.8)',
    surfaceHeader: '#210f2d',
    surfaceHighlight: 'hsl(270 30% 20%)',

    text: '#e0e0ff',
    textMuted: 'hsl(270 15% 75%)',

    border: '#43316c',
    ring: '#ffcc00',

    accent: '#ffcc00',
    accentFg: 'black',

    link: '#ffcc00',
    linkHover: '#ffcc00',

    glass: 'rgba(12,16,28,0.55)',
    grad0: '#ffcc00',
    grad1: '#4a148c',
    gradAngle: '145deg',
  },
  rainbow: {
    surface: 'hsl(240 25% 12%)',
    surfaceAlt: 'rgba(20, 20, 40, 0.8)',
    surfaceHeader: 'rgba(30, 30, 60, 0.9)',
    surfaceHighlight: 'hsl(240 20% 22%)',

    text: '#ffffff',
    textMuted: 'hsl(240 10% 75%)',

    border: '#4d4d80',
    ring: '#00ffcc',

    accent: '#00ffcc',
    accentFg: 'black',

    link: '#00ffcc',
    linkHover: '#00ffcc',

    glass: 'rgba(255,255,255,0.65)',
    grad0: '#ff3b30',
    grad1: '#ffd60a',
    gradAngle: '135deg',
  },
  electric: {
    surface: '#101646',
    surfaceAlt: '#1a237e',
    surfaceHeader: '#3e2bf7',
    surfaceHighlight: 'color-mix(in oklch, #f7f232 14%, transparent)',

    text: '#eceff1',
    textMuted: 'oklch(0.85 0.03 260)',

    border: '#5c6bc0',
    ring: '#f7f232',

    accent: '#f7f232',
    accentFg: '#000',

    link: '#f7f232',
    linkHover: '#f7f232',

    glass: 'rgba(30, 30, 80, 0.40)',
    grad0: '#3e2bf7',
    grad1: '#00d4ff',
    gradAngle: '135deg',
  },
  eden: {
    surface: '#e8f5f0',
    surfaceAlt: 'rgba(225, 242, 235, 0.85)',
    surfaceHeader: '#f9fafb',
    surfaceHighlight: '#f9fafb',

    text: '#1a3d32',
    textMuted: 'hsl(150 25% 40%)',

    border: '#e5e7eb',
    ring: '#4a9d7a',

    accent: '#4a9d7a',
    accentFg: 'white',

    link: '#2d7558',
    linkHover: '#1f5d45',

    glass: 'rgba(249, 250, 251, 0.7)',
    grad0: '#a8e6cf',
    grad1: '#d4f1e8',
    gradAngle: '180deg',
  },
};
