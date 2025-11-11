import { Tutorial } from './types';

export const TUTORIALS: Record<string, Tutorial> = {
  // ─────────────────────────────────────────────────────────────────────────────
  hyperlinks: {
    id: 'hyperlinks',
    version: 1,
    steps: [
      {
        id: 'intro',
        title: 'Clickable Scripture Links',
        bullets: [
          'Any verse reference in blue is clickable.',
          'Click to jump instantly without scrolling.'
        ],
        target: { selector: '[data-tutorial="bible-table"]', scroll: 'nearest' },
        prefer: ['bottom','top']
      },
      {
        id: 'crossrefs',
        title: 'Cross References',
        bullets: [
          'Cross references list related passages.',
          'Click a reference to jump to that verse.'
        ],
        target: { selector: '[data-tutorial="crossrefs"]', optional: true, waitMs: 3000, scroll: 'nearest' }
      },
      {
        id: 'prophecy-links',
        title: 'Prophecy Connections',
        bullets: [
          'Prophecy entries are also hyperlinks.',
          'Use them to move between prediction and fulfillment.'
        ],
        target: { selector: '[data-tutorial="prophecy-columns"]', optional: true, waitMs: 3000 }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  translations: {
    id: 'translations',
    version: 1,
    steps: [
      {
        id: 'main',
        title: 'Main Translation',
        bullets: [
          'Choose your primary translation here.',
          'This column stays anchored.'
        ],
        target: { selector: '[data-tutorial="translation-main"]', scroll: 'nearest', waitMs: 5000 }
      },
      {
        id: 'alts',
        title: 'Alternate Columns',
        bullets: [
          'Add/remove alternate translations as side columns.',
          'Reorder them any time in Column Editing.'
        ],
        target: { selector: '[data-tutorial="translation-alts"]', scroll: 'nearest' }
      },
      {
        id: 'why-limited',
        title: 'Why Limited Translations?',
        bullets: [
          'We show translations we currently have licensing for.',
          'More are added as agreements are finalized.'
        ],
        target: { selector: '#menuBtn', scroll: 'nearest' }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  strongs: {
    id: 'strongs',
    version: 1,
    steps: [
      {
        id: 'gesture',
        title: "Open Strong's (Gesture)",
        bullets: [
          'Double-tap and hold the bottom-right of any verse cell.',
          'This opens Strong\'s for that verse.'
        ],
        target: { selector: '[data-tutorial="verse-cell"]', scroll: 'center', waitMs: 5000 }
      },
      {
        id: 'interlinear',
        title: 'Interlinear Overlay',
        bullets: [
          'Tap any word to see all its occurrences in Scripture.',
          'Use results to study nuance and usage.'
        ],
        target: { selector: '[data-tutorial="strongs-hint"]', optional: true }
      },
      {
        id: 'jump',
        title: 'Jump from Results',
        bullets: [
          'Tap any verse in the results to open its Strong\'s overlay directly.',
          'Great for chasing themes across the Bible.'
        ],
        target: { selector: '[data-tutorial="strongs-results"]', optional: true }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  prophecies: {
    id: 'prophecies',
    version: 1,
    steps: [
      {
        id: 'toggle',
        title: 'Prophecy Columns',
        bullets: [
          'Toggle on to view Prediction, Fulfillment, and Verification.',
          'Any verse tied to a prophecy appears here.'
        ],
        target: { selector: '[data-tutorial="prophecy-columns"]', waitMs: 5000, scroll: 'nearest' }
      },
      {
        id: 'minimize',
        title: 'Minimize a Prophecy',
        bullets: [
          'Click a prophecy\'s summary to collapse it.',
          'This makes it easier to see multiple prophecies at once.'
        ],
        target: { selector: '[data-tutorial="prophecy-summary"]', optional: true, scroll: 'nearest' }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  display: {
    id: 'display',
    version: 1,
    steps: [
      {
        id: 'text-size',
        title: 'Display Settings',
        bullets: [
          'Adjust font size and row height for comfort.',
          'Dial it in for your exact screen.'
        ],
        target: { selector: '[data-tutorial="display-controls"]', waitMs: 5000 }
      },
      {
        id: 'widths',
        title: 'Column Widths',
        bullets: [
          'Double column widths for extra-wide reading.',
          'Great for side-by-side comparisons.'
        ],
        target: { selector: '[data-tutorial="column-headers"]', scroll: 'nearest' }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  columns: {
    id: 'columns',
    version: 1,
    steps: [
      {
        id: 'edit-mode',
        title: 'Column Editing',
        bullets: [
          'Toggle column editing to rearrange columns.',
          'Drag headers to change the order.'
        ],
        target: { selector: '#columnEditToggle', waitMs: 5000 }
      },
      {
        id: 'drag',
        title: 'Drag & Drop',
        bullets: [
          'Click and drag any header to a new position.',
          'Release to place it.'
        ],
        target: { selector: '[data-tutorial="column-headers"]', scroll: 'nearest' },
        advanceOn: [{ selector: '[data-tutorial="column-headers"]', event: 'mouseup' }]
      },
      {
        id: 'lock',
        title: 'Lock Arrangement',
        bullets: [
          'Toggle column editing off when finished.',
          'Your order is remembered.'
        ],
        target: { selector: '#columnEditToggle' }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  labels: {
    id: 'labels',
    version: 1,
    steps: [
      {
        id: 'toggle',
        title: 'Semantic Labels',
        bullets: [
          'Toggle labels to reveal semantic styling (who/what/when...).',
          'Each label adds a unique visual overlay.'
        ],
        target: { selector: '[data-tutorial="labels-toggle"]', waitMs: 5000 }
      },
      {
        id: 'members',
        title: 'Members Only',
        bullets: [
          'Labels are available to logged-in users.',
          'Sign in to enable this feature.'
        ],
        target: { selector: '#menuBtn', scroll: 'nearest' }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  notes: {
    id: 'notes',
    version: 1,
    steps: [
      {
        id: 'enable',
        title: 'Notes Column',
        bullets: [
          'Toggle on the Notes column to write alongside verses.',
          'Your notes save to your account.'
        ],
        target: { selector: '[data-tutorial="notes-column"]', waitMs: 5000 }
      },
      {
        id: 'write',
        title: 'Write a Note',
        bullets: [
          'Click the note cell next to a verse and start typing.',
          'Use Book.Chapter:Verse (e.g., John.3:16) to create clickable links.'
        ],
        target: { selector: '[data-tutorial="verse-cell"]', scroll: 'center' }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  highlights: {
    id: 'highlights',
    version: 1,
    steps: [
      {
        id: 'select',
        title: 'Select to Highlight',
        bullets: [
          'Hover or tap-drag text to select.',
          'Choose color and opacity in the highlight popup.'
        ],
        target: { selector: '[data-tutorial="highlight-toolbar"]', optional: true, waitMs: 3000 }
      },
      {
        id: 'remove',
        title: 'Remove Highlight',
        bullets: [
          'Re-select the text and click Remove.',
          'Cleans up quickly.'
        ],
        target: { selector: '[data-tutorial="highlight-toolbar"]', optional: true }
      },
      {
        id: 'star-all',
        title: 'Star: Highlight All Translations',
        bullets: [
          'Click the star to highlight this verse across every translation.',
          'Fast way to mark a theme.'
        ],
        target: { selector: '[data-tutorial="hover-panel"]', optional: true }
      },
      {
        id: 'trash-all',
        title: 'Trash: Clear All Highlights',
        bullets: [
          'Use the trash icon to clear every highlight for this verse.',
          'Handy when refactoring your study marks.'
        ],
        target: { selector: '[data-tutorial="hover-panel"]', optional: true }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  bookmarks: {
    id: 'bookmarks',
    version: 1,
    steps: [
      {
        id: 'quick',
        title: 'Quick Bookmark',
        bullets: [
          'Click the top bookmark button to save your current position.',
          'Great for session marks.'
        ],
        target: { selector: '[data-tutorial="bookmark-top"]', waitMs: 5000 }
      },
      {
        id: 'hover',
        title: 'Verse-Specific Bookmark',
        bullets: [
          'Hover (or single tap on mobile) to open the hover panel.',
          'Tap the bookmark icon to save this verse.'
        ],
        target: { selector: '[data-tutorial="hover-panel"]', optional: true, scroll: 'nearest' }
      },
      {
        id: 'menu',
        title: 'Access Saved Bookmarks',
        bullets: [
          'Open the menu to view and jump to your bookmarks.',
          'Name and organize them as you like.'
        ],
        target: { selector: '#menuBtn', scroll: 'nearest' }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  tapFunctions: {
    id: 'tapFunctions',
    version: 1,
    steps: [
      {
        id: 'hover-panel',
        title: 'Hover / Single Tap',
        bullets: [
          'Opens the hover tab with: copy, bookmark, share, star, delete.',
          'Your command center for quick actions.'
        ],
        target: { selector: '[data-tutorial="hover-panel"]', optional: true, waitMs: 3000 }
      },
      {
        id: 'strongs-gesture',
        title: "Double-Tap + Hold (Strong's)",
        bullets: [
          'Bottom-right of a verse cell.',
          'Opens Strong\'s overlay for that verse.'
        ],
        target: { selector: '[data-tutorial="verse-cell"]', scroll: 'center' }
      },
      {
        id: 'highlight-gestures',
        title: 'Highlight Gestures',
        bullets: [
          'Tap + drag to select and highlight.',
          'Double-tap + drag for longer spans.'
        ],
        target: { selector: '[data-tutorial="verse-cell"]' }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  navigation: {
    id: 'navigation',
    version: 1,
    steps: [
      {
        id: 'vertical',
        title: 'Vertical Navigation',
        bullets: [
          'Scroll the Y-axis to move through the whole Bible.',
          'Drag the scroller for a guided preview of where you\'ll land.'
        ],
        target: { selector: '[data-tutorial="scroller"]', waitMs: 5000 }
      },
      {
        id: 'links',
        title: 'Jump with Links',
        bullets: [
          'Click cross-refs or prophecy links to jump instantly.',
          'Faster than scrolling for long jumps.'
        ],
        target: { selector: '[data-tutorial="crossrefs"]', optional: true }
      },
      {
        id: 'horizontal',
        title: 'Horizontal Navigation',
        bullets: [
          'Swipe on touch screens to move left/right.',
          'Or use the arrow buttons above the columns.'
        ],
        target: { selector: '#xAxisRight', optional: true }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  presets: {
    id: 'presets',
    version: 1,
    steps: [
      {
        id: 'bar',
        title: 'Preset Bar',
        bullets: [
          'Quick layouts live above the column headers.',
          'Switch views instantly.'
        ],
        target: { selector: '#presetBar', waitMs: 5000 }
      },
      {
        id: 'save',
        title: 'Save Your Layout',
        bullets: [
          'Load the exact setup you want (columns, labels, translations).',
          'Save it as a custom preset for one-click recall.'
        ],
        target: { selector: '#presetBar' }
      }
    ]
  }
};