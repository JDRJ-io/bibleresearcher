// Simple theme test to verify our implementation
const { test, expect } = require('@playwright/test');

test('theme system works correctly', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
  
  // Check that body has a real background color (not transparent)
  const bodyBg = await page.evaluate(() => {
    const body = document.body;
    const computedStyle = window.getComputedStyle(body);
    const bg = computedStyle.backgroundColor;
    const isTransparent = bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)';
    return {
      backgroundColor: bg,
      isTransparent,
      hasGradient: computedStyle.backgroundImage.includes('gradient')
    };
  });
  
  console.log('Body background:', bodyBg);
  expect(bodyBg.isTransparent, 'Body should not be transparent').toBe(false);
  
  // Check that CSS variables are defined
  const cssVars = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      bgPrimary: root.getPropertyValue('--bg-primary').trim(),
      background: root.getPropertyValue('--background').trim(),
      themeClass: document.documentElement.className
    };
  });
  
  console.log('CSS Variables:', cssVars);
  expect(cssVars.bgPrimary, '--bg-primary should be defined').toBeTruthy();
  expect(cssVars.background, '--background should be defined').toBeTruthy();
  
  // Check for gradient on body::before
  const hasGradient = await page.evaluate(() => {
    const pseudoStyle = window.getComputedStyle(document.body, '::before');
    const bgImage = pseudoStyle.getPropertyValue('background-image');
    return bgImage.includes('linear-gradient');
  });
  
  console.log('Body::before has gradient:', hasGradient);
  expect(hasGradient, 'body::before should have gradient').toBe(true);
});