import { logger } from "@/lib/logger";
// ProphecyWorker.ts - Parse prophecy_rows.txt and prophecy_index.json
// Implements the end-to-end mental model from the documentation

export interface ProphecyMessage {
  type: 'PARSE_PROPHECY_FILES';
  payload: {
    prophecyRows: string; // Content of prophecy_rows.txt
    prophecyIndex: string; // Content of prophecy_index.json
  };
}

export interface ProphecyResponse {
  type: 'PROPHECY_FILES_PARSED';
  payload: {
    verseRoles: Record<string, { P: number[], F: number[], V: number[] }>;
    prophecyIndex: Record<number, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }>;
    success: boolean;
    error?: string;
  };
}

// Parser functions for the two prophecy files

self.addEventListener('message', async (event: MessageEvent<ProphecyMessage>) => {
  const { type, payload } = event.data;
  
  if (type === 'PARSE_PROPHECY_FILES') {
    try {
      const { prophecyRows, prophecyIndex } = payload;
      
      // Parse prophecy_rows.txt into verseRoles
      // Format: [VerseID]$[id:type, id:type, …]
      // Example: 1Chr.10:13$127:V,128:V
      const verseRoles: Record<string, { P: number[], F: number[], V: number[] }> = {};
      
      const rowLines = prophecyRows.split('\n').filter(line => line.trim());
      for (const line of rowLines) {
        const [verseId, data] = line.split('$');
        if (!verseId || !data) continue;
        
        const P: number[] = [], F: number[] = [], V: number[] = [];
        const items = data.split(',');
        
        for (const item of items) {
          const [idStr, type] = item.trim().split(':');
          const id = parseInt(idStr);
          if (isNaN(id)) continue;
          
          if (type === 'P') P.push(id);
          else if (type === 'F') F.push(id);
          else if (type === 'V') V.push(id);
        }
        
        verseRoles[verseId.trim()] = { P, F, V };
      }
      
      // Parse prophecy_index.json
      const parsedIndex = JSON.parse(prophecyIndex);
      
      // Convert string keys to numbers for the prophecy index
      const prophecyIndexData: Record<number, { summary: string; prophecy: string[]; fulfillment: string[]; verification: string[] }> = {};
      for (const [key, value] of Object.entries(parsedIndex)) {
        const id = parseInt(key);
        if (!isNaN(id) && typeof value === 'object' && value !== null) {
          const entry = value as any;
          prophecyIndexData[id] = {
            summary: entry.summary || '',
            prophecy: entry.prophecy || [],
            fulfillment: entry.fulfillment || [],
            verification: entry.verification || []
          };
        }
      }
      
      const response: ProphecyResponse = {
        type: 'PROPHECY_FILES_PARSED',
        payload: {
          verseRoles,
          prophecyIndex: prophecyIndexData,
          success: true
        }
      };
      
      self.postMessage(response);
      logger.debug('SW', `✅ ProphecyWorker: Parsed ${Object.keys(verseRoles).length} verses with prophecy roles and ${Object.keys(prophecyIndexData).length} prophecy definitions`);
      
    } catch (error) {
      const errorResponse: ProphecyResponse = {
        type: 'PROPHECY_FILES_PARSED',
        payload: {
          verseRoles: {},
          prophecyIndex: {},
          success: false,
          error: error instanceof Error ? error.message : 'Unknown prophecy parsing error'
        }
      };
      
      self.postMessage(errorResponse);
      logger.error('SW', '❌ ProphecyWorker error:', error);
    }
  }
});

export {};