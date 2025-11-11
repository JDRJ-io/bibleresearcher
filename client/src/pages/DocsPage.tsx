import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SEOHead } from '@/components/SEOHead';

interface DocMetadata {
  title: string;
  description?: string;
  category: 'legal' | 'support' | 'community' | 'info';
}

const DOC_METADATA: Record<string, DocMetadata> = {
  'privacy-policy': { title: 'Privacy Policy', category: 'legal', description: 'How we handle and protect your data' },
  'tos': { title: 'Terms of Service', category: 'legal', description: 'Terms and conditions for using our platform' },
  'policies': { title: 'Platform Policies', category: 'legal', description: 'Community guidelines and platform rules' },
  'acknowledgments': { title: 'Acknowledgments', category: 'info', description: 'Credits and attributions' },
  'donate': { title: 'Support Our Mission', category: 'support', description: 'Help us continue building this platform' },
  'disclaimer': { title: 'Disclaimer', category: 'legal' },
  'dmca': { title: 'DMCA Policy', category: 'legal' },
  'accessibility': { title: 'Accessibility', category: 'info' },
  'community-spaces': { title: 'Community Spaces', category: 'community' },
  'contributor-agreement': { title: 'Contributor Agreement', category: 'legal' },
  'delete-account': { title: 'Delete Account', category: 'support' },
  'mission-statement': { title: 'Our Mission Statement', category: 'info' },
  'pricing': { title: 'Pricing', category: 'info' },
  'safety-scam-prevention': { title: 'Safety & Scam Prevention', category: 'support' },
  'cookies': { title: 'Cookie Policy', category: 'legal' },
  'patch-notes': { title: 'Patch Notes', category: 'info', description: 'Latest updates and changes' },
  'support': { title: 'Support', category: 'support' },
  'contact': { title: 'Contact', category: 'support', description: 'Get in touch with us' },
  'licenses': { title: 'Licenses', category: 'info', description: 'Software licenses and attributions' }
};

const FILENAME_MAP: Record<string, string> = {
  'privacy-policy': 'Privacy Policy.md',
  'tos': 'ToS.md',
  'policies': 'Policies.md',
  'acknowledgments': 'Acknowledgments.md',
  'donate': 'Donate.md',
  'disclaimer': 'Disclaimer.md',
  'dmca': 'DMCA.md',
  'accessibility': 'Accessibility.md',
  'community-spaces': 'Community_Spaces.md',
  'contributor-agreement': 'Contributor Agreement original.md',
  'delete-account': 'Delete_account.md',
  'mission-statement': 'Our Mission Statement.md',
  'pricing': 'Pricing.md',
  'safety-scam-prevention': 'Safety & Scam Prevention.md',
  'cookies': 'cookies.md',
  'patch-notes': 'patch_notes.md',
  'support': 'support.md',
  'contact': 'Contact.md',
  'licenses': 'Licenses.md'
};

export default function DocsPage() {
  const [match, params] = useRoute('/docs/:docId?');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docId = params?.docId;
  const isDocumentView = !!docId;
  const metadata = docId ? DOC_METADATA[docId] : null;

  useEffect(() => {
    if (docId && FILENAME_MAP[docId]) {
      loadDocument(FILENAME_MAP[docId]);
    }
  }, [docId]);

  const loadDocument = async (filename: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/important_docs/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load document: ${response.statusText}`);
      }
      const text = await response.text();
      setContent(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const formatMarkdown = (text: string) => {
    // Simple markdown formatting for headers and basic styles
    return text
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-4 text-foreground">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mb-3 mt-6 text-foreground">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium mb-2 mt-4 text-foreground">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^(.+)$/gm, '<p class="mb-4">$1</p>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1 <ExternalLink className="inline w-3 h-3" /></a>');
  };

  if (!isDocumentView) {
    // Document index page

    const categories = {
      legal: 'Legal & Policies',
      info: 'Information',
      support: 'Support & Help',
      community: 'Community'
    };

    return (
      <>
        <SEOHead
          title="Documentation"
          description="Important documents, policies, and information about our biblical research platform."
          canonical="https://anointed.io/docs"
        />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Documentation</h1>
          <p className="text-muted-foreground">
            Important documents, policies, and information about our platform.
          </p>
        </div>

        {Object.entries(categories).map(([categoryKey, categoryName]) => (
          <div key={categoryKey} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{categoryName}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(DOC_METADATA)
                .filter(([_, doc]) => doc.category === categoryKey)
                .map(([key, doc]) => (
                  <Card key={key} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        <a href={`/docs/${key}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                          {doc.title}
                        </a>
                      </CardTitle>
                    </CardHeader>
                    {doc.description && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">{doc.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
      </>
    );
  }

  if (!metadata) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Document Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested document could not be found.</p>
          <Button asChild>
            <a href="/docs">View All Documents</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={metadata.title}
        description={metadata.description || `Read about ${metadata.title}`}
        canonical={`https://anointed.io/docs/${docId}`}
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <a href="/docs" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Documents
          </a>
        </Button>
        <h1 className="text-3xl font-bold">{metadata.title}</h1>
        {metadata.description && (
          <p className="text-lg text-muted-foreground mt-2">{metadata.description}</p>
        )}
        <Separator className="mt-4" />
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
          <Button onClick={() => docId && loadDocument(FILENAME_MAP[docId])}>
            Try Again
          </Button>
        </div>
      )}

      {content && (
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div 
            dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
            className="leading-relaxed"
          />
        </div>
      )}
      </div>
    </>
  );
}