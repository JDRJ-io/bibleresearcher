// Debug Script: Catch the rogue div with massive height
// Based on the debugging approach provided

console.log('🕵️ Debug script loaded - Setting up traps for rogue div detection...');

// Trap 1: Catch when the giant-height div appears
(() => {
  const eplus = /height:\s*\d+(?:\.\d+)?e\+\d+px/i;
  const obs = new MutationObserver(muts => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1 && (
            n.hasAttribute('data-original-style') ||
            n.hasAttribute('data-original-text') ||
            eplus.test(n.getAttribute('style') || '') ||
            n.style?.height?.includes('e+')
          )) {
          console.log('🚨 ROGUE NODE DETECTED:', n);
          console.log('📊 Node details:', {
            tagName: n.tagName,
            style: n.getAttribute('style'),
            dataOriginalStyle: n.getAttribute('data-original-style'),
            dataOriginalText: n.getAttribute('data-original-text'),
            computedHeight: getComputedStyle(n).height,
            parentElement: n.parentElement,
            innerHTML: n.innerHTML.substring(0, 100) + '...'
          });
          console.log('📍 Call Stack (where was this created):');
          console.trace();
          debugger; // This will pause execution so you can inspect the call stack
        }
      }
    }
  });
  obs.observe(document.documentElement, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'data-original-style', 'data-original-text']
  });
  console.log('✅ MutationObserver armed. Any rogue div will be caught.');
})();

// Trap 2: List all loaded scripts to spot extensions
console.log('📋 All loaded scripts:');
console.table(
  performance.getEntriesByType('resource')
    .filter(r => r.initiatorType === 'script')
    .map(r => ({ script: r.name }))
);

// Trap 3: Look for extension indicators
(() => {
  const extensionIndicators = [];
  
  // Check for chrome-extension URLs
  const scripts = Array.from(document.scripts);
  scripts.forEach(script => {
    if (script.src && script.src.startsWith('chrome-extension://')) {
      extensionIndicators.push(`Extension script: ${script.src}`);
    }
  });
  
  // Check for common extension globals
  const commonExtensionGlobals = ['ey', 'chrome', '__EXTENSION__', '_extension'];
  commonExtensionGlobals.forEach(global => {
    if (window[global]) {
      extensionIndicators.push(`Extension global detected: ${global}`);
    }
  });
  
  if (extensionIndicators.length > 0) {
    console.log('🔍 Extension indicators found:', extensionIndicators);
  } else {
    console.log('✅ No obvious extension indicators found');
  }
})();

// Trap 4: Search for existing elements with the problematic attributes
(() => {
  const existingRogue = document.querySelectorAll('[data-original-style], [data-original-text]');
  if (existingRogue.length > 0) {
    console.log('⚠️ Found existing elements with data-original attributes:', existingRogue);
    existingRogue.forEach((el, i) => {
      console.log(`Element ${i + 1}:`, {
        element: el,
        style: el.getAttribute('style'),
        dataOriginalStyle: el.getAttribute('data-original-style'),
        dataOriginalText: el.getAttribute('data-original-text'),
        height: getComputedStyle(el).height
      });
    });
  }
  
  // Also check for elements with scientific notation heights
  const allElements = document.querySelectorAll('*');
  const scientificHeights = [];
  allElements.forEach(el => {
    const style = el.getAttribute('style') || '';
    if (/height:\s*\d+(?:\.\d+)?e\+\d+px/i.test(style)) {
      scientificHeights.push(el);
    }
  });
  
  if (scientificHeights.length > 0) {
    console.log('🔬 Found elements with scientific notation heights:', scientificHeights);
  }
})();

// Trap 5: Monitor console hooks (if ey function exists)
(() => {
  const globs = [window, ...Array.from(frames).filter(Boolean)];
  for (const g of globs) {
    try {
      if (typeof g.ey === "function") {
        const orig = g.ey;
        g.ey = function(...a) {
          if (a && a[0] === "console") {
            console.log("🎯 ey('console', ...) called - Extension detected!");
            console.log('Arguments:', a);
            console.trace('Call stack for ey function:');
            debugger; // Will show which script is calling this
          }
          return orig.apply(this, a);
        };
        console.log("✅ ey trap armed - will catch extension console hooks");
      }
    } catch {}
  }
})();

console.log('🔍 All debugging traps are now active. Refresh the page or trigger the tutorial to catch the rogue div.');