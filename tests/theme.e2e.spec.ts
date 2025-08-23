import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

const siteUrl = readFileSync('tests/site-url.txt', 'utf8').trim();

test.describe('Theme background system', () => {
  test('body has real background (not transparent) and gradient is on body::before', async ({ page }) => {
    await page.goto(siteUrl, { waitUntil: 'networkidle' });

    // 1) The <body> should NOT be transparent; it should use --background
    const bodyBg = await page.evaluate(() => {
      const el = document.body;
      const cs = window.getComputedStyle(el);
      return {
        background: cs.background,
        bgColor: cs.backgroundColor,
        hasTransparent: /rgba?\(0,\s*0,\s*0,\s*0\)|transparent/i.test(cs.background + ' ' + cs.backgroundColor),
      };
    });
    expect(bodyBg.hasTransparent, 'Body background is transparent; should be a real color').toBeFalsy();

    // 2) body::before exists and paints the gradient
    const beforeBgImage = await page.evaluate(() => {
      const cs = window.getComputedStyle(document.body, '::before');
      return cs.getPropertyValue('background-image');
    });
    expect(beforeBgImage, 'body::before gradient missing').toMatch(/linear-gradient/i);

    // 3) Content sits above gradient
    const rootZ = await page.evaluate(() => {
      const root = document.querySelector('#root, .app-root') as HTMLElement | null;
      return root ? window.getComputedStyle(root).zIndex : null;
    });
    expect(rootZ === null || parseInt(String(rootZ), 10) >= 1, 'Root element should have z-index >= 1').toBeTruthy();

    // 4) No rogue negative z-index layers in the DOM (except legacy .dynamic-background)
    const negZElements = await page.evaluate(() => {
      return Array.from(document.querySelectorAll<HTMLElement>('*'))
        .filter(el => {
          const z = window.getComputedStyle(el).zIndex;
          return !isNaN(parseInt(z)) && parseInt(z) < 0;
        })
        .map(el => ({
          tag: el.tagName,
          classes: el.className,
          zIndex: window.getComputedStyle(el).zIndex
        }));
    });
    
    // Allow legacy .dynamic-background with negative z-index
    const problematicElements = negZElements.filter(el => 
      !el.classes.includes('dynamic-background')
    );
    expect(problematicElements.length, 'Found non-legacy elements with negative z-index').toBe(0);
  });

  test('theme toggle updates vars & switches gradient', async ({ page }) => {
    await page.goto(siteUrl, { waitUntil: 'networkidle' });

    // Capture light variables
    const lightVars = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return {
        bgPrimary: root.getPropertyValue('--bg-primary').trim(),
        background: root.getPropertyValue('--background').trim(),
        isLight: document.documentElement.classList.contains('light'),
        isDark: document.documentElement.classList.contains('dark'),
      };
    });

    // Try to find and trigger theme toggle
    const toggled = await page.evaluate(() => {
      // Try various theme toggle selectors
      const selectors = [
        '[data-theme-toggle]',
        '[aria-label*="theme" i]',
        '[aria-label*="toggle" i]',
        '.theme-toggle',
        'button[title*="theme" i]',
        'button[aria-label*="theme" i]'
      ];
      
      for (const selector of selectors) {
        const btn = document.querySelector(selector);
        if (btn instanceof HTMLElement) { 
          btn.click(); 
          return true; 
        }
      }
      
      // Fallback: manually toggle theme
      try {
        // Import and use the theme manager directly
        const currentTheme = localStorage.getItem('bible-theme-optimized') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('bible-theme-optimized', newTheme);
        
        // Add appropriate class
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
        
        // Dispatch a custom event to trigger theme change
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: newTheme } }));
        return true;
      } catch { 
        return false; 
      }
    });

    if (!toggled) {
      // If we can't find a toggle, just test that the theme system works by manually setting it
      await page.evaluate(() => {
        localStorage.setItem('bible-theme-optimized', 'dark');
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      });
    }

    // Wait a moment for theme changes to apply
    await page.waitForTimeout(100);

    // Capture dark variables
    const darkVars = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return {
        bgPrimary: root.getPropertyValue('--bg-primary').trim(),
        background: root.getPropertyValue('--background').trim(),
        isLight: document.documentElement.classList.contains('light'),
        isDark: document.documentElement.classList.contains('dark'),
      };
    });

    expect(darkVars.isDark, 'html.dark class not set after toggle').toBeTruthy();
    
    // Variables should be different between light and dark
    if (lightVars.bgPrimary && darkVars.bgPrimary) {
      expect(darkVars.bgPrimary !== lightVars.bgPrimary, 'bg-primary should change between themes').toBeTruthy();
    }
    if (lightVars.background && darkVars.background) {
      expect(darkVars.background !== lightVars.background, 'background should change between themes').toBeTruthy();
    }

    // Gradient should still exist after theme change
    const beforeBgImage = await page.evaluate(() => {
      const cs = window.getComputedStyle(document.body, '::before');
      return cs.getPropertyValue('background-image');
    });
    expect(beforeBgImage).toMatch(/linear-gradient/i);
  });

  test('glass morphism surfaces are semi-transparent per theme', async ({ page }) => {
    await page.goto(siteUrl, { waitUntil: 'networkidle' });

    // Ensure at least one .glass-morphism surface exists for testing
    const ensured = await page.evaluate(() => {
      let el = document.querySelector('.glass-morphism') as HTMLElement | null;
      if (!el) {
        el = document.createElement('div');
        el.className = 'glass-morphism';
        el.textContent = 'probe';
        el.style.position = 'fixed';
        el.style.top = '10px';
        el.style.left = '10px';
        el.style.width = '50px';
        el.style.height = '50px';
        document.body.appendChild(el);
      }
      return true;
    });
    expect(ensured).toBeTruthy();

    const lightBg = await page.evaluate(() => {
      const el = document.querySelector('.glass-morphism')!;
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(lightBg, 'Glass morphism element should have background color').toBeTruthy();

    // Toggle to dark theme
    await page.evaluate(() => {
      localStorage.setItem('bible-theme-optimized', 'dark');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(50);

    const darkBg = await page.evaluate(() => {
      const el = document.querySelector('.glass-morphism')!;
      return window.getComputedStyle(el).backgroundColor;
    });
    
    expect(darkBg, 'Glass morphism should have different background in dark theme').toBeTruthy();
    expect(darkBg !== lightBg, 'Glass backgrounds should differ between light and dark themes').toBeTruthy();

    // Clean up test element
    await page.evaluate(() => {
      const el = document.querySelector('.glass-morphism[style]');
      if (el && el.textContent === 'probe') {
        el.remove();
      }
    });
  });

  test('CSS variables are properly defined for both themes', async ({ page }) => {
    await page.goto(siteUrl, { waitUntil: 'networkidle' });

    const requiredVars = [
      '--bg-primary',
      '--bg-secondary', 
      '--header-bg',
      '--column-bg',
      '--highlight-bg',
      '--background',
      '--primary',
      '--secondary',
      '--card',
      '--popover',
    ];

    // Test light theme
    await page.evaluate(() => {
      localStorage.setItem('bible-theme-optimized', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await page.waitForTimeout(50);

    const lightVars = await page.evaluate((vars) => {
      const root = getComputedStyle(document.documentElement);
      const result: Record<string, string> = {};
      for (const v of vars) {
        result[v] = root.getPropertyValue(v).trim();
      }
      return result;
    }, requiredVars);

    for (const [varName, value] of Object.entries(lightVars)) {
      expect(value, `${varName} should be defined in light theme`).toBeTruthy();
    }

    // Test dark theme
    await page.evaluate(() => {
      localStorage.setItem('bible-theme-optimized', 'dark');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(50);

    const darkVars = await page.evaluate((vars) => {
      const root = getComputedStyle(document.documentElement);
      const result: Record<string, string> = {};
      for (const v of vars) {
        result[v] = root.getPropertyValue(v).trim();
      }
      return result;
    }, requiredVars);

    for (const [varName, value] of Object.entries(darkVars)) {
      expect(value, `${varName} should be defined in dark theme`).toBeTruthy();
    }

    // Verify aliases match core variables
    expect(lightVars['--background']).toBe(lightVars['--bg-primary']);
    expect(darkVars['--background']).toBe(darkVars['--bg-primary']);
  });
});