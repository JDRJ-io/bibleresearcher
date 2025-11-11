/**
 * WCAG-compliant color contrast utilities for smart highlighting
 * Ensures readable text on highlights across light/dark themes
 */

export function hexToRgb(hex: string) {
  const h = hex.replace('#','').trim();
  const v = h.length === 3
    ? h.split('').map(c => parseInt(c + c, 16))
    : [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  return { r: v[0], g: v[1], b: v[2] };
}

function srgbToLin(c: number) {
  const x = c/255;
  return x <= 0.04045 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4);
}

export function relativeLuminance(hex: string) {
  const { r,g,b } = hexToRgb(hex);
  const R = srgbToLin(r), G = srgbToLin(g), B = srgbToLin(b);
  return 0.2126*R + 0.7152*G + 0.0722*B;
}

export function contrastRatio(fgHex: string, bgHex: string) {
  const L1 = relativeLuminance(fgHex);
  const L2 = relativeLuminance(bgHex);
  const [light, dark] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (light + 0.05) / (dark + 0.05);
}

// pick black/white based on contrast to background
export function bestBW(bgHex: string) {
  const cWhite = contrastRatio('#FFFFFF', bgHex);
  const cBlack = contrastRatio('#000000', bgHex);
  return cWhite >= cBlack ? '#FFFFFF' : '#000000';
}

// blend highlight over base background to get the actual backdrop
export function blendOver(baseHex: string, topHex: string, alpha: number) {
  const base = hexToRgb(baseHex);
  const top  = hexToRgb(topHex);
  const clamp = (x:number) => Math.max(0, Math.min(255, Math.round(x)));

  const r = clamp(top.r*alpha + base.r*(1-alpha));
  const g = clamp(top.g*alpha + base.g*(1-alpha));
  const b = clamp(top.b*alpha + base.b*(1-alpha));

  const toHex = (n:number) => n.toString(16).padStart(2,'0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// quick hex <-> hsl helpers
function hexToHsl(hex: string) {
  const { r,g,b } = hexToRgb(hex);
  const R=r/255, G=g/255, B=b/255;
  const max=Math.max(R,G,B), min=Math.min(R,G,B);
  const d = max-min;
  let h=0, s=0, l=(max+min)/2;
  if (d !== 0) {
    s = d/(1-Math.abs(2*l-1));
    switch(max){
      case R: h = ((G-B)/d + (G<B?6:0)); break;
      case G: h = (B-R)/d + 2; break;
      case B: h = (R-G)/d + 4; break;
    }
    h *= 60;
  }
  return { h, s, l };
}

function hslToHex(h:number, s:number, l:number) {
  const C = (1 - Math.abs(2*l - 1)) * s;
  const X = C * (1 - Math.abs((h/60)%2 - 1));
  const m = l - C/2;
  let r=0,g=0,b=0;
  if (0<=h && h<60) [r,g,b] = [C,X,0];
  else if (60<=h && h<120) [r,g,b] = [X,C,0];
  else if (120<=h && h<180) [r,g,b] = [0,C,X];
  else if (180<=h && h<240) [r,g,b] = [0,X,C];
  else if (240<=h && h<300) [r,g,b] = [X,0,C];
  else [r,g,b] = [C,0,X];
  const toHex = (v:number)=> Math.round((v+m)*255).toString(16).padStart(2,'0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function nudgeLightness(hex: string, deltaL: number) {
  const {h,s,l} = hexToHsl(hex);
  const L = Math.max(0, Math.min(1, l + deltaL));
  return hslToHex(h, s, L);
}

// Robust iterative HSL lightness adjustment to meet target contrast
export function tweakHighlightForContrast(bgHex: string, baseHex: string, alpha: number, target = 4.5) {
  // try BW first
  const blended = blendOver(bgHex, baseHex, alpha);
  let text = bestBW(blended);
  if (contrastRatio(text, blended) >= target) {
    return { finalHighlight: baseHex, finalText: text };
  }
  
  // Iteratively adjust highlight lightness to meet target contrast
  const dir = text === '#000000' ? +1 : -1; // lighter for black text, darker for white text
  let currentHex = baseHex;
  let bestHex = baseHex;
  let bestContrast = contrastRatio(text, blended);
  
  // Try up to 10 steps with 3% lightness changes (max ±30% total)
  for (let step = 1; step <= 10; step++) {
    const nudgeAmount = 0.03 * step * dir;
    const nudged = nudgeLightness(baseHex, nudgeAmount);
    const blendedNudged = blendOver(bgHex, nudged, alpha);
    const textForNudged = bestBW(blendedNudged);
    const contrast = contrastRatio(textForNudged, blendedNudged);
    
    // Keep track of best result
    if (contrast > bestContrast) {
      bestContrast = contrast;
      bestHex = nudged;
      text = textForNudged;
    }
    
    // If we hit target, we're done
    if (contrast >= target) {
      return { finalHighlight: nudged, finalText: textForNudged };
    }
  }
  
  // Return the best we could achieve
  return { finalHighlight: bestHex, finalText: text };
}

// Decide text + background color you should render with for a given highlight
export function decideHighlightPaint({
  verseBaseBg = '#ffffff', // or your theme surface (dark: '#0b0b0b')
  highlightHex,
  opacity = 1,
  targetContrast = 4.5
}: {
  verseBaseBg?: string;
  highlightHex: string;
  opacity?: number;
  targetContrast?: number;
}) {
  // what text actually sits on top of:
  const blendedBg = opacity < 1 ? blendOver(verseBaseBg, highlightHex, opacity) : highlightHex;

  // try black/white
  const textBW = bestBW(blendedBg);
  if (contrastRatio(textBW, blendedBg) >= targetContrast) {
    return { textColor: textBW, paintBg: blendedBg, highlightHex };
  }

  // otherwise nudge highlight slightly to meet target
  const { finalHighlight, finalText } = tweakHighlightForContrast(verseBaseBg, highlightHex, opacity, targetContrast);
  const newBlended = opacity < 1 ? blendOver(verseBaseBg, finalHighlight, opacity) : finalHighlight;

  return { textColor: finalText, paintBg: newBlended, highlightHex: finalHighlight };
}