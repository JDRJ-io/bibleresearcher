// Search Worker for off-thread Bible search operations
let bibleData = null;
let strongsData = null;
let translationData = new Map();

// Message handler
self.onmessage = async function(e) {
  const { type, payload } = e.data;
  
  switch (type) {
    case 'INIT_DATA':
      await initializeData(payload);
      break;
      
    case 'SEARCH_TEXT':
      performTextSearch(payload);
      break;
      
    case 'SEARCH_STRONGS':
      performStrongsSearch(payload);
      break;
      
    case 'RANDOM_VERSE':
      selectRandomVerse();
      break;
  }
};

async function initializeData(data) {
  try {
    bibleData = data.verses;
    
    // Load translations if provided
    if (data.translations) {
      data.translations.forEach(trans => {
        translationData.set(trans.id, trans.data);
      });
    }
    
    self.postMessage({
      type: 'INIT_COMPLETE',
      payload: { success: true }
    });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: { error: error.message }
    });
  }
}

function performTextSearch({ query, translations, caseSensitive = false }) {
  if (!bibleData) {
    self.postMessage({
      type: 'ERROR',
      payload: { error: 'Bible data not initialized' }
    });
    return;
  }
  
  const results = [];
  const searchQuery = caseSensitive ? query : query.toLowerCase();
  
  // Handle random verse request
  if (query === '%') {
    selectRandomVerse();
    return;
  }
  
  // Search through all verses
  bibleData.forEach((verse, index) => {
    let matchFound = false;
    const matches = {};
    
    // Search in each selected translation
    translations.forEach(transId => {
      const text = verse.text[transId];
      if (text) {
        const searchText = caseSensitive ? text : text.toLowerCase();
        if (searchText.includes(searchQuery)) {
          matchFound = true;
          matches[transId] = highlightMatch(text, query, caseSensitive);
        }
      }
    });
    
    if (matchFound) {
      results.push({
        index,
        reference: verse.reference,
        matches
      });
    }
  });
  
  self.postMessage({
    type: 'SEARCH_RESULTS',
    payload: { results, query }
  });
}

function performStrongsSearch({ strongsNumber }) {
  if (!bibleData || !strongsData) {
    self.postMessage({
      type: 'ERROR',
      payload: { error: 'Data not initialized' }
    });
    return;
  }
  
  const results = [];
  
  bibleData.forEach((verse, index) => {
    if (verse.strongsWords) {
      const hasStrongs = verse.strongsWords.some(word => 
        word.strongs === strongsNumber
      );
      
      if (hasStrongs) {
        results.push({
          index,
          reference: verse.reference,
          words: verse.strongsWords.filter(w => w.strongs === strongsNumber)
        });
      }
    }
  });
  
  self.postMessage({
    type: 'STRONGS_RESULTS',
    payload: { results, strongsNumber }
  });
}

function selectRandomVerse() {
  if (!bibleData || bibleData.length === 0) {
    self.postMessage({
      type: 'ERROR',
      payload: { error: 'No verses available' }
    });
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * bibleData.length);
  const verse = bibleData[randomIndex];
  
  self.postMessage({
    type: 'RANDOM_VERSE',
    payload: {
      index: randomIndex,
      verse: verse
    }
  });
}

function highlightMatch(text, query, caseSensitive) {
  const regex = new RegExp(`(${escapeRegExp(query)})`, caseSensitive ? 'g' : 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}