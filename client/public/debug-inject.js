// Auto-injected debug script to catch rogue div
console.log('🔍 Rogue div detective active - auto-loaded');

// Function to check for existing rogue elements
function checkForRogueElements() {
  const rogueElements = document.querySelectorAll('[data-original-style], [data-original-text]');
  
  if (rogueElements.length > 0) {
    console.log('🚨 FOUND ROGUE ELEMENTS!', rogueElements);
    
    rogueElements.forEach((el, i) => {
      console.log(`🎯 Rogue Element ${i + 1}:`, {
        element: el,
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        style: el.getAttribute('style'),
        computedHeight: getComputedStyle(el).height,
        dataOriginalStyle: el.getAttribute('data-original-style'),
        dataOriginalText: el.getAttribute('data-original-text'),
        parent: el.parentElement,
        position: el.getBoundingClientRect()
      });
      
      // Check if it has the massive height
      const height = getComputedStyle(el).height;
      if (height.includes('e+') || parseFloat(height) > 1000000) {
        console.log('🎯 THIS IS THE MASSIVE HEIGHT ELEMENT!', height);
        
        // Try to identify what script created it by looking at call stack
        console.trace('Current stack when found:');
        
        // Look for clues in the element's properties
        console.log('🔎 Element clues:', {
          innerHTML: el.innerHTML.substring(0, 200),
          outerHTML: el.outerHTML.substring(0, 300),
          childNodes: el.childNodes.length,
          attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`),
        });
      }
    });
    
    return rogueElements;
  }
  
  // Also check for elements with scientific notation in style
  const allElements = document.querySelectorAll('*');
  const massiveHeightElements = [];
  
  allElements.forEach(el => {
    const style = el.getAttribute('style') || '';
    const computedHeight = getComputedStyle(el).height;
    
    if (/height:\s*\d+(?:\.\d+)?e\+\d+px/i.test(style) || 
        computedHeight.includes('e+') ||
        parseFloat(computedHeight) > 1000000) {
      massiveHeightElements.push(el);
      console.log('🎯 MASSIVE HEIGHT FOUND:', {
        element: el,
        height: computedHeight,
        style: style
      });
    }
  });
  
  if (massiveHeightElements.length > 0) {
    console.log('🚨 Found elements with massive heights:', massiveHeightElements);
    return massiveHeightElements;
  }
  
  console.log('✅ No rogue elements found currently');
  return [];
}

// Set up mutation observer to catch future rogue elements
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        const hasDataOriginal = node.hasAttribute('data-original-style') || 
                               node.hasAttribute('data-original-text');
        const style = node.getAttribute('style') || '';
        const hasMassiveHeight = /height:\s*\d+(?:\.\d+)?e\+\d+px/i.test(style);
        
        if (hasDataOriginal || hasMassiveHeight) {
          console.log('🚨 CAUGHT ROGUE ELEMENT BEING ADDED!');
          console.log('Element:', node);
          console.log('Style:', style);
          console.log('Data attributes:', {
            'data-original-style': node.getAttribute('data-original-style'),
            'data-original-text': node.getAttribute('data-original-text')
          });
          console.trace('📍 Creation stack trace:');
          debugger; // Will pause for inspection
        }
      }
    });
    
    // Also check for style changes
    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
      const target = mutation.target;
      const newStyle = target.getAttribute('style') || '';
      
      if (/height:\s*\d+(?:\.\d+)?e\+\d+px/i.test(newStyle)) {
        console.log('🚨 CAUGHT STYLE CHANGE TO MASSIVE HEIGHT!');
        console.log('Element:', target);
        console.log('New style:', newStyle);
        console.log('Old style:', mutation.oldValue);
        console.trace('📍 Style change stack trace:');
        debugger;
      }
    }
  });
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['style', 'data-original-style', 'data-original-text'],
  attributeOldValue: true
});

// Check immediately
console.log('🔍 Checking for existing rogue elements...');
const existing = checkForRogueElements();

// Re-check periodically
setInterval(() => {
  checkForRogueElements();
}, 2000);

// Make checkForRogueElements available globally
window.checkForRogueElements = checkForRogueElements;

console.log('✅ Debug script fully loaded. Use checkForRogueElements() to check manually.');