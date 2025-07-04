// Data normalization worker for Bible application
// Handles loading and structuring all Bible data for optimal memory usage

let translations = {};
let crossRefSets = {};
let prophecyByVerse = {};

// Initialize worker with data loading
self.onmessage = async function(e) {
  const { type, data } = e.data;
  
  try {
    switch (type) {
      case 'LOAD_TRANSLATIONS':
        await loadTranslations(data);
        break;
      case 'LOAD_CROSS_REFS':
        await loadCrossReferences(data);
        break;
      case 'LOAD_PROPHECY':
        await loadProphecyData(data);
        break;
      case 'GET_DATA':
        sendDataToMain();
        break;
      default:
        console.error('Unknown worker message type:', type);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message
    });
  }
};

// Load and normalize translation data
async function loadTranslations(translationConfigs) {
  console.log('Worker: Loading translations...', translationConfigs);
  
  for (const config of translationConfigs) {
    const { code, url } = config;
    
    try {
      const response = await fetch(url);
      const text = await response.text();
      
      // Parse text in format "Gen.1:1 #Text content..."
      const translationMap = {};
      const lines = text.split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          const match = line.match(/^([^#]+)#(.+)$/);
          if (match) {
            const verseKey = match[1].trim();
            const verseText = match[2].trim();
            translationMap[verseKey] = verseText;
          }
        }
      }
      
      translations[code] = translationMap;
      console.log(`Worker: Loaded ${Object.keys(translationMap).length} verses for ${code}`);
      
    } catch (error) {
      console.error(`Worker: Failed to load translation ${code}:`, error);
    }
  }
  
  self.postMessage({
    type: 'TRANSLATIONS_LOADED',
    count: Object.keys(translations).length
  });
}

// Load and normalize cross-reference data
async function loadCrossReferences(crossRefConfigs) {
  console.log('Worker: Loading cross-references...', crossRefConfigs);
  
  for (const config of crossRefConfigs) {
    const { name, url } = config;
    
    try {
      const response = await fetch(url);
      const text = await response.text();
      
      const crossRefMap = {};
      const lines = text.split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          const parts = line.split('$$');
          if (parts.length >= 2) {
            const verseKey = parts[0].trim();
            const refs = parts[1].split(/[~#]/).filter(Boolean);
            crossRefMap[verseKey] = refs;
          }
        }
      }
      
      crossRefSets[name] = crossRefMap;
      console.log(`Worker: Loaded ${Object.keys(crossRefMap).length} cross-references for ${name}`);
      
    } catch (error) {
      console.error(`Worker: Failed to load cross-references ${name}:`, error);
    }
  }
  
  self.postMessage({
    type: 'CROSS_REFS_LOADED',
    count: Object.keys(crossRefSets).length
  });
}

// Load and normalize prophecy data
async function loadProphecyData(prophecyConfig) {
  console.log('Worker: Loading prophecy data...', prophecyConfig);
  
  try {
    const response = await fetch(prophecyConfig.url);
    const text = await response.text();
    
    const prophecyMap = {};
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        const parts = line.split('\t'); // Tab-separated format
        if (parts.length >= 5) {
          const [predVerses, fulVerses, verVerses, title, category] = parts;
          
          // Split verses on comma and normalize
          const predList = predVerses ? predVerses.split(',').map(v => v.trim()).filter(Boolean) : [];
          const fulList = fulVerses ? fulVerses.split(',').map(v => v.trim()).filter(Boolean) : [];
          const verList = verVerses ? verVerses.split(',').map(v => v.trim()).filter(Boolean) : [];
          
          // Create prophecy entry
          const prophecyEntry = {
            pred: predList,
            ful: fulList,
            ver: verList,
            titles: [title.trim()]
          };
          
          // Add to all related verses for bidirectional lookup
          const allVerses = [...predList, ...fulList, ...verList];
          
          for (const verse of allVerses) {
            if (!prophecyMap[verse]) {
              prophecyMap[verse] = { pred: [], ful: [], ver: [], titles: [] };
            }
            
            // Merge with existing entry
            prophecyMap[verse].pred = [...new Set([...prophecyMap[verse].pred, ...predList])];
            prophecyMap[verse].ful = [...new Set([...prophecyMap[verse].ful, ...fulList])];
            prophecyMap[verse].ver = [...new Set([...prophecyMap[verse].ver, ...verList])];
            prophecyMap[verse].titles = [...new Set([...prophecyMap[verse].titles, title.trim()])];
          }
        }
      }
    }
    
    prophecyByVerse = prophecyMap;
    console.log(`Worker: Loaded prophecy data for ${Object.keys(prophecyMap).length} verses`);
    
  } catch (error) {
    console.error('Worker: Failed to load prophecy data:', error);
  }
  
  self.postMessage({
    type: 'PROPHECY_LOADED',
    count: Object.keys(prophecyByVerse).length
  });
}

// Send all normalized data back to main thread
function sendDataToMain() {
  console.log('Worker: Sending normalized data to main thread');
  
  // Create transferable buffers for large data
  const translationsBuffer = new ArrayBuffer(JSON.stringify(translations).length * 2);
  const crossRefsBuffer = new ArrayBuffer(JSON.stringify(crossRefSets).length * 2);
  const prophecyBuffer = new ArrayBuffer(JSON.stringify(prophecyByVerse).length * 2);
  
  self.postMessage({
    type: 'DATA_READY',
    data: {
      translations,
      crossRefSets,
      prophecyByVerse
    },
    stats: {
      translationsCount: Object.keys(translations).length,
      crossRefsCount: Object.keys(crossRefSets).length,
      prophecyCount: Object.keys(prophecyByVerse).length
    }
  }, [translationsBuffer, crossRefsBuffer, prophecyBuffer]);
}

console.log('Data worker initialized and ready');