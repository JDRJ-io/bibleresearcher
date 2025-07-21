
export interface SlotConfig {
  type: string;
  header: string;
  translationCode?: string;
  visible: boolean;
}

// Single source of truth for slot configuration
// This ensures ColumnHeaders.tsx & VirtualRow.tsx stay synchronized
export function createSlotConfig(
  main: string,
  alternates: string[],
  showCrossRefs: boolean,
  showProphecies: boolean,
  showNotes: boolean,
  showDates: boolean
): Record<number, SlotConfig> {
  const slotConfig: Record<number, SlotConfig> = {};
  
  // Slot 0: Reference (always visible)
  slotConfig[0] = { type: 'reference', header: 'Ref', visible: true };
  
  // Slot 1: Main translation (always visible) - center loading position
  slotConfig[1] = { type: 'main-translation', header: main, translationCode: main, visible: true };
  
  // Slot 2: Cross References (center column when enabled)
  slotConfig[2] = { type: 'cross-refs', header: 'Cross Refs', visible: showCrossRefs };
  
  // Slots 3-14: Alternate translations (load to the right first, then left)
  alternates.forEach((translationCode, index) => {
    const slot = 3 + index; // Alternates start at slot 3
    if (slot <= 14) { // Max 12 alternate translations (slots 3-14)
      slotConfig[slot] = { 
        type: 'alt-translation', 
        header: translationCode, 
        translationCode, 
        visible: true 
      };
    }
  });
  
  // Slots 15-17: Prophecy P/F/V (rightmost columns)
  slotConfig[15] = { type: 'prophecy-p', header: 'P', visible: showProphecies };
  slotConfig[16] = { type: 'prophecy-f', header: 'F', visible: showProphecies };
  slotConfig[17] = { type: 'prophecy-v', header: 'V', visible: showProphecies };
  
  // Slot 18: Notes (rightmost)
  slotConfig[18] = { type: 'notes', header: 'Notes', visible: showNotes };
  
  // Slot 19: Context/Dates (rightmost)
  slotConfig[19] = { type: 'context', header: 'Dates', visible: showDates };

  return slotConfig;
}

// Helper function to get visible columns from slot config
export function getVisibleColumns(slotConfig: Record<number, SlotConfig>) {
  return Object.entries(slotConfig)
    .filter(([_, cfg]) => cfg && cfg.visible !== false)
    .map(([slotStr, cfg]) => ({ 
      slot: parseInt(slotStr), 
      config: cfg
    }))
    .sort((a, b) => a.slot - b.slot);
}

// Helper function to get default widths per UI Layout Spec
export function getDefaultWidth(slot: number): number {
  switch (slot) {
    case 0: return 5;   // Reference
    case 1: return 20;  // Main translation (center position)
    case 2: return 15;  // Cross References
    case 3: case 4: case 5: case 6: case 7: case 8:
    case 9: case 10: case 11: case 12: case 13: case 14:
      return 18; // Alt translations
    case 15: case 16: case 17: return 5; // Prophecy P/F/V
    case 18: return 16; // Notes
    case 19: return 8;  // Dates
    default: return 10;
  }
}
