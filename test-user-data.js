/**
 * Browser Console Test Script
 * Run this in the browser console to test the wired APIs
 */

console.log('🧪 Testing User Data APIs...');

// Test 1: Bookmarks
async function testBookmarks() {
  console.log('\n📖 Testing Bookmarks API...');
  try {
    // Toggle bookmark
    await window.userBookmarksApi.toggle('KJV', 'John.3:16');
    console.log('✅ Bookmark toggle successful');
    
    // Load bookmarks for verses
    const bookmarks = await window.userBookmarksApi.loadForVerses(['John.3:16', 'Gen.1:1']);
    console.log('✅ Bookmarks loaded:', bookmarks);
  } catch (error) {
    console.error('❌ Bookmark test failed:', error);
  }
}

// Test 2: Highlights  
async function testHighlights() {
  console.log('\n🎨 Testing Highlights API...');
  try {
    const segments = [{ start: 5, end: 12, color: 'yellow' }];
    
    // Save highlights
    await window.userHighlightsApi.save('KJV', 'John.3:16', segments, 25);
    console.log('✅ Highlights save successful');
    
    // Load highlights
    const highlights = await window.userHighlightsApi.loadForVerses('KJV', ['John.3:16']);
    console.log('✅ Highlights loaded:', highlights);
  } catch (error) {
    console.error('❌ Highlights test failed:', error);
  }
}

// Test 3: Notes
async function testNotes() {
  console.log('\n📝 Testing Notes API...');
  try {
    // Save note
    await window.userNotesApi.save('KJV', 'John.3:16', 'For God so loved the world...');
    console.log('✅ Note save successful');
    
    // Load notes
    const notes = await window.userNotesApi.loadForVerses('KJV', ['John.3:16']);
    console.log('✅ Notes loaded:', notes);
  } catch (error) {
    console.error('❌ Notes test failed:', error);
  }
}

// Test 4: Navigation History
async function testNavigation() {
  console.log('\n🧭 Testing Navigation History...');
  try {
    const manager = window.navigationHistory;
    
    // Add entry
    await manager.addToHistory('John.3:16', 'KJV');
    console.log('✅ Navigation entry added');
    
    // Check state
    const state = manager.getHistoryState();
    console.log('✅ Navigation state:', state);
  } catch (error) {
    console.error('❌ Navigation test failed:', error);
  }
}

// Test 5: Autosave
async function testAutosave() {
  console.log('\n💾 Testing Autosave...');
  try {
    const manager = window.autosave;
    
    // Start session
    await manager.startSession();
    console.log('✅ Autosave session started');
    
    // Mark for save
    manager.markForSave();
    console.log('✅ Autosave marked');
    
    // Force save
    await manager.forceSave();
    console.log('✅ Autosave forced save completed');
  } catch (error) {
    console.error('❌ Autosave test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive user data tests...');
  
  await testBookmarks();
  await testHighlights();
  await testNotes();
  await testNavigation();
  await testAutosave();
  
  console.log('\n🏁 All tests completed!');
}

// Export to window for manual testing
window.testUserData = {
  bookmarks: testBookmarks,
  highlights: testHighlights,
  notes: testNotes,
  navigation: testNavigation,
  autosave: testAutosave,
  all: runAllTests
};

console.log('📋 Available tests: window.testUserData.all() or individual tests');
console.log('Usage examples:');
console.log('  window.testUserData.all()       - Run all tests');
console.log('  window.testUserData.bookmarks() - Test bookmarks only');
console.log('  window.testUserData.highlights() - Test highlights only');