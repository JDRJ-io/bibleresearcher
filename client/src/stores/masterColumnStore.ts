import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// SECTION REGISTRY - Fixed metadata for each master column section
// ============================================================================

export type MasterColumnSectionId = 
  | 'verse-reference'
  | 'date-place'
  | 'author-audience'
  | 'authorship-verses'
  | 'strongs-analysis'
  | 'cross-references'
  | 'prophecy';

export interface MasterColumnSection {
  id: MasterColumnSectionId;
  label: string;
  minHeight: number; // Fixed minimum height in pixels
  defaultVisible: boolean;
}

export const MASTER_COLUMN_SECTIONS: MasterColumnSection[] = [
  {
    id: 'verse-reference',
    label: 'Verse Reference',
    minHeight: 80,
    defaultVisible: true,
  },
  {
    id: 'date-place',
    label: 'Date & Place Written',
    minHeight: 100,
    defaultVisible: true,
  },
  {
    id: 'author-audience',
    label: 'Author & Audience',
    minHeight: 100,
    defaultVisible: true,
  },
  {
    id: 'authorship-verses',
    label: 'Verses of Authorship',
    minHeight: 120,
    defaultVisible: true,
  },
  {
    id: 'strongs-analysis',
    label: "Strong's Analysis",
    minHeight: 150,
    defaultVisible: true,
  },
  {
    id: 'cross-references',
    label: 'Cross References',
    minHeight: 150,
    defaultVisible: true,
  },
  {
    id: 'prophecy',
    label: 'Prophecy',
    minHeight: 120,
    defaultVisible: true,
  },
];

// ============================================================================
// ZUSTAND STORE - Persisted visibility preferences
// ============================================================================

interface MasterColumnStore {
  // Visibility state for each section
  sectionVisibility: Record<MasterColumnSectionId, boolean>;
  
  // Dropdown menu state (not persisted)
  settingsMenuOpen: boolean;
  setSettingsMenuOpen: (open: boolean) => void;
  
  // Actions
  toggleSection: (sectionId: MasterColumnSectionId) => void;
  setSectionVisibility: (sectionId: MasterColumnSectionId, visible: boolean) => void;
  resetToDefaults: () => void;
}

// Initialize default visibility from registry
const getDefaultVisibility = (): Record<MasterColumnSectionId, boolean> => {
  const defaults = {} as Record<MasterColumnSectionId, boolean>;
  MASTER_COLUMN_SECTIONS.forEach(section => {
    defaults[section.id] = section.defaultVisible;
  });
  return defaults;
};

export const useMasterColumnStore = create<MasterColumnStore>()(
  persist(
    (set) => ({
      sectionVisibility: getDefaultVisibility(),
      settingsMenuOpen: false,
      setSettingsMenuOpen: (open) => set({ settingsMenuOpen: open }),
      
      toggleSection: (sectionId) =>
        set((state) => ({
          sectionVisibility: {
            ...state.sectionVisibility,
            [sectionId]: !state.sectionVisibility[sectionId],
          },
        })),
      
      setSectionVisibility: (sectionId, visible) => {
        console.log('[MASTER-STORE] setSectionVisibility called:', sectionId, '=', visible);
        set((state) => {
          const newVisibility = {
            ...state.sectionVisibility,
            [sectionId]: visible,
          };
          console.log('[MASTER-STORE] New visibility:', newVisibility);
          return { sectionVisibility: newVisibility };
        });
      },
      
      resetToDefaults: () =>
        set({ sectionVisibility: getDefaultVisibility() }),
    }),
    {
      name: 'master-column-settings', // localStorage key
      partialize: (state) => ({
        sectionVisibility: state.sectionVisibility,
      }),
    }
  )
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getSectionConfig(sectionId: MasterColumnSectionId): MasterColumnSection | undefined {
  return MASTER_COLUMN_SECTIONS.find(s => s.id === sectionId);
}

export function getVisibleSections(visibility: Record<MasterColumnSectionId, boolean>): MasterColumnSection[] {
  return MASTER_COLUMN_SECTIONS.filter(section => visibility[section.id]);
}

export function getTotalMinHeight(visibility: Record<MasterColumnSectionId, boolean>): number {
  return MASTER_COLUMN_SECTIONS
    .filter(section => visibility[section.id])
    .reduce((sum, section) => sum + section.minHeight, 0);
}
