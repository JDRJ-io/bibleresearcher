// MANUAL ROGUE DESTROYER - USE THIS IN BROWSER CONSOLE NOW!

console.log('🚨 MANUAL ROGUE DESTROYER ACTIVATED');

// Search for the exact problematic element
let destroyed = 0;

// Method 1: Find by exact height
document.querySelectorAll('*').forEach((el, i) => {
  const style = el.getAttribute('style') || '';
  
  // Check for the exact heights we know are problematic
  if (style.includes('1.86024e+06') || 
      style.includes('1860240') || 
      style.includes('height: 1.86024e+06px') ||
      style.includes('height: 1860240px')) {
    
    console.log(`🎯 FOUND EXACT MATCH #${i}:`, {
      element: el,
      tagName: el.tagName,
      style: style,
      computedHeight: getComputedStyle(el).height,
      parent: el.parentElement?.tagName
    });
    
    try {
      el.remove();
      destroyed++;
      console.log(`💥 DESTROYED element #${i} with height pattern`);
    } catch (error) {
      console.error('Failed to destroy:', error);
    }
  }
});

// Method 2: Find by extension attributes + large height
document.querySelectorAll('[data-original-style], [data-original-text]').forEach((el, i) => {
  const style = el.getAttribute('style') || '';
  const computedHeight = parseFloat(getComputedStyle(el).height);
  
  console.log(`🔍 EXTENSION ELEMENT #${i}:`, {
    element: el,
    tagName: el.tagName,
    style: style,
    computedHeight: computedHeight,
    dataOriginalStyle: el.getAttribute('data-original-style'),
    dataOriginalText: el.getAttribute('data-original-text')
  });
  
  // If it has extension attributes AND a large height, destroy it
  if (computedHeight > 500000 || style.includes('1.86024e+06') || style.includes('1860240')) {
    try {
      el.remove();
      destroyed++;
      console.log(`💥 DESTROYED extension element #${i} with large height`);
    } catch (error) {
      console.error('Failed to destroy extension element:', error);
    }
  }
});

// Method 3: Nuclear option - find ANY element with massive computed height
document.querySelectorAll('*').forEach((el, i) => {
  try {
    const computedHeight = parseFloat(getComputedStyle(el).height);
    if (computedHeight > 1000000) {
      console.log(`🎯 FOUND MASSIVE HEIGHT #${i}:`, {
        element: el,
        tagName: el.tagName,
        computedHeight: computedHeight,
        style: el.getAttribute('style'),
        position: getComputedStyle(el).position,
        zIndex: getComputedStyle(el).zIndex
      });
      
      // Only destroy if it's positioned (likely an overlay)
      const position = getComputedStyle(el).position;
      if (position === 'fixed' || position === 'absolute') {
        try {
          el.remove();
          destroyed++;
          console.log(`💥 DESTROYED massive positioned element #${i}`);
        } catch (error) {
          console.error('Failed to destroy massive element:', error);
        }
      }
    }
  } catch (error) {
    // Ignore getComputedStyle errors
  }
});

console.log(`✅ MANUAL DESTROYER COMPLETE: Destroyed ${destroyed} rogue elements`);

// Set up continuous destroyer
const destroyerInterval = setInterval(() => {
  let newDestroyed = 0;
  
  document.querySelectorAll('*').forEach((el) => {
    const style = el.getAttribute('style') || '';
    if (style.includes('1.86024e+06') || style.includes('1860240') ||
        (el.hasAttribute('data-original-style') && parseFloat(getComputedStyle(el).height) > 500000)) {
      try {
        el.remove();
        newDestroyed++;
        console.log('🔄 CONTINUOUS: Destroyed new rogue element');
      } catch (error) {
        // Ignore errors
      }
    }
  });
  
  if (newDestroyed > 0) {
    console.log(`🔄 CONTINUOUS DESTROYER: Destroyed ${newDestroyed} new rogue elements`);
  }
}, 1000);

console.log('🛡️ CONTINUOUS DESTROYER ACTIVE');
console.log('To stop: clearInterval(' + destroyerInterval + ')');
return destroyerInterval;