import React, { useState, useEffect, useMemo } from "react";
import { marked } from "marked";
import BottomSheet from "./BottomSheet";

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
  const [sheet, setSheet] = useState<null | { key: DocKey | "docs" | "donate" | "forum"; title: string }>(null);
  const [md, setMd] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // lazy-load markdown when a legal doc opens
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
    
    if (sheet.key === "docs" || sheet.key === "donate" || sheet.key === "forum") {
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
        <div className="footer-row">
          <button onClick={() => setSheet({ key: "tos", title: "Terms of Service" })}>ToS</button>
          <button onClick={() => setSheet({ key: "policies", title: "Policies" })}>Policies</button>
          <button onClick={() => setSheet({ key: "privacy", title: "Privacy Policy" })}>Privacy</button>
          <button onClick={() => setSheet({ key: "forum", title: "Forum" })}>Forum</button>
        </div>

        <div className="footer-row">
          <button onClick={() => setSheet({ key: "docs", title: "All Documents" })}>All Docs</button>
          <button onClick={() => setSheet({ key: "donate", title: "Donate" })}>Donate</button>
          <span className="muted">© {year} Anointed.io</span>
        </div>
      </footer>

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

        {sheet?.key === "forum" && (
          <div className="sheet-actions">
            <p>Jump into the community forum to discuss scripture, share insights, and connect with other believers.</p>
            <a className="primary" href="/forum" target="_blank" rel="noopener noreferrer">Open Forum</a>
          </div>
        )}

        {sheet?.key === "donate" && (
          <div className="sheet-actions">
            <p>Support the work of Anointed.io and help us continue providing free biblical research tools to believers worldwide.</p>
            <a className="primary" href="/donate" target="_blank" rel="noopener noreferrer">Give</a>
          </div>
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