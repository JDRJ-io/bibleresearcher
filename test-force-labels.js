// Force test to make labels work immediately
console.log('🔥 FORCING LABELS TO WORK NOW!');

// This script should be run in the browser console
// It will directly manipulate the store and trigger label rendering

// 1. Get the current store state
const store = window.useBibleStore?.getState();
if (!store) {
  console.error('❌ Store not found! Make sure app is loaded.');
} else {
  console.log('✅ Store found, current state:', {
    activeLabels: store.activeLabels,
    mainTranslation: store.translationState?.main
  });
  
  // 2. Force set active labels
  console.log('🔧 Setting activeLabels to ["what"]...');
  store.setActiveLabels(['what']);
  
  // 3. Verify it worked
  setTimeout(() => {
    const newState = window.useBibleStore.getState();
    console.log('✅ New activeLabels:', newState.activeLabels);
    
    // 4. Force a re-render by dispatching event
    window.dispatchEvent(new CustomEvent('labelsChanged', { 
      detail: { activeLabels: ['what'] } 
    }));
    
    console.log('📢 Dispatched labelsChanged event');
    
    // 5. Check if LabeledText components are rendering
    setTimeout(() => {
      // Look for any elements with label CSS classes
      const labeledElements = document.querySelectorAll('.fx-shadow, .fx-hand, .fx-under, .fx-bracket, .fx-bold, .fx-ital, .fx-outline');
      console.log('🎨 Found', labeledElements.length, 'elements with label CSS classes');
      
      if (labeledElements.length > 0) {
        console.log('✅ SUCCESS! Labels are rendering!');
        console.log('First labeled element:', labeledElements[0]);
      } else {
        console.log('❌ No labeled elements found. Checking verse text...');
        
        // Check if verse text is present
        const verseTexts = document.querySelectorAll('.verse-text');
        console.log('Found', verseTexts.length, 'verse text elements');
        
        if (verseTexts.length > 0) {
          console.log('First verse text:', verseTexts[0].textContent?.substring(0, 100));
        }
      }
    }, 1000);
  }, 100);
}