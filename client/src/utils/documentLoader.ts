// Document loader utility to load markdown files from important_docs
export async function loadDocument(filename: string): Promise<string> {
  try {
    const response = await fetch(`/important_docs/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load document: ${filename}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error loading document ${filename}:`, error);
    throw new Error(`Failed to load document: ${filename}`);
  }
}

// Define available documents
export const availableDocuments = {
  'privacy': {
    filename: 'Privacy Policy.md',
    title: 'Privacy Policy'
  },
  'tos': {
    filename: 'ToS.md', 
    title: 'Terms of Service'
  },
  'policies': {
    filename: 'Policies.md',
    title: 'Policies'
  },
  'pricing': {
    filename: 'Pricing.md',
    title: 'Pricing'
  },
  'acknowledgments': {
    filename: 'Acknowledgments.md',
    title: 'Acknowledgments'
  },
  'donate': {
    filename: 'Donate.md',
    title: 'Donate'
  },
  'support': {
    filename: 'support.md',
    title: 'Support'
  },
  'mission': {
    filename: 'Our Mission Statement.md',
    title: 'Our Mission'
  },
  'safety': {
    filename: 'Safety & Scam Prevention.md',
    title: 'Safety & Scam Prevention'
  },
  'accessibility': {
    filename: 'Accessibility.md',
    title: 'Accessibility'
  },
  'community': {
    filename: 'Community_Spaces.md',
    title: 'Community Spaces'
  },
  'contributor': {
    filename: 'Contributor Agreement original.md',
    title: 'Contributor Agreement'
  },
  'dmca': {
    filename: 'DMCA.md',
    title: 'DMCA Policy'
  },
  'delete-account': {
    filename: 'Delete_account.md',
    title: 'Delete Account'
  },
  'disclaimer': {
    filename: 'Disclaimer.md',
    title: 'Disclaimer'
  },
  'cookies': {
    filename: 'cookies.md',
    title: 'Cookie Policy'
  },
  'patch-notes': {
    filename: 'patch_notes.md',
    title: 'Patch Notes'
  },
  'contact': {
    filename: 'Contact.md',
    title: 'Contact'
  },
  'licenses': {
    filename: 'Licenses.md',
    title: 'Licenses'
  }
} as const;

export type DocumentKey = keyof typeof availableDocuments;