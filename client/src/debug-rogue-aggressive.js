// AGGRESSIVE ROGUE ELEMENT HUNTER
// Run this in browser console to find and destroy the overlay

console.log('🚨 AGGRESSIVE ROGUE HUNTER STARTING...');

const TARGET_HEIGHT = 1860240;
const SUSPICIOUS_HEIGHTS = [1860240, 1_860_240, '1.86024e+06', '1.86024e+6'];

function findAndDestroyRogueElements() {
    let found = 0;
    
    // Check ALL elements
    const allElements = document.querySelectorAll('*');
    console.log(`🔍 Scanning ${allElements.length} elements...`);
    
    allElements.forEach((el, index) => {
        const style = el.getAttribute('style') || '';
        const computedStyle = getComputedStyle(el);
        
        // Check inline styles for height
        const heightMatch = style.match(/height:\s*([\d.]+(?:e[+-]?\d+)?)px/i);
        if (heightMatch) {
            const height = parseFloat(heightMatch[1]);
            if (height > 1000000 || SUSPICIOUS_HEIGHTS.some(h => Math.abs(height - parseFloat(h)) < 1000)) {
                console.log(`🎯 FOUND ROGUE #${index}:`, {
                    element: el,
                    tagName: el.tagName,
                    height: height,
                    inlineStyle: style,
                    computedHeight: computedStyle.height,
                    dataOriginalStyle: el.getAttribute('data-original-style'),
                    dataOriginalText: el.getAttribute('data-original-text'),
                    parent: el.parentElement?.tagName,
                    position: computedStyle.position,
                    zIndex: computedStyle.zIndex
                });
                
                // DESTROY IT
                try {
                    el.remove();
                    found++;
                    console.log(`💥 DESTROYED rogue element #${index}`);
                } catch (error) {
                    console.error(`❌ Failed to destroy element #${index}:`, error);
                }
            }
        }
        
        // Check computed styles for massive heights
        if (computedStyle.height && (computedStyle.height.includes('e+') || parseFloat(computedStyle.height) > 1000000)) {
            console.log(`🎯 FOUND COMPUTED ROGUE #${index}:`, {
                element: el,
                tagName: el.tagName,
                computedHeight: computedStyle.height,
                inlineStyle: style,
                parent: el.parentElement?.tagName
            });
            
            try {
                el.remove();
                found++;
                console.log(`💥 DESTROYED computed rogue element #${index}`);
            } catch (error) {
                console.error(`❌ Failed to destroy computed element #${index}:`, error);
            }
        }
        
        // Check for extension signatures
        if (el.hasAttribute('data-original-style') || el.hasAttribute('data-original-text')) {
            console.log(`🔍 EXTENSION ELEMENT #${index}:`, {
                element: el,
                tagName: el.tagName,
                dataOriginalStyle: el.getAttribute('data-original-style'),
                dataOriginalText: el.getAttribute('data-original-text'),
                computedHeight: computedStyle.height,
                inlineStyle: style
            });
            
            // Check if it has suspicious height
            const hasLargeHeight = style.includes('height') && (
                style.includes('1.86024e+06') || 
                style.includes('1860240') ||
                parseFloat(computedStyle.height) > 500000
            );
            
            if (hasLargeHeight) {
                try {
                    el.remove();
                    found++;
                    console.log(`💥 DESTROYED extension element with large height #${index}`);
                } catch (error) {
                    console.error(`❌ Failed to destroy extension element #${index}:`, error);
                }
            }
        }
    });
    
    console.log(`✅ SCAN COMPLETE: Found and destroyed ${found} rogue elements`);
    return found;
}

// Run the hunter
findAndDestroyRogueElements();

// Set up continuous monitoring
let hunterInterval = setInterval(() => {
    const destroyed = findAndDestroyRogueElements();
    if (destroyed > 0) {
        console.log(`🔄 CONTINUOUS HUNTER: Destroyed ${destroyed} new rogue elements`);
    }
}, 1000);

console.log('🛡️ CONTINUOUS HUNTER ACTIVE - will check every 1 second');
console.log('Run clearInterval(' + hunterInterval + ') to stop');