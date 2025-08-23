// scripts/theme-audit.cjs
// Usage: node scripts/theme-audit.cjs tests/site-url.txt tests/theme-audit-report.md
const fs = require('fs');
const path = require('path');

const roots = ['client/src', 'src', 'styles', 'client'];
const patterns = [
  // 1) Body forced transparent (should be removed)
  {
    name: 'body-transparent',
    regex: /body\s*{[^}]*background:\s*transparent[^}]*}/gis,
    message: 'Body background is forced to transparent (should be removed).',
  },
  // 2) Negative z-index background layer (should not exist)
  {
    name: 'neg-z',
    regex: /z-index\s*:\s*-\d+/gi,
    message: 'Found negative z-index; background layer should use body::before instead.',
  },
  // 3) Missing Tailwind aliases in CSS (should map to your bg vars)
  {
    name: 'missing-alias-background',
    regex: /--background\s*:/gi,
    message: 'Found --background alias (GOOD). This is informational only.',
  },
  {
    name: 'missing-alias-card',
    regex: /--card\s*:/gi,
    message: 'Found --card alias (GOOD). This is informational only.',
  },
  // 4) DynamicBackground component usage (prefer body::before)
  {
    name: 'dynamic-background-component',
    regex: /DynamicBackground\.tsx|<DynamicBackground/i,
    message: 'DynamicBackground component referenced; prefer body::before pseudo-element.',
  },
];

const requiredVars = [
  '--bg-primary',
  '--bg-secondary',
  '--header-bg',
  '--column-bg',
  '--highlight-bg',
  // aliases that Tailwind consumes
  '--background',
  '--primary',
  '--secondary',
  '--card',
  '--popover',
];

function listFiles(dir) {
  let out = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out = out.concat(listFiles(p));
      } else if (/\.(css|ts|tsx|scss|less)$/.test(p)) {
        out.push(p);
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return out;
}

function grep(file, content, re) {
  const res = [];
  let m;
  const lines = content.split(/\r?\n/);
  while ((m = re.exec(content))) {
    const pos = content.slice(0, m.index).split(/\r?\n/).length;
    res.push({
      file,
      line: pos,
      message: '',
      snippet: lines[pos - 1]?.trim() ?? '',
    });
  }
  return res;
}

function main() {
  const [,, inPath, outPath] = process.argv;
  const siteUrl = fs.readFileSync(inPath, 'utf8').trim();

  const allFiles = roots.flatMap(r => {
    try { return listFiles(r); } catch { return []; }
  });

  const findings = [];
  const seenAliases = new Set();
  const seenVars = new Set();

  for (const f of allFiles) {
    try {
      const text = fs.readFileSync(f, 'utf8');
      for (const pat of patterns) {
        const hits = grep(f, text, pat.regex).map(h => ({ ...h, message: pat.message }));
        findings.push(...hits);
        if (pat.name.startsWith('missing-alias')) {
          if (hits.length) seenAliases.add(pat.name);
        }
      }
      for (const v of requiredVars) {
        if (new RegExp(v.replace(/[-]/g, '\\-')).test(text)) seenVars.add(v);
      }
    } catch {
      // File read error, skip
    }
  }

  const missingVars = requiredVars.filter(v => !seenVars.has(v));
  const hasAliasBackground = seenAliases.has('missing-alias-background');
  const hasAliasCard = seenAliases.has('missing-alias-card');

  const out = [];
  out.push(`# Theme Audit Report`);
  out.push(`Target URL: ${siteUrl}`);
  out.push(`Generated: ${new Date().toISOString()}`);
  out.push(``);
  out.push(`## Summary`);
  out.push(`- **Missing vars**: ${missingVars.length ? missingVars.join(', ') : 'None ✅'}`);
  out.push(`- **Tailwind aliases**:`);
  out.push(`  - --background present: ${hasAliasBackground ? 'Yes ✅' : 'No ❌'}`);
  out.push(`  - --card present: ${hasAliasCard ? 'Yes ✅' : 'No ❌'}`);
  out.push(``);
  out.push(`## Findings`);
  if (!findings.length) out.push(`No issues found ✅`);
  for (const f of findings) {
    out.push(`- ${f.message}`);
    out.push(`  - File: \`${f.file}\` @ line ${f.line}`);
    if (f.snippet) out.push(`  - Snippet: \`${f.snippet}\``);
  }

  fs.writeFileSync(outPath, out.join('\n'), 'utf8');
  console.log(`Wrote ${outPath}`);
}

main();