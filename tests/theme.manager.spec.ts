import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  url: 'http://localhost'
});
global.document = dom.window.document;
global.window = dom.window as any;
global.HTMLElement = dom.window.HTMLElement;
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 16);
};

// Import ThemeManager after DOM setup
import { themeManager } from '../client/src/utils/themeOptimizer';

const requiredVars = [
  '--bg-primary',
  '--bg-secondary',
  '--header-bg',
  '--column-bg',
  '--highlight-bg',
  '--text-color',
  '--background',
  '--primary',
  '--secondary',
  '--card',
  '--popover',
];

function getVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

describe('ThemeManager variable coverage', () => {
  beforeEach(() => {
    // Clear all theme classes
    document.documentElement.classList.remove('dark', 'light');
    // Clear all CSS custom properties
    document.documentElement.style.cssText = '';
  });

  it('applies ALL required CSS variables for light theme', async () => {
    themeManager.applyTheme('light');
    
    // Wait for requestAnimationFrame to apply changes
    await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
    
    for (const v of requiredVars) {
      const val = document.documentElement.style.getPropertyValue(v).trim();
      expect(val, `Missing or empty ${v} in light theme`).toBeTruthy();
    }
    expect(document.documentElement.classList.contains('light')).toBeTruthy();
  });

  it('applies ALL required CSS variables for dark theme', async () => {
    themeManager.applyTheme('dark');
    
    // Wait for requestAnimationFrame to apply changes
    await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
    
    for (const v of requiredVars) {
      const val = document.documentElement.style.getPropertyValue(v).trim();
      expect(val, `Missing or empty ${v} in dark theme`).toBeTruthy();
    }
    expect(document.documentElement.classList.contains('dark')).toBeTruthy();
  });

  it('light and dark themes have different colors', async () => {
    // Apply light theme
    themeManager.applyTheme('light');
    await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
    const lightBgPrimary = document.documentElement.style.getPropertyValue('--bg-primary').trim();
    const lightBackground = document.documentElement.style.getPropertyValue('--background').trim();

    // Apply dark theme
    themeManager.applyTheme('dark');
    await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
    const darkBgPrimary = document.documentElement.style.getPropertyValue('--bg-primary').trim();
    const darkBackground = document.documentElement.style.getPropertyValue('--background').trim();

    expect(lightBgPrimary).not.toBe(darkBgPrimary);
    expect(lightBackground).not.toBe(darkBackground);
  });

  it('aliases match core variables', async () => {
    themeManager.applyTheme('light');
    await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
    
    const bgPrimary = document.documentElement.style.getPropertyValue('--bg-primary').trim();
    const background = document.documentElement.style.getPropertyValue('--background').trim();
    const bgSecondary = document.documentElement.style.getPropertyValue('--bg-secondary').trim();
    const secondary = document.documentElement.style.getPropertyValue('--secondary').trim();
    
    expect(background).toBe(bgPrimary);
    expect(secondary).toBe(bgSecondary);
  });
});