// Strong's Concordance Worker - handles heavy parsing off the main thread
// This is the compiled version for the public directory

let strongsVerseOffsets = null;
let strongsIndexOffsets = null;

// Initialize worker with offset data
self.onmessage = async (event) => {
  const { type, verseKey, strongsId, offsetsData } = event.data;

  try {
    switch (type) {
      case 'INIT':
        if (offsetsData) {
          strongsVerseOffsets = offsetsData.strongsVerseOffsets;
          strongsIndexOffsets = offsetsData.strongsIndexOffsets;
          self.postMessage({ type: 'INIT_SUCCESS' });
        }
        break;

      case 'VERSE':
        if (verseKey && strongsVerseOffsets) {
          const verseData = await fetchVerseStrongsData(verseKey);
          self.postMessage({ type: 'VERSE_RESULT', verseKey, data: verseData });
        }
        break;

      case 'LEMMA':
        if (strongsId && strongsIndexOffsets) {
          const lemmaData = await fetchLemmaData(strongsId);
          self.postMessage({ type: 'LEMMA_RESULT', strongsId, data: lemmaData });
        }
        break;

      default:
        self.postMessage({ type: 'ERROR', message: 'Unknown message type' });
    }
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      message: error.message || 'Unknown error' 
    });
  }
};

// Fetch Strong's data for a specific verse using byte range
async function fetchVerseStrongsData(verseKey) {
  const offsets = strongsVerseOffsets[verseKey];
  if (!offsets) {
    return { verseKey, words: [] };
  }

  const [start, end] = offsets;
  
  // For now, return mock data since the actual Strong's files are large
  // In production, this would make a range request to Supabase Storage
  return { 
    verseKey, 
    words: [
      {
        original: "בְּרֵאשִׁית",
        transliteration: "bərēšîṯ",
        strongs: "H7225",
        definition: "beginning, first, chief",
        pronunciation: "ber-ay-sheeth'"
      },
      {
        original: "בָּרָא",
        transliteration: "bārā",
        strongs: "H1254", 
        definition: "to create, shape, form",
        pronunciation: "baw-raw'"
      }
    ]
  };
}

// Fetch lemma data for a Strong's number
async function fetchLemmaData(strongsId) {
  const offsets = strongsIndexOffsets[strongsId];
  if (!offsets) {
    return [];
  }

  // Mock data for now - would fetch actual verse references containing this Strong's number
  return [
    "Gen.1:1",
    "Gen.1:21", 
    "Gen.1:27",
    "Gen.2:3",
    "Gen.2:4"
  ];
}