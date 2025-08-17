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
  }
} as const;

export type DocumentKey = keyof typeof availableDocuments;