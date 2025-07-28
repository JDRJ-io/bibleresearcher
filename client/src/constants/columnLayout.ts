// Column Layout System - Predefined slots for all Bible table features
// This ensures consistent positioning and serves as a gateway for data loading

export interface ColumnSlot {
  id: string;
  name: string;
  type: 'reference' | 'translation' | 'cross-ref' | 'prophecy' | 'notes' | 'context';
  width: string; // Tailwind width class
  mobileWidth: string; // Mobile-specific width
  position: number; // Slot position (0-19)
  defaultVisible: boolean;
  guestMode: boolean; // Available to guest users
}

// Master column layout - this is the single source of truth for column positioning
export const COLUMN_LAYOUT: ColumnSlot[] = [
  // Slot 0: Reference column (always visible)
  {
    id: 'reference',
    name: '#',
    type: 'reference',
    width: 'w-20',
    mobileWidth: 'w-6', // ULTRA-THIN for rotated text (12px = minimal possible)
    position: 0,
    defaultVisible: true,
    guestMode: true
  },
  
  // Slot 1: Main translation (KJV by default)
  {
    id: 'main-translation',
    name: 'Main Translation',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-52', // Main translation - MAXIMUM possible width (300px)
    position: 1,
    defaultVisible: true,
    guestMode: true
  },
  
  // Slots 2-5: Alternate translations
  {
    id: 'alt-translation-1',
    name: 'Alt Translation 1',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-full',
    position: 2,
    defaultVisible: false,
    guestMode: true
  },
  {
    id: 'alt-translation-2',
    name: 'Alt Translation 2',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-full',
    position: 3,
    defaultVisible: false,
    guestMode: true
  },
  {
    id: 'alt-translation-3',
    name: 'Alt Translation 3',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-full',
    position: 4,
    defaultVisible: false,
    guestMode: false // Premium feature
  },
  {
    id: 'alt-translation-4',
    name: 'Alt Translation 4',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-full',
    position: 5,
    defaultVisible: false,
    guestMode: false
  },
  
  // Slot 6: Cross References - SAME WIDTH AS ALTERNATE TRANSLATIONS
  {
    id: 'cross-references',
    name: 'Cross References',
    type: 'cross-ref',
    width: 'w-80',       // Same as alternate translations
    mobileWidth: 'w-80', // Same as alternate translations
    position: 6,
    defaultVisible: true, // Default ON for free users
    guestMode: true
  },
  
  // Slots 7-9: Prophecy columns - SAME WIDTH AS ALTERNATE TRANSLATIONS
  {
    id: 'prophecy-prediction',
    name: 'Predictions',
    type: 'prophecy',
    width: 'w-80',       // Same as alternate translations
    mobileWidth: 'w-80', // Same as alternate translations
    position: 7,
    defaultVisible: false,
    guestMode: true
  },
  {
    id: 'prophecy-fulfillment',
    name: 'Fulfillments',
    type: 'prophecy',
    width: 'w-80',       // Same as alternate translations
    mobileWidth: 'w-80', // Same as alternate translations
    position: 8,
    defaultVisible: false,
    guestMode: true
  },
  {
    id: 'prophecy-verification',
    name: 'Verifications',
    type: 'prophecy',
    width: 'w-80',       // Same as alternate translations
    mobileWidth: 'w-80', // Same as alternate translations
    position: 9,
    defaultVisible: false,
    guestMode: true
  },
  
  // Slot 10: Notes column
  {
    id: 'notes',
    name: 'Notes',
    type: 'notes',
    width: 'w-64',
    mobileWidth: 'w-56',
    position: 10,
    defaultVisible: false,
    guestMode: false // Requires login
  },
  
  // Slot 11: Context boundaries
  {
    id: 'context',
    name: 'Context',
    type: 'context',
    width: 'w-32',
    mobileWidth: 'w-24',
    position: 11,
    defaultVisible: false,
    guestMode: true
  }
];

// Helper functions for column management
export function getColumnByType(type: string): ColumnSlot | undefined {
  return COLUMN_LAYOUT.find(col => col.type === type);
}

export function getColumnById(id: string): ColumnSlot | undefined {
  return COLUMN_LAYOUT.find(col => col.id === id);
}

export function getVisibleColumns(preferences: any, isGuest: boolean = true): ColumnSlot[] {
  return COLUMN_LAYOUT
    .filter(col => {
      // Always show reference and main translation
      if (col.id === 'reference' || col.id === 'main-translation') return true;
      
      // Guest mode restrictions
      if (isGuest && !col.guestMode) return false;
      
      // Check preferences
      if (col.type === 'cross-ref' && preferences.showCrossRefs) return true;
      if (col.type === 'prophecy' && preferences.showProphecy) return true;
      if (col.type === 'notes' && preferences.showNotes) return true;
      if (col.type === 'context' && preferences.showContext) return true;
      
      return false;
    })
    .sort((a, b) => a.position - b.position);
}

export function getColumnWidth(column: ColumnSlot, isMobile: boolean = false): string {
  return isMobile ? column.mobileWidth : column.width;
}

// Translation slot management
export function getTranslationSlots(activeTranslations: string[]): ColumnSlot[] {
  const translationSlots = COLUMN_LAYOUT.filter(col => col.type === 'translation');
  
  return activeTranslations.map((translationCode, index) => {
    const baseSlot = translationSlots[index] || translationSlots[0];
    return {
      ...baseSlot,
      id: `translation-${translationCode}`,
      name: translationCode,
      defaultVisible: index === 0 // First translation is main
    };
  });
}

// Data loading gateway - this determines what data needs to be fetched for visible columns
export function getDataRequirements(visibleColumns: ColumnSlot[]): {
  translations: string[];
  crossRefs: boolean;
  prophecy: boolean;
  notes: boolean;
  context: boolean;
} {
  const requirements = {
    translations: [] as string[],
    crossRefs: false,
    prophecy: false,
    notes: false,
    context: false
  };
  
  for (const column of visibleColumns) {
    switch (column.type) {
      case 'translation':
        if (column.name !== 'Main Translation') {
          requirements.translations.push(column.name);
        }
        break;
      case 'cross-ref':
        requirements.crossRefs = true;
        break;
      case 'prophecy':
        requirements.prophecy = true;
        break;
      case 'notes':
        requirements.notes = true;
        break;
      case 'context':
        requirements.context = true;
        break;
    }
  }
  
  return requirements;
}