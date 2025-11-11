// Column Layout System - Predefined slots for all Bible table features
// This ensures consistent positioning and serves as a gateway for data loading

export interface ColumnSlot {
  id: string;
  name: string;
  type: 'reference' | 'translation' | 'cross-ref' | 'prophecy' | 'notes' | 'hybrid';
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
  
  // Slot 1: Notes column
  {
    id: 'notes',
    name: 'Notes',
    type: 'notes',
    width: 'w-80',
    mobileWidth: 'w-80',
    position: 1,
    defaultVisible: false,
    guestMode: false // Requires login
  },
  
  // Slot 2: Main translation (KJV by default)
  {
    id: 'main-translation',
    name: 'Main Translation',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-52', // Main translation - MAXIMUM possible width (300px)
    position: 2,
    defaultVisible: true,
    guestMode: true
  },
  
  // Slots 3-6: Alternate translations 1-4
  {
    id: 'alt-translation-1',
    name: 'Alt Translation 1',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-full',
    position: 3,
    defaultVisible: false,
    guestMode: true
  },
  {
    id: 'alt-translation-2',
    name: 'Alt Translation 2',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-full',
    position: 4,
    defaultVisible: false,
    guestMode: true
  },
  {
    id: 'alt-translation-3',
    name: 'Alt Translation 3',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-full',
    position: 5,
    defaultVisible: false,
    guestMode: true // Available to all users
  },
  {
    id: 'alt-translation-4',
    name: 'Alt Translation 4',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-full',
    position: 6,
    defaultVisible: false,
    guestMode: true // Available to all users
  },
  
  // Slot 15: Cross References - MOVED AFTER ALL ALTERNATE TRANSLATIONS
  {
    id: 'cross-refs',
    name: 'Cross References',
    type: 'cross-ref',
    width: 'w-80',       // Same as alternate translations
    mobileWidth: 'w-80', // Same as alternate translations
    position: 15,
    defaultVisible: true, // Default ON for free users
    guestMode: true
  },
  
  // Slot 16: Unified Prophecy Column - MOVED AFTER CROSS REFERENCES
  {
    id: 'prophecy',
    name: 'Prophecy',
    type: 'prophecy',
    width: 'w-80',       // Same as alternate translations
    mobileWidth: 'w-80', // Same as alternate translations
    position: 16,
    defaultVisible: false,
    guestMode: true
  },
  

  // Slots 7-14: Additional alternate translations (8 slots total) - MOVED TO FOLLOW FIRST 4
  {
    id: 'alt-translation-5',
    name: 'Alt Translation 5',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-full',
    position: 7,
    defaultVisible: false,
    guestMode: true
  },
  {
    id: 'alt-translation-6',
    name: 'Alt Translation 6',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-full',
    position: 8,
    defaultVisible: false,
    guestMode: true
  },
  {
    id: 'alt-translation-7',
    name: 'Alt Translation 7',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-full',
    position: 9,
    defaultVisible: false,
    guestMode: true // Available to all users
  },
  {
    id: 'alt-translation-8',
    name: 'Alt Translation 8',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-full',
    position: 10,
    defaultVisible: false,
    guestMode: true // Available to all users
  },
  {
    id: 'alt-translation-9',
    name: 'Alt Translation 9',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-full',
    position: 11,
    defaultVisible: false,
    guestMode: true // Available to all users
  },
  {
    id: 'alt-translation-10',
    name: 'Alt Translation 10',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-full',
    position: 12,
    defaultVisible: false,
    guestMode: true // Available to all users
  },
  {
    id: 'alt-translation-11',
    name: 'Alt Translation 11',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-full',
    position: 13,
    defaultVisible: false,
    guestMode: true // Available to all users
  },
  {
    id: 'alt-translation-12',
    name: 'Alt Translation 12',
    type: 'translation',
    width: 'w-80',
    mobileWidth: 'w-full',
    position: 14,
    defaultVisible: false,
    guestMode: true // Available to all users
  },
  
  // Slot 19: Master Column (Hybrid) - shows all data for center anchor verse
  {
    id: 'hybrid',
    name: 'Master Column',
    type: 'hybrid',
    width: 'w-80',       // Same as all other columns
    mobileWidth: 'w-80', // Same as all other columns
    position: 19,
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
      
      // Keep notes restricted for paid members only
      if (col.type === 'notes' && isGuest && !col.guestMode) return false;
      
      // All other columns available based on preferences regardless of guest status
      if (col.type === 'cross-ref' && preferences.showCrossRefs) return true;
      if (col.type === 'prophecy' && preferences.showProphecy) return true;
      if (col.type === 'notes' && preferences.showNotes) return true;
      if (col.type === 'hybrid' && preferences.showHybrid) return true;
      if (col.type === 'translation') return true; // All translations available
      
      return false;
    })
    .sort((a, b) => a.position - b.position);
}

export function getColumnWidth(column: ColumnSlot, isMobile: boolean = false): string {
  // Convert Tailwind classes to CSS custom properties that can be scaled
  const baseWidth = isMobile ? column.mobileWidth : column.width;
  
  // Convert common Tailwind width classes to rem values
  const widthMap: Record<string, string> = {
    'w-6': '1.5rem',
    'w-20': '5rem', 
    'w-52': '13rem',
    'w-80': '20rem',
    'w-64': '16rem',
    'w-72': '18rem',
    'w-full': '100%'
  };
  
  const remValue = widthMap[baseWidth] || baseWidth;
  
  // Apply column width multiplier for scalable columns
  if (remValue.includes('rem')) {
    return `calc(${remValue} * var(--column-width-mult))`;
  }
  
  return remValue;
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
} {
  const requirements = {
    translations: [] as string[],
    crossRefs: false,
    prophecy: false,
    notes: false
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
    }
  }
  
  return requirements;
}