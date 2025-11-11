import { useState, useEffect, useMemo } from "react";
import { marked } from "marked";
import BottomSheet from "./BottomSheet";
import { ForumQuickAccess } from "./ForumQuickAccess";
import { MessageSquare } from "lucide-react";

type DocKey = "tos" | "policies" | "privacy" | "ack" | "licenses" | "dmca" | "contact" | "changelog";

async function loadMarkdown(path: string) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const text = await res.text();
    return text;
  } catch (error) {
    console.error(`Failed to load markdown from ${path}:`, error);
    return `# Error\n\nFailed to load document. Please try again later.`;
  }
}

export default function MobileFooter() {
  const [sheet, setSheet] = useState<null | { key: DocKey | "docs"; title: string }>(null);
  const [md, setMd] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForumOpen, setIsForumOpen] = useState(false);

  useEffect(() => {
    if (!sheet) return;
    
    const map: Record<DocKey, string> = {
      tos: "/docs/tos.md",
      policies: "/docs/policies.md",
      privacy: "/docs/privacy.md",
      ack: "/docs/acknowledgments.md",
      licenses: "/docs/licenses.md",
      dmca: "/docs/dmca.md",
      contact: "/docs/contact.md",
      changelog: "/docs/changelog.md",
    };
    
    if (sheet.key === "docs") {
      setMd("");
      return;
    }

    setIsLoading(true);
    loadMarkdown(map[sheet.key as DocKey])
      .then(setMd)
      .catch(() => setMd("# Error\n\nFailed to load document."))
      .finally(() => setIsLoading(false));
  }, [sheet]);

  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <>
      <footer className="footer">
        <div className="footer-row" style={{ justifyContent: 'center', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => setSheet({ key: "docs", title: "All Documents" })}>All Docs</button>
          <span className="muted">·</span>
          <span className="muted" style={{ fontWeight: 500 }}>© Anointed.io™</span>
          <span className="muted">·</span>
          <button 
            onClick={() => setIsForumOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer' }}
            className="muted"
          >
            <MessageSquare size={16} />
            Forum
          </button>
        </div>
      </footer>

      {/* Forum Quick Access Popup */}
      <ForumQuickAccess isOpen={isForumOpen} onClose={() => setIsForumOpen(false)} />

      <BottomSheet
        isOpen={!!sheet}
        title={sheet?.title}
        onClose={() => setSheet(null)}
      >
        {sheet?.key === "docs" && (
          <nav className="docs-menu">
            <button onClick={() => setSheet({ key: "tos", title: "Terms of Service" })}>Terms of Service</button>
            <button onClick={() => setSheet({ key: "policies", title: "Policies" })}>Policies</button>
            <button onClick={() => setSheet({ key: "privacy", title: "Privacy Policy" })}>Privacy Policy</button>
            <button onClick={() => setSheet({ key: "ack", title: "Acknowledgments" })}>Acknowledgments</button>
            <button onClick={() => setSheet({ key: "licenses", title: "Licenses & Attributions" })}>Licenses & Attributions</button>
            <button onClick={() => setSheet({ key: "dmca", title: "DMCA" })}>DMCA</button>
            <button onClick={() => setSheet({ key: "contact", title: "Contact" })}>Contact</button>
            <button onClick={() => setSheet({ key: "changelog", title: "Changelog" })}>Changelog</button>
          </nav>
        )}

        {isLoading && (
          <div className="loading-state">Loading document...</div>
        )}

        {md && !isLoading && (
          <article 
            className="doc-body" 
            dangerouslySetInnerHTML={{ __html: marked(md) }} 
          />
        )}
      </BottomSheet>
    </>
  );
}