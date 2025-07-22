// ProphecyWorker.ts - Efficient prophecy data parsing from main translation
// Follows the same pattern as cross-references to avoid multiple downloads

export interface ProphecyMessage {
  type: 'PARSE_PROPHECIES_FROM_TRANSLATION';
  payload: {
    translationData: Map<string, string>; // The already-loaded translation verses
    verseKeys: string[]; // List of verse IDs to get prophecy data for
  };
}

export interface ProphecyResponse {
  type: 'PROPHECIES_PARSED';
  payload: {
    prophecyData: Record<string, { P: string[], F: string[], V: string[] }>;
    success: boolean;
    error?: string;
  };
}

// Enhanced prophecy patterns for parsing from verse text
const PROPHECY_PATTERNS = {
  // Prediction patterns (future tense, prophetic language)
  prediction: [
    /shall\s+(?:be|come|rise|fall|return|reign|build|destroy)/gi,
    /will\s+(?:be|come|rise|fall|return|reign|build|destroy|send|give)/gi,
    /prophecy\s+(?:of|concerning|about)/gi,
    /saith\s+the\s+lord/gi,
    /thus\s+saith/gi,
    /in\s+(?:the\s+)?(?:last\s+days|that\s+day|the\s+end)/gi,
    /behold,?\s+(?:i\s+will|the\s+days?\s+come)/gi,
    /(?:oracle|word)\s+of\s+the\s+lord/gi,
    /the\s+lord\s+(?:hath\s+)?spoken/gi
  ],
  
  // Fulfillment patterns (past tense, completion language)
  fulfillment: [
    /(?:it\s+came\s+to\s+pass|and\s+it\s+was\s+so)/gi,
    /(?:was\s+fulfilled|came\s+to\s+pass)/gi,
    /according\s+to\s+the\s+word\s+of\s+the\s+lord/gi,
    /as\s+(?:he\s+)?(?:had\s+)?(?:said|spoken|promised)/gi,
    /(?:then|thus)\s+was\s+fulfilled/gi,
    /(?:and\s+)?so\s+it\s+was/gi,
    /did\s+according\s+to\s+(?:all\s+)?that/gi,
    /fulfilled\s+(?:the\s+)?(?:word|prophecy|saying)/gi
  ],
  
  // Verification patterns (references to prophecy, confirmation)
  verification: [
    /as\s+(?:it\s+is\s+)?written/gi,
    /scripture\s+(?:saith|says)/gi,
    /(?:prophet|prophecy)\s+(?:saith|says|spoke)/gi,
    /that\s+(?:it\s+might\s+be\s+fulfilled|the\s+scripture)/gi,
    /spoken\s+by\s+the\s+prophet/gi,
    /(?:this\s+is\s+)?that\s+which\s+was\s+spoken/gi,
    /the\s+word\s+of\s+the\s+lord\s+(?:came|was)/gi,
    /according\s+to\s+(?:the\s+)?(?:prophecy|scripture)/gi
  ]
};

// High-value prophecy keywords that increase confidence
const PROPHECY_KEYWORDS = [
  'messiah', 'christ', 'anointed', 'kingdom', 'throne', 'david',
  'jerusalem', 'zion', 'temple', 'babylon', 'exile', 'return',
  'branch', 'root', 'seed', 'covenant', 'promise', 'redemption',
  'salvation', 'deliverer', 'king', 'priest', 'sacrifice'
];

self.addEventListener('message', async (event: MessageEvent<ProphecyMessage>) => {
  const { type, payload } = event.data;
  
  if (type === 'PARSE_PROPHECIES_FROM_TRANSLATION') {
    try {
      const { translationData, verseKeys } = payload;
      const prophecyData: Record<string, { P: string[], F: string[], V: string[] }> = {};
      
      // Parse each verse for prophecy indicators
      for (const verseKey of verseKeys) {
        const verseText = translationData.get(verseKey) || '';
        if (!verseText) continue;
        
        const result = { P: [], F: [], V: [] } as { P: string[], F: string[], V: string[] };
        
        // Check for prediction patterns
        let predictionScore = 0;
        PROPHECY_PATTERNS.prediction.forEach(pattern => {
          const matches = verseText.match(pattern);
          if (matches) predictionScore += matches.length;
        });
        
        // Check for fulfillment patterns
        let fulfillmentScore = 0;
        PROPHECY_PATTERNS.fulfillment.forEach(pattern => {
          const matches = verseText.match(pattern);
          if (matches) fulfillmentScore += matches.length;
        });
        
        // Check for verification patterns
        let verificationScore = 0;
        PROPHECY_PATTERNS.verification.forEach(pattern => {
          const matches = verseText.match(pattern);
          if (matches) verificationScore += matches.length;
        });
        
        // Boost score for prophecy keywords
        const keywordBoost = PROPHECY_KEYWORDS.reduce((count, keyword) => {
          return count + (verseText.toLowerCase().includes(keyword) ? 1 : 0);
        }, 0);
        
        // Apply keyword boost to all categories
        predictionScore += keywordBoost;
        fulfillmentScore += keywordBoost;
        verificationScore += keywordBoost;
        
        // Generate prophecy IDs based on verse reference and pattern strength
        const baseId = verseKey.replace(/\W/g, '');
        
        if (predictionScore >= 1) {
          result.P = [`${baseId}_P${predictionScore}`];
        }
        if (fulfillmentScore >= 1) {
          result.F = [`${baseId}_F${fulfillmentScore}`];
        }
        if (verificationScore >= 1) {
          result.V = [`${baseId}_V${verificationScore}`];
        }
        
        // Only include verses that have prophecy content
        if (result.P.length > 0 || result.F.length > 0 || result.V.length > 0) {
          prophecyData[verseKey] = result;
        }
      }
      
      const response: ProphecyResponse = {
        type: 'PROPHECIES_PARSED',
        payload: {
          prophecyData,
          success: true
        }
      };
      
      self.postMessage(response);
      console.log(`✅ ProphecyWorker: Parsed ${Object.keys(prophecyData).length} verses with prophecy content`);
      
    } catch (error) {
      const errorResponse: ProphecyResponse = {
        type: 'PROPHECIES_PARSED',
        payload: {
          prophecyData: {},
          success: false,
          error: error instanceof Error ? error.message : 'Unknown prophecy parsing error'
        }
      };
      
      self.postMessage(errorResponse);
      console.error('❌ ProphecyWorker error:', error);
    }
  }
});

export {};